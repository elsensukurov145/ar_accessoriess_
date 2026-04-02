import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, CheckCircle, ArrowLeft, Package } from 'lucide-react';

const CartPage = () => {
  const { lang, t } = useLanguage();
  const { items, removeFromCart, updateQuantity, total: totalPrice, clearCart } = useCart();
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash_on_delivery'>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.name.trim()) { setError('Please enter your name.'); return; }
    if (!formData.surname.trim()) { setError('Please enter your surname.'); return; }
    if (!formData.phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!formData.address.trim()) { setError('Please enter your delivery address.'); return; }

    setLoading(true);

    try {
      const orderPayload = {
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        total: totalPrice,
        payment_method: paymentMethod,
        items: items.map(item => ({
          product_id: item.id,
          product_name: item.name[lang],
          quantity: item.quantity,
          price: item.discount_price || item.price,
          selected_color: item.selectedColor,
        })),
      };

      console.log('[handleCheckout] Submitting order:', orderPayload);

      const res = await authFetch(API_CONFIG.orders.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      // ✅ Use response.ok as the primary success condition
      console.log('[handleCheckout] Response received:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      });

      // ✅ Parse response body
      let data;
      try {
        data = await res.json();
        console.log('[handleCheckout] Parsed response body:', data);
      } catch (jsonErr) {
        console.error('[handleCheckout] Failed to parse JSON response:', jsonErr);
        // If not JSON but status is ok, we'll try to proceed, otherwise throw
        if (!res.ok) {
          throw new Error(`Server returned error ${res.status} with non-JSON response.`);
        }
        data = {};
      }

      // ✅ Evaluate success based on status and body
      if (!res.ok) {
        console.error('[handleCheckout] Order failed on server:', data);
        // If the order was actually created despite the error (as indicated by having an order id), we can treat it as success
        if (data?.order?.id || data?.orderId) {
          console.warn('[handleCheckout] Server returned error but also an order ID. Proceeding as success.');
        } else {
          throw new Error(data?.message || `Server error (${res.status}) during order creation.`);
        }
      }

      console.log('[handleCheckout] Order submission successful!');
      
      // ✅ Clear any previous error state on success
      setError(null);

      // ✅ Handle payment redirect or success
      if (data?.url) {
        console.log('[handleCheckout] Redirecting to payment gateway:', data.url);
        window.location.href = data.url;
        return; // Important: Stop further execution
      } 
      
      console.log('[handleCheckout] Processing success result');
      // Cash/manual payment or success without redirect
      const finalOrderId = data?.order?.id || data?.orderId || null;
      if (finalOrderId) {
        console.log('[handleCheckout] Setting orderId:', finalOrderId);
        setOrderId(finalOrderId);
      }
      
      setSuccess(true);
      clearCart();
      
      // Navigate to orders page after a brief delay
      setTimeout(() => {
        console.log('[handleCheckout] Navigating to /orders');
        navigate('/orders');
      }, 1000);

    } catch (err: any) {
      console.error('[handleCheckout] Caught error in catch block:', err);
      // Ensure we are not already in a success state
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to server. Please check your internet connection or the server status.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main container-custom py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground mb-3">
              {lang === 'az' ? 'Sifariş Qəbul Edildi!' : lang === 'ru' ? 'Заказ Принят!' : 'Order Placed!'}
            </h1>
            {orderId && (
              <p className="text-accent font-semibold mb-2">
                {lang === 'az' ? `Sifariş #${orderId}` : lang === 'ru' ? `Заказ #${orderId}` : `Order #${orderId}`}
              </p>
            )}
            <p className="text-muted-foreground mb-8">
              {lang === 'az'
                ? 'Sifarişiniz uğurla qəbul edildi. Tezliklə sizinlə əlaqə saxlayacağıq.'
                : lang === 'ru'
                ? 'Ваш заказ успешно принят. Мы свяжемся с вами в ближайшее время.'
                : 'Your order has been successfully placed. We will contact you shortly.'}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Package className="w-4 h-4" />
              {t('cart.continueShopping')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Empty Cart ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main container-custom py-20 text-center">
          <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground/20 mb-6" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-3">{t('cart.empty')}</h1>
          <p className="text-muted-foreground mb-6">
            {lang === 'az' ? 'Alış-veriş etməyə başlayın' : lang === 'ru' ? 'Начните покупки' : 'Start shopping to fill your cart'}
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            {t('cart.continueShopping')}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Checkout Form (full page) ───────────────────────────────────────────────
  if (isCheckingOut) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main container-custom py-10">
          <button
            onClick={() => setIsCheckingOut(false)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === 'az' ? 'Səbətə Qayıt' : lang === 'ru' ? 'Назад в корзину' : 'Back to Cart'}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">
            {/* Form */}
            <div className="lg:col-span-3">
              <h1 className="text-2xl font-bold font-display text-foreground mb-6">
                {lang === 'az' ? 'Çatdırılma Məlumatları' : lang === 'ru' ? 'Данные доставки' : 'Delivery Details'}
              </h1>

              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="checkout-name" className="block text-sm font-medium mb-1.5">
                      {lang === 'az' ? 'Ad' : lang === 'ru' ? 'Имя' : 'First Name'} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={lang === 'az' ? 'Adınız' : lang === 'ru' ? 'Ваше имя' : 'Your first name'}
                      className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="checkout-surname" className="block text-sm font-medium mb-1.5">
                      {lang === 'az' ? 'Soyad' : lang === 'ru' ? 'Фамилия' : 'Last Name'} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="checkout-surname"
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleChange}
                      placeholder={lang === 'az' ? 'Soyadınız' : lang === 'ru' ? 'Ваша фамилия' : 'Your last name'}
                      className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block text-sm font-medium mb-1.5">
                    {lang === 'az' ? 'Telefon Nömrəsi' : lang === 'ru' ? 'Номер телефона' : 'Phone Number'} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+994 XX XXX XX XX"
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-address" className="block text-sm font-medium mb-1.5">
                    {lang === 'az' ? 'Çatdırılma Ünvanı' : lang === 'ru' ? 'Адрес доставки' : 'Delivery Address'} <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    placeholder={lang === 'az' ? 'Şəhər, küçə, bina, mənzil...' : lang === 'ru' ? 'Город, улица, дом, квартира...' : 'City, street, building, apartment...'}
                    className="w-full px-3.5 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
                  />
                </div>

                <div className="p-4 border border-border rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-2">{lang === 'az' ? 'Ödəniş Metodunu Seçin' : lang === 'ru' ? 'Выберите способ оплаты' : 'Choose Payment Method'}</p>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-primary focus:ring-primary"
                      />
                      {lang === 'az' ? 'Kartla Ödəniş (Kapital Bank)' : lang === 'ru' ? 'Оплата картой (Kapital Bank)' : 'Card Payment (Kapital Bank)'}
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => setPaymentMethod('cash_on_delivery')}
                        className="text-primary focus:ring-primary"
                      />
                      {lang === 'az' ? 'Nəğd Çatdırılma ilə Ödəniş' : lang === 'ru' ? 'Оплата наложенным платежом' : 'Cash on Delivery'}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-accent text-accent-foreground rounded-lg font-semibold hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {lang === 'az' ? 'Göndərilir...' : lang === 'ru' ? 'Обработка...' : 'Processing...'}
                    </>
                  ) : (
                    lang === 'az' ? 'Sifarişi Tamamla' : lang === 'ru' ? 'Оформить заказ' : 'Place Order'
                  )}
                </button>
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-5 sticky top-24">
                <h3 className="font-bold font-display text-base mb-4">
                  {t('cart.orderSummary')}
                </h3>
                <div className="space-y-3 mb-4">
                  {items.map(item => {
                    const price = item.discount_price || item.price;
                    return (
                      <div key={`${item.id}-${item.selectedColor}`} className="flex gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name[lang]}
                          className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-2">{item.name[lang]}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.quantity}x · {price} {t('currency')}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground shrink-0">{(price * item.quantity).toFixed(2)} {t('currency')}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.shipping')}</span>
                    <span className="text-success font-semibold">{t('cart.free')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>{t('cart.total')}</span>
                    <span className="text-accent text-lg">{totalPrice.toFixed(2)} {t('currency')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    );
  }

  // ── Cart View ───────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-10">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">{t('cart.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => {
              const price = item.discount_price || item.price;
              return (
                <div key={`${item.id}-${item.selectedColor}`} className="flex gap-4 bg-card rounded-xl border border-border p-4">
                  <Link to={`/product/${item.id}`} className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    <img src={item.image_url} alt={item.name[lang]} className="w-full h-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.id}`} className="font-semibold text-foreground text-sm hover:text-accent transition-colors line-clamp-2">
                      {item.name[lang]}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {item.selectedColor && item.selectedColor !== 'transparent' && (
                        <div
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: item.selectedColor }}
                          title={item.selectedColor}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground">{(price * item.quantity).toFixed(2)} {t('currency')}</span>
                        <button
                          onClick={() => removeFromCart(item.cartId)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={t('cart.remove')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-xl border border-border p-6 h-fit sticky top-24">
            <h3 className="font-bold font-display text-lg mb-4">{t('cart.orderSummary')}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.subtotal')}</span>
                <span className="font-semibold">{totalPrice.toFixed(2)} {t('currency')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('cart.shipping')}</span>
                <span className="font-semibold text-success">{t('cart.free')}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-bold">{t('cart.total')}</span>
                <span className="font-bold text-lg text-accent">{totalPrice.toFixed(2)} {t('currency')}</span>
              </div>
            </div>

            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full py-3.5 bg-accent text-accent-foreground rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              {t('cart.checkout')}
            </button>
            <Link
              to="/products"
              className="block text-center text-sm text-muted-foreground hover:text-accent mt-3 transition-colors"
            >
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default CartPage;
