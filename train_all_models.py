import os
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score

from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier


def train_for_dataset(csv_path: str, model_name: str):
    print(f"\n==============================")
    print(f"Training for: {model_name}")
    print(f"Dataset: {csv_path}")
    print(f"==============================")

    df = pd.read_csv(csv_path)

    target_col = "Class/ASD"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in {csv_path}")

    y = df[target_col]
    X = df.drop(columns=[target_col])

    le = LabelEncoder()
    y = le.fit_transform(y)

    X = pd.get_dummies(X, drop_first=True)

    os.makedirs("models", exist_ok=True)

    joblib.dump(list(X.columns), f"models/{model_name}_columns.pkl")
    joblib.dump(le, f"models/{model_name}_label_encoder.pkl")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ------------------ CatBoost (Primary Model) ------------------
    cat_model = CatBoostClassifier(
        iterations=500,
        learning_rate=0.05,
        depth=6,
        loss_function="Logloss",
        verbose=False
    )
    cat_model.fit(X_train, y_train)

    cat_probs = cat_model.predict_proba(X_test)[:, 1]
    cat_pred = (cat_probs >= 0.5).astype(int)

    cat_acc = accuracy_score(y_test, cat_pred)
    cat_f1 = f1_score(y_test, cat_pred)

    # ✅ FIXED: save as .cbm (CatBoost native format) not .pkl
    cat_model.save_model(f"models/{model_name}_catboost.cbm")

    # ------------------ LightGBM (Secondary Model) ------------------
    lgbm_model = LGBMClassifier(
        n_estimators=500,
        learning_rate=0.05,
        random_state=42
    )
    lgbm_model.fit(X_train, y_train)

    lgbm_probs = lgbm_model.predict_proba(X_test)[:, 1]
    lgbm_pred = (lgbm_probs >= 0.5).astype(int)

    lgbm_acc = accuracy_score(y_test, lgbm_pred)
    lgbm_f1 = f1_score(y_test, lgbm_pred)

    joblib.dump(lgbm_model, f"models/{model_name}_lightgbm.pkl")

    # ✅ FIXED: print statements updated to reflect correct file names
    print(f"\n✅ Saved Models for {model_name}")
    print(f"  - models/{model_name}_catboost.cbm")
    print(f"  - models/{model_name}_lightgbm.pkl")
    print(f"  - models/{model_name}_columns.pkl")
    print(f"  - models/{model_name}_label_encoder.pkl")

    print(f"\n📌 Results ({model_name})")
    print(f"CatBoost  -> Accuracy: {cat_acc:.4f}, F1: {cat_f1:.4f}")
    print(f"LightGBM  -> Accuracy: {lgbm_acc:.4f}, F1: {lgbm_f1:.4f}")

    return {
        "catboost": {"acc": cat_acc, "f1": cat_f1},
        "lightgbm": {"acc": lgbm_acc, "f1": lgbm_f1},
    }


if __name__ == "__main__":
    results = {}

    results["child"]      = train_for_dataset("ml/data/autism_child.csv",      "child")
    results["adolescent"] = train_for_dataset("ml/data/autism_adolescent.csv", "adolescent")
    results["adult"]      = train_for_dataset("ml/data/autism_adult.csv",      "adult")

    print("\n==============================")
    print("FINAL SUMMARY")
    print("==============================")
    for k, v in results.items():
        print(k.upper(), "=>", v)