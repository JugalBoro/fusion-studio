import React from 'react';

interface LoaderProps {
  message: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-pulse">
      <div className="relative w-20 h-20">
        <div className="absolute top-0 left-0 w-full h-full border-[3px] border-neutral-800 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-[3px] border-t-amber-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 m-auto w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div>
      </div>
      <p className="text-amber-500 font-medium text-xs tracking-[0.2em] uppercase">{message}</p>
    </div>
  );
};