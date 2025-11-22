import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManualReview } from './pages/ManualReview';
import { Documentation } from './pages/Documentation';

export type Page = 'landing' | 'dashboard' | 'admin' | 'manual_review' | 'documentation';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') setCurrentPage('admin');
    else if (path === '/review') setCurrentPage('manual_review');
    else if (path === '/dashboard') setCurrentPage('dashboard');
    else if (path === '/docs') setCurrentPage('documentation');
    else setCurrentPage('landing');

    const handlePopState = () => {
        const path = window.location.pathname;
        if (path === '/admin') setCurrentPage('admin');
        else if (path === '/review') setCurrentPage('manual_review');
        else if (path === '/dashboard') setCurrentPage('dashboard');
        else if (path === '/docs') setCurrentPage('documentation');
        else setCurrentPage('landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    let path = '/';
    if (page === 'dashboard') path = '/dashboard';
    if (page === 'admin') path = '/admin';
    if (page === 'manual_review') path = '/review';
    if (page === 'documentation') path = '/docs';
    
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 flex flex-col">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
      
      <main className="flex-grow">
        <div className={currentPage === 'landing' ? 'block' : 'hidden'}>
            <LandingPage 
                onGetStarted={() => handleNavigate('dashboard')} 
                onViewDocs={() => handleNavigate('documentation')}
            />
        </div>
        <div className={currentPage === 'dashboard' ? 'block' : 'hidden'}>
            <Dashboard />
        </div>
        <div className={currentPage === 'admin' ? 'block' : 'hidden'}>
            <AdminDashboard isActive={currentPage === 'admin'} />
        </div>
        <div className={currentPage === 'manual_review' ? 'block' : 'hidden'}>
            <ManualReview isActive={currentPage === 'manual_review'} />
        </div>
        <div className={currentPage === 'documentation' ? 'block' : 'hidden'}>
            <Documentation onBack={() => handleNavigate('landing')} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;