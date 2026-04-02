import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_CONFIG } from '@/config/apiConfig';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { User, Mail, Shield, Calendar, Loader2, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

const ProfilePage: React.FC = () => {
  const { user, authFetch, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (!authLoading && user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(API_CONFIG.user.profile);
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await response.json();
      if (data.success) {
        setProfile(data.user);
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main flex items-center justify-center p-6 bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-wrapper">
        <Header />
        <main className="page-main flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <p className="font-medium">{error || 'Profile not found'}</p>
            </div>
            <button
              onClick={fetchProfile}
              className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <main className="page-main flex items-center justify-center p-6 bg-gradient-to-b from-background to-secondary min-h-screen">
        <div className="w-full max-w-2xl">
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Header with avatar */}
            <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-8 border-b border-border">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold">
                  {profile.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{profile.email}</h1>
                  <p className="text-muted-foreground text-sm mt-1">Account</p>
                </div>
              </div>
            </div>

            {/* Profile content */}
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <Mail className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</p>
                    <p className="text-foreground font-medium mt-1">{profile.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <Shield className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</p>
                    <p className="text-foreground font-medium mt-1 capitalize">
                      {profile.role === 'admin' ? 'Administrator' : 'Regular User'}
                    </p>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <Calendar className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Member Since</p>
                    <p className="text-foreground font-medium mt-1">{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                {/* User ID */}
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
                  <User className="w-5 h-5 text-accent mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User ID</p>
                    <p className="text-foreground font-medium mt-1">#{profile.id}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  onClick={fetchProfile}
                  className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;