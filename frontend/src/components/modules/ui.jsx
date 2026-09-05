import { useState, useEffect } from 'react';

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '', title = '', style }) {
  const normVariant = variant === 'pink' ? 'accent' : variant === 'success' ? 'primary' : variant;
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={style}
      className={`btn btn-${normVariant} ${className}`}>
      {children}
    </button>
  );
}

export function Banner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="banner">
      <span>{error}</span>
      {onDismiss && <button type="button" onClick={onDismiss}>Dismiss</button>}
    </div>
  );
}

export function StatusPill({ status }) {
  const key = (status || 'default').toLowerCase();
  return <span className={`pill pill-${key}`}>{status || '—'}</span>;
}

export function Pagination({ page, setPage, totalItems, pageSize = 20 }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;
  return (
    <div className="pagination">
      <span>Page {page} of {totalPages} · {totalItems} items</span>
      <div className="cluster">
        <Button variant="secondary" className="btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
        <Button variant="secondary" className="btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

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
    <div className="module-shell">
      <div className="module-head">
        <div>
          <h1 className="h1">{title}</h1>
          {subtitle && <p className="lede" style={{ marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && <div className="cluster">{actions}</div>}
      </div>
      {error && <Banner error={error} onDismiss={onDismissError} />}
      <div>{children}</div>
    </div>
  );
}

export function Toolbar({ search, onSearch, placeholder = 'Search…', children }) {
  return (
    <div className="toolbar">
      <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} className="input" style={{ maxWidth: 280 }} />
      <div className="cluster">{children}</div>
    </div>
  );
}

export function TypewriterText({ text, speed = 35, className = '' }) {
  const str = String(text ?? '');
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayed('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (index <= str.length) {
        setDisplayed(str.slice(0, index));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [str, speed]);

  return (
    <span className={`typewriter-text ${isTyping ? 'is-typing' : ''} ${className}`}>
      {displayed}
      {isTyping && <span className="typewriter-cursor">|</span>}
    </span>
  );
}
