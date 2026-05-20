import React, { useState, useEffect } from 'react';
import { ChevronRight, TrendingUp, Users, Zap, Lock, MapPin, BarChart3, ShoppingCart, Shield, Clock, Award } from 'lucide-react';

interface WelcomeScreenProps {
  onEnterApp: () => void;
}

export default function WelcomeScreen({ onEnterApp }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    onEnterApp();
    return null;
  }

  const features = [
    {
      icon: TrendingUp,
      title: 'Real-Time Prices',
      description: 'Get live market prices and track trends instantly across all major markets in Rwanda.',
      color: 'emerald'
    },
    {
      icon: MapPin,
      title: 'Multi-Location',
      description: 'Compare prices across different markets and locations to find the best deals.',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Price Analytics',
      description: 'Visualize price trends with advanced charts and predictive analytics tools.',
      color: 'purple'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join thousands of users contributing to accurate and up-to-date pricing data.',
      color: 'orange'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Lightning-fast updates with 99.9% uptime and real-time notifications.',
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security and encryption.',
      color: 'red'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Users', icon: Users },
    { value: '50+', label: 'Markets Tracked', icon: MapPin },
    { value: '24/7', label: 'Real-Time Updates', icon: Clock },
    { value: '98%', label: 'User Satisfaction', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-xl shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  SMPPMS
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Market Price Monitoring System
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-all hover:shadow-md text-white text-sm"
            >
              Get Started
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className={`text-center transition-all duration-700 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Smart Market Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Know the Real Price,
            <span className="text-emerald-600 dark:text-emerald-400 block mt-2">
              Make Smarter Choices
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Track live market prices, compare across locations, and get real-time insights 
            to make informed purchasing decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsVisible(false)}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-all hover:shadow-lg text-white"
            >
              Start Tracking Now
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-8 py-3 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-semibold transition-all"
            >
              Watch Demo
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 transition-all duration-700 delay-200 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-t border-slate-200 dark:border-slate-700">
        <div className={`text-center mb-12 transition-all duration-700 delay-400 ${
          animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Why Choose SMPMPS?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Everything you need to stay ahead in the market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`group p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{
                  transitionDelay: animate ? `${500 + index * 100}ms` : '0ms'
                }}
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg w-fit mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-700 delay-700 ${
            animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Three simple steps to start tracking prices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up for free and choose your role - Consumer, Vendor, or Business.'
              },
              {
                step: '02',
                title: 'Browse Markets',
                description: 'Explore markets, view real-time prices, and compare across locations.'
              },
              {
                step: '03',
                title: 'Make Informed Decisions',
                description: 'Use price insights to buy smarter and save money.'
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: animate ? `${900 + index * 100}ms` : '0ms' }}
              >
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className={`bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-center transition-all duration-700 delay-1000 ${
          animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Start Tracking?
          </h2>
          <p className="text-emerald-100 mb-8 text-lg">
            Join thousands of users who make smarter purchasing decisions every day.
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-600 hover:bg-slate-50 rounded-lg font-semibold transition-all hover:shadow-lg"
          >
            Create Free Account
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                © 2024 SMPMPS. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}