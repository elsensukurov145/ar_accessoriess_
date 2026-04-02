import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const langLabels: Record<Language, string> = { az: 'AZ', ru: 'RU', en: 'EN' };
const langFlags: Record<Language, string> = { az: '🇦🇿', ru: '🇷🇺', en: '🇬🇧' };

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium text-header-foreground hover:bg-foreground/10 transition-colors"
        aria-label="Change language"
      >
        <span>{langFlags[lang]} {langLabels[lang]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[120px] z-50">
          {(Object.keys(langLabels) as Language[]).map(l => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors ${l === lang ? 'font-semibold text-accent' : 'text-foreground'}`}
            >
              <span>{langFlags[l]}</span>
              <span>{langLabels[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
