import { useEffect, useState, useCallback } from 'react'
import HomePage from './pages/HomePage'
import IncomesPage from './pages/IncomePage'
import ExpensesPage from './pages/ExpensesPage'
import AddManualExpensePage from './pages/AddManualExpensePage'
import ConfirmCapturePage from './pages/ConfirmCapturePage'
import AddDocumentPage from './pages/AddDocumentPage'
import OcrReviewPage from './pages/OcrReviewPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import Toast from './components/Toast'
import DocumentPreviewOverlay from './components/DocumentPreviewOverlay'
import type { Income, Expense, Currency, DocumentType, OcrStatusResponse } from './types/income'
import { incomeService } from './services/income'
import { expenseService } from './services/expense'
import type { CreateExpensePayload } from './services/expense'
import { authService } from './services/auth'
import { useOcrPolling } from './services/useOcrPolling'

type Route = 'home' | 'incomes' | 'expenses' | 'add-manual-expense'
           | 'confirm-capture' | 'add-document' | 'ocr-review' | 'settings' | 'login' | 'register'
type AuthState = { token: string; email: string } | null
type CapturedFile = { file: File; dataUrl: string; fileName: string; source: 'scan' | 'photos' | 'files' } | null
type ToastState = { message: string; type: 'info' | 'error' } | null

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

const PLACEHOLDER_ID_PREFIX = '__ocr_placeholder__'

