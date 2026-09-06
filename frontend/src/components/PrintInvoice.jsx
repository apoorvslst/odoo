import React, { useState, useEffect } from 'react';
import { apiFetch, money } from '../lib/api';

const PrintInvoice = ({ docId }) => {
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch the invoice using the existing portal endpoint
    apiFetch(`/portal/documents/${docId}`)
      .then(data => {
        setDoc(data);
        // Add a small delay to let images render before triggering print
        setTimeout(() => window.print(), 500);
      })
      .catch(err => setError(err.message));
  }, [docId]);

  if (error) {
    return <div style={{ padding: '2rem', color: 'red', fontFamily: 'sans-serif' }}>Error loading document: {error}</div>;
  }

  if (!doc) {
    return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Loading document...</div>;
  }

  const isBill = doc.kind === 'bill';

  return (
    <div className="print-invoice" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: '"Inter", sans-serif', color: '#333' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0052cc', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#0052cc', fontWeight: 800 }}>Urban Furniture</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: '#555', fontSize: '0.9rem' }}>Near Sabarmati Ashram</p>
          <p style={{ margin: '0', color: '#555', fontSize: '0.9rem' }}>Ahmedabad, Gujarat, India</p>
          <p style={{ margin: '0', color: '#555', fontSize: '0.9rem' }}>Email: billing@urbanfurniture.com</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#555', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {isBill ? 'Vendor Bill' : 'Tax Invoice'}
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 'bold' }}>#{isBill ? `VB/2026/${String(doc.id).padStart(4, '0')}` : `INV/2026/${String(doc.id).padStart(4, '0')}`}</p>
          <p style={{ margin: '0', color: '#555' }}>Date: {doc.date}</p>
          {doc.dueDate && <p style={{ margin: '0', color: '#555' }}>Due Date: {doc.dueDate}</p>}
        </div>
      </div>

      {/* Bill To */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.25rem', marginBottom: '0.5rem', color: '#777', textTransform: 'uppercase' }}>
          {isBill ? 'From (Vendor)' : 'Bill To (Customer)'}
        </h3>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{doc.contactName}</p>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Item Description</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Price</th>
            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax %</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines?.map((line, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem', textAlign: 'left' }}>{line.description || line.productName}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>{money(line.unitPrice)}</td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>{line.quantity}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace' }}>{line.taxRate}%</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                {money(Number(line.unitPrice) * Number(line.quantity))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
        <table style={{ width: '300px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '0.5rem', textAlign: 'left', color: '#555' }}>Subtotal:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{money(doc.subtotal)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', textAlign: 'left', color: '#555' }}>Tax Amount:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace' }}>{money(doc.taxAmount)}</td>
            </tr>
            <tr style={{ borderTop: '2px solid #333', borderBottom: '2px solid #333', background: '#f9f9f9' }}>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'left', fontWeight: 'bold' }}>Total:</td>
              <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>{money(doc.totalAmount)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', textAlign: 'left', color: '#006400' }}>Amount Paid:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: '#006400' }}>{money(doc.paid)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem', textAlign: 'left', color: doc.balanceDue > 0 ? '#b00' : '#555', fontWeight: 'bold' }}>Balance Due:</td>
              <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'monospace', color: doc.balanceDue > 0 ? '#b00' : '#555', fontWeight: 'bold' }}>{money(doc.balanceDue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#777', fontSize: '0.85rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>Thank you for your business!</p>
        <p style={{ margin: 0 }}>This is a computer-generated invoice and does not require a physical signature.</p>
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
          .print-invoice { max-width: 100% !important; margin: 0 !important; padding: 2cm !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintInvoice;
