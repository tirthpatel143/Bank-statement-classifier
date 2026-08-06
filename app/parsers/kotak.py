import re
from typing import List, Dict, Any, Optional
from app.parsers.base import BankParser, clean_amount, parse_date_string, mask_account_number, extract_dynamic_account_details
from app.schemas.models import AccountDetails, FieldDetail, Transaction

class KotakParser(BankParser):
    @property
    def bank_name(self) -> str:
        return "Kotak Mahindra Bank"

    def can_parse(self, text: str) -> bool:
        text_upper = text.upper()
        return "KOTAK" in text_upper or "KKBK" in text_upper

    def extract_account_details(self, pages_data: List[Dict[str, Any]]) -> AccountDetails:
        return extract_dynamic_account_details(pages_data, default_bank="Kotak Mahindra Bank")

    def extract_transactions(self, pages_data: List[Dict[str, Any]]) -> List[Transaction]:
        transactions = []
        date_pattern = r'^\s*(?:\d+[\s.-]+)?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{2,4})\s+'
        
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
                            row_lines.append(lines[idx].strip())
                            idx += 1
                            
                        full_row = " ".join(row_lines)
                        tx = self._parse_kotak_line(full_row, parsed_date, page_num)
                        if tx:
                            transactions.append(tx)
                        continue
                idx += 1
                
        return transactions

    def _parse_kotak_line(self, line: str, parsed_date: str, page_num: int) -> Optional[Transaction]:
        amounts = re.findall(r'[\d,]+\.\d{2}', line)
        if not amounts:
            return None
            
        balance, _ = clean_amount(amounts[-1])
        if balance is None:
            return None
            
        debit = None
        credit = None
        amount = 0.0
        tx_type = "debit"
        
        if len(amounts) >= 2:
            amt_val, _ = clean_amount(amounts[0])
            if amt_val:
                amount = amt_val
                if "CR" in line.upper() or "CREDIT" in line.upper():
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
        desc = re.sub(r'^\s*(?:\d+[\s.-]+)?(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[/-][A-Za-z]{3}[/-]\d{2,4})', '', desc).strip()
        for am in amounts:
            desc = desc.replace(am, '')
        desc = re.sub(r'\s+', ' ', desc).strip()
        if not desc:
            desc = "Kotak Transaction"

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
            extraction_confidence=0.94
        )
