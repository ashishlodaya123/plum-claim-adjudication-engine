import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Activity, Database, Server, Cpu } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface DocumentationProps {
    onBack: () => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <Button variant="ghost" onClick={onBack} className="mb-8 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-12"
                >
                    <header className="border-b border-slate-200 dark:border-slate-800 pb-8">
                        <h1 className="text-4xl font-bold mb-4">System Documentation</h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400">
                            Technical overview of the Plum Claim Adjudication Engine.
                        </p>
                    </header>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Cpu className="w-6 h-6 text-primary-500" />
                            Architecture Overview
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            The system is built on a modern microservices-inspired architecture, designed for scalability and reliability.
                            It leverages a hybrid AI approach, combining traditional OCR with Large Language Models (LLMs) for superior data extraction.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Server className="w-4 h-4 text-blue-500" /> Backend
                                </h3>
                                <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-1">
                                    <li>FastAPI (Python) for high-performance REST APIs</li>
                                    <li>Celery & Redis for asynchronous task processing</li>
                                    <li>PostgreSQL for structured data persistence</li>
                                    <li>MinIO for secure object storage (documents)</li>
                                </ul>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-green-500" /> AI Engine
                                </h3>
                                <ul className="list-disc list-inside text-sm text-slate-500 dark:text-slate-400 space-y-1">
                                    <li>EasyOCR for raw text extraction</li>
                                    <li>Llama-3.3-70b (via Groq) for semantic understanding</li>
                                    <li>Rule-based Adjudication Engine for policy enforcement</li>
                                    <li>Dynamic Confidence Scoring</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-indigo-500" />
                            Adjudication Logic
                        </h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p>
                                The core adjudication process follows a strict pipeline to ensure accuracy and compliance:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 mt-4 text-slate-600 dark:text-slate-300">
                                <li><strong>Validation:</strong> Checks for minimum claim amount and essential fields.</li>
                                <li><strong>Coverage Verification:</strong> Validates if the treatment is covered under the specific policy terms.</li>
                                <li><strong>Limit Checks:</strong> Enforces sub-limits for specific categories (e.g., Pharmacy, Dental).</li>
                                <li><strong>Exclusion Filtering:</strong> Scans for excluded keywords (e.g., "Cosmetic").</li>
                                <li><strong>Fraud Detection:</strong> Heuristic checks for high-value claims or suspicious patterns.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <Database className="w-6 h-6 text-amber-500" />
                            Data Models
                        </h2>
                        <div className="bg-slate-900 text-slate-50 p-6 rounded-xl overflow-x-auto font-mono text-sm">
                            <pre>{`
// Claim Entity
{
  "id": "uuid",
  "status": "PROCESSING | APPROVED | REJECTED | NEEDS_REVIEW",
  "created_at": "timestamp",
  "decision": {
    "approved_amount": float,
    "confidence_score": float,
    "rejection_reasons": string[],
    "notes": string
  }
}
                            `}</pre>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
};
