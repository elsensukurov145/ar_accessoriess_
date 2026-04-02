import { useLanguage } from '@/contexts/LanguageContext';
import { reviews } from '@/data/reviews';
import { Star } from 'lucide-react';

export function Reviews() {
  const { lang, t } = useLanguage();

  return (
    <section className="py-20 bg-secondary">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-3">
            {t('reviews.title')}
          </h2>
          <p className="text-muted-foreground text-lg">{t('reviews.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map(review => (
            <div key={review.id} className="bg-card rounded-xl p-6 border border-border">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? 'text-accent fill-accent' : 'text-border'}`}
                  />
                ))}
              </div>
              <p className="text-foreground/80 text-sm leading-relaxed mb-4">{review.text[lang]}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {review.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
