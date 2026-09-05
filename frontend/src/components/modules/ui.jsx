import { useState, useEffect } from 'react';

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '', title = '' }) {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800 border border-transparent',
    accent: 'bg-orange-500 text-white hover:bg-orange-600 border border-transparent',
    pink: 'bg-orange-500 text-white hover:bg-orange-600 border border-transparent',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-transparent',
    ghost: 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  };
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98] cursor-pointer';
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${variants[variant]} ${disabledStyle} ${className}`}>
      {children}
    </button>
  );
}

export function Banner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="mb-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between gap-3">
      <span>{error}</span>
      {onDismiss && <button onClick={onDismiss} className="underline underline-offset-2 font-semibold shrink-0">dismiss</button>}
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    draft: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
    confirmed: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    converted: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
    posted: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    partial: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'}`}>
      {status || '—'}
    </span>
  );
}

export function Pagination({ page, setPage, totalItems, pageSize = 20 }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;
  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
      <span className="text-sm text-slate-500">Page {page} of {totalPages} · {totalItems} items</span>
      <div className="flex gap-2">
        <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Button>
        <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</Button>
      </div>
    </div>
  );
}

// Search + paginated list shell used by every module list view.
export function usePagedSearch(items, matcher) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const filtered = items.filter((x) => matcher(x, searchTerm.toLowerCase()));
  useEffect(() => { setPage(1); }, [searchTerm]);
  const pageItems = filtered.slice((page - 1) * 20, page * 20);
  return { searchTerm, setSearchTerm, page, setPage, filtered, pageItems };
}

export function ModuleShell({ title, subtitle, error, onDismissError, actions, children }) {
  return (
    <div className="animate-fade-in">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-2xl md:text-[1.75rem] font-extrabold tracking-tight text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {error && <div className="mt-4"><Banner error={error} onDismiss={onDismissError} /></div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// Standard toolbar row: search field on the left, actions on the right.
export function Toolbar({ search, onSearch, placeholder = 'Search…', children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="input sm:max-w-xs"
      />
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}
