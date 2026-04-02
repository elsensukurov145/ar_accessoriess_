import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const { t } = useLanguage();

  return (
    <a
      href="https://wa.me/994702330989"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[hsl(142,70%,45%)] text-[hsl(0,0%,100%)] pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
      aria-label={t('contact.whatsapp')}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">{t('contact.whatsapp')}</span>
    </a>
  );
}
