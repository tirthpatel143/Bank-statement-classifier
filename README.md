# 🏦 Bank Statement Classification & Financial Processing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3%2B-f7931e.svg)](https://scikit-learn.org)

An enterprise-grade, full-stack financial platform designed to upload, extract, validate, classify, and export bank statement PDFs (HDFC, ICICI, SBI, Axis, Kotak, and generic formats). Built with a high-precision extraction pipeline (`pdfplumber` + OCR fallback), dynamic account metadata parser, strict accounting continuity validator, and a hybrid rule + ML classification engine.

---

## 🌟 Executive Overview

Processing bank statements across varying PDF formats, layout designs, and character encodings presents complex technical challenges. This platform provides an end-to-end automated workflow:

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│  Upload PDF     │ ────► │ Page Inspector  │ ────► │ Dynamic Bank &       │
│  (50MB Limit)   │       │ (Text vs OCR)   │       │ Header Extraction    │
└─────────────────┘       └─────────────────┘       └──────────┬───────────┘
                                                               │
                                                               ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────────┐
│ Export Excel/   │ ◄──── │ Hybrid ML       │ ◄──── │ Accounting           │
│ CSV / JSON      │       │ Classifier      │       │ Validation Suite     │
└─────────────────┘       └─────────────────┘       └──────────────────────┘
```

---

## 🚀 Key Features

### 📄 1. Multi-Format PDF Extraction Engine
- **Text & Scanned OCR Processing**: Inspects PDF page character density. Text-rich pages extract via `pdfplumber`, while image/scanned pages route to `pytesseract` + `pdf2image` OCR.
- **Dynamic Bank Layout Matching**: Auto-detects statement layouts for major Indian banks (**State Bank of India**, **HDFC Bank**, **ICICI Bank**, **Axis Bank**, **Kotak Mahindra Bank**) with automatic multi-layered fallback to `GenericParser` for unlisted or custom layouts.
- **PDF-Specific Dynamic Account Metadata**: Parses exact account holder names, masked account numbers (`XXXX XXXX 1234`), bank-specific IFSC codes (`SBIN0...`), statement periods, and opening/closing balances directly from PDF headers without hardcoded fallbacks.

### ⚖️ 2. Accounting Validation Suite
- **Mathematical Continuity Check**: Verifies consecutive transaction running balances:
  $$\text{Balance}_i = \text{Balance}_{i-1} \pm \text{Amount}_i \quad (\text{Tolerance: } \pm 0.05)$$
- **Non-Destructive Review Flagging**: Automatically flags rows failing balance checks or missing critical fields as `Needs Review` for human audit.
- **Duplicate & Anomaly Detection**: Highlights duplicate transaction tuples (same date, description, amount) and reconciles overall closing balances.

### 🧠 3. Hybrid Categorization Engine (Rules + ML)
- **Priority-Based Rule Layer**: Fast rule-matching for standard transaction patterns (`Swiggy`/`Zomato` → `Food`, `Salary` → `Salary`, `HPCL`/`BPCL` → `Fuel`, `BESCOM` → `Utilities`).
- **Char-n-Gram TF-IDF + Logistic Regression**: Scikit-Learn machine learning pipeline using `TfidfVectorizer(analyzer="char_wb", ngram_range=(3,5))` with balanced class weighting to categorize unclassified transactions.
- **Human-in-the-Loop Feedback & Retraining**: Supports inline UI editing and triggers live model retraining via `/api/retrain`.

### 🎨 4. Modern Light Emerald Web Dashboard
- Built with **React 19**, **Vite**, and custom vanilla CSS using a light emerald financial palette (`#f4f9f5` background, `#ffffff` card panels, `#059669` emerald accents).
- Interactive Data Grid with inline cell editing for Date, Description, Debit, Credit, Balance, and Category.
- Instant search filtering, category dropdowns, and "Needs Review Only" toggle.
- Multi-sheet styled Excel workbook generation (`.xlsx`) containing 4 dedicated tabs:
  1. `Transactions`
  2. `Account Details`
  3. `Validation Report`
  4. `Classification Summary`

