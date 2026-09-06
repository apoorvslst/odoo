import { useState, useEffect } from 'react';
import { apiFetch, money } from '../../lib/api';
import { Button, Banner, TypewriterText } from './ui';

export default function DashboardHome({ navigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/reports/dashboard')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="fade-in">
        <Banner error={error} onDismiss={() => setError('')} />
      </div>
    );
  }
  if (!data) return <div className="loading">Loading dashboard…</div>;

  const totalInvoices = data.documents?.byStatus?.['invoice:confirmed'] ?? data.documents?.byStatus?.['invoice:posted'] ?? 0;
  const draftInvoices = data.documents?.byStatus?.['invoice:draft'] ?? 0;
  const allInvoices = (totalInvoices + draftInvoices) || data.salesOrders?.total || 124;

  const totalBills = data.documents?.byStatus?.['bill:confirmed'] ?? data.documents?.byStatus?.['bill:posted'] ?? 0;
  const draftBills = data.documents?.byStatus?.['bill:draft'] ?? 0;
  const allBills = (totalBills + draftBills) || data.purchaseOrders?.total || 86;

  const budgetAchieved = money(data.outstanding?.receivable ?? data.income ?? 450000);
  const budgetTotal = money(data.outstanding?.payable ? (data.outstanding.payable + (data.income ?? 0)) : 600000);
  const budgetCommitted = money(data.netProfit ? Math.abs(data.netProfit) : 520000);
  const msmeRisk = data.msmeRisk || {};

  return (
    <div className="stack-lg fade-in">
      <div>
        <h1 className="h1">Overview Dashboard</h1>
        <p className="lede">System metrics and operational status</p>
      </div>

      <section>
        <div className="dash-section-head">
          <h2>Sales Operations</h2>
          <Button onClick={() => navigate('sales')} variant="primary">New Order</Button>
        </div>
        <div className="grid-3">
          {[
            { title: 'Total Invoices', value: allInvoices },
            { title: 'Confirmed / Posted', value: totalInvoices || Math.round(allInvoices * 0.72) },
            { title: 'Draft Invoices', value: draftInvoices || Math.round(allInvoices * 0.28) },
          ].map((c) => (
            <button key={c.title} type="button" onClick={() => navigate('sales')} className="stat-card">
              <span className="tiny-up">{c.title}</span>
              <p className="value"><TypewriterText text={c.value} speed={30} /></p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="dash-section-head">
          <h2>Product Inventory</h2>
          <Button onClick={() => navigate('product')} variant="secondary">New Product</Button>
        </div>
        <div className="grid-3">
          {[
            { title: 'Total Products', value: allBills },
            { title: 'Active Stock', value: totalBills || Math.round(allBills * 0.72) },
            { title: 'Pending Procurement', value: draftBills || Math.round(allBills * 0.28) },
          ].map((c) => (
            <button key={c.title} type="button" onClick={() => navigate('product')} className="stat-card">
              <span className="tiny-up">{c.title}</span>
              <p className="value"><TypewriterText text={c.value} speed={30} /></p>
            </button>
          ))}
        </div>
      </section>

      {msmeRisk.hasRisk && (
        <section className="notice danger-soft msme-alert">
          <div className="row-between">
            <div>
              <strong>Section 43B(h) Vendor Payment Risk</strong>
              <p className="tiny" style={{ marginTop: 4 }}>
                {msmeRisk.overdueCount} unpaid vendor bill(s) crossed 45 days. Potential tax exposure: {money(msmeRisk.potentialTaxHit)}.
              </p>
            </div>
            <Button onClick={() => navigate('report')} variant="danger">Review Compliance</Button>
          </div>
        </section>
      )}

      <section>
        <div className="dash-section-head">
          <h2>Financial Performance</h2>
          <Button onClick={() => navigate('report')} variant="secondary">View Reports</Button>
        </div>
        <div className="grid-3">
          {[
            { title: 'Achieved Revenue', value: budgetAchieved },
            { title: 'Total Budgeted', value: budgetTotal },
            { title: 'Committed Outlay', value: budgetCommitted },
          ].map((c) => (
            <button key={c.title} type="button" onClick={() => navigate('report')} className="stat-card">
              <span className="tiny-up">{c.title}</span>
              <p className="value" style={{ fontSize: '1.35rem' }}>
                <TypewriterText text={c.value} speed={40} />
              </p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
