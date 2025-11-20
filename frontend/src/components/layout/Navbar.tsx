import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

interface NavbarProps {
  onNavigate: (page: 'landing' | 'dashboard') => void;
  currentPage: 'landing' | 'dashboard';
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  return (
    <nav className="border-b border-slate-200 bg-white/75 backdrop-blur-lg sticky top-0 z-50 dark:border-slate-800 dark:bg-slate-950/75">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate('landing')}>
          <ShieldCheck className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-50">PlumClaims</span>
        </div>
        <div className="flex items-center space-x-4">
          {currentPage === 'landing' ? (
            <Button onClick={() => onNavigate('dashboard')}>Launch App</Button>
          ) : (
            <Button variant="ghost" onClick={() => onNavigate('landing')}>Home</Button>
          )}
        </div>
      </div>
    </nav>
  );
};
