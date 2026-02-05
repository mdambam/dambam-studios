'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // App routes where this header should be hidden or simplified
  const isAppRoute = pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/generate') ||
    pathname?.startsWith('/enhance') ||
    pathname?.startsWith('/video') ||
    pathname?.startsWith('/music') ||
    pathname?.startsWith('/voice') ||
    pathname?.startsWith('/graphics') ||
    pathname?.startsWith('/history') ||
    pathname?.startsWith('/account') ||
    pathname?.startsWith('/billing') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/studio');

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isAppRoute) return null;

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
          isScrolled
            ? 'bg-background/95 backdrop-blur-sm border-border py-3 shadow-sm'
            : 'bg-background border-transparent py-5'
        )}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="font-bold text-white text-lg">e</span>
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">AI Studios</span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl px-4">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search for AI tools, templates, and more..."
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/50 border border-transparent focus:bg-background focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* CTA */}
            <Button
              variant="default"
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg h-10 px-6 shadow-sm shadow-primary/20"
              asChild
            >
              <Link href={user ? "/dashboard" : "/signup"}>
                {user ? "Go to Dashboard" : "Get Started"}
              </Link>
            </Button>

            {/* Sign In / User */}
            {!user && (
              <Link
                href="/login"
                className="text-sm font-semibold text-foreground/80 hover:text-foreground hidden sm:block"
              >
                Log in
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-lg font-medium">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
            <div className="h-px bg-border my-2" />
            {user ? (
              <Link href="/dashboard" className="text-primary">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link href="/signup" className="text-primary" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
