import { Loader2, AlertCircle, ChevronLeft, ChevronRight, Search, X, Inbox } from 'lucide-react'

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-8 h-8' }
  return <Loader2 className={`animate-spin text-brand-500 ${sizes[size]} ${className}`} />
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} />
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-brand-50 rounded-2xl mb-4">
        <Icon className="w-8 h-8 text-brand-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorDisplay({ message = 'Une erreur est survenue.' }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 text-sm">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-white border border-slate-100 rounded-3xl shadow-2xl animate-fade-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Supprimer', loading }) {
  if (!isOpen) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-500 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function Pagination({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null
  return (
    <div className="flex items-center gap-1">
      <button
        className="p-1.5 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-30"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4 text-slate-400" />
      </button>
      {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
        const page = i + 1
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-gradient-to-r from-brand-500 to-blush-500 text-white shadow-soft'
                : 'text-slate-500 hover:bg-brand-50'
            }`}
          >
            {page}
          </button>
        )
      })}
      <button
        className="p-1.5 hover:bg-brand-50 rounded-lg transition-colors disabled:opacity-30"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage}
      >
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher…' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 w-64"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  )
}

export function Select({ value, onChange, options, placeholder = 'Tous', className = '' }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={`input-field ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'blue', sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-500' },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-500' },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-500' },
    violet: { bg: 'bg-violet-50',  text: 'text-violet-500' },
    cyan:   { bg: 'bg-cyan-50',    text: 'text-cyan-500' },
    rose:   { bg: 'bg-rose-50',    text: 'text-rose-500' },
  }
  const c = colors[color] || colors.blue
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-2xl ${c.bg}`}>
        <Icon className={`w-5 h-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-semibold text-slate-800">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}