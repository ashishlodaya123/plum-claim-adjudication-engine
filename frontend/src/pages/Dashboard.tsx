import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, Loader2, RefreshCw, CheckCircle2, XCircle, FileType, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOcrRequired, setIsOcrRequired] = useState(true);

  // Determine if OCR is needed based on file type
  useEffect(() => {
    if (files && files.length > 0) {
      const file = files[0];
      // If it's a text file, we skip the heavy OCR visualization step
      if (file.name.toLowerCase().endsWith('.txt')) {
        setIsOcrRequired(false);
      } else {
        setIsOcrRequired(true);
      }
    }
  }, [files]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(event.target.files);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(e.dataTransfer.files);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!files) {
      setError('Please select files to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatus('Uploading...');
    setClaimData(null);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/claims/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setClaimId(response.data.claim_id);
      setStatus('Processing');
      // Start polling
      pollStatus(response.data.claim_id);
    } catch (err) {
      clearInterval(progressInterval);
      console.error('Error uploading files:', err);
      setError('Failed to upload files. Please try again.');
      setIsLoading(false);
      setStatus(null);
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/claims/${id}`);
        const currentStatus = response.data.status;
        setStatus(currentStatus);

        const terminalStatuses = ['APPROVED', 'REJECTED', 'MANUAL_REVIEW', 'FAILED'];

        if (terminalStatuses.includes(currentStatus)) {
          clearInterval(interval);
          setIsLoading(false);
          if (currentStatus !== 'FAILED') {
             setClaimData(response.data);
          } else {
             setError('Claim processing failed.');
          }
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    }, 2000);
  };

  const resetUpload = () => {
    setFiles(null);
    setClaimId(null);
    setStatus(null);
    setClaimData(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Dynamic Steps based on file type
  const steps = [
    { id: 'upload', label: 'Upload', status: uploadProgress === 100 ? 'completed' : uploadProgress > 0 ? 'current' : 'pending' },
    ...(isOcrRequired ? [{ id: 'ocr', label: 'OCR & Extraction', status: status === 'Processing' && !claimData ? 'current' : claimData ? 'completed' : 'pending' }] : []),
    { id: 'adjudication', label: 'Adjudication', status: claimData ? 'completed' : status === 'Processing' ? 'pending' : 'pending' },
    { id: 'decision', label: 'Final Decision', status: claimData ? 'completed' : 'pending' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Claims Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
              Intelligent adjudication engine powered by AI.
            </p>
          </div>
          <div className="hidden md:block">
             <Badge variant="outline" className="px-4 py-1 text-sm">
                System Status: <span className="text-green-500 ml-2">● Online</span>
             </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT PANEL: UPLOAD ZONE */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary-500" />
                  New Claim
                </CardTitle>
                <CardDescription>
                  Upload medical bills or reports to begin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "relative group border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out",
                    files 
                      ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10" 
                      : "border-slate-300 hover:border-primary-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />

                  {files ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mb-4">
                        <FileType className="h-8 w-8 text-primary-600" />
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                        {files[0].name}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {(files[0].size / 1024).toFixed(1)} KB • {files.length} file(s)
                      </p>
                    </motion.div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-lg">
                        Drag & drop your files
                      </p>
                      <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                        Supports PDF, JPG, PNG and Text files.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                  >
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <Button
                  className="w-full mt-6 h-12 text-lg shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all"
                  onClick={handleSubmit}
                  disabled={!files || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Claim...
                    </>
                  ) : (
                    <>
                      Submit for Adjudication
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Step Tracker */}
            <AnimatePresence>
              {(isLoading || claimData) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border-0 bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {steps.map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 z-10",
                                step.status === 'completed' ? "bg-green-500 border-green-500 text-white" :
                                step.status === 'current' ? "bg-white border-primary-500 text-primary-500 dark:bg-slate-800" :
                                "bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                              )}>
                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                                 step.status === 'current' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                 <span className="text-xs font-bold">{idx + 1}</span>}
                              </div>
                              {idx !== steps.length - 1 && (
                                <div className={cn(
                                  "w-0.5 h-8 absolute top-8 transition-colors duration-300",
                                  step.status === 'completed' ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                                )} />
                              )}
                            </div>
                            <div className="pb-6">
                              <p className={cn(
                                "font-medium text-sm transition-colors",
                                step.status === 'completed' ? "text-green-600 dark:text-green-400" :
                                step.status === 'current' ? "text-primary-600 dark:text-primary-400" :
                                "text-slate-500"
                              )}>
                                {step.label}
                              </p>
                              {step.status === 'current' && (
                                <p className="text-xs text-slate-400 animate-pulse">Processing...</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT PANEL: RESULTS FEED */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!claimData ? (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20"
                >
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Waiting for Claims</h3>
                  <p className="text-slate-500 text-center max-w-sm">
                    Upload a document on the left to see the AI adjudication engine in action.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  <Card className="border-0 shadow-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800">
                    {/* Receipt Header */}
                    <div className={cn(
                      "p-6 text-white flex justify-between items-center",
                      claimData.decision === 'APPROVED' ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                      claimData.decision === 'REJECTED' ? "bg-gradient-to-r from-red-500 to-rose-600" :
                      "bg-gradient-to-r from-amber-500 to-orange-600"
                    )}>
                      <div>
                        <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Adjudication Decision</p>
                        <h2 className="text-3xl font-bold mt-1">{claimData.decision}</h2>
                      </div>
                      <div className="bg-white/20 backdrop-blur-md p-3 rounded-xl">
                        {claimData.decision === 'APPROVED' ? <CheckCircle2 className="w-8 h-8 text-white" /> :
                         claimData.decision === 'REJECTED' ? <XCircle className="w-8 h-8 text-white" /> :
                         <AlertCircle className="w-8 h-8 text-white" />}
                      </div>
                    </div>

                    <CardContent className="p-0">
                      {/* Receipt Body */}
                      <div className="p-8 space-y-8">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">Total Approved</p>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">
                              ₹{claimData.approved_amount?.toLocaleString() || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500 mb-1">AI Confidence</p>
                            <div className="inline-flex items-center gap-2">
                              <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary-500" 
                                  style={{ width: `${(claimData.confidence_score || 0) * 100}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {((claimData.confidence_score || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Patient</p>
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-lg">
                              {claimData.patient_name?.value || claimData.patient_name || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Provider</p>
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-lg">
                              {claimData.hospital_name?.value || claimData.hospital_name || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Claim ID</p>
                            <p className="font-mono text-slate-600 dark:text-slate-400 text-sm">
                              {claimId}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">Date</p>
                            <p className="text-slate-600 dark:text-slate-400">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Rejection Reasons */}
                        {claimData.rejection_reasons && claimData.rejection_reasons.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/20">
                            <h4 className="text-red-800 dark:text-red-300 font-semibold mb-3 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Analysis Findings
                            </h4>
                            <ul className="space-y-2">
                              {claimData.rejection_reasons.map((reason: string, idx: number) => (
                                <li key={idx} className="text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Notes */}
                        {claimData.notes && (
                           <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-400 italic">
                              " {claimData.notes} "
                           </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-slate-50 dark:bg-slate-800/30 p-6 border-t border-slate-100 dark:border-slate-800">
                      <Button 
                        variant="outline" 
                        onClick={resetUpload} 
                        className="w-full h-12 text-slate-600 hover:text-primary-600 hover:border-primary-200 dark:text-slate-300 dark:hover:text-primary-400"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Process Another Claim
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
