import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create abort controller for 10-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_CONFIG.auth.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        login(data.token, data.user);
        toast.success('Giriş uğurla tamamlandı');
        navigate('/admin');
      } else {
        setError(data.message || 'Giriş uğursuz oldu. Məlumatları yoxlayın.');
        toast.error('Giriş uğursuz oldu');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Sorğu vaxtı sona çatdı. Zəhmət olmasa yenidən cəhd edin.');
      } else {
        setError('Serverlə əlaqə qurulmadı. Yenidən cəhd edin.');
      }
      toast.error('Xəta baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main flex items-center justify-center p-6 bg-muted/20">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-accent/10 rounded-full">
                <Lock className="w-8 h-8 text-accent" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-foreground mb-2">Admin Panel Girişi</h1>
            <p className="text-muted-foreground text-center mb-8">Mağaza idarəetmə panelinə daxil olun</p>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground" htmlFor="password">Şifrə</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-accent-foreground font-bold py-4 rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Daxil olunur...
                  </>
                ) : (
                  'Daxil ol'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
