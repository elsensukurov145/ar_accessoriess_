import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import heroBanner from '@/assets/hero-banner.jpg';

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative h-[85vh] min-h-[500px] max-h-[800px] overflow-hidden">
      <img
        src={heroBanner}
        alt="Premium phone accessories"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />
      <div className="relative h-full container-custom flex items-center">
        <div className="max-w-xl animate-fade-in">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-primary-foreground leading-tight mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-8 font-body leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/products"
              className="inline-flex items-center px-7 py-3.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:brightness-110 transition-all text-sm"
            >
              {t('hero.shopNow')}
            </Link>
            <a
              href="#categories"
              className="inline-flex items-center px-7 py-3.5 border-2 border-primary-foreground/30 text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground/10 transition-all text-sm"
            >
              {t('hero.viewCategories')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
