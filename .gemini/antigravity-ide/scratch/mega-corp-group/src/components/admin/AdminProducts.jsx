import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  Copy, Download, Edit, Filter, ImagePlus, LayoutGrid, PackagePlus, Plus, Save,
  Search, Star, Table2, Trash2, Upload, X
} from 'lucide-react';
import { PRODUCT_CATEGORIES, formatMoney, formatNumber } from './adminData';
import { uploadProductImage } from '../../lib/supabase';

const productTemplate = {
  name: '',
  sku: '',
  category: 'Detergents',
  description: '',
  ingredients: '',
  price: '',
  discountPrice: '',
  stock: '',
  status: 'Available',
  featured: false,
  image: '',
  images: []
};

function normalizeProduct(product) {
  const stock = Number(product.stock ?? 0);
  const status = product.status || (stock <= 0 ? 'Out of Stock' : 'Available');

  return {
    ...product,
    sku: product.sku || `MCG-${String(product.id).padStart(4, '0')}`,
    discountPrice: product.discountPrice ?? '',
    stock,
    status,
    featured: product.featured ?? false,
    ingredients: product.ingredients || '',
    image: product.image || '',
    images: product.images?.length ? product.images : (product.image ? [product.image] : [])
  };
}

export default function AdminProducts() {
  const { products, addProduct, updateProduct, deleteProduct } = useContext(AppContext);
  const [categories, setCategories] = useState(PRODUCT_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notice, setNotice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(productTemplate);
  const [viewMode, setViewMode] = useState('cards');
  const [dragOver, setDragOver] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const catalog = useMemo(() => products.map(normalizeProduct), [products]);

  const filtered = catalog.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCat === 'All' || product.category === filterCat;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'stock':
        comparison = a.stock - b.stock;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(productTemplate);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description,
      ingredients: product.ingredients,
      price: String(product.price),
      discountPrice: String(product.discountPrice || ''),
      stock: String(product.stock),
      status: product.status,
      featured: product.featured,
      image: product.image || product.images?.[0] || '',
      images: product.images || []
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const image = form.image || form.images[0] || '';
    const payload = {
      name: form.name.trim() || 'Untitled Product',
      sku: form.sku.trim() || `MCG-${Date.now().toString().slice(-5)}`,
      category: form.category,
      description: form.description,
      ingredients: form.ingredients,
      price: Number(form.price) || 0,
      discountPrice: form.discountPrice ? Number(form.discountPrice) : '',
      stock: Number(form.stock) || 0,
      status: form.status,
      featured: form.featured,
      isTopSeller: form.featured,
      image,
      images: form.images.length ? form.images : (image ? [image] : [])
    };

    try {
      if (editing) {
        await updateProduct(editing.id, payload);
        setNotice(`${payload.name} updated successfully.`);
      } else {
        await addProduct(payload);
        setNotice(`${payload.name} added to the catalog.`);
      }
      setShowModal(false);
    } catch (error) {
      setNotice(`Error: ${error.message}`);
    }
  };

  const handleDuplicate = (product) => {
    const copy = {
      ...product,
      name: `${product.name} Copy`,
      sku: `${product.sku}-COPY`,
      featured: false,
      isTopSeller: false
    };
    delete copy.id;
    addProduct(copy);
    setNotice(`${product.name} duplicated.`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this product from the catalog?')) {
      try {
        await deleteProduct(id);
        setNotice('Product deleted.');
      } catch (error) {
        setNotice(`Error: ${error.message}`);
      }
    }
  };

  const handleImages = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    setNotice('Uploading images to Supabase Storage...');
    
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const url = await uploadProductImage(file);
        urls.push(url);
      }
      
      setForm(current => ({
        ...current,
        image: current.image || urls[0] || '',
        images: [...current.images, ...urls]
      }));
      setNotice('Images uploaded successfully.');
    } catch (error) {
      console.error('Error uploading images:', error);
      setNotice(`Failed to upload images: ${error.message}`);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = (index) => {
    setForm(current => {
      const newImages = current.images.filter((_, i) => i !== index);
      const newImage = newImages[0] || '';
      return {
        ...current,
        image: newImage,
        images: newImages
      };
    });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleImages(files);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mega-corp-products.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Product catalog exported.');
  };

  const handleImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach(item => addProduct({ ...productTemplate, ...item, id: undefined }));
        setNotice(`${items.length} product${items.length === 1 ? '' : 's'} imported.`);
      } catch {
        setNotice('Import failed. Please upload a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const addCategory = () => {
    const category = newCategory.trim();
    if (category && !categories.includes(category)) {
      setCategories(current => [...current, category]);
      setNewCategory('');
      setNotice(`${category} category added.`);
    }
  };

  return (
    <div className="admin-products admin-page-stack">
      <div className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Catalog operations</span>
          <h1 className="admin-page-title">Product Management</h1>
          <p className="admin-page-sub">Create, edit, price, duplicate, import, export, and manage availability for every product SKU.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
      </div>

      {notice && (
        <div className="admin-inline-notice">
          <PackagePlus size={16} />
          <span>{notice}</span>
          <button onClick={() => setNotice('')}><X size={14} /></button>
        </div>
      )}

      <div className="admin-grid-3">
        <div className="admin-mini-card">
          <span>Total SKUs</span>
          <strong>{catalog.length}</strong>
        </div>
        <div className="admin-mini-card">
          <span>Featured</span>
          <strong>{catalog.filter(product => product.featured).length}</strong>
        </div>
        <div className="admin-mini-card">
          <span>Low or Out</span>
          <strong>{catalog.filter(product => product.stock <= 300 || product.status === 'Out of Stock').length}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search-box">
          <Search size={16} />
          <input type="text" placeholder="Search products, SKUs, descriptions..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
        <div className="admin-filter-group">
          <Filter size={16} />
          {['All', ...categories].map(category => (
            <button key={category} className={`admin-filter-chip ${filterCat === category ? 'active' : ''}`} onClick={() => setFilterCat(category)}>
              {category}
            </button>
          ))}
        </div>
        <div className="admin-toolbar-actions">
          <select 
            className="admin-sort-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="stock-asc">Stock (Low to High)</option>
            <option value="stock-desc">Stock (High to Low)</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="status-asc">Status (A-Z)</option>
          </select>
          <button className={`admin-toolbar-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title="Card view">
            <LayoutGrid size={16} />
          </button>
          <button className={`admin-toolbar-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
            <Table2 size={16} />
          </button>
          <label className="admin-toolbar-btn">
            <Upload size={16} /> Import
            <input type="file" accept="application/json" hidden onChange={event => handleImport(event.target.files?.[0])} />
          </label>
          <button className="admin-toolbar-btn" onClick={handleExport}><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="admin-grid-main">
        {viewMode === 'table' ? (
          <section className="admin-card admin-grid-span-2">
            <div className="admin-card-head">
              <div>
                <h3>Product Catalog</h3>
                <p>Showing {filtered.length} of {catalog.length} products.</p>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table admin-table-lg">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" /></th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => (
                    <tr key={product.id}>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="admin-prod-cell">
                          <span className="admin-thumb" style={{ backgroundImage: `url(${product.image || product.images?.[0]})` }} />
                          <span>
                            <strong className="admin-prod-name">{product.name}</strong>
                            <small className="admin-prod-desc">{product.description?.slice(0, 78)}{product.description?.length > 78 ? '...' : ''}</small>
                          </span>
                        </div>
                      </td>
                      <td><span className="admin-sku">{product.sku}</span></td>
                      <td><span className="admin-cat-tag">{product.category}</span></td>
                      <td>
                        <div className="admin-amount">{formatMoney(product.price)}</div>
                        {product.discountPrice && <div className="admin-prod-desc">Sale {formatMoney(Number(product.discountPrice))}</div>}
                      </td>
                      <td>
                        <div className={product.stock <= 300 ? 'admin-stock-low' : 'admin-stock-ok'}>{formatNumber(product.stock)}</div>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${product.status === 'Available' ? 'admin-status-success' : 'admin-status-danger'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-feature-pill ${product.featured ? 'active' : ''}`}>
                          <Star size={13} fill={product.featured ? 'currentColor' : 'none'} /> {product.featured ? 'Featured' : 'Standard'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-action-group">
                          <button className="admin-action-btn" onClick={() => openEdit(product)} title="Edit"><Edit size={14} /></button>
                          <button className="admin-action-btn" onClick={() => handleDuplicate(product)} title="Duplicate"><Copy size={14} /></button>
                          <button className="admin-action-btn admin-action-danger" onClick={() => handleDelete(product.id)} title="Delete"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="admin-card admin-grid-span-2">
            <div className="admin-card-head">
              <div>
                <h3>Product Catalog</h3>
                <p>Showing {filtered.length} of {catalog.length} products.</p>
              </div>
            </div>
            <div className="admin-products-grid">
              {filtered.map(product => (
                <div key={product.id} className="admin-product-card">
                  <div className="admin-product-card-image" style={{ backgroundImage: `url(${product.image || product.images?.[0]})` }}>
                    <span className={`admin-status-badge admin-product-card-status ${product.status === 'Available' ? 'admin-status-success' : 'admin-status-danger'}`}>
                      {product.status}
                    </span>
                    <div className="admin-product-card-actions">
                      <button className="admin-action-btn" onClick={() => openEdit(product)} title="Edit"><Edit size={14} /></button>
                      <button className="admin-action-btn admin-action-danger" onClick={() => handleDelete(product.id)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="admin-product-card-body">
                    <span className="admin-cat-tag">{product.category}</span>
                    <h4>{product.name}</h4>
                    <p>{product.description?.slice(0, 60)}{product.description?.length > 60 ? '...' : ''}</p>
                    <div className="admin-product-card-footer">
                      <span className="admin-amount">{formatMoney(product.price)}</span>
                      <span className={`admin-feature-pill ${product.featured ? 'active' : ''}`}>
                        <Star size={12} fill={product.featured ? 'currentColor' : 'none'} /> {product.featured ? 'Featured' : 'Standard'}
                      </span>
                    </div>
                    <div className="admin-product-card-meta">
                      <span>SKU: {product.sku}</span>
                      <span>Stock: {formatNumber(product.stock)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <aside className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Categories</h3>
              <p>Manage the taxonomy used by catalog filters and storefront sections.</p>
            </div>
          </div>
          <div className="admin-category-list">
            {categories.map(category => (
              <span key={category}>{category}</span>
            ))}
          </div>
          <div className="admin-form-group" style={{ marginTop: 18 }}>
            <label>New Category</label>
            <div className="admin-inline-field">
              <input value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="e.g. Baby Care" />
              <button className="admin-action-btn" onClick={addCategory}><Plus size={15} /></button>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal admin-modal-lg" onClick={event => event.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
                <p>{editing ? 'Update catalog details, pricing, inventory, and visibility.' : 'Create a new product record for the catalog.'}</p>
              </div>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>Product Name</label>
                  <input type="text" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="UltraClean Laundry Liquid" />
                </div>
                <div className="admin-form-group">
                  <label>SKU</label>
                  <input type="text" value={form.sku} onChange={event => setForm({ ...form, sku: event.target.value })} placeholder="MCG-LQ-2400" />
                </div>
                <div className="admin-form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
                    {categories.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}>
                    <option>Available</option>
                    <option>Out of Stock</option>
                    <option>Draft</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Price</label>
                  <input type="number" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} placeholder="0.00" />
                </div>
                <div className="admin-form-group">
                  <label>Discount Price</label>
                  <input type="number" value={form.discountPrice} onChange={event => setForm({ ...form, discountPrice: event.target.value })} placeholder="0.00" />
                </div>
                <div className="admin-form-group">
                  <label>Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={event => setForm({ ...form, stock: event.target.value })} placeholder="0" />
                </div>
                <div className="admin-form-group">
                  <label>Featured Status</label>
                  <label className="admin-switch-row">
                    <input type="checkbox" checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })} />
                    <span className="admin-toggle-slider"></span>
                    <strong>{form.featured ? 'Featured product' : 'Standard product'}</strong>
                  </label>
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Description</label>
                  <textarea rows="3" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Product description..." />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Ingredients</label>
                  <textarea rows="2" value={form.ingredients} onChange={event => setForm({ ...form, ingredients: event.target.value })} placeholder="List ingredients..." />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Primary Image URL</label>
                  <input type="url" value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} placeholder="https://..." />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Product Images</label>
                  <label
                    className={`admin-upload-drop ${dragOver ? 'drag-over' : ''} ${uploadingImages ? 'uploading' : ''}`}
                    onDragOver={(event) => { if (!uploadingImages) { event.preventDefault(); setDragOver(true); } }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(event) => { if (!uploadingImages) handleDrop(event); }}
                    style={{ opacity: uploadingImages ? 0.7 : 1, cursor: uploadingImages ? 'not-allowed' : 'pointer' }}
                  >
                    <ImagePlus size={28} className={uploadingImages ? 'animate-pulse' : ''} />
                    {uploadingImages ? (
                      <>
                        <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Uploading to Supabase Storage...</span>
                        <small>Please wait while we secure your assets</small>
                      </>
                    ) : (
                      <>
                        <span>Drag & drop product images here</span>
                        <small>or click to browse files</small>
                      </>
                    )}
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      hidden 
                      disabled={uploadingImages}
                      onChange={event => handleImages(event.target.files)} 
                    />
                  </label>
                  {form.images.length > 0 && (
                    <div className="admin-image-strip">
                      {form.images.map((image, index) => (
                        <div key={`${image}-${index}`} className="admin-image-item">
                          <span style={{ backgroundImage: `url(${image})` }} />
                          <button 
                            className="admin-image-delete" 
                            disabled={uploadingImages}
                            onClick={() => handleDeleteImage(index)}
                            title="Delete image"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button className="btn btn-outline" disabled={uploadingImages} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={uploadingImages} onClick={handleSave}>
                <Save size={16} /> {uploadingImages ? 'Uploading...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
