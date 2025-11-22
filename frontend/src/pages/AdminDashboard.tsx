import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, FileText, Settings, Activity, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

interface PolicyTerms {
    claim_requirements: {
        minimum_claim_amount: number;
    };
    coverage_details: Record<string, any>;
    exclusions: string[];
}

interface AdminDashboardProps {
    isActive: boolean;
}

interface MetricPoint {
    time: string;
    requests: number;
    latency: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isActive }) => {
    const [stats, setStats] = useState({
        total: 0,
        approved: 0,
        rejected: 0,
        needsReview: 0,
        avgConfidence: 0
    });
    const [policyTerms, setPolicyTerms] = useState<PolicyTerms | null>(null);
    const [loading, setLoading] = useState(true);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editedPolicy, setEditedPolicy] = useState('');

    // Metrics State
    const [activeTab, setActiveTab] = useState<'overview' | 'metrics'>('overview');
    const [metricsHistory, setMetricsHistory] = useState<MetricPoint[]>([]);
    const [currentMetrics, setCurrentMetrics] = useState<any>(null);
    const [statusData, setStatusData] = useState<any[]>([]);
    const [endpointData, setEndpointData] = useState<any[]>([]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple hardcoded check for demo purposes
        // In production, this would verify a token or call an auth endpoint
        if (username === 'admin' && password === 'admin123') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid credentials');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch claims to calculate stats
                // In a real app, we'd have a dedicated stats endpoint
                const response = await axios.get('http://localhost:8000/claims/');
                const claims = response.data;
                
                const total = claims.length;
                const approved = claims.filter((c: any) => c.status === 'APPROVED').length;
                const rejected = claims.filter((c: any) => c.status === 'REJECTED').length;
                const needsReview = claims.filter((c: any) => c.status === 'NEEDS_REVIEW' || c.status === 'MANUAL_REVIEW').length;
                
                const confidenceSum = claims.reduce((sum: number, c: any) => sum + (c.confidence_score || 0), 0);
                const avgConfidence = total > 0 ? confidenceSum / total : 0;

                setStats({ total, approved, rejected, needsReview, avgConfidence });

                // Fetch policy terms
                const policyResponse = await axios.get('http://localhost:8000/claims/policy-terms');
                setPolicyTerms(policyResponse.data);
                setEditedPolicy(JSON.stringify(policyResponse.data, null, 2));

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isActive && isAuthenticated) {
            fetchData();
        }
    }, [isActive, isAuthenticated]);

    // Poll for metrics
    useEffect(() => {
        if (!isActive || !isAuthenticated) return;

        const fetchMetrics = async () => {
            try {
                const response = await axios.get('http://localhost:8000/admin/metrics');
                const data = response.data;
                setCurrentMetrics(data);

                // Update History
                setMetricsHistory(prev => {
                    const newPoint = {
                        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        requests: data.total_requests,
                        latency: data.average_latency * 1000 // Convert to ms
                    };
                    const newHistory = [...prev, newPoint];
                    if (newHistory.length > 20) newHistory.shift();
                    return newHistory;
                });

                // Update Status Distribution
                const sData = Object.entries(data.status_distribution || {}).map(([name, value]) => ({ name, value }));
                setStatusData(sData);

                // Update Endpoint Usage
                const eData = Object.entries(data.endpoint_usage || {}).map(([name, value]) => ({ name, value }));
                setEndpointData(eData);

            } catch (error) {
                console.error("Error fetching metrics:", error);
            }
        };

        const interval = setInterval(fetchMetrics, 2000); // Poll every 2 seconds
        fetchMetrics(); // Initial fetch

        return () => clearInterval(interval);
    }, [isActive, isAuthenticated]);

    const handleSavePolicy = async () => {
        try {
            const parsedPolicy = JSON.parse(editedPolicy);
            await axios.post('http://localhost:8000/claims/policy-terms', parsedPolicy);
            setPolicyTerms(parsedPolicy);
            setIsEditing(false);
            alert('Policy updated successfully!');
        } catch (error) {
            console.error("Error updating policy:", error);
            alert('Failed to update policy. Please check JSON format.');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-[60vh]">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Access</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Please verify your identity to continue.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Enter password"
                            />
                        </div>
                        
                        {authError && (
                            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                {authError}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-primary-500/30"
                        >
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center">Loading Dashboard...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('metrics')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'metrics' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            System Metrics
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsAuthenticated(false)}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <StatCard 
                            title="Total Claims" 
                            value={stats.total} 
                            icon={<FileText className="w-6 h-6 text-blue-500" />} 
                        />
                        <StatCard 
                            title="Approval Rate" 
                            value={`${stats.total ? Math.round((stats.approved / stats.total) * 100) : 0}%`} 
                            icon={<ShieldCheck className="w-6 h-6 text-green-500" />} 
                        />
                        <StatCard 
                            title="Needs Review" 
                            value={stats.needsReview} 
                            icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />} 
                        />
                        <StatCard 
                            title="Avg Confidence" 
                            value={(stats.avgConfidence * 100).toFixed(1) + '%'} 
                            icon={<Activity className="w-6 h-6 text-purple-500" />} 
                        />
                    </div>

                    {/* Policy Configuration Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Policy Configuration
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-500">
                                    {isEditing ? 'Editing Mode' : 'Read-only View'}
                                </span>
                                {!isEditing ? (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                                    >
                                        Edit Policy
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSavePolicy}
                                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900/50 text-sm text-yellow-800 dark:text-yellow-200 mb-4">
                                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                                    Warning: Modifying policy terms will affect all future claim adjudications immediately. Please ensure JSON is valid.
                                </div>
                                <textarea
                                    value={editedPolicy}
                                    onChange={(e) => setEditedPolicy(e.target.value)}
                                    className="w-full h-[500px] font-mono text-sm p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Claim Requirements</h3>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                        <pre className="text-sm font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                                            {JSON.stringify(policyTerms?.claim_requirements, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Exclusions</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {policyTerms?.exclusions.map((ex, i) => (
                                            <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm">
                                                {ex}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                     <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Full Policy JSON</h3>
                                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                                        <pre className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                            {JSON.stringify(policyTerms, null, 2)}
                                        </pre>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Total Requests" 
                            value={currentMetrics?.total_requests || 0} 
                            icon={<Activity className="w-6 h-6 text-blue-500" />} 
                        />
                        <StatCard 
                            title="Avg Latency" 
                            value={`${(currentMetrics?.average_latency * 1000 || 0).toFixed(1)} ms`} 
                            icon={<BarChart2 className="w-6 h-6 text-green-500" />} 
                        />
                        <StatCard 
                            title="Active Requests" 
                            value={currentMetrics?.active_requests || 0} 
                            icon={<Activity className="w-6 h-6 text-purple-500" />} 
                        />
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Request Volume (Live)</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metricsHistory}>
                                        <defs>
                                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">API Latency (ms)</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metricsHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row 2 */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Top Endpoints</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={endpointData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                        <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis dataKey="name" type="category" width={150} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"
    >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h3>
            {icon}
        </div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </motion.div>
);
