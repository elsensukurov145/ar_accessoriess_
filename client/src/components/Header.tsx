import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ShoppingBag, Menu, X, Shield, Smartphone, User, LogOut, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { t } = useLanguage();
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navLinks = [
    { label: t('nav.home'), href: '/' },
    { label: t('nav.products'), href: '/products' },
    { label: t('nav.discounts'), href: '/discounts' },
    { label: t('nav.contact'), href: '/contact' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-header text-header-foreground sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Premium Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 shadow-[0_0_15px_rgba(var(--accent),0.3)] group-hover:shadow-[0_0_20px_rgba(var(--accent),0.5)] transition-all duration-300">
              <Smartphone className="w-5 h-5 text-accent-foreground" />
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/20"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-display tracking-tight text-header-foreground leading-none">
                ar_<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/70">accessories</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-header-foreground/50 leading-none mt-1">Premium Store</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-header-foreground/80 hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Link to="/cart" className="p-2 text-header-foreground/80 hover:text-accent transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold cursor-pointer hover:bg-accent/80 transition-colors">
                    {user.email.charAt(0).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="p-2 text-header-foreground/80 hover:text-accent transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            <LanguageSwitcher />

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-header-foreground/80"
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="border-t border-foreground/10 px-4 py-3">
          <form onSubmit={handleSearch} className="container-custom">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-header-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('nav.search') || 'Search products...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-foreground/10 text-header-foreground placeholder:text-header-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>
          </form>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-foreground/10 pt-3 flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-header-foreground/80 hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
