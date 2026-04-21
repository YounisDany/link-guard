'use client'

import { motion } from 'framer-motion'
import { BarChart3, PieChart, Table as TableIcon, Database, Layers, Activity } from 'lucide-react'

export function EvaluationSection() {
  return (
    <section id="evaluation" className="px-4 py-24 sm:px-6 lg:px-8 bg-slate-900/50">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl"
      >
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Model Evaluation & Results</h2>
          <p className="mx-auto max-w-2xl text-slate-400">
            Our system is rigorously tested against industry-standard datasets to ensure the highest detection accuracy and reliability.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Dataset Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="landing-gradient-card rounded-xl p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <Database className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-semibold text-white">Dataset Overview</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <span className="text-slate-400">Total Samples</span>
                <span className="font-mono text-teal-400">11,430 URLs</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <span className="text-slate-400">Benign URLs</span>
                <span className="font-mono text-emerald-400">5,715</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <span className="text-slate-400">Phishing URLs</span>
                <span className="font-mono text-red-400">5,715</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Features Extracted</span>
                <span className="font-mono text-teal-400">17+ Primary Features</span>
              </div>
              
              <div className="mt-8">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">Training/Testing Split</h4>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="absolute h-full w-[80%] bg-teal-500" />
                  <div className="absolute left-[80%] h-full w-[20%] bg-emerald-600" />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-teal-400">Training (80%)</span>
                  <span className="text-emerald-400">Testing (20%)</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Model Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="landing-gradient-card rounded-xl p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-semibold text-white">Model Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="pb-4 font-medium">Model</th>
                    <th className="pb-4 font-medium">Accuracy</th>
                    <th className="pb-4 font-medium">F1-Score</th>
                    <th className="pb-4 font-medium">Recall</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-800/50">
                    <td className="py-4 font-medium text-white">Random Forest</td>
                    <td className="py-4">97.2%</td>
                    <td className="py-4">97.1%</td>
                    <td className="py-4">97.5%</td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="py-4 font-medium text-white">SVM</td>
                    <td className="py-4">94.5%</td>
                    <td className="py-4">94.1%</td>
                    <td className="py-4">95.1%</td>
                  </tr>
                  <tr className="border-b border-slate-800/50">
                    <td className="py-4 font-medium text-white">Decision Tree</td>
                    <td className="py-4">92.8%</td>
                    <td className="py-4">92.4%</td>
                    <td className="py-4">93.4%</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-teal-400">LinkGuard (Hybrid)</td>
                    <td className="py-4 text-teal-400">91.5%</td>
                    <td className="py-4 text-teal-400">91.3%</td>
                    <td className="py-4 text-teal-400">88.6%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-xs text-slate-500 italic">
              * LinkGuard utilizes a hybrid heuristic-ML approach optimized for real-time performance and low false-positive rates.
            </p>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Activity,
              title: '91.5% Accuracy',
              desc: 'Overall detection rate across balanced test sets.'
            },
            {
              icon: Layers,
              title: '17+ Features',
              desc: 'Deep URL analysis including entropy, structure, and content.'
            },
            {
              icon: PieChart,
              title: 'Low Latency',
              desc: 'Average analysis time under 150ms per URL.'
            }
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 rounded-lg bg-slate-800/30 p-6 border border-slate-700/50">
              <div className="rounded-full bg-teal-500/10 p-2">
                <item.icon className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
