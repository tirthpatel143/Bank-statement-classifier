import os
import joblib
import numpy as np
from typing import List, Tuple, Optional, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "training")
MODEL_PATH = os.path.join(MODEL_DIR, "tfidf_classifier.joblib")

class MLClassifier:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.pipeline: Optional[Pipeline] = None
        self._load_or_initialize()

    def _load_or_initialize(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception:
                self._initialize_pipeline()
        else:
            self._initialize_pipeline()

    def _initialize_pipeline(self):
        self.pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                min_df=1
            )),
            ("classifier", LogisticRegression(
                max_iter=1000,
                class_weight="balanced"
            ))
        ])

    def fit(self, descriptions: List[str], categories: List[str]):
        """
        Trains or updates the TF-IDF + LogisticRegression classifier.
        """
        if not descriptions or not categories or len(set(categories)) < 2:
            return
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.pipeline.fit(descriptions, categories)
        joblib.dump(self.pipeline, self.model_path)

    def predict(self, description: str) -> Optional[Tuple[str, float]]:
        """
        Predicts category and returns (category, confidence_probability).
        """
        if not self.pipeline or not hasattr(self.pipeline, "classes_"):
            return None
            
        try:
            probs = self.pipeline.predict_proba([description])[0]
            max_idx = np.argmax(probs)
            category = self.pipeline.classes_[max_idx]
            confidence = float(probs[max_idx])
            return category, confidence
        except Exception:
            return None
