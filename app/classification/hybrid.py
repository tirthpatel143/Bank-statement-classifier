from typing import List, Tuple, Dict
from collections import defaultdict
from app.classification.rules import RuleClassifier
from app.classification.ml_model import MLClassifier
from app.schemas.models import Transaction, CategorySummary

class HybridClassifier:
    def __init__(self):
        self.rule_classifier = RuleClassifier()
        self.ml_classifier = MLClassifier()

    def classify_transactions(self, transactions: List[Transaction]) -> Tuple[List[Transaction], List[CategorySummary]]:
        """
        Applies hybrid rule + ML classification policy:
        1. Strong priority rule match -> use rule category
        2. No rule match, ML confidence >= 0.75 -> use ML category
        3. No rule match, ML confidence < 0.75 -> 'Other' / 'Needs Review'
        """
        cat_stats = defaultdict(lambda: {"count": 0, "total_debit": 0.0, "total_credit": 0.0})

        for tx in transactions:
            rule_result = self.rule_classifier.classify(tx.description)
            
            if rule_result:
                cat, conf, matched = rule_result
                tx.category = cat
                tx.classification_method = "rule"
                tx.classification_confidence = conf
                tx.matched_keywords = matched
            else:
                ml_result = self.ml_classifier.predict(tx.description)
                if ml_result and ml_result[1] >= 0.75:
                    cat, conf = ml_result
                    tx.category = cat
                    tx.classification_method = "ml"
                    tx.classification_confidence = round(conf, 2)
                    tx.matched_keywords = []
                else:
                    tx.category = "Other"
                    tx.classification_method = "fallback"
                    tx.classification_confidence = round(ml_result[1], 2) if ml_result else 0.50
                    tx.matched_keywords = []
                    tx.needs_review = True
                    tx.validation_issues.append("Low confidence classification (Requires Review)")

            # Aggregate stats
            cat_stats[tx.category]["count"] += 1
            if tx.transaction_type == "debit" or tx.debit:
                cat_stats[tx.category]["total_debit"] += (tx.debit or tx.amount)
            else:
                cat_stats[tx.category]["total_credit"] += (tx.credit or tx.amount)

        summary_list = [
            CategorySummary(
                category=cat,
                count=data["count"],
                total_debit=round(data["total_debit"], 2),
                total_credit=round(data["total_credit"], 2)
            )
            for cat, data in cat_stats.items()
        ]

        return transactions, summary_list
