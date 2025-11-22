import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, ArrowRight, Activity, CheckCircle, BarChart3, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewDocs: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onViewDocs }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden font-sans">
      
      {/* Hero Section with Gradient Mesh */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary-400/20 blur-[100px] animate-float" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8 flex justify-center">
              <span className="inline-flex items-center py-1.5 px-4 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm text-slate-600 text-sm font-medium dark:bg-slate-900/80 dark:border-slate-800 dark:text-slate-300">
                <Zap className="w-4 h-4 mr-2 text-amber-500 fill-amber-500" />
                <span>New: AI-Powered Fraud Detection 2.0</span>
              </span>
            </motion.div>

            <motion.h1
              className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight dark:text-white"
              variants={itemVariants}
            >
              Claims Adjudication <br />
              <span className="text-gradient">Reimagined.</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed dark:text-slate-400"
              variants={itemVariants}
            >
              Process medical claims in seconds, not days. 
              Our autonomous engine delivers <span className="font-semibold text-slate-900 dark:text-white">99% accuracy</span> with enterprise-grade security.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4 items-center"
              variants={itemVariants}
            >
              <Button 
                size="lg" 
                onClick={onGetStarted} 
                className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all hover:-translate-y-1"
              >
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={onViewDocs}
                className="h-14 px-8 text-lg rounded-full border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
              >
                View Documentation
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating UI Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 100, rotateX: 20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.6, duration: 1, type: "spring" }}
            className="mt-20 relative max-w-5xl mx-auto perspective-1000"
          >
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-200/50 bg-white/50 backdrop-blur-xl dark:bg-slate-900/50 dark:border-slate-700/50">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent pointer-events-none z-10" />
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/50 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex-1 bg-slate-100 h-6 rounded-md max-w-sm dark:bg-slate-800" />
              </div>
              <div className="p-8 grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <div className="h-32 rounded-lg bg-slate-100 animate-pulse dark:bg-slate-800" />
                  <div className="h-16 rounded-lg bg-slate-100 animate-pulse delay-75 dark:bg-slate-800" />
                  <div className="h-16 rounded-lg bg-slate-100 animate-pulse delay-150 dark:bg-slate-800" />
                </div>
                <div className="space-y-4">
                  <div className="h-full rounded-lg bg-primary-50 border border-primary-100 p-4 dark:bg-primary-900/20 dark:border-primary-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">AI PROCESSING</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-primary-200 rounded w-3/4 dark:bg-primary-800" />
                      <div className="h-2 bg-primary-200 rounded w-1/2 dark:bg-primary-800" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-32 bg-white dark:bg-slate-900 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 dark:text-white">Built for Scale</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">
              Everything you need to automate your claims workflow, from ingestion to final decision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1: Large */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:col-span-2 p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Intelligent Extraction</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Our hybrid engine combines OCR with Large Language Models to understand complex medical documents, extracting not just text, but context, diagnosis codes, and line-item costs with unprecedented accuracy.
              </p>
            </motion.div>

            {/* Feature 2: Tall */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="md:row-span-2 p-8 rounded-3xl bg-slate-900 text-white shadow-xl overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                <ShieldCheck className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Fraud Guard</h3>
              <p className="text-slate-400 mb-8">
                Real-time analysis of every claim against thousands of fraud patterns.
              </p>
              <ul className="space-y-3">
                {['Duplicate Claims', 'Inflated Costs', 'Policy Exclusions', 'Identity Mismatch'].map((item) => (
                  <li key={item} className="flex items-center text-sm text-slate-300">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" /> {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Feature 3: Standard */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-amber-500/30">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Analytics Ready</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Gain insights into claim trends, rejection rates, and processing times instantly.
              </p>
            </motion.div>

            {/* Feature 4: Standard */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-xl transition-all dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6 text-white shadow-lg shadow-emerald-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">Enterprise Secure</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Bank-grade encryption for all data at rest and in transit. HIPAA compliant.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-t border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Accuracy Rate', value: '99.8%' },
              { label: 'Processing Time', value: '< 2s' },
              { label: 'Claims Processed', value: '1M+' },
              { label: 'Cost Savings', value: '40%' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 tracking-tight dark:text-white">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-slate-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to transform your operations?</h2>
          <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto">
            Join the fastest growing insurance companies using PlumClaims to adjudicate claims automatically.
          </p>
          <Button size="lg" onClick={onGetStarted} className="h-16 px-12 text-xl rounded-full bg-white text-slate-900 hover:bg-indigo-50">
            Get Started Now
          </Button>
        </div>
      </section>
    </div>
  );
};
