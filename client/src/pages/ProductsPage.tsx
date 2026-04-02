import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { Category } from '@/types/product';
import { Loader2 } from 'lucide-react';

type SortMode = 'newest' | 'popular' | 'discounted';

const ProductsPage = () => {
  const { lang, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') as Category | null;
  const initialSearch = searchParams.get('search') || '';

  const { products, loading, error } = useProducts();
  const [category, setCategory] = useState<Category | 'all'>(initialCategory || 'all');
  const [sort, setSort] = useState<SortMode>('popular');
  const [search, setSearch] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = [...products];

    if (category !== 'all') result = result.filter(p => p.category === category);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p => (p.name[lang] && p.name[lang].toLowerCase().includes(q)) || 
             (p.description[lang] && p.description[lang].toLowerCase().includes(q))
      );
    }

    result = result.filter(p => {
      const price = p.discount_price || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sort) {
      // In a real full-stack, these DB properties can be dynamic fields or computed based on creation date
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'popular': result.sort((a, b) => (b.category ? 1 : 0) - (a.category ? 1 : 0)); break; // simple mockup
      case 'discounted': result.sort((a, b) => (b.discount_price ? 1 : 0) - (a.discount_price ? 1 : 0)); break;
    }

    return result;
  }, [category, sort, search, priceRange, lang, products]);

  const categoryOptions: { value: Category | 'all'; label: string }[] = [
    { value: 'all', label: t('products.allCategories') },
    { value: 'cases', label: t('categories.cases') },
    { value: 'chargers', label: t('categories.chargers') },
    { value: 'cables', label: t('categories.cables') },
  ];

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'popular', label: t('products.popular') },
    { value: 'newest', label: t('products.newest') },
    { value: 'discounted', label: t('products.discounted') },
  ];

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-10">
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-8">
          {t('products.title')}
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('nav.search')}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full sm:w-auto sm:min-w-[240px]"
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category | 'all')}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortMode)}
            className="px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('products.priceRange')}:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={priceRange[0]}
              onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
              className="w-16 px-2 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
            />
            <span>—</span>
            <input
              type="number"
              min={0}
              max={100}
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-16 px-2 py-2 rounded-lg border border-border bg-card text-foreground text-sm"
            />
            <span>{t('currency')}</span>
          </div>
        </div>

        {/* Products grid */}
        {loading ? (
             <div className="flex justify-center items-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-accent" />
             </div>
        ) : error ? (
            <div className="text-center py-20 text-destructive text-sm font-semibold">
              <p>{error}</p>
            </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No products found</p>
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductsPage;
