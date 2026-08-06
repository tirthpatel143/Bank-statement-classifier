# Bank Statement Extraction, Validation, Classification & Export System

A comprehensive, production-ready system for extracting account details, parsing transactions, performing strict accounting balance validations, classifying transactions using a hybrid (Rules + TF-IDF ML) engine, and exporting formatted multi-sheet Excel, CSV, and JSON data.

---

## 🌟 Key Features & Pipeline Steps

### 1. Upload & File Security Validation
- **Extension & MIME Validation**: Enforces strict `.pdf` / `application/pdf` checks.
- **File Size Guard**: Enforces configurable file size limits (50 MB default).
- **Duplicate Prevention**: SHA-256 hash calculation prevents duplicate processing.
- **Privacy Masking**: Automatically masks sensitive account numbers in output (`XXXXXXXX1234`).
- **Encryption Check**: Rejects password-protected PDFs with clear error feedback.

### 2. PDF Page Detector (Text vs Image Scanned)
- Page-by-page character density analysis (`pdfplumber` threshold check).
- Classifies each page as either `text` (searchable) or `image` (scanned).
- Routes image pages to an OCR pipeline (`pytesseract` + `pdf2image`).

### 3. Bank & Layout Detection Engine
- Abstract `BankParser` class architecture.
- Included Parsers:
  - **HDFC Bank** (`HDFCParser`)
  - **ICICI Bank** (`ICICIParser`)
  - **State Bank of India** (`SBIParser`)
  - **Axis Bank** (`AxisParser`)
  - **Kotak Mahindra Bank** (`KotakParser`)
  - **Generic Fallback Parser** (`GenericParser`)
- Auto-selects parser based on header identifiers and column layout confidence.

### 4. Account Details & Transaction Extraction
- Extracts Account Holder Name, Account Number (Masked), IFSC Code, Bank Name, Statement Period, Opening & Closing Balances.
- Normalizes transaction dates to `YYYY-MM-DD`.
- Cleans currency symbols (`₹`, `$`, commas) and handles DR/CR suffixes.
- Multi-line description concatenation.

### 5. Accounting Validation Suite
- **Balance Sequence Check**: Mathematically verifies consecutive balances: $\text{Balance}_i = \text{Balance}_{i-1} \pm \text{Amount}_i$ (with $\pm 0.05$ tolerance).
- **Duplicate Row Detection**: Flags duplicate date/description/amount tuples.
- **Closing Balance Reconciliation**: Reconciles final transaction balance against statement closing balance.
- **Row Review Flagging**: Non-destructive flagging marking questionable rows with `needs_review: true`.

### 6. Hybrid Classification Engine
- **Phase 1 (Rules)**: Priority-ordered YAML rule engine (e.g. `Swiggy`/`Zomato` → `Food`, `HPCL`/`BPCL` → `Fuel`, `Salary` → `Salary`).
- **Phase 2 (Machine Learning)**: Scikit-learn pipeline using `TfidfVectorizer(analyzer="char_wb", ngram_range=(3,5))` + `LogisticRegression(class_weight="balanced")`.
- **Feedback Loop**: Collects user manual category overrides and supports incremental retraining (`/api/retrain`).

### 7. Modern Interactive Web UI & Multi-Format Exporter
- Drag-and-drop PDF upload with progress tracking bar.
- Interactive transaction table with inline cell editing for Date, Description, Debit, Credit, Balance, and Category.
- **Multi-Sheet Excel Export**: Generates `.xlsx` workbooks containing 4 styled sheets:
  1. `Transactions`
  2. `Account Details`
  3. `Validation Report`
  4. `Classification Summary`
- CSV and JSON export options.

---

## 🚀 Quickstart Guide

### Option 1: Run Unified Server (Recommended - Port 8080)
The backend automatically serves the built React web dashboard at **http://localhost:8080** in a single command:

```bash
# Activate virtual environment
source venv/bin/activate

# Seed initial data & generate sample test PDFs
PYTHONPATH=. python scripts/seed_data.py
PYTHONPATH=. python scripts/generate_sample_pdfs.py

# Start application server
PYTHONPATH=. uvicorn app.main:app --port 8080
```
- **Web UI & Backend App**: [http://localhost:8080](http://localhost:8080)
- **API Documentation**: [http://localhost:8080/docs](http://localhost:8080/docs)

---

### Option 2: Run Development Mode (Port 5173 + Port 8080)

If you are modifying the React frontend code in real time:

**Terminal 1 (Backend):**
```bash
source venv/bin/activate
PYTHONPATH=. uvicorn app.main:app --reload --port 8080
```

**Terminal 2 (Frontend Dev Server):**
```bash
cd frontend
npm run dev
```
- **Vite Dev Server**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

```bash
# Run pytest across all test modules
PYTHONPATH=. pytest
```
