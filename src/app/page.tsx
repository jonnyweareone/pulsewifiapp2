import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

// Force dynamic rendering to prevent build-time errors when env vars aren't available
export const dynamic = 'force-dynamic';
import { Footer } from '@/components/layout/Footer';
import { Button, Card, CardContent } from '@/components/ui';
import {
  WifiIcon,
  ShieldCheckIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: WifiIcon,
    title: 'Free Public WiFi',
    description:
      'Access high-speed WiFi throughout your local area and surrounding areas. No data caps, no limits.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Connection',
    description:
      'Enterprise-grade WPA2/WPA3 encryption keeps your data safe. Passpoint 2.0 ensures you only connect to trusted networks.',
  },
  {
    icon: BoltIcon,
    title: 'Seamless Roaming',
    description:
      'Install once, connect automatically. Your device will seamlessly switch between Pulse WiFi hotspots.',
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Works on All Devices',
    description:
      'iPhone, Android, Mac, Windows - Pulse WiFi works with any device that supports WiFi.',
  },
  {
    icon: MapPinIcon,
    title: 'Growing Coverage',
    description:
      'Starting at your local area and expanding. More locations coming soon across your area.',
  },
  {
    icon: SparklesIcon,
    title: 'Local Offers',
    description:
      'Get exclusive offers and promotions from local businesses when connected to Pulse WiFi.',
  },
];

const steps = [
  {
    number: '1',
    title: 'Create an Account',
    description: 'Sign up with your email address in less than a minute.',
  },
  {
    number: '2',
    title: 'Download Your Profile',
    description: 'Get a personalized WiFi configuration for your device.',
  },
  {
    number: '3',
    title: 'Connect & Enjoy',
    description: 'Your device will automatically connect to Pulse WiFi wherever available.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="text-sm text-indigo-400">Powered by Passpoint 2.0</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Pulse WiFi</span>
              <br />
              <span className="text-white mt-2 block">Seamless Public WiFi</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Connect once, stay connected everywhere. Experience secure, fast, and free WiFi
              throughout participating venues with Passpoint 2.0 technology.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Sign up to get seamless WiFi
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Learn more
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-400" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-400" />
                <span>No data caps</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-400" />
                <span>Enterprise security</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Why Choose Pulse WiFi?
              </h2>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                More than just free WiFi - it&apos;s a seamless connectivity experience powered by
                next-generation technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} variant="hover" padding="lg">
                  <CardContent>
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg w-fit">
                      <feature.icon className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
                Get connected in three simple steps. No technical knowledge required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative text-center">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500/50" />
                  )}

                  {/* Step circle */}
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold shadow-lg shadow-indigo-500/25 mb-6">
                    {step.number}
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link href="/auth/register">
                <Button size="lg">
                  Get Started Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Passpoint Info Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card variant="default" padding="lg" className="relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="inline-block px-3 py-1 bg-indigo-500/20 text-indigo-400 text-sm font-medium rounded-full mb-4">
                    Passpoint 2.0 / Hotspot 2.0
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    What is Passpoint?
                  </h2>
                  <p className="mt-4 text-gray-400">
                    Passpoint (also known as Hotspot 2.0) is an industry standard that enables
                    seamless, secure WiFi roaming. Once configured, your device automatically
                    connects to trusted WiFi networks without you having to do anything.
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Automatic authentication - no passwords to remember
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Encrypted connection protects your data
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">
                        Works just like cellular roaming, but for WiFi
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-30 animate-pulse-glow" />
                    <div className="relative p-8 bg-slate-800/50 rounded-3xl border border-white/10">
                      <WifiIcon className="h-32 w-32 text-indigo-400 mx-auto animate-float" />
                      <p className="text-center text-white font-semibold mt-4">
                        Seamless Connectivity
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready for Seamless WiFi?
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Join Pulse WiFi today and never worry about WiFi again. Free forever, no strings
              attached.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Free Account
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
