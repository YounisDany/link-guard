'use client'

import { motion } from 'framer-motion'
import { Shield, Search, FileBarChart, ArrowRight, Zap, Brain, FileText, Globe, Cpu, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register') => void
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="landing-gradient min-h-screen text-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-teal-400" />
            <span className="text-xl font-bold text-white">LinkGuard</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a href="#features" className="text-sm text-slate-300 transition-colors hover:text-teal-400">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-slate-300 transition-colors hover:text-teal-400">
              How It Works
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </Button>
            <Button
              className="btn-teal-gradient border-0 text-white hover:text-white"
              onClick={() => onNavigate('register')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-4xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/20"
          >
            <Shield className="h-10 w-10 text-teal-400" />
          </motion.div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Smart System for{' '}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Real-Time Detection
            </span>
            <br />
            of Suspicious Internet Links
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">
            Protect yourself from phishing, malware, and fraudulent websites with our AI-powered URL analysis
            engine. Get instant threat assessments and detailed security reports for any link.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="btn-teal-gradient h-12 w-full border-0 px-8 text-base font-semibold text-white sm:w-auto hover:text-white"
              onClick={() => onNavigate('register')}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full border-slate-600 bg-transparent px-8 text-base font-semibold text-slate-300 hover:bg-slate-800 hover:text-white sm:w-auto"
              >
                Learn More
              </Button>
            </a>
          </div>
        </motion.div>

        {/* Decorative grid pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-6xl"
        >
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Powerful Features</h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Our system uses advanced machine learning algorithms to analyze URLs and detect potential threats
              in real-time.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'Real-Time Analysis',
                description:
                  'Instant URL scanning powered by machine learning models that analyze 17+ features to identify potential threats within milliseconds.',
                color: 'teal',
              },
              {
                icon: Brain,
                title: 'Threat Intelligence',
                description:
                  'Comprehensive threat detection engine with risk scoring, threat classification, and actionable security recommendations.',
                color: 'emerald',
              },
              {
                icon: FileText,
                title: 'Detailed Reports',
                description:
                  'Generate and export detailed security reports with feature breakdowns, confidence scores, and risk assessments for every scan.',
                color: 'cyan',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="landing-gradient-card group rounded-xl p-6 transition-all duration-300 hover:border-teal-500/30"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}-500/10`}
                >
                  <feature.icon className={`h-6 w-6 text-${feature.color}-400`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl"
        >
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
            <p className="mx-auto max-w-2xl text-slate-400">
              Three simple steps to protect yourself from online threats.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Globe,
                title: 'Enter URL',
                description: 'Paste any suspicious URL into our scanner to begin the analysis process.',
              },
              {
                step: '02',
                icon: Cpu,
                title: 'AI Analysis',
                description:
                  'Our engine extracts 17+ features and runs them through ML classification algorithms.',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Get Results',
                description:
                  'Receive a comprehensive report with risk level, threat type, confidence score, and recommendations.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative text-center"
              >
                <div className="mb-6 flex items-center justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500/10 ring-2 ring-teal-500/20">
                    <item.icon className="h-8 w-8 text-teal-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white md:right-[calc(25%-4px)] md:top-6">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 p-10 text-center"
        >
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">Start Protecting Yourself Today</h2>
          <p className="mb-8 text-teal-50">
            Join thousands of users who trust LinkGuard to keep them safe from online threats.
          </p>
          <Button
            size="lg"
            className="h-12 border-0 bg-white px-8 text-base font-semibold text-teal-700 hover:bg-teal-50"
            onClick={() => onNavigate('register')}
          >
            Create Free Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-teal-400" />
            <span className="text-sm font-semibold text-white">LinkGuard</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} LinkGuard. Smart System for Real-Time Detection of Suspicious Internet Links.
          </p>
        </div>
      </footer>
    </div>
  )
}
