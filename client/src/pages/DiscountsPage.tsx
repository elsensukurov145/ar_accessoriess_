import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { Loader2 } from 'lucide-react';

const DiscountsPage = () => {
  const { t } = useLanguage();
  const { products, loading, error } = useProducts();
  const discounted = products.filter(p => p.discount_price);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
          {t('products.discountedProducts')}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">{t('products.discountedSubtitle')}</p>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-destructive text-sm font-semibold">
            <p>{error}</p>
          </div>
        ) : discounted.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {discounted.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No discounted products available</p>
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default DiscountsPage;
