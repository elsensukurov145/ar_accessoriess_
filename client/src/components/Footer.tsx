import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div>
            <Link to="/" className="text-xl font-bold font-display mb-4 block">
              ar_<span className="text-accent">accessories</span>
            </Link>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">{t('footer.aboutText')}</p>
            <div className="flex gap-3 mt-5">
              {['facebook', 'instagram', 'tiktok'].map(social => (
                <a
                  key={social}
                  href={social === 'instagram' ? 'https://www.instagram.com/ar_accessoriess_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==' : '#'}
                  target={social === 'instagram' ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent/20 transition-colors text-xs font-bold uppercase text-primary-foreground/70"
                  aria-label={social}
                >
                  {social[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 font-display">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2.5">
              {[
                { label: t('footer.delivery'), href: '#' },
                { label: t('footer.warranty'), href: '#' },
                { label: t('footer.returnPolicy'), href: '#' },
                { label: t('footer.privacyPolicy'), href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-primary-foreground/60 hover:text-accent transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 font-display">{t('footer.contactInfo')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-primary-foreground/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                {t('footer.address')}
              </li>
              <li className="flex items-center gap-2.5 text-sm text-primary-foreground/60">
                <Phone className="w-4 h-4 shrink-0 text-accent" />
                {t('footer.phone')}
              </li>
              <li className="flex items-center gap-2.5 text-sm text-primary-foreground/60">
                <Mail className="w-4 h-4 shrink-0 text-accent" />
                {t('footer.email')}
              </li>
            </ul>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="font-bold mb-4 font-display">{t('footer.workingHours')}</h4>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-sm text-primary-foreground/60">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <div>
                  <p>{t('footer.weekdays')}</p>
                  <p>{t('footer.weekend')}</p>
                  <p>{t('footer.sunday')}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-custom py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-primary-foreground/50">
            © 2025 ar_accessories. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
