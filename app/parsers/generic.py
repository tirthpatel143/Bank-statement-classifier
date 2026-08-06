import re
from typing import List, Dict, Any, Optional
from app.parsers.base import BankParser, clean_amount, parse_date_string, mask_account_number, extract_dynamic_account_details
from app.schemas.models import AccountDetails, FieldDetail, Transaction

class GenericParser(BankParser):
    @property
    def bank_name(self) -> str:
        return "Generic Bank Statement Parser"

    def can_parse(self, text: str) -> bool:
        return True

    def extract_account_details(self, pages_data: List[Dict[str, Any]]) -> AccountDetails:
        return extract_dynamic_account_details(pages_data, default_bank="Detected Bank Layout")

    def extract_transactions(self, pages_data: List[Dict[str, Any]]) -> List[Transaction]:
        transactions = []
        date_pattern = r'^\s*(?:\d+[\s.-]+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4}|\d{4}-\d{2}-\d{2})'
        
        current_tx = None
        
        for p in pages_data:
            page_num = p["page_number"]
            lines = p["text"].split("\n")
            
            for line in lines:
                line_str = line.strip()
                if not line_str:
                    continue
                    
                match = re.match(date_pattern, line_str)
                if match:
                    if current_tx:
                        tx_obj = self._build_transaction(current_tx)
                        if tx_obj:
                            transactions.append(tx_obj)
                        current_tx = None
                        
                    raw_date = match.group(1)
                    parsed_dt = parse_date_string(raw_date)
                    if parsed_dt:
                        current_tx = {
                            "date": parsed_dt,
                            "raw_lines": [line_str],
                            "page": page_num
                        }
                elif current_tx:
                    current_tx["raw_lines"].append(line_str)
                    
        if current_tx:
            tx_obj = self._build_transaction(current_tx)
            if tx_obj:
                transactions.append(tx_obj)
                
        if not transactions:
            inline_date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})'
            for p in pages_data:
                page_num = p["page_number"]
                for line in p["text"].split("\n"):
                    match = re.search(inline_date_pattern, line)
                    if match:
                        parsed_dt = parse_date_string(match.group(1))
                        if parsed_dt:
                            tx_obj = self._build_transaction({
                                "date": parsed_dt,
                                "raw_lines": [line],
                                "page": page_num
                            })
                            if tx_obj:
                                transactions.append(tx_obj)

        return transactions

    def _build_transaction(self, tx_dict: Dict[str, Any]) -> Optional[Transaction]:
        full_line = " ".join(tx_dict["raw_lines"])
        date_str = tx_dict["date"]
        
        amount_matches = re.findall(r'[₹$]?\s*[\d,]+\.\d{2}(?:\s*[DC]R)?', full_line, re.IGNORECASE)
        if not amount_matches:
            amount_matches = re.findall(r'[\d,]+\.\d{2}', full_line)
            
        if not amount_matches:
            return None
            
        cleaned_amounts = []
        for am_str in amount_matches:
            val, type_override = clean_amount(am_str)
            if val is not None:
                cleaned_amounts.append((val, type_override, am_str))
                
        if not cleaned_amounts:
            return None
            
        balance = cleaned_amounts[-1][0]
        debit = None
        credit = None
        tx_type = "debit"
        amount = 0.0
        
        if len(cleaned_amounts) >= 3:
            d_val, _, _ = cleaned_amounts[-3]
            c_val, _, _ = cleaned_amounts[-2]
            if d_val > 0 and c_val == 0:
                debit = d_val
                amount = d_val
                tx_type = "debit"
            elif c_val > 0:
                credit = c_val
                amount = c_val
                tx_type = "credit"
            else:
                debit = d_val
                amount = d_val
                tx_type = "debit"
        elif len(cleaned_amounts) == 2:
            amt_val, type_override, raw_str = cleaned_amounts[0]
            amount = amt_val
            if type_override == "credit" or "CR" in full_line.upper() or "CREDIT" in full_line.upper() or "DEPOSIT" in full_line.upper() or "BY " in full_line.upper():
                credit = amt_val
                tx_type = "credit"
            else:
                debit = amt_val
                tx_type = "debit"
        else:
            amount = balance
            debit = amount
            tx_type = "debit"
            
        desc = full_line
        desc = re.sub(r'^\s*(?:\d+[\s.-]+)?(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})', '', desc).strip()
        for _, _, raw_am in cleaned_amounts:
            desc = desc.replace(raw_am, '')
        desc = re.sub(r'\s+', ' ', desc).strip()
        if not desc:
            desc = "Transaction"

        return Transaction(
            date=date_str,
            description=desc,
            raw_description=full_line,
            debit=debit,
            credit=credit,
            amount=amount,
            transaction_type=tx_type,
            balance=balance,
            source_page=tx_dict["page"],
            extraction_confidence=0.85
        )
