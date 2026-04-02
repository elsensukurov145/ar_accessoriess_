import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { ShoppingBag, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  
  const product = products.find(p => p.id === id);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product && product.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  if (loading) {
     return (
       <div className="page-wrapper">
         <Header />
         <div className="page-main flex justify-center items-center py-40">
           <Loader2 className="w-10 h-10 animate-spin text-accent" />
         </div>
         <Footer />
       </div>
     );
  }

  if (!product) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main container-custom py-20 text-center">
          <p className="text-lg text-muted-foreground">Product not found</p>
          <Link to="/products" className="text-accent mt-4 inline-block">{t('detail.backToProducts')}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAdd = () => {
    addToCart(product, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discountPercent = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-10">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('detail.backToProducts')}
        </Link>

        {/* Adjusting the grid wrapper to hold both columns properly */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            <img 
              src={product.image_url} 
              alt={product.name[lang] || product.name.az} 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%236b7280" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* Details */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-4">
              {product.name[lang] || product.name.az}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              {product.discount_price ? (
                <>
                  <span className="text-3xl font-bold text-accent">{product.discount_price} {t('currency')}</span>
                  <span className="text-lg text-muted-foreground line-through">{product.price} {t('currency')}</span>
                  <span className="px-2.5 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md">
                    -{discountPercent}%
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-foreground">{product.price} {t('currency')}</span>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2.5 h-2.5 rounded-full ${product.in_stock ? 'bg-success' : 'bg-destructive'}`} />
              <span className="text-sm font-medium">
                {product.in_stock ? t('products.inStock') : t('products.outOfStock')}
              </span>
            </div>

            <p className="text-foreground/70 leading-relaxed mb-6">{product.description[lang] || product.description.az}</p>

            {/* Colors */}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-2">{t('products.color')}</p>
                <div className="flex gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-accent scale-110 ring-2 ring-accent/30' : 'border-border'
                      }`}
                      style={{ backgroundColor: color === 'transparent' ? '#f0f0f0' : color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <button
              onClick={handleAdd}
              disabled={!product.in_stock || added}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                added ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {added ? <Check className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
              {added ? '✓' : t('products.addToCart')}
            </button>

            {/* Specs */}
            {product.specs && (product.specs[lang] || product.specs.az) && (
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-lg font-bold font-display mb-4">{t('detail.specifications')}</h3>
                <ul className="space-y-2">
                  {(product.specs[lang] || product.specs.az).map((spec: string, i: number) => (
                    <li key={i} className="text-sm text-foreground/70 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground mb-6">{t('detail.relatedProducts')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetailPage;
