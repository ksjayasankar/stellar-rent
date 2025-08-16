'use client';

import { FeaturedProperties } from '@/components/features/properties/FeaturedProperties';
import { SearchBar } from '@/components/features/search/SearchBar';
import { HowItWorks } from '@/components/shared/HowItWorks';
import { Testimonials } from '@/components/shared/Testimonials';
import { Footer } from '@/components/shared/layout/Footer';
import { HeroSection } from '@/components/shared/layout/HeroSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth/use-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Optional: Redirect authenticated users to /search
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/search');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with CTAs */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Link href="/" className="text-xl font-bold">
                StellarRent
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <HeroSection />

        {/* Search Bar Section */}
        <section className="py-8 bg-gradient-to-b from-white to-blue-50 dark:from-[#0B1D39] dark:to-[#071429]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <FeaturedProperties />

        {/* How It Works */}
        <HowItWorks />

        {/* Testimonials */}
        <Testimonials />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