---

## 📂 Project Architecture

```
Bank-statement-classifier/
├── app/
│   ├── api/                  # FastAPI router endpoints (upload, process, export, retrain)
│   ├── classification/       # Hybrid rule + ML classification module
│   ├── export/               # Excel (.xlsx), CSV, and JSON exporters
│   ├── extraction/           # PDF text extractor, OCR module & page-type detector
│   ├── parsers/              # Bank-specific parsers (HDFC, ICICI, SBI, Axis, Kotak, Generic)
│   ├── schemas/              # Pydantic data models & schema definitions
│   ├── validation/           # Accounting balance continuity & validation suite
│   └── main.py               # FastAPI application entrypoint
├── config/
│   ├── bank_layouts.yaml     # Header keyword layouts & column rules
│   └── categories.yaml       # Priority rule patterns & category keywords
├── data/
│   ├── processed/            # Serialized JSON execution results
│   ├── raw/                  # Uploaded PDF statement store
│   └── samples/              # Generated sample PDF statements
├── frontend/
│   ├── src/                  # React components, App.jsx, index.css
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite dev server & proxy settings
├── scripts/
│   ├── generate_sample_pdfs.py  # Test PDF generator script
│   └── seed_data.py             # Category model training seed script
├── tests/                    # Pytest backend test suite
├── LICENSE                   # MIT License
├── README.md                 # Project documentation
└── requirements.txt          # Python dependencies
```

---

## 🛠️ Installation & Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **Tesseract OCR** (optional, for scanned PDF OCR support)
  - macOS: `brew install tesseract poppler`
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr poppler-utils`

### 1. Clone & Setup Virtual Environment

```bash
# Clone the repository
git clone https://github.com/your-username/Bank-statement-classifier.git
cd Bank-statement-classifier

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Frontend Build & Data Seeding

```bash
# Seed initial categories & ML classification model
PYTHONPATH=. python scripts/seed_data.py
PYTHONPATH=. python scripts/generate_sample_pdfs.py

# Install frontend dependencies and build production assets
cd frontend
npm install
npm run build
cd ..
```

---

## ⚡ Running the Platform

### Unified Server Mode (Recommended — Port 8080)
Runs the FastAPI backend and serves the production React frontend on **Port 8080**:

```bash
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8080
```

- 🌐 **Web Dashboard**: [http://localhost:8080](http://localhost:8080)
- 📖 **Interactive Swagger API Documentation**: [http://localhost:8080/docs](http://localhost:8080/docs)

### Development Mode (Port 5173 + Port 8080)

**Terminal 1 (Backend API):**
```bash
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8080
```

**Terminal 2 (Frontend HMR):**
```bash
cd frontend
npm run dev
```
- ⚡ **Vite Dev Dashboard**: [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload & validate statement PDF (extension, MIME, size check) |
| `POST` | `/api/process/{job_id}` | Trigger PDF extraction, validation, and classification pipeline |
| `GET` | `/api/result/{job_id}` | Retrieve JSON result for processed job |
| `POST` | `/api/transactions/update/{job_id}` | Update edited transactions in backend memory & persistence |
| `GET` | `/api/export/excel/{job_id}` | Download 4-sheet formatted Excel workbook (`.xlsx`) |
| `GET` | `/api/export/csv/{job_id}` | Download formatted CSV file |
| `POST` | `/api/retrain` | Train ML model on user-corrected category feedback |
| `GET` | `/api/health` | Health check endpoint |

---

## 🧪 Testing

Run the complete automated backend test suite using `pytest`:

```bash
source venv/bin/activate
PYTHONPATH=. pytest -v
```

All 11 unit & integration test suites verify PDF extraction, date parsing, balance continuity logic, ML classification, and API upload/export flows.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
