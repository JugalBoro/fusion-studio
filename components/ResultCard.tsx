import React, { useEffect, useState, useRef } from 'react';
import { GenerationResult } from '../types';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';

interface ResultCardProps {
  result: GenerationResult;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup on unmount or if result changes
  useEffect(() => {
    return () => {
      stopAndClose();
    };
  }, [result.id]);

  const stopAndClose = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = async () => {
    if (!result.audioData) return;

    if (isPlaying) {
      stopAndClose();
    } else {
      // Lazy creation: Only create AudioContext when needed to avoid 6-context limit
      const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new CtxClass();
      audioContextRef.current = ctx;

      const source = ctx.createBufferSource();
      source.buffer = result.audioData;
      source.connect(ctx.destination);
      
      source.onended = () => {
        stopAndClose();
      };

      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    }
  };

  return (
    <div className="group bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-amber-500/30 hover:shadow-amber-900/10">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Visual Side */}
        <div className="relative h-[400px] md:h-auto bg-black overflow-hidden border-b md:border-b-0 md:border-r border-neutral-800">
          {result.imageData ? (
            <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60 z-10 pointer-events-none" />
                <img 
                src={`data:image/jpeg;base64,${result.imageData}`} 
                alt={result.textData.imagePrompt} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
            </>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 gap-4">
               <div className="w-12 h-12 border-2 border-neutral-800 border-t-amber-500 rounded-full animate-spin"></div>
               <span className="text-xs uppercase tracking-widest">{result.status === 'generating_media' ? 'Rendering Visual' : 'No Visual'}</span>
             </div>
          )}
          
          {/* Badge */}
          <div className="absolute top-6 left-6 z-20">
            <span className="bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-black/20">
                {result.mode}
            </span>
          </div>
        </div>

        {/* Content Side */}
        <div className="p-8 md:p-10 flex flex-col h-full bg-neutral-900/50">
          <div className="flex-grow space-y-6">
            <h2 className="text-3xl font-bold text-white font-serif tracking-tight leading-tight group-hover:text-amber-400 transition-colors duration-300">
              {result.textData.title}
            </h2>
            <div className="w-12 h-0.5 bg-amber-500/50"></div>
            <div className="prose prose-invert prose-lg text-neutral-400 leading-relaxed font-light">
              {result.textData.body}
            </div>
          </div>

          {/* Audio Controls */}
          {result.audioData && (
            <div className="mt-10 pt-8 border-t border-neutral-800 flex items-center space-x-6">
              <button
                onClick={togglePlayback}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white hover:bg-amber-400 text-black transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95"
              >
                {isPlaying ? (
                  <PauseIcon className="w-6 h-6" />
                ) : (
                  <PlayIcon className="w-6 h-6 ml-1" />
                )}
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest">
                    <span className="text-amber-500 flex items-center gap-2">
                        <SpeakerWaveIcon className="w-4 h-4" />
                        AI Narration
                    </span>
                    <span className="text-neutral-600">
                        {isPlaying ? 'Playing' : 'Ready'}
                    </span>
                </div>
                <div className="h-1 bg-neutral-800 rounded-full w-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} 
                    style={{ width: isPlaying ? '100%' : '0%', transition: 'width 0.5s ease' }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};