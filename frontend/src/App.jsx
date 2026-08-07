import React, { useState } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, Download, 
  RefreshCw, Layers, ShieldCheck, Tag, Search, Filter, Save, Sparkles, Building2, CreditCard, DollarSign,
  ArrowRight, Shield, Zap, Cpu, BarChart3, Database, FileSpreadsheet, ExternalLink, Eye, X, Info, Code, Play, ArrowDownLeft, ArrowUpRight, Check
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'workspace'
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobStatus, setJobStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Selected Card Modal Detail State
  const [selectedFeatureModal, setSelectedFeatureModal] = useState(null);

  // Filters & Edit state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);
  const [editableTxs, setEditableTxs] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [retraining, setRetraining] = useState(false);

  // Hero Interactive Live Simulator State
  const [heroSimBank, setHeroSimBank] = useState('sbi');
  const [heroSimLoading, setHeroSimLoading] = useState(false);

  const sampleBankData = {
    sbi: {
      bank: "State Bank of India",
      holder: "Ankit Tirthpatel",
      accountNo: "XXXX XXXX 6394",
      ifsc: "SBIN0001234",
      balance: "₹1,42,850.00",
      period: "01 Jan 2026 - 31 Jan 2026",
      transactions: [
        { desc: "SWIGGY FOOD ORDER", sender: "Self", recipient: "Swiggy", amount: "- ₹450.00", type: "debit", cat: "Food" },
        { desc: "ACME CORP SALARY DEPOSIT", sender: "ACME Corp", recipient: "Self", amount: "+ ₹50,000.00", type: "credit", cat: "Salary" },
        { desc: "HPCL PETROL PUMP", sender: "Self", recipient: "HPCL Petrol Station", amount: "- ₹2,000.00", type: "debit", cat: "Fuel" }
      ],
      stats: { food: 450, salary: 50000, fuel: 2000 }
    },
    hdfc: {
      bank: "HDFC Bank Limited",
      holder: "Swati Sharma",
      accountNo: "XXXX XXXX 7890",
      ifsc: "HDFC0000240",
      balance: "₹2,88,400.50",
      period: "01 Dec 2025 - 31 Dec 2025",
      transactions: [
        { desc: "AMAZON SHOPPING INDIA", sender: "Self", recipient: "Amazon Retail", amount: "- ₹3,499.00", type: "debit", cat: "Shopping" },
        { desc: "ZERODHA BROKING MUTUAL FUND", sender: "Zerodha Broking", recipient: "Self", amount: "+ ₹12,500.00", type: "credit", cat: "Investment" },
        { desc: "BESCOM ELECTRICITY BILL", sender: "Self", recipient: "BESCOM Utility", amount: "- ₹1,850.00", type: "debit", cat: "Utilities" }
      ],
      stats: { shopping: 3499, investment: 12500, utilities: 1850 }
    },
    icici: {
      bank: "ICICI Bank Limited",
      holder: "Rajesh Kumar",
      accountNo: "XXXX XXXX 4120",
      ifsc: "ICIC0000102",
      balance: "₹95,210.00",
      period: "15 Jan 2026 - 05 Feb 2026",
      transactions: [
        { desc: "ZOMATO RESTAURANT ORDER", sender: "Self", recipient: "Zomato", amount: "- ₹680.00", type: "debit", cat: "Food" },
        { desc: "FREELANCE CONSULTING FEE", sender: "TechCorp Inc", recipient: "Self", amount: "+ ₹35,000.00", type: "credit", cat: "Salary" },
        { desc: "BOOKMYSHOW MOVIE TICKETS", sender: "Self", recipient: "BookMyShow", amount: "- ₹1,100.00", type: "debit", cat: "Entertainment" }
      ],
      stats: { food: 680, salary: 35000, entertainment: 1100 }
    }
  };

  const categoriesList = [
    "ALL", "Food", "Fuel", "Salary", "Utilities", "Shopping", "Transport", 
    "Healthcare", "Insurance", "Entertainment", "Education", "Investment", 
    "Bank Charges", "Cash Withdrawal", "Cash Deposit", "Transfer", "Loan/EMI", "Rent", "Refund", "Other"
  ];

  // Feature Cards Detailed Content Dictionary for Modals
  const featureDetailsData = {
    page_inspector: {
      title: "PDF Page Inspector & Hybrid OCR Engine",
      icon: <Layers size={32} color="#059669" />,
      tag: "Extraction Architecture",
      summary: "Performs page-by-page character density analysis to dynamically route searchable text vs scanned image pages.",
      deepDive: [
        "Analyzes character density using pdfplumber on each individual page.",
        "Pages with >50 characters are processed via high-speed text extraction.",
        "Scanned pages or image receipts (<=50 characters) route to PyTesseract OCR with pdf2image resolution scaling.",
        "Supports mixed PDF documents where page 1 is text and page 2 is a scanned physical receipt."
      ],
      codeSnippet: `if extracted_text_length > 50:\n    page_type = "text"  # Fast pdfplumber extraction\nelse:\n    page_type = "image" # PyTesseract OCR pipeline`,
      badgeText: "High Precision PDF Routing"
    },
    header_extractor: {
      title: "Dynamic PDF Header & Metadata Parser",
      icon: <CreditCard size={32} color="#0369a1" />,
      tag: "Dynamic Intelligence",
      summary: "Parses real account holder names, masked account numbers, bank-specific IFSC codes, and balances directly from PDF headers without hardcoded fallbacks.",
      deepDive: [
        "Inspects Page 1 header blocks across multi-line layouts (Account Name, Customer Name, In Account Of, Title of Account).",
        "Enforces bank-scoped IFSC matching (e.g. SBIN0... for State Bank of India) to prevent picking up transfer IFSCs from transaction descriptions.",
        "Formats account numbers securely into masked format: XXXX XXXX 1234.",
        "Extracts opening and closing statement balances dynamically."
      ],
      codeSnippet: `account_holder = re.search(r'(?:Account\\s*Name|Name|Customer\\s*Name)[\\s.:]+([A-Z\\s]{3,45})')\nmasked_acc = "XXXX XXXX " + acc_num[-4:]`,
      badgeText: "Zero Static Defaults"
    },
    validation_suite: {
      title: "Accounting Balance Continuity Suite",
      icon: <ShieldCheck size={32} color="#b45309" />,
      tag: "Accounting Compliance",
      summary: "Verifies consecutive running balances (Balance_i = Balance_(i-1) ± Amount_i) and flags anomalous rows for audit.",
      deepDive: [
        "Calculates mathematical balance equation across consecutive rows with ±0.05 tolerance.",
        "Non-destructive auditing: flags failing rows as 'Needs Review' without deleting data.",
        "Identifies duplicate transaction tuples (same date, description, amount, balance).",
        "Reconciles overall statement opening vs closing balances."
      ],
      codeSnippet: `expected_balance = prev_balance - debit + credit\nif abs(current_balance - expected_balance) > 0.05:\n    row.needs_review = True`,
      badgeText: "Mathematical Verification"
    },
    ml_categorization: {
      title: "Hybrid Rules + ML Categorization Engine",
      icon: <Cpu size={32} color="#6b21a8" />,
      tag: "Machine Learning Pipeline",
      summary: "Combines priority-ordered YAML keyword rules with a Scikit-Learn TF-IDF char n-gram Logistic Regression model.",
      deepDive: [
        "Phase 1 Rules Engine: Priority-ordered matching (Swiggy/Zomato → Food, Salary → Salary, HPCL/BPCL → Fuel).",
        "Phase 2 ML Model: TfidfVectorizer(analyzer='char_wb', ngram_range=(3,5)) + LogisticRegression(class_weight='balanced').",
        "Feedback Loop: User manual category edits in the browser trigger incremental model retraining (/api/retrain).",
        "High accuracy on abbreviated Indian bank transaction codes."
      ],
      codeSnippet: `vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3,5))\nclf = LogisticRegression(class_weight='balanced')\nclf.fit(X_train, y_train)`,
      badgeText: "Rule + Scikit-Learn ML"
    },
    interactive_grid: {
      title: "Interactive In-Browser Data Grid with Party Extraction",
      icon: <Save size={32} color="#047857" />,
      tag: "Human-in-the-Loop Audit",
      summary: "Inline editing of transaction dates, descriptions, Sender (Money From), Recipient (Money To), debit, credit, balance, and category values.",
      deepDive: [
        "Automated Party Identification: Extracts who sent money (Sender) for credits and to whom money was sent (Recipient) for debits.",
        "Full inline editing capabilities for every extracted cell.",
        "Instant debits/credits balance re-calculation with 2 decimal precision rounding.",
        "Real-time search filtering across descriptions, raw text, and date ranges."
      ],
      codeSnippet: `if tx_type == "credit":\n    sender = parse_sender(description) # Who sent money\n    recipient = holder_name            # Credited to Self\nelse:\n    sender = holder_name               # Debited from Self\n    recipient = parse_recipient(description) # Who received money`,
      badgeText: "Real-time Party Parsing"
    },
    excel_exporter: {
      title: "Multi-Sheet Excel & CSV Exporter",
      icon: <FileSpreadsheet size={32} color="#15803d" />,
      tag: "Formatted Exports",
      summary: "Generates styled .xlsx workbooks containing 4 dedicated tabs: Transactions (with Sender & Recipient columns), Account Details, Validation Report, and Summaries.",
      deepDive: [
        "Sheet 1 (Transactions): Styled table including Date, Description, Sender (Money From), Recipient (Money To), Debit, Credit, Balance, Category, Method, Status.",
        "Sheet 2 (Account Details): PDF-extracted bank name, holder name, account number, IFSC, and balances.",
        "Sheet 3 (Validation Report): Audit summary of balance pass rates, duplicate counts, and warnings.",
        "Sheet 4 (Classification Summary): Total debits and credits grouped by category."
      ],
      codeSnippet: `writer = pd.ExcelWriter(buffer, engine='openpyxl')\ndf_txs.to_excel(writer, sheet_name='Transactions')\ndf_account.to_excel(writer, sheet_name='Account Details')`,
      badgeText: "4-Sheet Workbook"
    }
  };

  const handleHeroBankSwitch = (bankKey) => {
    setHeroSimLoading(true);
    setHeroSimBank(bankKey);
    setTimeout(() => {
      setHeroSimLoading(false);
    }, 300);
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (selectedFile) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file (.pdf).');
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds maximum allowed limit of 50 MB.');
      return;
    }
    setFile(selectedFile);
    setActiveTab('workspace');
    uploadAndProcess(selectedFile);
  };

  // Upload & process PDF pipeline
  const uploadAndProcess = async (fileToUpload) => {
    const targetFile = fileToUpload || file;
    if (!targetFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', targetFile);

    try {
      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.detail || 'Upload failed');
      }

      const statusData = await uploadRes.json();
      setJobStatus(statusData);

      const processRes = await fetch(`${API_BASE}/process/${statusData.job_id}`, {
        method: 'POST'
      });

      if (!processRes.ok) {
        const errData = await processRes.json();
        throw new Error(errData.detail || 'Extraction pipeline failed');
      }

      const resultData = await processRes.json();
      setResult(resultData);
      setEditableTxs(resultData.transactions);
      setJobStatus(prev => ({ ...prev, status: 'completed', step_progress: 100 }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle cell edit
  const handleCellEdit = (index, field, value) => {
    const updated = [...editableTxs];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'debit') {
      const d = parseFloat(value);
      if (!isNaN(d) && d > 0) {
        updated[index].amount = Math.round(d * 100) / 100;
        updated[index].transaction_type = 'debit';
        updated[index].credit = null;
      }
    } else if (field === 'credit') {
      const c = parseFloat(value);
      if (!isNaN(c) && c > 0) {
        updated[index].amount = Math.round(c * 100) / 100;
        updated[index].transaction_type = 'credit';
        updated[index].debit = null;
      }
    }

    setEditableTxs(updated);
    setHasChanges(true);
  };

  // Save changes to backend
  const saveTransactionEdits = async () => {
    if (!result) return;
    setSavingEdits(true);
    try {
      const res = await fetch(`${API_BASE}/transactions/update/${result.job_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableTxs)
      });
      if (!res.ok) throw new Error('Failed to update transactions');
      const updatedResult = await res.json();
      setResult(updatedResult);
      setEditableTxs(updatedResult.transactions);
      setHasChanges(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdits(false);
    }
  };

  // Trigger feedback retraining
  const handleRetrain = async () => {
    if (!result) return;
    setRetraining(true);
    try {
      const overrides = editableTxs.map(t => ({
        transaction_id: t.transaction_id,
        category: t.category
      }));
      const res = await fetch(`${API_BASE}/retrain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides })
      });
      const resData = await res.json();
      alert(`Model Feedback Submitted! ${resData.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetraining(false);
    }
  };

  // Download handlers
  const downloadExcel = () => {
    if (!result) return;
    window.open(`${API_BASE}/export/excel/${result.job_id}`, '_blank');
  };

  const downloadCSV = () => {
    if (!result) return;
    window.open(`${API_BASE}/export/csv/${result.job_id}`, '_blank');
  };

  // Calculate Precision Rounded Summary Metrics
  const totalDebit = Math.round(editableTxs.reduce((sum, t) => sum + (parseFloat(t.debit) || 0), 0) * 100) / 100;
  const totalCredit = Math.round(editableTxs.reduce((sum, t) => sum + (parseFloat(t.credit) || 0), 0) * 100) / 100;
  const rowsNeedingReviewCount = editableTxs.filter(t => t.needs_review).length;

  // Filtered transactions list
  const filteredTxs = editableTxs.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.date.includes(searchQuery) ||
                          (tx.sender && tx.sender.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (tx.recipient && tx.recipient.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (tx.raw_description && tx.raw_description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'ALL' || tx.category === selectedCategory;
    const matchesReview = !showNeedsReviewOnly || tx.needs_review;
    return matchesSearch && matchesCat && matchesReview;
  });

  const activeSim = sampleBankData[heroSimBank];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Universal Modern Navbar */}
      <nav style={{ background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Custom High-Tech App Logo & Branding */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
            onClick={() => setActiveTab('home')}
          >
            <div style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', padding: '0.45rem', borderRadius: '14px', display: 'flex', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)' }}>
              <img 
                src="/logo.png" 
                alt="StatementAI Logo" 
                style={{ height: '36px', width: '36px', objectFit: 'contain' }} 
              />
            </div>
            <div>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#064e3b' }}>
                Statement<span style={{ color: 'var(--accent-primary)' }}>AI</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '-2px', fontWeight: 500 }}>
                Bank Statement Processing Platform
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            <button 
              onClick={() => setActiveTab('home')}
              style={{ background: 'none', border: 'none', fontWeight: activeTab === 'home' ? 700 : 500, color: activeTab === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              Home
            </button>
            <a href="#how-it-works" style={{ textDecoration: 'none', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              How It Works
            </a>
            <a href="#features" style={{ textDecoration: 'none', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Features
            </a>
            <a href="#supported-banks" style={{ textDecoration: 'none', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Supported Banks
            </a>

            <button 
              className="glass-button" 
              style={{ padding: '0.55rem 1.25rem', fontSize: '0.875rem' }}
              onClick={() => setActiveTab('workspace')}
            >
              <Sparkles size={16} /> Launch Workspace
            </button>
          </div>

        </div>
      </nav>

      {/* VIEW 1: Modern Dynamic Home Page */}
      {activeTab === 'home' && (
        <div style={{ position: 'relative' }}>
          
          {/* Ambient Glowing Halo */}
          <div className="hero-ambient-glow" />

          {/* Hero Section with Interactive Live Widget */}
          <section style={{ padding: '4.5rem 1.5rem 3.5rem', maxWidth: '1350px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
              
              {/* Left Column: Hero Copy */}
              <div>
                <div className="badge badge-success" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <Sparkles size={16} /> Enterprise Bank Statement Intelligence
                </div>

                <h1 style={{ fontSize: '3.3rem', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-1.2px', marginBottom: '1.25rem' }}>
                  Automated Bank Statement <br />
                  <span className="hero-gradient-text">Extraction & Party Intelligence</span>
                </h1>

                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2.25rem', lineHeight: 1.6 }}>
                  Upload bank statement PDFs from <strong>HDFC, SBI, ICICI, Axis, Kotak, or Generic banks</strong>. Automate page-by-page text & OCR extraction, party identification (Sender & Recipient), accounting balance continuity checks, hybrid ML categorization, and multi-sheet Excel exports.
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
                  <button 
                    className="glass-button" 
                    style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
                    onClick={() => setActiveTab('workspace')}
                  >
                    Start Processing PDF <ArrowRight size={20} />
                  </button>
                  
                  <a 
                    href="#features" 
                    className="glass-button-secondary"
                    style={{ padding: '0.9rem 1.75rem', fontSize: '1rem' }}
                  >
                    Explore Platform Features
                  </a>
                </div>

                {/* Key Highlights */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CheckCircle2 size={18} color="#059669" /> Sender & Recipient Extraction</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CheckCircle2 size={18} color="#059669" /> Automatic Bank Detection</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CheckCircle2 size={18} color="#059669" /> 4-Sheet Excel Export</span>
                </div>
              </div>

              {/* Right Column: Dynamic Interactive Live Simulator Widget */}
              <div className="hero-interactive-card">
                
                {/* Header Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Zap size={18} color="var(--accent-primary)" /> Live Extraction Simulator
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      Select a sample statement to test real-time parsing
                    </span>
                  </div>

                  {/* Simulator Bank Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '10px' }}>
                    <button 
                      onClick={() => handleHeroBankSwitch('sbi')}
                      style={{ padding: '0.3rem 0.7rem', borderRadius: '7px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: heroSimBank === 'sbi' ? '#059669' : 'transparent', color: heroSimBank === 'sbi' ? '#ffffff' : '#475569', transition: 'all 0.2s ease' }}
                    >
                      SBI
                    </button>
                    <button 
                      onClick={() => handleHeroBankSwitch('hdfc')}
                      style={{ padding: '0.3rem 0.7rem', borderRadius: '7px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: heroSimBank === 'hdfc' ? '#059669' : 'transparent', color: heroSimBank === 'hdfc' ? '#ffffff' : '#475569', transition: 'all 0.2s ease' }}
                    >
                      HDFC
                    </button>
                    <button 
                      onClick={() => handleHeroBankSwitch('icici')}
                      style={{ padding: '0.3rem 0.7rem', borderRadius: '7px', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: heroSimBank === 'icici' ? '#059669' : 'transparent', color: heroSimBank === 'icici' ? '#ffffff' : '#475569', transition: 'all 0.2s ease' }}
                    >
                      ICICI
                    </button>
                  </div>
                </div>

                {heroSimLoading ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                    <RefreshCw className="spin" size={32} color="var(--accent-primary)" style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Executing Layout & Party Parsing Pipeline...</p>
                  </div>
                ) : (
                  <div>
                    {/* Account Header Badge */}
                    <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Bank Detected:</span>
                        <strong style={{ color: '#064e3b', fontSize: '0.95rem' }}>{activeSim.bank}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Account Holder:</span>
                        <strong>{activeSim.holder}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Masked Account No:</span>
                        <strong className="mono" style={{ color: 'var(--accent-primary)' }}>{activeSim.accountNo}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>IFSC Code:</span>
                        <strong className="mono">{activeSim.ifsc}</strong>
                      </div>
                    </div>

                    {/* Extracted Transactions Party Ticker */}
                    <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                      {activeSim.transactions.map((t, idx) => (
                        <div key={idx} style={{ padding: '0.65rem 0.85rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 700, color: '#064e3b' }}>{t.desc}</span>
                            <span style={{ color: t.type === 'credit' ? '#059669' : '#dc2626', fontWeight: 700 }}>{t.amount}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span><strong>Sender (From):</strong> <span style={{ color: t.type === 'credit' ? '#059669' : 'var(--text-main)', fontWeight: 600 }}>{t.sender}</span></span>
                            <span><strong>Recipient (To):</strong> <span style={{ color: t.type === 'debit' ? '#dc2626' : 'var(--text-main)', fontWeight: 600 }}>{t.recipient}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <button 
                      className="glass-button" 
                      style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                      onClick={() => setActiveTab('workspace')}
                    >
                      <Sparkles size={16} /> Process Your Own PDF Document
                    </button>
                  </div>
                )}

              </div>

            </div>
          </section>

          {/* Section 2: "How It Works" 4-Step Cards */}
          <section id="how-it-works" style={{ padding: '4rem 1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#064e3b', marginBottom: '0.5rem' }}>
                How The Platform Works
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Four automated steps to transform PDF bank statements into audited financial reports.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.75rem' }}>
              
              <div className="step-card" onClick={() => setSelectedFeatureModal(featureDetailsData.page_inspector)}>
                <div className="step-number-badge">1</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>Upload Statement</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Drag and drop any bank statement PDF up to 50 MB. Supports encrypted file checks and hash duplicate prevention.
                </p>
                <div className="card-click-hint">Click for Workflow Details →</div>
              </div>

              <div className="step-card" onClick={() => setSelectedFeatureModal(featureDetailsData.header_extractor)}>
                <div className="step-number-badge">2</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>Layout & OCR Check</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Performs page character density checks. Searchable text parses directly while scanned image pages trigger PyTesseract OCR.
                </p>
                <div className="card-click-hint">Click for Workflow Details →</div>
              </div>

              <div className="step-card" onClick={() => setSelectedFeatureModal(featureDetailsData.validation_suite)}>
                <div className="step-number-badge">3</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>Balance Validation</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Verifies mathematical balance continuity (Balance_i = Balance_(i-1) ± Amount_i) and flags anomalous rows for review.
                </p>
                <div className="card-click-hint">Click for Workflow Details →</div>
              </div>

              <div className="step-card" onClick={() => setSelectedFeatureModal(featureDetailsData.excel_exporter)}>
                <div className="step-number-badge">4</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>Multi-Sheet Export</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Download styled 4-sheet Excel workbooks (.xlsx), CSV files, or trigger machine learning model retraining on custom edits.
                </p>
                <div className="card-click-hint">Click for Workflow Details →</div>
              </div>

            </div>
          </section>

          {/* Section 3: Interactive 6-Feature Cards Grid (Pill Shape with Click Modal) */}
          <section id="features" style={{ padding: '4rem 1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#064e3b', marginBottom: '0.5rem' }}>
                Enterprise Extraction & Categorization Features
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                Click any animated card below to inspect full technical architecture, code snippets, and audit workflows.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
              
              {/* Feature Card 1 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.page_inspector)}
              >
                <div>
                  <div style={{ background: '#d1fae5', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#059669' }}>
                    <Layers size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    PDF Page Inspector & OCR Engine
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Analyzes character density per page. Searchable text extracts via <code className="mono">pdfplumber</code>, while image pages trigger <code className="mono">pytesseract</code> OCR.
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

              {/* Feature Card 2 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.header_extractor)}
              >
                <div>
                  <div style={{ background: '#e0f2fe', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#0369a1' }}>
                    <CreditCard size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    Dynamic PDF Header Extractor
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Parses real account holder names, masked account numbers (<code className="mono">XXXX XXXX 1234</code>), bank IFSC codes (<code className="mono">SBIN0...</code>), and balances.
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

              {/* Feature Card 3 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.validation_suite)}
              >
                <div>
                  <div style={{ background: '#fef3c7', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#b45309' }}>
                    <ShieldCheck size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    Accounting Validation Suite
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Checks balance equation Balance_i = Balance_(i-1) ± Amount_i with ±0.05 tolerance. Highlights questionable rows with <code className="mono">Needs Review</code> flags.
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

              {/* Feature Card 4 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.ml_categorization)}
              >
                <div>
                  <div style={{ background: '#f3e8ff', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#6b21a8' }}>
                    <Cpu size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    Hybrid Rules + ML Engine
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Combines priority YAML rules with Scikit-Learn TF-IDF char n-gram Logistic Regression to classify Food, Fuel, Salary, Utilities, and Investments.
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

              {/* Feature Card 5 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.interactive_grid)}
              >
                <div>
                  <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#047857' }}>
                    <Save size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    Sender & Recipient Extraction Grid
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Identifies who sent money (Sender) for credits and to whom money was sent (Recipient) for debits. Allows inline cell editing and model retraining (<code className="mono">/api/retrain</code>).
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

              {/* Feature Card 6 */}
              <div 
                className="animated-feature-card"
                onClick={() => setSelectedFeatureModal(featureDetailsData.excel_exporter)}
              >
                <div>
                  <div style={{ background: '#dcfce7', padding: '0.85rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.25rem', color: '#15803d' }}>
                    <FileSpreadsheet size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.65rem', color: '#064e3b' }}>
                    Multi-Sheet Excel Workbook Export
                  </h3>
                  <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Generates styled <code className="mono">.xlsx</code> workbooks containing 4 dedicated tabs: Transactions (with Sender & Recipient), Account Details, Validation Report, and Summaries.
                  </p>
                </div>
                <div className="card-click-hint">Click to Inspect Technical Details →</div>
              </div>

            </div>
          </section>

          {/* Section 4: Supported Banks Showcase Cards */}
          <section id="supported-banks" style={{ padding: '3.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#064e3b', marginBottom: '1rem' }}>
              Supported Bank Statement Layouts
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem' }}>
              High-precision layout matchers for top Indian financial institutions + universal generic fallback.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="bank-badge-item">🏛️ HDFC Bank Limited</div>
              <div className="bank-badge-item">🏛️ State Bank of India (SBI)</div>
              <div className="bank-badge-item">🏛️ ICICI Bank Limited</div>
              <div className="bank-badge-item">🏛️ Axis Bank Limited</div>
              <div className="bank-badge-item">🏛️ Kotak Mahindra Bank</div>
              <div className="bank-badge-item">🌐 Generic Bank PDF Parser</div>
            </div>
          </section>

          {/* Section 5: Call to Action Banner */}
          <section style={{ padding: '4rem 1.5rem 6rem', textAlign: 'center' }}>
            <div style={{ maxWidth: '950px', margin: '0 auto', background: 'linear-gradient(135deg, #064e3b, #059669)', padding: '3.5rem 2rem', borderRadius: 'var(--radius-xl)', color: '#ffffff', boxShadow: '0 15px 35px rgba(5, 150, 105, 0.28)' }}>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem' }}>
                Ready to Process Your Statement?
              </h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '640px', margin: '0 auto 2rem' }}>
                Upload any bank statement PDF to inspect page breakdowns, extracted metadata, accounting continuity, and download styled Excel workbooks.
              </p>
              <button 
                className="glass-button" 
                style={{ background: '#ffffff', color: '#064e3b', padding: '0.95rem 2.5rem', fontSize: '1.05rem' }}
                onClick={() => setActiveTab('workspace')}
              >
                Upload Statement Now <ArrowRight size={20} />
              </button>
            </div>
          </section>

        </div>
      )}

      {/* VIEW 2: Upload Dropzone & Processing Workspace */}
      {activeTab === 'workspace' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%' }}>
          
          {/* Workspace Header Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="glass-button-secondary" onClick={() => setActiveTab('home')}>
                ← Back to Home
              </button>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064e3b' }}>
                  Document Extraction Workspace
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Upload & process statement PDF documents
                </p>
              </div>
            </div>

            <div className="badge badge-info" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} /> Pipeline Ready & Operational
            </div>
          </div>

          {/* Main Upload Dropzone View if No Result */}
          {!result && (
            <div style={{ maxWidth: '660px', margin: '3rem auto' }}>
              <div 
                className={`dropzone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input 
                  id="fileInput"
                  type="file" 
                  accept=".pdf" 
                  style={{ display: 'none' }} 
                  onChange={(e) => e.target.files[0] && processSelectedFile(e.target.files[0])}
                />

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ background: '#d1fae5', padding: '1.25rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <Upload size={38} color="#059669" />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#064e3b' }}>
                  {file ? file.name : "Upload Bank Statement PDF"}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  {file ? `${(file.size / (1024*1024)).toFixed(2)} MB • PDF Document` : "Drag and drop or browse to upload. Supports HDFC, ICICI, SBI, Axis, Kotak & Borderless PDFs (Up to 50 MB)"}
                </p>

                <button 
                  className="glass-button" 
                  style={{ margin: '0 auto' }} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    document.getElementById('fileInput').click(); 
                  }} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="spin" size={18} /> Processing Statement...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Browse & Process PDF
                    </>
                  )}
                </button>
              </div>

              {/* Progress Indicator */}
              {loading && jobStatus && (
                <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: '#064e3b' }}>
                    <span>Status: {jobStatus.status.toUpperCase()}</span>
                    <span>{jobStatus.step_progress}%</span>
                  </div>
                  <div className="progress-bar-bg" style={{ marginBottom: '0.75rem' }}>
                    <div className="progress-bar-fill" style={{ width: `${jobStatus.step_progress}%` }} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {jobStatus.message}
                  </p>
                </div>
              )}

              {error && (
                <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#fee2e2', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={20} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Result Dashboard View */}
          {result && (
            <div>
              
              {/* Top Controls Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button className="glass-button-secondary" onClick={() => { setResult(null); setFile(null); }}>
                    ← Upload Another PDF
                  </button>
                  <div className="badge badge-info" style={{ padding: '0.55rem 0.95rem' }}>
                    Bank Detected: <strong>{result.detected_bank}</strong> ({result.parser_used})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {hasChanges && (
                    <button className="glass-button" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={saveTransactionEdits} disabled={savingEdits}>
                      <Save size={18} /> {savingEdits ? 'Saving...' : 'Save Table Edits'}
                    </button>
                  )}
                  
                  <button className="glass-button-secondary" onClick={handleRetrain} disabled={retraining}>
                    <RefreshCw size={16} /> Retrain ML
                  </button>

                  <button className="glass-button" onClick={downloadExcel}>
                    <Download size={18} /> Export Excel (.xlsx)
                  </button>

                  <button className="glass-button-secondary" onClick={downloadCSV}>
                    <FileText size={18} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Account Details & Summary Statistics Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                
                {/* Card 1: Account Information */}
                <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                    <CreditCard size={20} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Account Details</h3>
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Bank Name:</span> <strong>{result.account_details.bank_name.value}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Account Holder:</span> <strong>{result.account_details.account_holder.value}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Masked Acc No:</span> <strong className="mono" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{result.account_details.masked_account_number}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>IFSC Code:</span> <strong className="mono">{result.account_details.ifsc.value || 'N/A'}</strong></div>
                  </div>
                </div>

                {/* Card 2: Statement Financial Overview */}
                <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                    <DollarSign size={20} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Statement Totals</h3>
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Total Transactions:</span> <strong>{editableTxs.length} rows</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Total Debit:</span> <strong style={{ color: '#dc2626' }}>₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Total Credit:</span> <strong style={{ color: '#059669' }}>₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Closing Balance:</span> <strong className="mono">₹{(parseFloat(result.account_details.closing_balance || (editableTxs.length > 0 ? editableTxs[editableTxs.length - 1].balance : 0)) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                  </div>
                </div>

                {/* Card 3: Validation Suite */}
                <div className="glass-panel" style={{ padding: '1.25rem', wordBreak: 'break-word' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                    <ShieldCheck size={20} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Validation Suite</h3>
                  </div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Balance Pass Rate:</span> <strong style={{ color: result.validation_report.balance_check_pass_rate >= 95 ? '#059669' : '#d97706' }}>{result.validation_report.balance_check_pass_rate}%</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Valid Rows:</span> <strong>{result.validation_report.valid_rows} / {result.validation_report.total_rows}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Rows Needing Review:</span> <strong style={{ color: rowsNeedingReviewCount > 0 ? '#d97706' : '#059669' }}>{rowsNeedingReviewCount}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Duplicates Flagged:</span> <strong>{result.validation_report.duplicate_count}</strong></div>
                  </div>
                </div>

                {/* Card 4: Page Inspector */}
                <div className="glass-panel" style={{ padding: '1.25rem', maxHeight: '220px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: '#064e3b' }}>
                    <Layers size={20} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>PDF Page Inspector</h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {result.page_types.map(pt => (
                      <div key={pt.page_number} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Page {pt.page_number}</span>
                        <span className={`badge ${pt.page_type === 'text' ? 'badge-success' : 'badge-warning'}`}>
                          {pt.page_type.toUpperCase()} ({pt.character_count} chars)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Warnings Banner if any */}
              {result.validation_report.warnings.length > 0 && (
                <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#fef3c7', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', color: '#92400e' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} /> Accounting Validation Alerts:
                  </strong>
                  <ul style={{ paddingLeft: '1.5rem', marginTop: '0.35rem', fontSize: '0.875rem' }}>
                    {result.validation_report.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transaction Search & Filter Bar */}
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Search descriptions, sender, recipient, or dates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-cell"
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--text-muted)" />
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input-cell"
                      style={{ width: '160px' }}
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={showNeedsReviewOnly}
                      onChange={(e) => setShowNeedsReviewOnly(e.target.checked)}
                    />
                    <span style={{ color: showNeedsReviewOnly ? '#d97706' : 'var(--text-main)' }}>
                      Needs Review Only ({editableTxs.filter(t => t.needs_review).length})
                    </span>
                  </label>
                </div>
              </div>

              {/* Interactive Editable Transactions Data Grid with Sender & Recipient Columns */}
              <div className="glass-panel" style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '105px' }}>Date</th>
                      <th style={{ minWidth: '220px' }}>Description</th>
                      <th style={{ minWidth: '150px' }}>Sender (Money From)</th>
                      <th style={{ minWidth: '150px' }}>Recipient (Money To)</th>
                      <th style={{ width: '115px', textAlign: 'right' }}>Debit</th>
                      <th style={{ width: '115px', textAlign: 'right' }}>Credit</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Balance</th>
                      <th style={{ width: '140px' }}>Category</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Method</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.map((tx, idx) => {
                      const methodDisplay = tx.classification_method === 'rule' ? 'Rule' : (tx.classification_method === 'ml' ? 'ML model' : 'Manual');
                      const statusDisplay = (tx.row_valid && tx.balance_check && !tx.needs_review) ? 'Valid' : 'Needs Review';

                      return (
                        <tr key={tx.transaction_id} className={tx.needs_review ? 'needs-review' : ''}>
                          
                          {/* Date */}
                          <td>
                            <input 
                              type="text" 
                              value={tx.date} 
                              onChange={(e) => handleCellEdit(idx, 'date', e.target.value)}
                              className="input-cell mono"
                              style={{ fontSize: '0.8rem' }}
                            />
                          </td>

                          {/* Description */}
                          <td>
                            <input 
                              type="text" 
                              value={tx.description} 
                              onChange={(e) => handleCellEdit(idx, 'description', e.target.value)}
                              className="input-cell"
                              style={{ fontWeight: 500 }}
                            />
                          </td>

                          {/* Sender (Money From) */}
                          <td>
                            <input 
                              type="text" 
                              value={tx.sender || 'Self'} 
                              onChange={(e) => handleCellEdit(idx, 'sender', e.target.value)}
                              className="input-cell"
                              style={{ fontSize: '0.8rem', color: tx.credit ? '#059669' : 'var(--text-muted)', fontWeight: tx.credit ? 600 : 400 }}
                            />
                          </td>

                          {/* Recipient (Money To) */}
                          <td>
                            <input 
                              type="text" 
                              value={tx.recipient || 'Self'} 
                              onChange={(e) => handleCellEdit(idx, 'recipient', e.target.value)}
                              className="input-cell"
                              style={{ fontSize: '0.8rem', color: tx.debit ? '#dc2626' : 'var(--text-muted)', fontWeight: tx.debit ? 600 : 400 }}
                            />
                          </td>

                          {/* Debit */}
                          <td>
                            <input 
                              type="number" 
                              value={tx.debit !== null && tx.debit !== undefined ? tx.debit : ''} 
                              onChange={(e) => handleCellEdit(idx, 'debit', e.target.value)}
                              placeholder="—"
                              className="input-cell mono"
                              style={{ textAlign: 'right', color: tx.debit ? '#dc2626' : 'var(--text-muted)', fontWeight: tx.debit ? 600 : 400 }}
                            />
                          </td>

                          {/* Credit */}
                          <td>
                            <input 
                              type="number" 
                              value={tx.credit !== null && tx.credit !== undefined ? tx.credit : ''} 
                              onChange={(e) => handleCellEdit(idx, 'credit', e.target.value)}
                              placeholder="—"
                              className="input-cell mono"
                              style={{ textAlign: 'right', color: tx.credit ? '#059669' : 'var(--text-muted)', fontWeight: tx.credit ? 600 : 400 }}
                            />
                          </td>

                          {/* Balance */}
                          <td>
                            <input 
                              type="number" 
                              value={tx.balance} 
                              onChange={(e) => handleCellEdit(idx, 'balance', parseFloat(e.target.value) || 0)}
                              className="input-cell mono"
                              style={{ textAlign: 'right', fontWeight: 600 }}
                            />
                          </td>

                          {/* Category Select */}
                          <td>
                            <select 
                              value={tx.category || 'Other'} 
                              onChange={(e) => handleCellEdit(idx, 'category', e.target.value)}
                              className="input-cell"
                            >
                              {categoriesList.filter(c => c !== 'ALL').map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>

                          {/* Method Column */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${tx.classification_method === 'rule' ? 'badge-info' : tx.classification_method === 'ml' ? 'badge-success' : 'badge-warning'}`}>
                              {methodDisplay}
                            </span>
                          </td>

                          {/* Status Column */}
                          <td style={{ textAlign: 'center' }}>
                            {statusDisplay === 'Valid' ? (
                              <span className="badge badge-success" title="Balance check & row structure valid"><CheckCircle2 size={14} /> Valid</span>
                            ) : (
                              <span className="badge badge-warning" title={tx.validation_issues.join(' | ')}><AlertTriangle size={14} /> Needs Review</span>
                            )}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Category Summary Section */}
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag size={20} color="var(--accent-primary)" /> Category Breakdown Summary
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {result.classification_summary.map(cs => (
                    <div key={cs.category} style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700, color: '#064e3b' }}>
                        <span>{cs.category}</span>
                        <span className="badge badge-info">{cs.count} tx</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <div>Debit: <strong style={{ color: '#dc2626' }}>₹{cs.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                        <div>Credit: <strong style={{ color: '#059669' }}>₹{cs.total_credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* INTERACTIVE FEATURE DETAIL MODAL DRAWER */}
      {selectedFeatureModal && (
        <div className="modal-overlay" onClick={() => setSelectedFeatureModal(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  {selectedFeatureModal.icon}
                </div>
                <div>
                  <span className="badge badge-info" style={{ marginBottom: '0.35rem' }}>{selectedFeatureModal.tag}</span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064e3b' }}>{selectedFeatureModal.title}</h3>
                </div>
              </div>

              <button 
                onClick={() => setSelectedFeatureModal(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.6, fontWeight: 500 }}>
              {selectedFeatureModal.summary}
            </p>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={18} color="var(--accent-primary)" /> Deep-Dive Technical Flow
              </h4>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedFeatureModal.deepDive.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Code Snippet Box */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#064e3b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code size={16} /> Key Execution Logic
              </h4>
              <pre className="mono" style={{ background: '#0f172a', color: '#38bdf8', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', overflowX: 'auto' }}>
                {selectedFeatureModal.codeSnippet}
              </pre>
            </div>

            {/* Modal Footer CTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <span className="badge badge-success">{selectedFeatureModal.badgeText}</span>
              
              <button 
                className="glass-button"
                onClick={() => {
                  setSelectedFeatureModal(null);
                  setActiveTab('workspace');
                }}
              >
                Launch Workspace with Feature <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Universal Footer */}
      <footer style={{ marginTop: 'auto', background: '#ffffff', borderTop: '1px solid var(--border-color)', padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src="/logo.png" alt="StatementAI Logo" style={{ height: '24px', width: '24px' }} />
            <span><strong>StatementAI Processing Platform</strong> • Built with FastAPI, React & Scikit-Learn</span>
          </div>
          <div>
            Distributed under the <strong>MIT License</strong>
          </div>
        </div>
      </footer>

    </div>
  );
}
