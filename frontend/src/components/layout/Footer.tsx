import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
      <div className="container mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>&copy; {new Date().getFullYear()} PlumHQ. All rights reserved.</p>
        <p className="mt-2">Automated Medical Claim Adjudication Engine</p>
      </div>
    </footer>
  );
};
