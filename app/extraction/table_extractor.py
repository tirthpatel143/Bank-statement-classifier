import pdfplumber
from typing import List, Dict, Any, Optional

def extract_tables_from_pdf(
    pdf_path: str,
    page_numbers: Optional[List[int]] = None,
    table_settings: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Extracts tabular data from specified PDF pages using border or text-alignment strategies.
    """
    if table_settings is None:
        table_settings = {
            "vertical_strategy": "text",
            "horizontal_strategy": "text",
            "text_x_tolerance": 3,
            "text_y_tolerance": 3,
        }
        
    extracted_tables = []
    
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        target_pages = page_numbers if page_numbers else list(range(1, total + 1))
        
        for p_num in target_pages:
            if p_num <= total:
                page = pdf.pages[p_num - 1]
                # First try explicit lines table strategy
                tables = page.extract_tables()
                if not tables or all(len(t) == 0 for t in tables):
                    # Fallback to text-alignment strategy
                    tables = page.extract_tables(table_settings=table_settings)
                    
                for table in tables:
                    if table:
                        extracted_tables.append({
                            "page_number": p_num,
                            "rows": table
                        })
                        
    return extracted_tables
