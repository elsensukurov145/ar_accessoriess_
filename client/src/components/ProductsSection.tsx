import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function ProductsSection() {
  const { t } = useLanguage();
  const { products, loading, error } = useProducts();
  
  // Find featured or popular products (since backend currently just grabs all, we slice here)
  const featured = products.slice(0, 8);

  return (
    <section className="py-20 bg-secondary">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
              {t('products.title')}
            </h2>
            <p className="text-muted-foreground text-lg">{t('products.subtitle')}</p>
          </div>
          <Link
            to="/products"
            className="hidden sm:inline-flex items-center px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('categories.viewAll')} →
          </Link>
        </div>
        
        {loading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-accent" />
           </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-destructive mb-4">Failed to load products: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="sm:hidden mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
          >
            {t('categories.viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
