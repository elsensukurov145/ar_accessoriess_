import { useLanguage } from '@/contexts/LanguageContext';
import { Shield, Truck, Award, Headphones } from 'lucide-react';

export function WhyChooseUs() {
  const { t } = useLanguage();

  const features = [
    { icon: Shield, title: t('whyUs.quality'), desc: t('whyUs.qualityDesc') },
    { icon: Truck, title: t('whyUs.delivery'), desc: t('whyUs.deliveryDesc') },
    { icon: Award, title: t('whyUs.warranty'), desc: t('whyUs.warrantyDesc') },
    { icon: Headphones, title: t('whyUs.support'), desc: t('whyUs.supportDesc') },
  ];

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container-custom">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-3">
            {t('whyUs.title')}
          </h2>
          <p className="text-primary-foreground/70 text-lg">{t('whyUs.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-accent/20 flex items-center justify-center">
                <f.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 font-display">{f.title}</h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
