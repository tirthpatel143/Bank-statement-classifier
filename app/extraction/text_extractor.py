import pdfplumber
from typing import List, Dict, Any, Optional

def extract_pdf_pages_text(pdf_path: str) -> List[Dict[str, Any]]:
    """
    Extracts text and word bounding coordinates for each page in the PDF.
    """
    pages_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for idx, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            words = page.extract_words() or []
            pages_data.append({
                "page_number": idx + 1,
                "text": text,
                "words": words,
                "width": float(page.width),
                "height": float(page.height)
            })
            
    return pages_data

def get_full_text(pages_data: List[Dict[str, Any]]) -> str:
    """
    Combines text from all pages into a single string.
    """
    return "\n".join([p["text"] for p in pages_data])
