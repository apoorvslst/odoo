import React, { useState, useEffect } from 'react';
import { apiFetch, money } from '../lib/api';
import { Button, Banner } from './modules/ui';

const CustomerStorefront = ({ onCheckoutSuccess }) => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/products')
      .then(data => {
        // Only show active goods or combos
        setProducts(data.filter(p => !p.isArchived && p.type !== 'service'));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, product, quantity: 1, unitPrice: Number(product.salesPrice), taxRate: 18 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: qty } : item));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (1 + item.taxRate / 100)), 0);
  const cartUntaxed = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div className="storefront" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--line-soft)' }}>
      <div className="row-between fade-in" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="h2" style={{ marginBottom: 4 }}>Furniture Store</h2>
          <p className="tiny">Purchase our products directly from the portal.</p>
        </div>
        <Button variant="primary" onClick={() => setShowCart(true)}>
          🛒 View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
        </Button>
      </div>
      
      {error && <Banner error={error} onDismiss={() => setError('')} />}
      
      <div className="grid-4 fade-in">
        {loading ? <p>Loading store...</p> : products.length === 0 ? <p className="empty">No products available in the store.</p> : products.map(p => (
          <div key={p.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', height: '100%', gap: 0 }}>
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderBottom: '1px solid var(--line-soft)' }} />
            ) : (
              <div style={{ width: '100%', height: 160, background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-soft)', borderBottom: '1px solid var(--line-soft)' }}>
                No Image
              </div>
            )}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.75rem' }}>
              <div style={{ flexGrow: 1 }}>
                <span className="tiny-up">{p.category || 'Furniture'}</span>
                <h3 className="h3" style={{ margin: '0.25rem 0', minHeight: 40 }}>{p.name}</h3>
                <p className="value" style={{ fontSize: '1.25rem', color: 'var(--ink)' }}>{money(p.salesPrice)}</p>
              </div>
              <Button variant="secondary" className="btn-sm" onClick={() => addToCart(p)} style={{ width: '100%' }}>
                Add to Cart
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showCart && (
        <CartModal 
          cart={cart} 
          cartTotal={cartTotal}
          cartUntaxed={cartUntaxed}
          onClose={() => setShowCart(false)}
          onUpdate={updateQuantity}
          onSuccess={() => {
            setCart([]);
            setShowCart(false);
            onCheckoutSuccess();
          }}
        />
      )}
    </div>
  );
};

const CartModal = ({ cart, cartTotal, cartUntaxed, onClose, onUpdate, onSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setProcessing(true);
    setError('');
    
    const lines = cart.map(item => ({
      productId: item.productId,
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate
    }));

    try {
      await apiFetch('/portal/documents/checkout', {
        method: 'POST',
        body: JSON.stringify({ cartItems: lines })
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="modal-backdrop fade-in">
        <div className="modal stack">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <h3 className="h2">Shopping Cart</h3>
            <button onClick={onClose} className="btn-icon">✕</button>
          </div>
          <p className="empty" style={{ padding: '2rem 0' }}>Your cart is empty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop fade-in">
      <div className="modal stack" style={{ maxWidth: 600 }}>
        <div className="row-between" style={{ marginBottom: 16 }}>
          <h3 className="h2">Shopping Cart</h3>
          <button onClick={onClose} className="btn-icon" disabled={processing}>✕</button>
        </div>

        {error && <Banner error={error} onDismiss={() => setError('')} />}

        {!processing ? (
          <>
            <div className="table-wrap">
              <table className="data-table compact">
                <thead>
                  <tr><th>Item</th><th className="t-right">Price</th><th className="t-center">Qty</th><th className="t-right">Total</th></tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.productId}>
                      <td style={{ fontWeight: 500 }}>{item.product.name}</td>
                      <td className="t-right mono">{money(item.unitPrice)}</td>
                      <td className="t-center">
                        <input type="number" min="0" value={item.quantity} onChange={(e) => onUpdate(item.productId, Number(e.target.value))} className="input mono t-center" style={{ width: 60, padding: 4, display: 'inline-block' }} />
                      </td>
                      <td className="t-right mono" style={{ fontWeight: 600 }}>{money(item.unitPrice * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="grid-2" style={{ marginTop: '1.5rem' }}>
              <div></div>
              <div className="stack-sm t-right">
                <div className="row-between"><span className="tiny">Untaxed:</span><span className="mono">{money(cartUntaxed)}</span></div>
                <div className="row-between"><span className="tiny">Taxes (18%):</span><span className="mono">{money(cartTotal - cartUntaxed)}</span></div>
                <div className="row-between" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}><span className="tiny-up">Total:</span><span className="mono">{money(cartTotal)}</span></div>
              </div>
            </div>

            <div className="row" style={{ marginTop: '2rem', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="secondary" onClick={onClose}>Continue Shopping</Button>
              <Button variant="primary" onClick={handleCheckout}>Request Purchase Approval</Button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <h3 className="h3" style={{ marginBottom: '1rem' }}>Sending Request...</h3>
            <p className="tiny" style={{ marginBottom: '2rem' }}>Please do not close this window.</p>
            <div>
              <span className="portal-tag" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>Awaiting Confirmation...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerStorefront;
