import os
import json
from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.models import RetrainRequest
from app.classification.ml_model import MLClassifier

router = APIRouter()

TRAINING_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "training")
FEEDBACK_FILE = os.path.join(TRAINING_DIR, "user_corrections.json")
os.makedirs(TRAINING_DIR, exist_ok=True)

ml_classifier = MLClassifier()

@router.post("/retrain")
def retrain_model(request: RetrainRequest):
    """
    Saves user manual category overrides and triggers TF-IDF + Logistic Regression model retraining.
    """
    if not request.overrides:
        return {"status": "success", "message": "No overrides provided."}

    existing_corrections = []
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                existing_corrections = json.load(f)
        except Exception:
            existing_corrections = []

    for override in request.overrides:
        existing_corrections.append({
            "transaction_id": override.transaction_id,
            "category": override.category
        })

    with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
        json.dump(existing_corrections, f, indent=2)

    # Collect training dataset (description -> category)
    descriptions = []
    categories = []
    for item in existing_corrections:
        if "description" in item and "category" in item:
            descriptions.append(item["description"])
            categories.append(item["category"])

    if len(descriptions) >= 2 and len(set(categories)) >= 2:
        ml_classifier.fit(descriptions, categories)
        return {
            "status": "success",
            "message": f"Model successfully retrained on {len(descriptions)} labeled records.",
            "total_samples": len(descriptions)
        }
    else:
        return {
            "status": "saved",
            "message": "Corrections saved to feedback store. Additional samples needed for ML fitting.",
            "total_samples": len(existing_corrections)
        }
