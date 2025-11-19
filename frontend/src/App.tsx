import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!files) {
      alert('Please select files to upload.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await axios.post('/claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setClaimId(response.data.claim_id);
      setJobId(response.data.job_id);
      setStatus('Claim submitted. Processing...');
    } catch (error) {
      console.error('Error uploading files:', error);
      setStatus('Error uploading files.');
    }
  };

  const checkStatus = async () => {
    if (claimId) {
      try {
        const response = await axios.get(`/claims/${claimId}`);
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching claim status:', error);
        setStatus('Error fetching claim status.');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PlumHQ Automated Claims Adjudication</h1>
        <form onSubmit={handleSubmit}>
          <input type="file" multiple onChange={handleFileChange} />
          <button type="submit">Upload Claim</button>
        </form>
        {claimId && (
          <div>
            <p>Claim ID: {claimId}</p>
            <p>Job ID: {jobId}</p>
            <p>Status: {status}</p>
            <button onClick={checkStatus}>Check Status</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
