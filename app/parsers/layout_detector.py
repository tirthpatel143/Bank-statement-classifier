from typing import List, Dict, Any, Tuple
from app.parsers.base import BankParser
from app.parsers.generic import GenericParser
from app.parsers.hdfc import HDFCParser
from app.parsers.icici import ICICIParser
from app.parsers.sbi import SBIParser
from app.parsers.axis import AxisParser
from app.parsers.kotak import KotakParser

PARSERS: List[BankParser] = [
    HDFCParser(),
    ICICIParser(),
    SBIParser(),
    AxisParser(),
    KotakParser(),
    GenericParser()
]

def select_best_parser(full_text: str) -> Tuple[BankParser, float]:
    """
    Selects the best parser based on bank identifiers in PDF text.
    Returns (selected_parser, confidence_score)
    """
    for parser in PARSERS[:-1]:  # Exclude generic parser in first pass
        if parser.can_parse(full_text):
            return parser, 0.95
            
    return GenericParser(), 0.70