export default function App() {
  const [route,       setRoute]       = useState<Route>('login')
  const [auth,        setAuth]        = useState<AuthState>(null)
  const [incomes,     setIncomes]     = useState<Income[]>([])
  const [expenses,    setExpenses]    = useState<Expense[]>([])
  const [capturedFile, setCapturedFile] = useState<CapturedFile>(null)
  const [toast,       setToast]       = useState<ToastState>(null)

  // Document preview overlay
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null)

  // OCR state
  const [ocrDocumentId,   setOcrDocumentId]   = useState<string | null>(null)
  const [ocrDocumentType, setOcrDocumentType] = useState<DocumentType>('Receipt')
  const [ocrResult,       setOcrResult]       = useState<OcrStatusResponse | null>(null)

  // ── Session restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const email = localStorage.getItem('auth_email')
    if (token && email) {
      setAuth({ token, email })
      setRoute('home')
    }
  }, [])

  // ── Auth expiry handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => {
      setAuth(null)
      setIncomes([])
      setExpenses([])
      setRoute('login')
    }
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  // ── Load data on login ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth) return
    incomeService.list('size=200&sort=createdAt,desc')
      .then(p => setIncomes(p.content))
      .catch(() => {})
    expenseService.list('size=200&sort=date,desc')
      .then(p => setExpenses(p.content))
      .catch(() => {})
  }, [auth])

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleAuthSuccess = (token: string, email: string) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_email', email)
    setAuth({ token, email })
    setRoute('home')
  }

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_email')
    setAuth(null)
    setIncomes([])
    setExpenses([])
    setRoute('login')
  }

  const onNav  = (to: string) => setRoute(to as Route)
  const onHome = () => setRoute('home')

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type })
  }, [])

  // ── Income CRUD ─────────────────────────────────────────────────────────────
  const addIncome = async ({ title, amount, currency }: { title: string; amount: number; currency: Currency }) => {
    const income = await incomeService.create({ title, amount, currency })
    setIncomes(prev => [income, ...prev])
  }

  const deleteIncome = async (id: string) => {
    await incomeService.delete(id)
    setIncomes(prev => prev.filter(x => x.id !== id))
  }

  // ── Expense CRUD ────────────────────────────────────────────────────────────
  const addExpense = async (payload: CreateExpensePayload): Promise<Expense> => {
    const expense = await expenseService.create(payload)
    setExpenses(prev => [expense, ...prev])
    return expense
  }

  const deleteExpense = async (id: string) => {
    await expenseService.delete(id)
    setExpenses(prev => prev.filter(x => x.id !== id))
  }

  // ── Placeholder helpers for OCR fast path ──────────────────────────────────
  const addPlaceholder = useCallback((documentId: string) => {
    const placeholder: Expense = {
      id:            PLACEHOLDER_ID_PREFIX + documentId,
      title:         'Processing…',
      amount:        0,
      currency:      'TRY',
      date:          todayStr(),
      isPlaceholder: true,
    }
    setExpenses(prev => [placeholder, ...prev])
  }, [])

  const removePlaceholder = useCallback((documentId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== PLACEHOLDER_ID_PREFIX + documentId))
  }, [])

  // ── OCR polling hook ────────────────────────────────────────────────────────
  useOcrPolling(ocrDocumentId, {
    onShowPlaceholder: () => {
      if (ocrDocumentId) addPlaceholder(ocrDocumentId)
    },
    onHidePlaceholder: () => {
      if (ocrDocumentId) removePlaceholder(ocrDocumentId)
    },
    onSlowPath: () => {
      // Placeholder already hidden by hook; user can keep using the app
      // Toast will fire when onDone/onFailed is called
    },
    onDone: (result) => {
      setOcrResult(result)
      showToast('Document processed — review your expense')
      setRoute('ocr-review')
    },
    onFailed: () => {
      showToast('Could not read document — please enter details manually', 'error')
      setRoute('add-manual-expense')
      setOcrDocumentId(null)
    },
  })

  // ── Capture flow ────────────────────────────────────────────────────────────
  const handleCapture = (file: File, source: 'scan' | 'photos' | 'files') => {
    const reader = new FileReader()
    reader.onload = () => {
      setCapturedFile({ file, dataUrl: reader.result as string, fileName: file.name, source })
      setRoute('confirm-capture')
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmCapture = () => setRoute('add-document')

  const handleCancelCapture = () => {
    setCapturedFile(null)
    setRoute('expenses')
  }

  // Called by AddDocumentPage after the file is uploaded successfully
  const handleDocumentUploaded = (documentId: string, documentType: DocumentType) => {
    setCapturedFile(null)
    setOcrDocumentId(documentId)
    setOcrDocumentType(documentType)
    setRoute('expenses')   // go to expenses so user sees placeholder / can keep using app
  }

  const handleDocumentCancel = () => {
    setCapturedFile(null)
    setRoute('expenses')
  }

  // ── OCR Review ──────────────────────────────────────────────────────────────
  const handleOcrReviewSave = async (payload: CreateExpensePayload) => {
    await addExpense(payload)
    setOcrDocumentId(null)
    setOcrResult(null)
    setRoute('expenses')
  }

  const handleOcrReviewCancel = () => {
    // Document stays stored; expense is not created
    setOcrDocumentId(null)
    setOcrResult(null)
    setRoute('expenses')
  }

  // ── Manual expense ──────────────────────────────────────────────────────────
  const handleAddManual  = () => setRoute('add-manual-expense')
  const handleManualSave = async (data: { title: string; amount: number; currency: Currency; date: string }) => {
    await addExpense(data)
    setRoute('expenses')
  }
  const handleManualCancel = () => setRoute('expenses')

  // ── Auth screens ─────────────────────────────────────────────────────────────
  if (!auth) {
    if (route === 'register')
      return <RegisterPage onSuccess={handleAuthSuccess} onGoLogin={() => setRoute('login')} />
    return <LoginPage onSuccess={handleAuthSuccess} onGoRegister={() => setRoute('register')} />
  }

  return (
    <div className="font-sans">
      {route === 'home' && (
        <HomePage onNav={onNav} incomes={incomes} expenses={expenses}
          onCapture={handleCapture} onAddManual={handleAddManual} onLogout={handleLogout}
          onSettings={() => setRoute('settings')} />
      )}
      {route === 'incomes' && (
        <IncomesPage onHome={onHome} onNav={onNav} incomes={incomes}
          onAddIncome={addIncome} onDeleteIncome={deleteIncome}
          onCapture={handleCapture} onAddManual={handleAddManual} />
      )}
      {route === 'expenses' && (
        <ExpensesPage onHome={onHome} onNav={onNav} expenses={expenses}
          onDeleteExpense={deleteExpense} onAddManual={handleAddManual} onCapture={handleCapture}
          onViewDocument={setPreviewDocumentId} />
      )}
      {route === 'add-manual-expense' && (
        <AddManualExpensePage onSave={handleManualSave} onCancel={handleManualCancel} />
      )}
      {route === 'confirm-capture' && capturedFile && (
        <ConfirmCapturePage
          dataUrl={capturedFile.dataUrl}
          fileName={capturedFile.fileName}
          source={capturedFile.source}
          onConfirm={handleConfirmCapture}
          onCancel={handleCancelCapture}
        />
      )}
      {route === 'add-document' && capturedFile && (
        <AddDocumentPage
          defaultName={capturedFile.source === 'files' ? capturedFile.fileName : ''}
          capturedFile={capturedFile.file}
          onUploaded={handleDocumentUploaded}
          onCancel={handleDocumentCancel}
        />
      )}
      {route === 'ocr-review' && ocrResult && ocrDocumentId && (
        <OcrReviewPage
          ocrResult={ocrResult}
          documentId={ocrDocumentId}
          documentType={ocrDocumentType}
          onSave={handleOcrReviewSave}
          onCancel={handleOcrReviewCancel}
        />
      )}

      {route === 'settings' && (
        <SettingsPage
          onHome={() => setRoute('home')}
          onToast={showToast}
        />
      )}

      {previewDocumentId && (
        <DocumentPreviewOverlay
          documentId={previewDocumentId}
          onClose={() => setPreviewDocumentId(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
