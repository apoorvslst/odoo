import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/api';
import { Button, Pagination, usePagedSearch, ModuleShell } from './ui';

// Product schema per routes_db.md:
// { id, name, type: "goods"|"service"|"combo", salesPrice, purchaseCost, category, quantityOnHand, isArchived }
const EMPTY_PRODUCT = { id: null, name: '', type: 'goods', category: '', salesPrice: '', purchaseCost: '' };

const ProductFormView = ({ initialData, onBack, onSave, onNew, categories, onAddCategory }) => {
  const [formData, setFormData] = useState(EMPTY_PRODUCT);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, salesPrice: initialData.salesPrice ?? '', purchaseCost: initialData.purchaseCost ?? '' });
    } else {
      setFormData(EMPTY_PRODUCT);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category' && value === 'CREATE_NEW') { setIsCreatingCategory(true); return; }
    if (['salesPrice', 'purchaseCost'].includes(name) && value !== '' && Number(value) < 0) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNewCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setFormData((prev) => ({ ...prev, category: newCategoryName.trim() }));
      setIsCreatingCategory(false);
      setNewCategoryName('');
    }
  };

  const handleConfirmSubmit = () => {
    if (!formData.name.trim()) { setErrorMsg('Please enter a Product Name'); return; }
    if (!formData.category.trim()) { setErrorMsg('Please select or create a Category'); return; }
    setErrorMsg('');
    onSave(formData);
  };

  return (
    <div className="panel max-w-4xl mx-auto fade-in">
      <div className="panel-head">
        <div className="cluster">
          <Button onClick={() => { setFormData(EMPTY_PRODUCT); setIsCreatingCategory(false); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
          <Button onClick={handleConfirmSubmit} variant="primary">Confirm</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="h2" style={{ marginBottom: '1.25rem' }}>
        {formData.id ? `Edit Product: ${formData.name}` : 'Create Product Master'}
      </h2>

      {errorMsg && <div className="form-error">{errorMsg}</div>}

      <div className="stack" style={{ gap: '1.25rem' }}>
        <div className="form-row">
          <label className="form-label">Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Executive Office Chair" className="input" />
        </div>

        <div className="form-row">
          <label className="form-label">Product Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input">
            <option value="goods">Goods</option>
            <option value="service">Service</option>
            <option value="combo">Combo</option>
          </select>
        </div>

        <div className="form-row">
          <label className="form-label">Category</label>
          {isCreatingCategory ? (
            <div className="row grow" style={{ background: 'var(--bg)', padding: '6px', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter New Category Name…" className="input grow" autoFocus />
              <Button onClick={handleSaveNewCategory} variant="primary" className="btn-sm">Save</Button>
              <Button onClick={() => setIsCreatingCategory(false)} variant="ghost" className="btn-sm">Cancel</Button>
            </div>
          ) : (
            <select name="category" value={formData.category} onChange={handleChange} className="input">
              <option value="" disabled>Select category…</option>
              {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
              <option value="CREATE_NEW">+ Create New Category…</option>
            </select>
          )}
        </div>

        <div className="price-grid">
          <div className="form-row">
            <label className="form-label" style={{ width: '6rem' }}>Sales Price</label>
            <input type="number" min="0" step="0.1" name="salesPrice" value={formData.salesPrice} onChange={handleChange} placeholder="0.00" className="input mono" />
          </div>
          <div className="form-row">
            <label className="form-label" style={{ width: '6rem' }}>Purchase Cost</label>
            <input type="number" min="0" step="0.1" name="purchaseCost" value={formData.purchaseCost} onChange={handleChange} placeholder="0.00" className="input mono" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductListView = ({ products, user, onNew, onSwitchToKanban, onSelectRow, onDelete, onArchive }) => {
  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(products,
    (p, q) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  const isAdmin = user?.role === 'admin';

  return (
    <div className="panel fade-in">
      <div className="toolbar">
        <div className="cluster grow" style={{ maxWidth: 500 }}>
          <Button onClick={onNew} variant="primary">New Product</Button>
          <input type="text" placeholder="Search products by name, category, or type…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="input grow" />
        </div>
        <div className="view-toggle">
          <Button variant="secondary" className="btn-sm">List</Button>
          <Button variant="ghost" onClick={onSwitchToKanban} className="btn-sm">Kanban</Button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Type</th>
              <th className="t-right">Sales Price</th>
              <th className="t-right">Purchase Cost</th>
              <th className="t-right">Qty on Hand</th>
              {isAdmin && <th className="t-center">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="empty">No products match your search query.</td></tr>
            ) : (
              pageItems.map((product) => (
                <tr key={product.id} onClick={() => onSelectRow(product)} className="clickable">
                  <td style={{ fontWeight: 650, color: 'var(--ink)' }}>{product.name}</td>
                  <td><span className="pill pill-neutral">{product.category || 'General'}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{product.type}</td>
                  <td className="t-right mono" style={{ fontWeight: 650, color: 'var(--ink)' }}>₹{Number(product.salesPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="t-right mono" style={{ color: 'var(--muted)' }}>₹{Number(product.purchaseCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="t-right mono" style={{ fontWeight: 600 }}>{Number(product.quantityOnHand || 0)}</td>
                  {isAdmin && (
                    <td className="t-center" onClick={(e) => e.stopPropagation()}>
                      <div className="cluster" style={{ justifyContent: 'center', gap: '4px' }}>
                        <button type="button" onClick={() => onArchive(product)} className="btn btn-secondary btn-sm" title={product.isArchived ? 'Unarchive' : 'Archive'}>
                          {product.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button type="button" onClick={() => onDelete(product)} className="btn btn-danger btn-sm" title="Delete">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
    </div>
  );
};

const ProductKanbanView = ({ products, onNew, onSwitchToList, onSelectCard }) => {
  const { searchTerm, setSearchTerm, page, setPage, filtered, pageItems } = usePagedSearch(products,
    (p, q) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));

  return (
    <div className="panel fade-in">
      <div className="toolbar">
        <div className="cluster grow" style={{ maxWidth: 500 }}>
          <Button onClick={onNew} variant="primary">New Product</Button>
          <input type="text" placeholder="Search cards by name or category…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="input grow" />
        </div>
        <div className="view-toggle">
          <Button variant="ghost" onClick={onSwitchToList} className="btn-sm">List</Button>
          <Button variant="secondary" className="btn-sm">Kanban</Button>
        </div>
      </div>

      <div className="kanban">
        {pageItems.length === 0 ? (
          <div className="kanban-empty">No products found.</div>
        ) : (
          pageItems.map((product) => (
            <div key={product.id} onClick={() => onSelectCard(product)} className="kanban-card">
              <div className="thumb">
                {product.name ? product.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div className="grow" style={{ overflow: 'hidden' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                  <p className="mono">Price: ₹{Number(product.salesPrice || 0).toLocaleString('en-IN')}</p>
                  <p className="mono">Qty: {Number(product.quantityOnHand || 0)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination page={page} setPage={setPage} totalItems={filtered.length} />
    </div>
  );
};

export default function ProductsModule({ user }) {
  const [activeView, setActiveView] = useState('list');
  const [categories, setCategories] = useState(['Chair', 'Table', 'Dining', 'Sofa']);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const data = await apiFetch('/products');
      setProducts(data);
      const cats = [...new Set(data.map((p) => p.category).filter(Boolean))];
      setCategories((prev) => [...new Set([...prev, ...cats])]);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleOpenNewForm = () => { setEditingProduct(null); setActiveView('form'); };
  const handleEditProduct = (product) => { setEditingProduct(product); setActiveView('form'); };

  const handleSaveProduct = async (formData) => {
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        salesPrice: Number(formData.salesPrice) || 0,
        purchaseCost: Number(formData.purchaseCost) || 0,
        category: formData.category,
      };
      if (formData.id) {
        await apiFetch(`/products/${formData.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      await loadProducts();
      setActiveView('list');
    } catch (e) { setError(e.message); }
  };

  const handleAddCategory = (newCat) => {
    if (!categories.includes(newCat)) setCategories((prev) => [...prev, newCat]);
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;
    try {
      // 409 if used on any order_line — archive instead.
      await apiFetch(`/products/${product.id}`, { method: 'DELETE' });
      await loadProducts();
    } catch (e) { window.alert(e.message); }
  };

  const handleArchiveProduct = async (product) => {
    try {
      await apiFetch(`/products/${product.id}/archive`, { method: 'PATCH' });
      await loadProducts();
    } catch (e) { window.alert(e.message); }
  };

  return (
    <ModuleShell title="Products & Inventory" subtitle="Catalog of goods, services and combos with stock on hand" error={error} onDismissError={() => setError('')}>
      {activeView === 'form' && (
        <ProductFormView initialData={editingProduct} onBack={() => setActiveView('list')} onSave={handleSaveProduct} onNew={handleOpenNewForm} categories={categories} onAddCategory={handleAddCategory} />
      )}
      {activeView === 'list' && (
        <ProductListView products={products} user={user} onNew={handleOpenNewForm} onSwitchToKanban={() => setActiveView('kanban')} onSelectRow={handleEditProduct} onDelete={handleDeleteProduct} onArchive={handleArchiveProduct} />
      )}
      {activeView === 'kanban' && (
        <ProductKanbanView products={products} onNew={handleOpenNewForm} onSwitchToList={() => setActiveView('list')} onSelectCard={handleEditProduct} />
      )}
    </ModuleShell>
  );
}
