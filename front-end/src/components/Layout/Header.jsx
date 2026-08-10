import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

export default function Header({ collapsed, onToggle, title }) {
  return (
    <header className="h-16 bg-navy-900/80 backdrop-blur-sm border-b border-slate-700/40 flex items-center justify-between px-6 flex-shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-navy-700 rounded-lg transition-colors"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-slate-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-slate-400" />
          )}
        </button>
        <h1 className="text-sm font-semibold text-slate-200">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Clock */}
        <div className="hidden md:block px-3 py-1.5 bg-navy-700/50 rounded-lg border border-slate-700/30">
          <span className="text-xs font-mono text-slate-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </header>
  )
}