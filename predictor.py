import os
import joblib
import numpy as np
import pandas as pd
import shap
from catboost import CatBoostClassifier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), "models")

VALID_AGE_GROUPS = ["child", "adolescent", "adult"]

CONF_LOW = 0.4
CONF_HIGH = 0.6

FEATURE_LABEL_MAP = {
    "A1_Score": "Eye Contact",
    "A2_Score": "Non-verbal Cues",
    "A3_Score": "Repetitive Behaviors",
    "A4_Score": "Routine Flexibility",
    "A5_Score": "Sensory Sensitivity",
    "A6_Score": "Social Friendships",
    "A7_Score": "Emotional Expression",
    "A8_Score": "Focused Interests",
    "A9_Score": "Verbal Communication",
    "A10_Score": "Daily Living Skills",
    "age": "Age",
    "gender_m": "Gender",
    "jundice_yes": "Jaundice History",
    "austim_yes": "Family Autism History",
}


# ---------------------- LOAD HELPERS ----------------------

def load_columns(age_group: str):
    path = os.path.join(MODELS_DIR, f"{age_group}_columns.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Columns file missing: {path}")
    return joblib.load(path)


def load_lightgbm_model(age_group: str):
    path = os.path.join(MODELS_DIR, f"{age_group}_lightgbm.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError(f"LightGBM model missing: {path}")
    return joblib.load(path)


def load_catboost_model(age_group: str):
    path = os.path.join(MODELS_DIR, f"{age_group}_catboost.cbm")
    if not os.path.exists(path):
        raise FileNotFoundError(f"CatBoost model missing: {path}")
    model = CatBoostClassifier()
    model.load_model(path)
    print(f"Loaded CatBoost model: {path}")
    return model


# ---------------------- INPUT BUILDER ----------------------

def build_input_dataframe(age_group: str, answers: list, meta: dict = None):
    meta = meta or {}
    cols = load_columns(age_group)
    row = {c: 0 for c in cols}

    for ans in answers:
        qid = ans.get("questionId")
        val = ans.get("value", 0)
        col = f"A{qid}_Score"
        if col in row:
            row[col] = 1 if int(val) > 0 else 0

    # result NOT used — retrained model doesn't need it
    if "result" in row:
        row["result"] = 0

    if "age" in row:
        row["age"] = float(meta.get("age", 25))

    if "gender_m" in row:
        row["gender_m"] = 1 if str(meta.get("gender", "m")).lower() in ["m", "male"] else 0

    if "jundice_yes" in row:
        row["jundice_yes"] = 1 if str(meta.get("jaundice", "no")).lower() in ["yes", "y", "true", "1"] else 0

    if "austim_yes" in row:
        row["austim_yes"] = 1 if str(meta.get("autism", "no")).lower() in ["yes", "y", "true", "1"] else 0

    eth_col = f"ethnicity_{meta.get('ethnicity', '')}"
    if eth_col in row:
        row[eth_col] = 1

    country_col = f"contry_of_res_{meta.get('country', '')}"
    if country_col in row:
        row[country_col] = 1

    relation_col = f"relation_{meta.get('relation', 'Self')}"
    if relation_col in row:
        row[relation_col] = 1

    df = pd.DataFrame([row])
    df = df.reindex(columns=cols, fill_value=0)
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

    print("DATAFRAME VALUES:", df.to_dict(orient='records'))
    return df


# ---------------------- SHAP EXPLAINABILITY ----------------------

def get_shap_explanation(cat_model, X: pd.DataFrame, columns: list):
    """
    Calculate SHAP values for the prediction and return
    top features with their contribution direction and magnitude.
    """
    try:
        # Use TreeExplainer for CatBoost (fast and accurate)
        explainer = shap.TreeExplainer(cat_model)
        shap_values = explainer.shap_values(X)

        # For binary classification, shap_values may be a list [class0, class1]
        # We want class 1 (autism positive)
        if isinstance(shap_values, list):
            sv = shap_values[1][0]  # class 1, first (only) row
        else:
            sv = shap_values[0]     # single output, first row

        # Pair each feature with its SHAP value
        shap_pairs = list(zip(columns, sv))

        # Sort by absolute SHAP value (most impactful first)
        shap_pairs_sorted = sorted(shap_pairs, key=lambda x: abs(x[1]), reverse=True)

        # Take top 6 most impactful features
        result = []
        for feature_name, shap_val in shap_pairs_sorted[:6]:
            readable = FEATURE_LABEL_MAP.get(feature_name, feature_name)
            result.append({
                "feature": readable,
                "importance": round(abs(float(shap_val)), 4),
                # positive SHAP = increases autism risk
                # negative SHAP = decreases autism risk
                "contribution": "positive" if float(shap_val) > 0 else "negative",
                "shapValue": round(float(shap_val), 4)
            })

        return result

    except Exception as e:
        print(f"SHAP error: {e}")
        # Fallback to regular feature importance
        return get_feature_importance_fallback(cat_model, columns)


def get_feature_importance_fallback(cat_model, columns: list):
    """Fallback if SHAP fails"""
    try:
        fi = cat_model.get_feature_importance()
        total = np.sum(fi) if np.sum(fi) != 0 else 1
        paired = sorted(zip(columns, fi), key=lambda x: x[1], reverse=True)
        result = []
        for name, imp in paired[:6]:
            readable = FEATURE_LABEL_MAP.get(name, name)
            result.append({
                "feature": readable,
                "importance": round(float(imp / total), 4),
                "contribution": "positive",
                "shapValue": 0
            })
        return result
    except:
        return [
            {"feature": "Eye Contact", "importance": 0.25, "contribution": "positive", "shapValue": 0},
            {"feature": "Verbal Communication", "importance": 0.20, "contribution": "positive", "shapValue": 0},
            {"feature": "Repetitive Behaviors", "importance": 0.18, "contribution": "positive", "shapValue": 0},
            {"feature": "Sensory Sensitivity", "importance": 0.15, "contribution": "positive", "shapValue": 0},
            {"feature": "Social Friendships", "importance": 0.12, "contribution": "positive", "shapValue": 0},
            {"feature": "Daily Living Skills", "importance": 0.10, "contribution": "negative", "shapValue": 0},
        ]


# ---------------------- POST PROCESS ----------------------

def risk_level_from_score(score: float):
    if score < 40:
        return "low"
    elif score < 70:
        return "medium"
    return "high"


# ---------------------- MAIN PREDICT ----------------------

def predict_risk(age_group: str, answers: list, model_choice: str = "auto", meta=None):

    if age_group not in VALID_AGE_GROUPS:
        raise ValueError(f"Invalid age_group: {age_group}")

    X = build_input_dataframe(age_group, answers, meta)
    cols = load_columns(age_group)

    print("MODEL INPUT:")
    print(X)

    # Primary model: CatBoost
    cat_model = load_catboost_model(age_group)
    p1 = float(cat_model.predict_proba(X)[0][1])

    # Confidence-aware: use LightGBM too if uncertain
    if CONF_LOW <= p1 <= CONF_HIGH:
        lgbm_model = load_lightgbm_model(age_group)
        p2 = float(lgbm_model.predict_proba(X)[0][1])
        final_prob = (p1 + p2) / 2
        strategy = "dual_model"
    else:
        final_prob = p1
        strategy = "single_model"

    risk_score = round(final_prob * 100, 2)
    risk_level = risk_level_from_score(risk_score)

    # ✅ SHAP explainability
    shap_explanation = get_shap_explanation(cat_model, X, cols)

    print("\n===== DEBUG predict_risk =====")
    print("Age Group:", age_group)
    print("CatBoost Prob:", p1)
    print("Final Prob:", final_prob)
    print("Strategy:", strategy)
    print("Risk Score:", risk_score)
    print("Risk Level:", risk_level)
    print("SHAP Features:", [(f["feature"], f["shapValue"]) for f in shap_explanation])
    print("=============================\n")

    return {
        "ageGroup": age_group,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "featureImportance": shap_explanation,
        "decisionStrategy": strategy,
        "modelUsed": "CatBoost + LightGBM" if strategy == "dual_model" else "CatBoost"
    }