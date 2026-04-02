import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir');
      return;
    }

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      // Create abort controller for 10-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_CONFIG.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.message || 'Qeydiyyat uğursuz oldu');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Sorğu vaxtı sona çatdı. Zəhmət olmasa bağlantınızı yoxlayıb yenidən cəhd edin.');
      } else {
        setError('Şəbəkə xətası. Yenidən cəhd edin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Qeydiyyat</CardTitle>
          <CardDescription>
            Yeni hesab yaradın və alış-verişə başlayın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="siz@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifrə</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Şifrənizi daxil edin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifrəni təsdiqləyin</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Şifrənizi təkrar daxil edin"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Qeydiyyat olunur...
                </>
              ) : (
                'Qeydiyyatdan keçin'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Daxil olun
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;