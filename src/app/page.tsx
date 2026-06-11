'use client';

import { useState, useCallback } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ListingEditor from '@/components/ListingEditor';
import { AnalysisResult, ResearchResult } from '@/lib/types';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelected = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setResearch(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleResearch = useCallback(async () => {
    if (!analysis) return;

    setIsResearching(true);
    setError(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: analysis.title,
          category: analysis.category,
          brand: analysis.brand,
          model: analysis.model,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Research failed');
      }

      setResearch(data.research);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Research failed';
      setError(message);
    } finally {
      setIsResearching(false);
    }
  }, [analysis]);

  const reset = useCallback(() => {
    setAnalysis(null);
    setResearch(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#111111]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#111111]/80 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              <span className="text-[#e7f900]">GV8</span> eBay Helper
            </h1>
            <span className="text-xs text-zinc-500 hidden sm:inline">AI eBay Listing Creator</span>
          </div>
          {analysis && (
            <button
              onClick={reset}
              className="text-sm text-zinc-400 hover:text-[#e7f900] transition-colors"
            >
              + New Listing
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {!analysis ? (
          /* Upload State */
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                GV8 <span className="text-[#e7f900]">eBay Helper</span>
              </h2>
              <p className="text-zinc-400 text-lg max-w-md mx-auto">
                Upload a photo and AI will identify your item, write the listing, and suggest a price.
              </p>
            </div>
            <ImageUploader
              onImageSelected={handleImageSelected}
              isAnalyzing={isAnalyzing}
            />
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            {/* How it works */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              {[
                { emoji: '📸', title: 'Upload', desc: 'Snap a photo of your item' },
                { emoji: '🤖', title: 'AI Analysis', desc: 'AI identifies & writes listing' },
                { emoji: '📋', title: 'Copy & List', desc: 'Copy to eBay when ready' },
              ].map((step) => (
                <div key={step.title} className="text-center p-4">
                  <div className="text-3xl mb-2">{step.emoji}</div>
                  <h3 className="font-semibold text-zinc-200 text-sm">{step.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Editor State */
          <ListingEditor
            analysis={analysis}
            research={research}
            onResearch={handleResearch}
            isResearching={isResearching}
          />
        )}

        {error && analysis && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-3xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-zinc-600">
            GV8 eBay Helper v1.0 — AI-powered eBay listing creator • Direct posting coming in v1.1
          </p>
        </div>
      </footer>
    </div>
  );
}
