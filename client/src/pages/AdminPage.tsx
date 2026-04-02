import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Product } from '@/types/product';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RefreshCw, Package, Phone, Mail, MapPin, Calendar, ShoppingBag, LogOut, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  selected_color?: string;
}

interface Order {
  id: number;
  name: string;
  surname: string;
  email: string | null;
  phone: string;
  address: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  paid: 'bg-green-500/15 text-green-600 border-green-500/30',
  shipped: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  delivered: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  cancelled: 'bg-red-500/15 text-red-600 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Gözləyir',
  paid: 'Ödənilib',
  shipped: 'Göndərilib',
  delivered: 'Çatdırılıb',
  cancelled: 'Ləğv edilib',
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productForm, setProductForm] = useState({
    id: '',
    nameAz: '',
    nameEn: '',
    nameRu: '',
    descriptionAz: '',
    descriptionEn: '',
    descriptionRu: '',
    price: '',
    discount_price: '',
    category: '',
    image_url: '',
    in_stock: true,
    stock: '',
  });

  const { user, isLoading: authLoading, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    authFetch(API_CONFIG.orders.list)
      .then(async res => {
        if (res.status === 401 || res.status === 403) {
          toast.error('Session expired or access denied');
          logout();
          navigate('/admin/login');
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          let errorMsg = `Server error: ${res.status}`;
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errorMsg = errData.message || errorMsg;
          }
          throw new Error(errorMsg);
        }

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response (HTML). Check API URL.');
        }

        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          setOrders(data.orders);
        } else if (data) {
          setError(data.message || 'Failed to load orders.');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message || 'Connection error.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); fetchProducts(); }, []);

  const fetchProducts = () => {
    authFetch(API_CONFIG.products.list)
      .then(async res => {
        const contentType = res.headers.get('content-type');
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned HTML instead of JSON. Check API configuration.');
        }
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.message || 'Failed to load products');
        }
      })
      .catch(err => {
        console.error('Fetch products error:', err);
        setError(err.message || 'Connection error loading products');
      });
  };

  const handleProductFormChange = (field: string, value: string | boolean) => {
    setProductForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(API_CONFIG.products.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productForm.id,
          name: { az: productForm.nameAz, en: productForm.nameEn, ru: productForm.nameRu },
          description: { az: productForm.descriptionAz, en: productForm.descriptionEn, ru: productForm.descriptionRu },
          price: Number(productForm.price),
          discount_price: productForm.discount_price ? Number(productForm.discount_price) : null,
          category: productForm.category,
          image_url: productForm.image_url,
          in_stock: productForm.in_stock,
          stock: productForm.stock ? Number(productForm.stock) : 10,
          status: 'active',
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Please check API URL.');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Product created');
        setProductForm({ id: '', nameAz: '', nameEn: '', nameRu: '', descriptionAz: '', descriptionEn: '', descriptionRu: '', price: '', discount_price: '', category: '', image_url: '', in_stock: true, stock: '' });
        fetchProducts();
      } else {
        throw new Error(data.message || 'Failed to create product');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await authFetch(API_CONFIG.products.update(productId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock, in_stock: newStock > 0 }),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON.');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Stock updated');
        fetchProducts();
      } else {
        throw new Error(data.message || 'Failed to update stock');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating stock');
    } finally {
      setEditingStock(null);
      setNewStockValue('');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await authFetch(API_CONFIG.orders.updateStatus(id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML. Check API configuration.');
      }

      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm(`Are you sure you want to delete this product (${productId})?`)) {
      return;
    }
    
    setDeletingId(productId);
    try {
      const res = await authFetch(API_CONFIG.products.delete(productId), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted successfully');
        fetchProducts();
      } else {
        toast.error(data.message || 'Failed to delete product');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting product');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const toggleOrder = (id: number) => {
    setExpandedOrder(prev => (prev === id ? null : id));
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold font-display text-foreground tracking-tight">İdarəetmə Paneli</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              ar_accessories — Canlı Sifariş İdarəetməsi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Yenilə
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 bg-destructive/10 text-destructive rounded-xl text-sm font-semibold hover:bg-destructive/20 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              Çıxış
            </button>
          </div>
        </div>

        {/* Product Management */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-10">
          <h2 className="text-2xl font-bold mb-4">Məhsul İdarəetməsi</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <input value={productForm.id} onChange={(e) => handleProductFormChange('id', e.target.value)} placeholder="ID" className="p-2 border rounded" />
            <input value={productForm.nameAz} onChange={(e) => handleProductFormChange('nameAz', e.target.value)} placeholder="Ad (AZ)" className="p-2 border rounded" />
            <input value={productForm.nameEn} onChange={(e) => handleProductFormChange('nameEn', e.target.value)} placeholder="Name (EN)" className="p-2 border rounded" />
            <input value={productForm.nameRu} onChange={(e) => handleProductFormChange('nameRu', e.target.value)} placeholder="Название (RU)" className="p-2 border rounded" />
            <input value={productForm.price} onChange={(e) => handleProductFormChange('price', e.target.value)} placeholder="Price" className="p-2 border rounded" />
            <input value={productForm.discount_price} onChange={(e) => handleProductFormChange('discount_price', e.target.value)} placeholder="Discount price" className="p-2 border rounded" />
            <input value={productForm.category} onChange={(e) => handleProductFormChange('category', e.target.value)} placeholder="Category" className="p-2 border rounded" />
            <input value={productForm.image_url} onChange={(e) => handleProductFormChange('image_url', e.target.value)} placeholder="Image URL" className="p-2 border rounded" />
            <input value={productForm.stock} onChange={(e) => handleProductFormChange('stock', e.target.value)} placeholder="Stock Quantity" className="p-2 border rounded" />
            <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={productForm.in_stock} onChange={(e) => handleProductFormChange('in_stock', e.target.checked)} /> In stock</label>
            <button onClick={handleCreateProduct} className="px-4 py-2 bg-green-500 text-white rounded">Create Product</button>
          </div>

          <div className="mt-6 grid gap-3">
            {products.map((prod) => (
              <div key={prod.id} className="flex flex-wrap items-center justify-between bg-muted p-3 rounded-xl border border-border">
                <div>
                  <p className="font-semibold">{prod.id} - {prod.name?.en || prod.name?.az || prod.name?.ru}</p>
                  <p className="text-muted-foreground text-sm">{prod.category} • Stock: {prod.stock || 0} • {prod.in_stock ? 'In Stock' : 'Out of Stock'}</p>
                </div>
                <div className="flex gap-2">
                  {editingStock === prod.id ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newStockValue}
                        onChange={(e) => setNewStockValue(e.target.value)}
                        placeholder="New stock"
                        className="w-20 p-1 border rounded text-sm"
                      />
                      <button
                        onClick={() => handleUpdateStock(prod.id, Number(newStockValue))}
                        className="px-2 py-1 text-xs text-white bg-green-500 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStock(null)}
                        className="px-2 py-1 text-xs text-white bg-gray-500 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingStock(prod.id);
                          setNewStockValue(String(prod.stock || 0));
                        }}
                        className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                      >
                        Edit Stock
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(prod.id)} 
                        disabled={deletingId === prod.id}
                        className="px-2 py-1 text-xs text-white bg-red-500 rounded disabled:opacity-50"
                      >
                        {deletingId === prod.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Ümumi Sifariş', value: orders.length, color: 'text-foreground' },
            { label: 'Gözləyən', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'Çatdırılan', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-600' },
            { label: 'Ümumi Gəlir', value: `${orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)} ₼`, color: 'text-accent' }
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Content Section */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-muted/5 rounded-3xl border border-dashed border-border">
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-accent/20" />
              <Package className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" />
            </div>
            <span className="text-muted-foreground font-medium text-lg">Sifarişlər yüklənir...</span>
          </div>
        ) : error ? (
          <div className="p-8 bg-destructive/5 border border-destructive/20 rounded-2xl text-center max-w-xl mx-auto">
            <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Bağlantı xətası</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button onClick={fetchOrders} className="bg-foreground text-background px-6 py-2.5 rounded-xl font-bold hover:bg-foreground/90 transition-all">Yenidən yoxla</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 bg-muted/5 rounded-3xl border border-dashed border-border">
            <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground/10 mb-6" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Hələ ki sifariş yoxdur</h3>
            <p className="text-muted-foreground">Yeni sifarişlər bura daxil olacaq.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map(order => (
              <div key={order.id} className={`group bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${expandedOrder === order.id ? 'ring-2 ring-accent/30 border-accent/50' : 'border-border'}`}>
                {/* Order Summary Row */}
                <div className="flex flex-wrap items-center justify-between p-6 gap-6">
                  <div className="flex-1 min-w-[280px]">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent font-bold text-lg">#{order.id}</span>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{order.name} {order.surname}</h3>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border transition-colors ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>
                          {STATUS_LABELS[order.status] || 'Naməlum'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
                      <p className="flex items-center gap-2 font-medium hover:text-foreground transition-colors"><Phone className="w-4 h-4 text-accent/50" />{order.phone}</p>
                      {order.email && <p className="flex items-center gap-2 font-medium hover:text-foreground transition-colors"><Mail className="w-4 h-4 text-accent/50" />{order.email}</p>}
                      <p className="flex items-center gap-2 font-medium hover:text-foreground transition-colors sm:col-span-2"><MapPin className="w-4 h-4 text-accent/50" />{order.address}</p>
                      <p className="flex items-center gap-2 font-medium hover:text-foreground transition-colors sm:col-span-2"><Calendar className="w-4 h-4 text-accent/50" />{new Date(order.created_at).toLocaleString('az-AZ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Məbləğ</p>
                      <p className="text-3xl font-black text-accent">{Number(order.total).toFixed(2)} ₼</p>
                      <p className="text-xs font-bold text-muted-foreground mt-1">{order.items?.length || 0} növ məhsul</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => toggleOrder(order.id)}
                        className={`p-3 rounded-xl transition-all ${expandedOrder === order.id ? 'bg-accent text-accent-foreground rotate-180' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground'}`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section */}
                {expandedOrder === order.id && (
                  <div className="border-t border-border bg-muted/10 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid lg:grid-cols-3 gap-8 p-8">
                      {/* Items Column */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="flex items-center gap-2 text-md font-bold text-foreground">
                            <Package className="w-5 h-5 text-accent" />
                            Sifariş Detalları
                          </h4>
                        </div>
                        
                        <div className="grid gap-3">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-card p-4 rounded-xl border border-border hover:border-accent/30 transition-all shadow-sm group/item">
                              <div className="flex items-center gap-4">
                                {item.selected_color && item.selected_color !== 'transparent' && (
                                  <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-border shrink-0" style={{ backgroundColor: item.selected_color }} />
                                )}
                                <div>
                                  <p className="font-bold text-foreground group-hover/item:text-accent transition-colors">{item.product_name || `Məhsul ID: ${item.product_id}`}</p>
                                  <p className="text-xs font-bold text-muted-foreground mt-0.5">Məbləğ: {Number(item.price_at_purchase).toFixed(2)} ₼</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-foreground">{item.quantity} x</p>
                                <p className="text-sm font-bold text-accent">{(item.quantity * Number(item.price_at_purchase)).toFixed(2)} ₼</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Update Column */}
                      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm self-start">
                        <h4 className="flex items-center gap-2 text-md font-bold text-foreground mb-6">
                          <CheckCircle2 className="w-5 h-5 text-accent" />
                          Statusu Dəyiş
                        </h4>
                        
                        <div className="space-y-3">
                          {Object.keys(STATUS_LABELS).map((status) => (
                            <button
                              key={status}
                              disabled={updatingId === order.id}
                              onClick={() => handleUpdateStatus(order.id, status)}
                              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all border ${order.status === status ? 'bg-accent text-accent-foreground border-accent shadow-md shadow-accent/20' : 'bg-background border-border hover:border-accent/50 text-muted-foreground'}`}
                            >
                              <span>{STATUS_LABELS[status]}</span>
                              {order.status === status && <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>

                        {updatingId === order.id && (
                          <div className="mt-4 flex items-center justify-center gap-2 text-accent animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Yadda saxlanılır...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Helper icons needed but not imported
function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
