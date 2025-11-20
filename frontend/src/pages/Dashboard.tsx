import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const Dashboard: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimData, setClaimData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setClaimId(response.data.claim_id);
      setJobId(response.data.job_id);
      setStatus('Processing');
      // Start polling
      pollStatus(response.data.claim_id);
    } catch (err) {
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
    setJobId(null);
    setStatus(null);
    setClaimData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Claim Adjudication Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Upload medical documents to get an instant decision.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>Supported formats: PDF, JPG, PNG</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    files ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-slate-300 hover:border-primary-400 dark:border-slate-700",
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
                  {files ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-primary-600 mb-2" />
                      <p className="font-medium text-slate-900 dark:text-slate-50">{files.length} file(s) selected</p>
                      <p className="text-xs text-slate-500 mt-1">Click to change</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-slate-400 mb-2" />
                      <p className="font-medium text-slate-900 dark:text-slate-50">Drag & drop or click</p>
                      <p className="text-xs text-slate-500 mt-1">to upload documents</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-center dark:bg-red-900/30 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                )}

                <Button
                  className="w-full mt-6"
                  onClick={handleSubmit}
                  disabled={!files || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {!status && !claimData ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-lg dark:border-slate-800"
                >
                  <div className="text-center text-slate-400">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Upload documents to see results here</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="mb-6">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">Claim Status</CardTitle>
                          <CardDescription>ID: {claimId}</CardDescription>
                        </div>
                        <Badge variant={
                          status === 'APPROVED' ? 'success' :
                          status === 'REJECTED' || status === 'FAILED' ? 'destructive' :
                          status === 'MANUAL_REVIEW' ? 'warning' :
                          'secondary'
                        }>
                          {status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress Steps */}
                        <div className="relative pt-4">
                          <div className="flex justify-between mb-2">
                            <span className={cn("text-xs font-medium", status ? "text-primary-600" : "text-slate-400")}>Uploaded</span>
                            <span className={cn("text-xs font-medium", status !== 'Uploading...' ? "text-primary-600" : "text-slate-400")}>Processing</span>
                            <span className={cn("text-xs font-medium", ['APPROVED', 'REJECTED', 'MANUAL_REVIEW'].includes(status || '') ? "text-primary-600" : "text-slate-400")}>Decision</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                            <div
                              className="h-full bg-primary-600 transition-all duration-500 ease-out"
                              style={{
                                width: ['APPROVED', 'REJECTED', 'MANUAL_REVIEW'].includes(status || '') ? '100%' :
                                       status === 'Processing' ? '66%' :
                                       status === 'Uploading...' ? '33%' : '0%'
                              }}
                            />
                          </div>
                        </div>

                        {claimData && claimData.decision && (
                          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-50">Adjudication Decision</h4>
                              <Badge variant={
                                claimData.decision === 'APPROVED' ? 'success' :
                                claimData.decision === 'REJECTED' ? 'destructive' :
                                'warning'
                              } className="text-sm px-3 py-1">
                                {claimData.decision}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {claimData.patient_name && (
                                <div>
                                  <p className="text-slate-500">Patient Name</p>
                                  <p className="font-medium text-slate-900 dark:text-slate-50">{claimData.patient_name.value || claimData.patient_name}</p>
                                </div>
                              )}
                              {claimData.hospital_name && (
                                <div>
                                  <p className="text-slate-500">Hospital Name</p>
                                  <p className="font-medium text-slate-900 dark:text-slate-50">{claimData.hospital_name.value || claimData.hospital_name}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500">Approved Amount</p>
                                <p className="font-medium text-lg text-slate-900 dark:text-slate-50">
                                  ${claimData.approved_amount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">Confidence Score</p>
                                <p className="font-medium text-lg text-slate-900 dark:text-slate-50">
                                  {(claimData.confidence_score * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>

                            {claimData.rejection_reasons && claimData.rejection_reasons.length > 0 && (
                              <div className="mt-4">
                                <p className="text-slate-500 mb-2">Rejection Reasons</p>
                                <ul className="list-disc list-inside text-red-600 dark:text-red-400">
                                  {claimData.rejection_reasons.map((reason: string, idx: number) => (
                                    <li key={idx}>{reason}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {['APPROVED', 'REJECTED', 'MANUAL_REVIEW', 'FAILED'].includes(status || '') && (
                      <CardFooter>
                        <Button variant="outline" onClick={resetUpload} className="w-full">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Process Another Claim
                        </Button>
                      </CardFooter>
                    )}
                  </Card>

                  {/* Detailed JSON View (Optional/Advanced) */}
                  {claimData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Raw Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto text-xs">
                          {JSON.stringify(claimData, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
