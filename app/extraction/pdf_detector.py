import pdfplumber
import pypdf
from typing import List, Dict, Any
from app.schemas.models import PageTypeInfo

def detect_pdf_page_types(pdf_path: str, min_char_threshold: int = 50) -> List[PageTypeInfo]:
    """
    Performs page-by-page analysis to classify pages as 'text' or 'image' (scanned).
    Does not rely only on file extension or single page check.
    """
    page_types = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                # Count meaningful alphanumeric characters
                meaningful_chars = sum(1 for c in text if c.isalnum())
                
                page_type = "text" if meaningful_chars >= min_char_threshold else "image"
                page_types.append(PageTypeInfo(
                    page_number=idx + 1,
                    page_type=page_type,
                    character_count=meaningful_chars
                ))
    except Exception as e:
        # Fallback using pypdf
        try:
            reader = pypdf.PdfReader(pdf_path)
            page_types = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                meaningful_chars = sum(1 for c in text if c.isalnum())
                page_type = "text" if meaningful_chars >= min_char_threshold else "image"
                page_types.append(PageTypeInfo(
                    page_number=idx + 1,
                    page_type=page_type,
                    character_count=meaningful_chars
                ))
        except Exception as inner_e:
            raise RuntimeError(f"Failed to inspect PDF page types: {str(e)} | {str(inner_e)}")

    return page_types
