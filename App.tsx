import React, { useState, useCallback } from 'react';
import { generateTextContent, generateCreativeImage, generateNarration } from './services/geminiService';
import { ContentMode, GenerationResult } from './types';
import { ResultCard } from './components/ResultCard';
import { Loader } from './components/Loader';
import { SparklesIcon, SwatchIcon, BookOpenIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ContentMode>(ContentMode.STORY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    setError(null);
    setLoadingMessage('Weaving text content...');

    // Placeholder result
    const tempId = Date.now().toString();
    
    try {
      // 1. Generate Text
      const textData = await generateTextContent(prompt, mode);
      
      setLoadingMessage('Painting pixels & Recording voice...');
      
      const newResult: GenerationResult = {
        id: tempId,
        timestamp: Date.now(),
        mode,
        textData,
        status: 'generating_media'
      };
      
      // Add partially complete result
      setResults(prev => [newResult, ...prev]);

      // 2. Parallel Generation: Image & Audio
      // We do this concurrently for speed
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const [imageData, audioData] = await Promise.all([
        generateCreativeImage(textData.imagePrompt).catch(e => {
            console.error("Image failed", e);
            return undefined;
        }),
        generateNarration(textData.body, audioCtx).catch(e => {
            console.error("Audio failed", e);
            return undefined;
        })
      ]);

      // Update result with media
      setResults(prev => prev.map(r => {
        if (r.id === tempId) {
          return {
            ...r,
            imageData,
            audioData,
            status: 'completed'
          };
        }
        return r;
      }));

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      // Remove the failed result attempt
      setResults(prev => prev.filter(r => r.id !== tempId));
    } finally {
      setIsProcessing(false);
      setLoadingMessage('');
    }
  }, [prompt, mode]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 selection:bg-amber-500/30 selection:text-amber-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6 text-amber-500" />
            <h1 className="text-xl font-bold tracking-wide uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600">
              Fusion Studio
            </h1>
          </div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-16">
        
        {/* Input Section */}
        <section className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-serif">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">Create. Visualize. Narrate.</span>
            </h2>
            <p className="text-neutral-400 text-lg">
              The premium multimodal suite for creators.
            </p>
          </div>

          <div className="bg-neutral-900/50 p-1.5 rounded-2xl flex shadow-2xl shadow-black/50 border border-neutral-800 backdrop-blur-sm">
             <button 
                onClick={() => setMode(ContentMode.STORY)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${mode === ContentMode.STORY ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-900/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
             >
               <BookOpenIcon className="w-5 h-5" /> Story
             </button>
             <button 
                onClick={() => setMode(ContentMode.MARKETING)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${mode === ContentMode.MARKETING ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-900/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
             >
               <MegaphoneIcon className="w-5 h-5" /> Marketing
             </button>
             <button 
                onClick={() => setMode(ContentMode.EDUCATION)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${mode === ContentMode.EDUCATION ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-900/20' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
             >
               <SwatchIcon className="w-5 h-5" /> Concept
             </button>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === ContentMode.STORY ? "Describe a noir detective scene in rainy Tokyo..." :
                mode === ContentMode.MARKETING ? "Luxury watch advertisement copy..." :
                "Explain the golden ratio..."
              }
              className="relative w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-xl text-neutral-200 placeholder:text-neutral-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all h-40 resize-none shadow-inner"
              disabled={isProcessing}
            />
            
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={handleGenerate}
                disabled={isProcessing || !prompt.trim()}
                className="bg-white text-black hover:bg-amber-400 hover:text-black px-8 py-3 rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-transparent"
              >
                {isProcessing ? 'Crafting...' : 'Generate'}
                {!isProcessing && <SparklesIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-950/30 border border-red-900/50 text-red-200 px-6 py-4 rounded-xl text-sm backdrop-blur">
              {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        <section className="space-y-12">
          {isProcessing && loadingMessage && (
            <Loader message={loadingMessage} />
          )}

          {results.length > 0 && (
             <div className="grid gap-12">
               {results.map((result) => (
                 <ResultCard key={result.id} result={result} />
               ))}
             </div>
          )}

          {!isProcessing && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/20">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-6 border border-neutral-800">
                <SparklesIcon className="w-8 h-8 text-neutral-600" />
              </div>
              <p className="text-neutral-500 font-medium tracking-wide">Ready to create excellence</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default App;