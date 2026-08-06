import re
from typing import List, Dict, Any, Optional
from app.parsers.base import BankParser, clean_amount, parse_date_string, mask_account_number, extract_dynamic_account_details
from app.schemas.models import AccountDetails, FieldDetail, Transaction

class HDFCParser(BankParser):
    @property
    def bank_name(self) -> str:
        return "HDFC Bank"

    def can_parse(self, text: str) -> bool:
        text_upper = text.upper()
        # Strict check for HDFC Bank header
        return "HDFC BANK" in text_upper or "HDFCBANK" in text_upper or "HDFC BANK LIMITED" in text_upper

    def extract_account_details(self, pages_data: List[Dict[str, Any]]) -> AccountDetails:
        return extract_dynamic_account_details(pages_data, default_bank="HDFC Bank Limited")

    def extract_transactions(self, pages_data: List[Dict[str, Any]]) -> List[Transaction]:
        transactions = []
        date_pattern = r'^\s*(?:\d+[\s.-]+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})'
        
        for p in pages_data:
            page_num = p["page_number"]
            lines = p["text"].split("\n")
            
            idx = 0
            while idx < len(lines):
                line = lines[idx].strip()
                match = re.match(date_pattern, line)
                if match:
                    raw_date = match.group(1)
                    parsed_date = parse_date_string(raw_date)
                    
                    if parsed_date:
                        row_lines = [line]
                        idx += 1
                        while idx < len(lines) and not re.match(date_pattern, lines[idx].strip()) and lines[idx].strip():
                            if "NARRATION" in lines[idx].upper() or "STATEMENT" in lines[idx].upper() or "PAGE" in lines[idx].upper():
                                break
                            row_lines.append(lines[idx].strip())
                            idx += 1
                            
                        full_row = " ".join(row_lines)
                        tx = self._parse_hdfc_line(full_row, parsed_date, page_num)
                        if tx:
                            transactions.append(tx)
                        continue
                idx += 1
                
        return transactions

    def _parse_hdfc_line(self, line: str, parsed_date: str, page_num: int) -> Optional[Transaction]:
        amounts = re.findall(r'[\d,]+\.\d{2}', line)
        if not amounts:
            amounts = re.findall(r'[\d,]+', line)
            amounts = [a for a in amounts if len(a) < 10 and not a.startswith("202")]
            
        if not amounts:
            return None
            
        balance, _ = clean_amount(amounts[-1])
        if balance is None:
            return None
            
        debit = None
        credit = None
        amount = 0.0
        tx_type = "debit"
        
        if len(amounts) >= 3:
            w_val, _ = clean_amount(amounts[-3])
            d_val, _ = clean_amount(amounts[-2])
            if w_val and w_val > 0:
                debit = w_val
                amount = w_val
                tx_type = "debit"
            elif d_val and d_val > 0:
                credit = d_val
                amount = d_val
                tx_type = "credit"
        elif len(amounts) == 2:
            amt_val, _ = clean_amount(amounts[0])
            if amt_val:
                amount = amt_val
                if "CR" in line.upper() or "DEPOSIT" in line.upper() or "BY " in line.upper():
                    credit = amt_val
                    tx_type = "credit"
                else:
                    debit = amt_val
                    tx_type = "debit"
        else:
            amount = balance
            debit = amount
            tx_type = "debit"

        desc = line
        desc = re.sub(r'^\s*(?:\d+[\s.-]+)?(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})', '', desc).strip()
        for am in amounts:
            desc = desc.replace(am, '')
        desc = re.sub(r'\s+', ' ', desc).strip()
        if not desc:
            desc = "HDFC Transaction"

        return Transaction(
            date=parsed_date,
            description=desc,
            raw_description=line,
            debit=debit,
            credit=credit,
            amount=amount,
            transaction_type=tx_type,
            balance=balance,
            source_page=page_num,
            extraction_confidence=0.95
        )
