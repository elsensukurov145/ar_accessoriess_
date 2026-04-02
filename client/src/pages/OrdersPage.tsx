import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ShoppingBag, Calendar, DollarSign, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface Order {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
  paid: 'bg-green-500/15 text-green-600 border-green-500/30',
  shipped: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  delivered: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  cancelled: 'bg-red-500/15 text-red-600 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const OrdersPage: React.FC = () => {
  const { user, authFetch, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(API_CONFIG.user.orders);
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main flex items-center justify-center p-6 bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main flex flex-col p-6 bg-gradient-to-b from-background to-secondary min-h-screen">
        <div className="container-custom max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-display text-foreground mb-2">Orders</h1>
            <p className="text-muted-foreground">View your order history</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl shadow-lg p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10">
                {/* Icon - Left */}
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-20 h-20 rounded-full bg-accent/10">
                    <ShoppingBag className="w-10 h-10 text-accent" />
                  </div>
                </div>
                
                {/* Message - Center/Middle */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg md:text-xl font-semibold text-foreground mb-2">No orders yet</p>
                  <p className="text-sm text-muted-foreground">Start shopping to place your first order and track it here.</p>
                </div>
                
                {/* Button - Right */}
                <div className="flex-shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full md:w-auto px-8 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-md hover:shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                  {/* Order header */}
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full p-6 hover:bg-muted/50 transition-colors flex items-center justify-between cursor-pointer text-left"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Order ID</p>
                        <p className="text-foreground font-semibold mt-1">#{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Date</p>
                        <p className="text-foreground font-semibold mt-1">{formatDate(order.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Total</p>
                        <p className="text-foreground font-semibold mt-1">${(Number(order.total) || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            STATUS_COLORS[order.status] || 'bg-gray-500/15 text-gray-600 border-gray-500/30'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                    {expandedOrder === order.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground ml-4" />
                    )}
                  </button>

                  {/* Order details */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-border p-6 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Name</p>
                          <p className="text-foreground font-medium mt-1">
                            {order.name} {order.surname}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                          <p className="text-foreground font-medium mt-1">{order.email}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                          <p className="text-foreground font-medium mt-1">{order.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</p>
                          <p className="text-foreground font-medium mt-1 capitalize">{order.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Payment Status</p>
                          <p className="text-foreground font-medium mt-1 capitalize">{order.payment_status}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Delivery Address</p>
                        <p className="text-foreground font-medium mt-1">{order.address}</p>
                      </div>

                      {/* Order items */}
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Items</p>
                        <div className="space-y-2">
                          {Array.isArray(order.items) && order.items.length > 0 ? (
                            order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                                <div>
                                  <p className="text-foreground font-medium">{item.product_name || 'Unknown Product'}</p>
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity || 0}</p>
                                </div>
                                <p className="text-foreground font-semibold">${((Number(item.price_at_purchase) || 0) * (item.quantity || 0)).toFixed(2)}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No items in order</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-border">
            <button
              onClick={fetchOrders}
              className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;