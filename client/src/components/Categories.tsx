import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import categoryCases from '@/assets/category-cases.jpg';
import categoryChargers from '@/assets/category-chargers.jpg';
import categoryCables from '@/assets/category-cables.jpg';

export function Categories() {
  const { t } = useLanguage();

  const categories = [
    { key: 'cases', image: categoryCases, label: t('categories.cases') },
    { key: 'chargers', image: categoryChargers, label: t('categories.chargers') },
    { key: 'cables', image: categoryCables, label: t('categories.cables') },
  ];

  return (
    <section id="categories" className="py-20 bg-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            {t('categories.title')}
          </h2>
          <p className="text-muted-foreground text-lg">{t('categories.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.key}
              to={`/products?category=${cat.key}`}
              className="group relative rounded-xl overflow-hidden aspect-square"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                width={800}
                height={800}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-primary-foreground font-display mb-1">{cat.label}</h3>
                <span className="text-sm text-primary-foreground/70 group-hover:text-accent transition-colors">
                  {t('categories.viewAll')} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
