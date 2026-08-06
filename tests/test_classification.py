import pytest
from app.classification.rules import RuleClassifier
from app.classification.ml_model import MLClassifier
from app.classification.hybrid import HybridClassifier
from app.schemas.models import Transaction

def test_rule_classifier():
    rule_cls = RuleClassifier()
    res = rule_cls.classify("UPI/SWIGGY/FOOD ORDER/129381")
    assert res is not None
    cat, conf, matched = res
    assert cat == "Food"
    assert "swiggy" in matched

def test_ml_classifier_fit_predict():
    ml = MLClassifier()
    descriptions = ["SWIGGY FOOD ORDER", "ZOMATO RESTAURANT", "PETROL PUMP HPCL", "PETROL DIESEL STATION"]
    categories = ["Food", "Food", "Fuel", "Fuel"]
    ml.fit(descriptions, categories)
    
    pred = ml.predict("SWIGGY DELIVERY")
    assert pred is not None
    assert pred[0] == "Food"
    assert pred[1] > 0.50

def test_hybrid_classifier():
    hybrid = HybridClassifier()
    txs = [
        Transaction(
            date="2026-01-10",
            description="HPCL PETROL PUMP MUMBAI",
            raw_description="HPCL PETROL PUMP MUMBAI",
            debit=2000.0,
            amount=2000.0,
            transaction_type="debit",
            balance=72550.0
        )
    ]
    classified_txs, summary = hybrid.classify_transactions(txs)
    assert classified_txs[0].category == "Fuel"
    assert classified_txs[0].classification_method == "rule"
