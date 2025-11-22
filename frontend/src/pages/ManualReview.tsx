import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Claim {
    claim_id: string;
    status: string;
    decision?: string;
    approved_amount?: number;
    confidence_score?: number;
    created_at?: string;
}

interface ManualReviewProps {
    isActive: boolean;
}

export const ManualReview: React.FC<ManualReviewProps> = ({ isActive }) => {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isActive) {
            fetchClaims();
        }
    }, [isActive]);

    const fetchClaims = async () => {
        try {
            const response = await axios.get('http://localhost:8000/claims/?status=MANUAL_REVIEW');
            setClaims(response.data);
        } catch (error) {
            console.error("Error fetching review claims:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (claimId: string, action: 'APPROVE' | 'REJECT') => {
        try {
            const decision = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
            await axios.put(`http://localhost:8000/claims/${claimId}/decision`, {
                decision: decision,
                notes: `Manually ${decision.toLowerCase()} by admin`
            });
            
            // Optimistic update
            setClaims(claims.filter(c => c.claim_id !== claimId));
        } catch (error) {
            console.error("Error updating claim decision:", error);
            alert("Failed to update claim. Please try again.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Review Queue...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Manual Review Queue</h1>

            {claims.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500">No claims currently require manual review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {claims.map((claim) => (
                        <motion.div 
                            key={claim.claim_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono text-sm text-slate-500">#{claim.claim_id.slice(0, 8)}</span>
                                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full font-medium flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Low Confidence: {(claim.confidence_score || 0) * 100}%
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    System Decision: <span className="font-medium">{claim.decision || 'N/A'}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => handleAction(claim.claim_id, 'REJECT')}
                                    className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    Reject
                                </button>
                                <button 
                                    onClick={() => handleAction(claim.claim_id, 'APPROVE')}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm shadow-green-200 dark:shadow-none"
                                >
                                    Approve
                                </button>
                                <a 
                                    href={`/claims/${claim.claim_id}`} // Assuming we have a detail view or just use this for now
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
