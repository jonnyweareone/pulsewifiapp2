'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
} from '@/components/ui';
import {
  WifiIcon,
  BuildingStorefrontIcon,
  HomeIcon,
  UserIcon,
  ArrowRightIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';

type OnboardingType = 'venue' | 'home' | 'general' | null;

interface VenueData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  splash_image_url: string | null;
  primary_color: string | null;
  address: string | null;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [onboardingType, setOnboardingType] = useState<OnboardingType>(null);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOnboardingContext() {
      const type = searchParams.get('type') as OnboardingType;
      const venueId = searchParams.get('venue_id');
      const venueSlug = searchParams.get('venue');

      setOnboardingType(type || 'general');

      // Load venue data if venue onboarding
      if (type === 'venue' && (venueId || venueSlug)) {
        try {
          const supabase = createClient();
          let query = supabase.from('venues').select('*');
          
          if (venueId) {
            query = query.eq('id', venueId);
          } else if (venueSlug) {
            query = query.eq('slug', venueSlug);
          }

          const { data, error: venueError } = await query.single();

          if (venueError) throw venueError;
          setVenue(data);
        } catch (err) {
          console.error('Error loading venue:', err);
          setError('Venue not found');
        }
      }

      setLoading(false);
    }

    loadOnboardingContext();
  }, [searchParams]);

  const handleContinue = () => {
    if (!user) {
      // Redirect to register with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/auth/register?redirect=${returnUrl}`);
    } else {
      // Go to passpoint setup
      router.push('/onboarding/passpoint');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Venue-specific onboarding
  if (onboardingType === 'venue' && venue) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Venue Header */}
            <div className="text-center mb-8">
              {venue.logo_url && (
                <img 
                  src={venue.logo_url} 
                  alt={venue.name}
                  className="h-16 mx-auto mb-4"
                />
              )}
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome to {venue.name}
              </h1>
              <p className="text-gray-400">
                Get free, seamless WiFi powered by Pulse
              </p>
            </div>

            {/* WiFi Card */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
                    <WifiIcon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Passpoint WiFi
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Connect once and your device will automatically reconnect whenever you visit {venue.name} or any Pulse WiFi location.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        No passwords to remember
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        Secure WPA2/WPA3 encryption
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        Works at all Pulse WiFi venues
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Info */}
            {venue.address && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-300 text-sm">{venue.address}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleContinue}
            >
              {user ? 'Set Up WiFi' : 'Create Free Account'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>

            {user && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Signed in as {user.email}
              </p>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Home onboarding
  if (onboardingType === 'home') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <HomeIcon className="h-10 w-10 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Pulse WiFi for Home
              </h1>
              <p className="text-gray-400">
                Premium mesh WiFi for your entire home
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  What you get:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <div>
                      <span className="text-white font-medium">Whole-home coverage</span>
                      <p className="text-gray-400 text-sm">No more dead spots with mesh technology</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <div>
                      <span className="text-white font-medium">Seamless roaming</span>
                      <p className="text-gray-400 text-sm">Same Passpoint profile works at home and out</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <div>
                      <span className="text-white font-medium">Parental controls</span>
                      <p className="text-gray-400 text-sm">Guardian lockdown and content filtering</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <div>
                      <span className="text-white font-medium">Professional installation</span>
                      <p className="text-gray-400 text-sm">We handle everything for you</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleContinue}
            >
              {user ? 'Check Coverage' : 'Get Started'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // General onboarding (default)
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Get Connected with Pulse WiFi
            </h1>
            <p className="text-gray-400">
              Choose how you want to use Pulse WiFi
            </p>
          </div>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            {/* Public WiFi Option */}
            <Card 
              className="cursor-pointer hover:border-indigo-500/50 transition-colors"
              onClick={() => router.push('/onboarding/passpoint')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg">
                    <BuildingStorefrontIcon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Free Public WiFi
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Get seamless WiFi at cafes, venues, and public spaces. Connect once, stay connected everywhere.
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            {/* Home WiFi Option */}
            <Card 
              className="cursor-pointer hover:border-indigo-500/50 transition-colors"
              onClick={() => router.push('/onboarding?type=home')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <HomeIcon className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Home WiFi
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Premium mesh WiFi for your home with parental controls and whole-home coverage.
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-500" />
                </div>
              </CardContent>
            </Card>

            {/* Already have account */}
            <div className="text-center pt-4">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
