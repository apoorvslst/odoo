import { useState, useEffect, useCallback } from 'react';
import { apiFetch, money } from '../../lib/api';
import { ModuleShell, Pagination, usePagedSearch } from './ui';

// Payments hub — GET /api/payments returns every payment with its journal + contact.

export default function PaymentsModule() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setPayments(await apiFetch('/payments')); } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(payments,
    (p, q) => (p.contactName || '').toLowerCase().includes(q) || String(p.invoiceId).includes(q) || (p.journalName || '').toLowerCase().includes(q));

  const total = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const received = payments.filter((p) => p.invoiceKind === 'invoice').reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const sent = payments.filter((p) => p.invoiceKind === 'bill').reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <ModuleShell title="Payments Ledger" subtitle="Cash and bank transactions against invoices and bills" error={error} onDismissError={() => setError('')}>
      <div className="panel fade-in">
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <span className="tiny-up">Received (Invoices)</span>
            <p className="value" style={{ color: 'var(--ok)' }}>{money(received)}</p>
          </div>
          <div className="stat-card">
            <span className="tiny-up">Disbursed (Bills)</span>
            <p className="value">{money(sent)}</p>
          </div>
          <div className="stat-card">
            <span className="tiny-up">Total Movement</span>
            <p className="value">{money(total)}</p>
          </div>
        </div>

        <div className="toolbar">
          <input type="text" placeholder="Search by contact, document, journal…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="input grow" style={{ maxWidth: 400 }} />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Journal</th>
                <th>Method</th>
                <th className="t-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id}>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--ok)' }}>PAY-{p.id}</td>
                  <td className="mono" style={{ color: 'var(--muted)' }}>{p.date}</td>
                  <td>
                    <span className={`pill ${p.invoiceKind === 'bill' ? 'pill-neutral' : 'pill-paid'}`}>
                      {p.invoiceKind === 'bill' ? 'Bill Paid' : 'Invoice Received'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{p.contactName || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{p.journalName || `J-${p.journalId}`}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.method}</td>
                  <td className="t-right mono" style={{ fontWeight: 700 }}>{money(p.amount)}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={7} className="empty">No payments recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
      </div>
    </ModuleShell>
  );
}
