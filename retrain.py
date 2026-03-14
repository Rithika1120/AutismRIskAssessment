"""
Autism Risk Assessment - Model Retraining Script
Run from backend folder: python retrain.py

This retrains CatBoost + LightGBM models WITHOUT the 'result' column
so predictions are based on actual answer patterns, not just the sum.
"""

import os
import pickle
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from catboost import CatBoostClassifier
import lightgbm as lgb

# ============================================================
# CONFIG - Update these paths if needed
# ============================================================
DATA_FILES = {
    "adult":      "ml/data/autism_adult.csv",
    "adolescent": "ml/data/autism_adolescent.csv",
    "child":      "ml/data/autism_child.csv",}

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ============================================================
# PREPROCESSING
# ============================================================

def preprocess(df: pd.DataFrame, age_group: str):
    df = df.copy()

    # ✅ Drop result column - this was causing the model to cheat
    drop_cols = ["result", "age_desc", "Class/ASD"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

    # Target
    target_col = "Class/ASD"
    # Already dropped above, re-read target before drop
    return df

def load_and_prepare(csv_path: str, age_group: str):
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()

    print(f"\n{'='*50}")
    print(f"Dataset: {age_group} | Shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")

    # Target
    target = df["Class/ASD"].str.strip().str.upper().map({"YES": 1, "NO": 0})

    # Drop columns not useful for prediction
    drop_cols = ["result", "age_desc", "Class/ASD"]
    df = df.drop(columns=[c for c in drop_cols if c in df.columns], errors="ignore")

    # Replace '?' with NaN
    df = df.replace("?", np.nan)

    # One-hot encode categorical columns
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    print(f"Categorical columns to encode: {cat_cols}")

    df = pd.get_dummies(df, columns=cat_cols, drop_first=False)

    # Fill NaN
    df = df.fillna(0)

    # Convert all to numeric
    df = df.apply(pd.to_numeric, errors="coerce").fillna(0)

    print(f"Final shape after encoding: {df.shape}")
    print(f"Target distribution:\n{target.value_counts()}")

    return df, target

# ============================================================
# TRAIN
# ============================================================

def train_models(age_group: str, csv_path: str):
    print(f"\n{'#'*50}")
    print(f"Training models for: {age_group.upper()}")
    print(f"{'#'*50}")

    X, y = load_and_prepare(csv_path, age_group)

    # Save column order for prediction time
    columns = list(X.columns)
    col_path = os.path.join(MODELS_DIR, f"{age_group}_columns.pkl")
    joblib.dump(columns, col_path)
    print(f"Saved columns ({len(columns)}) → {col_path}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── CatBoost ──────────────────────────────────────────
    print(f"\nTraining CatBoost for {age_group}...")
    cat_model = CatBoostClassifier(
        iterations=500,
        learning_rate=0.05,
        depth=6,
        eval_metric="AUC",
        random_seed=42,
        verbose=100,
        early_stopping_rounds=50,
    )
    cat_model.fit(
        X_train, y_train,
        eval_set=(X_test, y_test),
        use_best_model=True
    )

    cb_path = os.path.join(MODELS_DIR, f"{age_group}_catboost.cbm")
    cat_model.save_model(cb_path)
    print(f"Saved CatBoost → {cb_path}")

    cb_preds = cat_model.predict(X_test)
    print(f"\nCatBoost {age_group} accuracy: {accuracy_score(y_test, cb_preds):.4f}")
    print(classification_report(y_test, cb_preds, target_names=["NO", "YES"]))

    # ── LightGBM ──────────────────────────────────────────
    print(f"\nTraining LightGBM for {age_group}...")
    lgbm_model = lgb.LGBMClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        random_state=42,
        verbose=-1,
    )
    lgbm_model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(100)]
    )

    lgbm_path = os.path.join(MODELS_DIR, f"{age_group}_lightgbm.pkl")
    with open(lgbm_path, "wb") as f:
        pickle.dump(lgbm_model, f)
    print(f"Saved LightGBM → {lgbm_path}")

    lgbm_preds = lgbm_model.predict(X_test)
    print(f"\nLightGBM {age_group} accuracy: {accuracy_score(y_test, lgbm_preds):.4f}")
    print(classification_report(y_test, lgbm_preds, target_names=["NO", "YES"]))

    return cat_model, lgbm_model, columns


# ============================================================
# VERIFY - Test predictions after training
# ============================================================

def verify_model(age_group: str, cat_model, lgbm_model, columns):
    print(f"\n{'─'*50}")
    print(f"Verifying {age_group} model with sample inputs...")

    def make_input(a_scores):
        row = {c: 0 for c in columns}
        for i, v in enumerate(a_scores, 1):
            col = f"A{i}_Score"
            if col in row:
                row[col] = v
        if "age" in row:
            row["age"] = 25.0
        if "gender_m" in row:
            row["gender_m"] = 1
        df = pd.DataFrame([row])
        df = df.reindex(columns=columns, fill_value=0)
        return df

    # All 0s = low risk
    low = make_input([0]*10)
    # All 1s = high risk
    high = make_input([1]*10)
    # Half = medium
    medium = make_input([1,0,1,0,1,0,1,0,1,0])

    for label, X in [("ALL ZEROS (low)", low), ("MIXED (medium)", medium), ("ALL ONES (high)", high)]:
        cb_prob = float(cat_model.predict_proba(X)[0][1])
        lgbm_prob = float(lgbm_model.predict_proba(X)[0][1])
        print(f"  {label}: CatBoost={cb_prob:.4f}, LightGBM={lgbm_prob:.4f}")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("Starting model retraining...")
    print(f"Models will be saved to: {MODELS_DIR}")

    results = {}

    for age_group, csv_file in DATA_FILES.items():
        if not os.path.exists(csv_file):
            print(f"WARNING: {csv_file} not found, skipping {age_group}")
            continue

        cat_model, lgbm_model, columns = train_models(age_group, csv_file)
        verify_model(age_group, cat_model, lgbm_model, columns)
        results[age_group] = "✅ Done"

    print(f"\n{'='*50}")
    print("RETRAINING COMPLETE")
    for ag, status in results.items():
        print(f"  {ag}: {status}")
    print(f"Models saved in: {MODELS_DIR}")
    print("\nRestart Flask server to load new models.")
