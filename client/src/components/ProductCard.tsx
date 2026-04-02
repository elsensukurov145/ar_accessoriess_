import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types/product';
import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.in_stock) return;
    addToCart(product, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discountPercent = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  // Check if product is created within the last 30 days
  const isNew = new Date(product.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_url}
          alt={product.name[lang] || product.name.az}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          width={400}
          height={400}
          onError={(e) => {
            const imgElement = e.target as HTMLImageElement;
            imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="18" fill="%236b7280" text-anchor="middle" dy=".3em"%3ENo image%3C/text%3E%3C/svg%3E';
          }}
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.discount_price && (
            <span className="px-2.5 py-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-md">
              -{discountPercent}%
            </span>
          )}
          {isNew && (
            <span className="px-2.5 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-md">
              YENİ
            </span>
          )}
        </div>
        {!product.in_stock && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-semibold">
              {t('products.outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 group-hover:text-accent transition-colors line-clamp-2 font-body">
            {product.name[lang] || product.name.az}
          </h3>
        </Link>

        {/* Colors */}
        {Array.isArray(product.colors) && product.colors.length > 1 && (
          <div className="flex gap-1.5 mb-3">
            {product.colors.map(color => (
              <button
                key={color}
                onClick={(e) => { e.preventDefault(); setSelectedColor(color); }}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  selectedColor === color ? 'border-accent scale-110' : 'border-border'
                }`}
                style={{ backgroundColor: color === 'transparent' ? '#f0f0f0' : color }}
                aria-label={`${t('products.color')}: ${color}`}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          {product.discount_price ? (
            <>
               <span className="text-lg font-bold text-accent">{product.discount_price} {t('currency')}</span>
              <span className="text-sm text-muted-foreground line-through">{product.price} {t('currency')}</span>
            </>
          ) : (
            <span className="text-lg font-bold text-foreground">{product.price} {t('currency')}</span>
          )}
        </div>

        {/* Stock status */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-success' : 'bg-destructive'}`} />
          <span className="text-xs text-muted-foreground">
            {product.in_stock ? t('products.inStock') : t('products.outOfStock')}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock || added}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              added ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {added ? '✓' : t('products.addToCart')}
          </button>
          <Link
            to={`/product/${product.id}`}
            className="px-3 py-2.5 border border-border text-foreground rounded-lg text-xs font-semibold hover:bg-muted transition-colors"
          >
            {t('products.viewDetails')}
          </Link>
        </div>
      </div>
    </div>
  );
}
