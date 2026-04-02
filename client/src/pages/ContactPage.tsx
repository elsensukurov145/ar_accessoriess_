import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Phone, Mail, MessageCircle } from 'lucide-react';

const ContactPage = () => {
  const { t } = useLanguage();

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main container-custom py-16">
        <h1 className="text-3xl sm:text-4xl font-bold font-display text-foreground mb-10 text-center">
          {t('contact.title')}
        </h1>
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('footer.phone')}</h3>
                <p className="text-sm text-muted-foreground">+994 70 233 09 89</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <p className="text-sm text-muted-foreground">info@ar_accessories.az</p>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('footer.address')}</h3>
                <p className="text-sm text-muted-foreground">Bakı, Azərbaycan</p>
              </div>
            </div>
            <a
              href="https://wa.me/994702330989"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card rounded-xl border border-border p-6 flex items-start gap-4 hover:border-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">WhatsApp</h3>
                <p className="text-sm text-muted-foreground">{t('contact.whatsapp')}</p>
              </div>
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ContactPage;
