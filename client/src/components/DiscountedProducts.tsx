import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function DiscountedProducts() {
  const { t } = useLanguage();
  const { products, loading, error } = useProducts();
  const discounted = products.filter(p => p.discount_price != null).slice(0, 4);

  if (discounted.length === 0 && !loading) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3 flex items-center gap-3">
              {t('nav.discounts')}
              <span className="bg-destructive/10 text-destructive text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                SALE
              </span>
            </h2>
          </div>
          <Link
            to="/discounts"
            className="hidden sm:inline-flex items-center px-5 py-2.5 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/80 transition-colors"
          >
            Bütün endirimlər →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
           <p className="text-center text-destructive">{error}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {discounted.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
