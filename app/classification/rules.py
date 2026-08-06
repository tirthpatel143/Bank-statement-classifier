import os
import yaml
import re
from typing import Dict, Any, List, Optional, Tuple

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config", "categories.yaml")

class RuleClassifier:
    def __init__(self, config_file: str = CONFIG_PATH):
        self.config_file = config_file
        self.categories_config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if not os.path.exists(self.config_file):
            return {}
        with open(self.config_file, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("categories", {})

    def classify(self, description: str) -> Optional[Tuple[str, float, List[str]]]:
        """
        Classifies transaction description based on priority rules and keyword patterns.
        Returns: (category, confidence, matched_keywords) or None if no rule matches.
        """
        if not description:
            return None
            
        desc_lower = description.lower()
        
        # Sort categories by priority order (ascending priority int)
        sorted_cats = sorted(
            self.categories_config.items(),
            key=lambda item: item[1].get("priority", 999)
        )

        for cat_key, cat_info in sorted_cats:
            keywords = cat_info.get("keywords", [])
            matched = []
            for kw in keywords:
                if kw.lower() in desc_lower:
                    matched.append(kw)
                    
            if matched:
                category_display_name = cat_key.replace("_", " ").title()
                confidence = 0.95 if len(matched) >= 2 else 0.90
                return category_display_name, confidence, matched
                
        return None
