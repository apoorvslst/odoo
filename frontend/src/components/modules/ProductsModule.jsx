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
    <div className="max-w-4xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex justify-between items-center pb-6 mb-8 border-b border-slate-100">
        <div className="flex gap-3">
          <Button onClick={() => { setFormData(EMPTY_PRODUCT); setIsCreatingCategory(false); setErrorMsg(''); if (onNew) onNew(); }} variant="secondary">New</Button>
          <Button onClick={handleConfirmSubmit} variant="pink">Confirm</Button>
        </div>
        <Button onClick={onBack} variant="secondary">Back</Button>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        {formData.id ? 'Edit Product Master' : 'Product Master Form View'}
      </h2>

      {errorMsg && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">⚠️ {errorMsg}</div>}

      <div className="space-y-7">
        <div className="flex items-baseline">
          <label className="w-36 font-bold text-orange-700 text-sm">Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Executive Office Chair" className="flex-1 product-underline-input py-1.5 bg-transparent text-slate-900 font-medium" />
        </div>

        <div className="flex items-baseline">
          <label className="w-36 font-bold text-orange-700 text-sm">Product Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="flex-1 product-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
            <option value="goods">Goods</option>
            <option value="service">Service</option>
            <option value="combo">Combo</option>
          </select>
        </div>

        <div className="flex items-baseline">
          <label className="w-36 font-bold text-orange-700 text-sm">Category</label>
          {isCreatingCategory ? (
            <div className="flex-1 flex gap-2 items-center bg-orange-50/80 p-2 rounded-xl border border-orange-200">
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Enter New Category Name…" className="flex-1 bg-white px-3 py-1 text-sm text-slate-800 rounded-lg border border-orange-300 focus:outline-none" autoFocus />
              <Button onClick={handleSaveNewCategory} variant="success" className="!px-3 !py-1.5 !text-xs !rounded-lg">Save</Button>
              <Button onClick={() => setIsCreatingCategory(false)} variant="ghost" className="!px-2 !text-xs">Cancel</Button>
            </div>
          ) : (
            <select name="category" value={formData.category} onChange={handleChange} className="flex-1 product-underline-input py-1.5 bg-transparent text-slate-900 font-medium cursor-pointer">
              <option value="" disabled>Select…</option>
              {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
              <option value="CREATE_NEW" className="font-bold text-orange-600">+ Create New Category…</option>
            </select>
          )}
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100">
          <div className="flex items-baseline">
            <label className="w-24 font-bold text-orange-700 text-sm">Sales Price</label>
            <span className="text-slate-500 mr-2 text-sm font-medium">Rs.</span>
            <input type="number" name="salesPrice" value={formData.salesPrice} onChange={handleChange} placeholder="100.00" className="flex-1 product-underline-input py-1 bg-transparent text-sm text-slate-900 font-mono font-bold" />
          </div>
          <div className="flex items-baseline">
            <label className="w-28 font-bold text-orange-700 text-sm">Purchase Cost</label>
            <span className="text-slate-500 mr-2 text-sm font-medium">Rs.</span>
            <input type="number" name="purchaseCost" value={formData.purchaseCost} onChange={handleChange} placeholder="50.00" className="flex-1 product-underline-input py-1 bg-transparent text-sm text-slate-900 font-mono font-bold" />
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
    <div className="max-w-6xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Button onClick={onNew} variant="secondary">New</Button>
          <input type="text" placeholder="Search products by name, category, or type…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" />
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Button variant="secondary" className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
          <Button variant="ghost" onClick={onSwitchToKanban} className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Product Master List View</h2>
      <div className="overflow-hidden bg-white rounded-2xl border border-slate-300 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="py-4 px-4">Product</th>
              <th className="py-4 px-4">Category</th>
              <th className="py-4 px-4">Type</th>
              <th className="py-4 px-4 text-right">Sales Price</th>
              <th className="py-4 px-4 text-right">Purchase Cost</th>
              <th className="py-4 px-4 text-right">Qty on Hand</th>
              {isAdmin && <th className="py-4 px-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm bg-white">
            {pageItems.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400 font-medium">No products match your search query.</td></tr>
            ) : (
              pageItems.map((product) => (
                <tr key={product.id} onClick={() => onSelectRow(product)} className="hover:bg-orange-50/40 cursor-pointer transition-colors group">
                  <td className="py-4 px-4 font-bold text-slate-900 group-hover:text-orange-600">{product.name}</td>
                  <td className="py-4 px-4 text-slate-600 font-medium"><span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-700 font-semibold">{product.category || 'Uncategorized'}</span></td>
                  <td className="py-4 px-4 text-slate-600">{product.type}</td>
                  <td className="py-4 px-4 text-slate-900 font-mono font-bold text-right">Rs. {Number(product.salesPrice || 0).toLocaleString()}</td>
                  <td className="py-4 px-4 text-slate-900 font-mono text-right">Rs. {Number(product.purchaseCost || 0).toLocaleString()}</td>
                  <td className="py-4 px-4 text-slate-700 font-mono text-right">{Number(product.quantityOnHand || 0)}</td>
                  {isAdmin && (
                    <td className="py-4 px-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={(e) => { e.stopPropagation(); onArchive(product); }} className="text-xs text-amber-600 hover:underline" title={product.isArchived ? 'Unarchive' : 'Archive'}>{product.isArchived ? '📂' : '📁'}</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(product); }} className="text-xs text-red-500 hover:underline" title="Delete">🗑️</button>
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
    <div className="max-w-5xl mx-auto card card-lg p-6 sm:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Button onClick={onNew} variant="secondary">New</Button>
          <input type="text" placeholder="Search cards by name or category…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm" />
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <Button variant="ghost" onClick={onSwitchToList} className="!px-3 !py-1.5"><span className="text-base">&#9776;</span> List</Button>
          <Button variant="secondary" className="!px-3 !py-1.5"><span className="text-base">&#8862;</span> Kanban</Button>
        </div>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Product Master Kanban View</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {pageItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No products found.</div>
        ) : (
          pageItems.map((product) => (
            <div key={product.id} onClick={() => onSelectCard(product)} className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-5 group">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 text-xl">
                {product.name ? product.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 overflow-x-auto">
                <h3 className="font-bold text-lg text-slate-900 truncate mb-1 group-hover:text-orange-600">{product.name}</h3>
                <div className="flex flex-col gap-0.5 text-xs text-slate-500 font-mono">
                  <p className="font-semibold text-slate-700">Sales Price <span className="text-orange-600 font-bold">{Number(product.salesPrice || 0).toLocaleString()}</span></p>
                  <p>Cost <span className="text-slate-400">{Number(product.purchaseCost || 0).toLocaleString()}</span></p>
                  <p className="text-green-400 text-[11px]">Qty: {Number(product.quantityOnHand || 0)}</p>
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
    <ModuleShell title="Product Master Suite" subtitle="Catalog of goods, services and combos with stock on hand" error={error} onDismissError={() => setError('')}>
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
