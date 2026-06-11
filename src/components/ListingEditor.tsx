'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnalysisResult, ResearchResult } from '@/lib/types';

interface ListingEditorProps {
  analysis: AnalysisResult;
  research: ResearchResult | null;
  onResearch: () => void;
  isResearching: boolean;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      className="h-7 px-2 text-xs text-zinc-400 hover:text-yellow-400 hover:bg-zinc-800"
      title={`Copy ${label}`}
    >
      {copied ? '✓ Copied' : '📋'}
    </Button>
  );
}

function CopyableField({ label, value, multiline, onChange }: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-400">{label}</label>
        <CopyButton text={value} label={label} />
      </div>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-zinc-200 min-h-[120px] font-mono text-sm resize-y"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="bg-zinc-800 border-zinc-700 text-zinc-200"
        />
      )}
    </div>
  );
}

export default function ListingEditor({ analysis, research, onResearch, isResearching }: ListingEditorProps) {
  const [title, setTitle] = useState(analysis.title);
  const [description, setDescription] = useState(analysis.description);
  const [condition, setCondition] = useState(analysis.condition);
  const [price, setPrice] = useState(analysis.estimatedPrice.recommended.toString());
  const [format, setFormat] = useState(analysis.listingFormat);

  const copyAll = useCallback(async () => {
    const all = [
      `Title: ${title}`,
      `Price: $${price}`,
      `Condition: ${condition}`,
      `Format: ${format === 'AUCTION' ? 'Auction' : 'Fixed Price'}`,
      `Category: ${analysis.category}`,
      analysis.brand ? `Brand: ${analysis.brand}` : '',
      analysis.model ? `Model: ${analysis.model}` : '',
      '',
      `Description:`,
      description.replace(/<[^>]*>/g, ''), // Strip HTML for plain text copy
      '',
      `Key Features:`,
      ...analysis.keyFeatures.map(f => `• ${f}`),
      '',
      `Item Specifics:`,
      ...Object.entries(analysis.itemSpecifics).map(([k, v]) => `${k}: ${v}`),
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(all);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = all;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }, [title, price, condition, format, analysis, description]);

  const currentPrice = parseFloat(price) || 0;
  const priceDiff = research && research.medianPrice > 0
    ? ((currentPrice - research.medianPrice) / research.medianPrice * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Listing Details</h2>
          <p className="text-zinc-400 text-sm mt-1">All fields are editable and copyable</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={copyAll}
            variant="outline"
            className="border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10"
          >
            📋 Copy All
          </Button>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className={`${
            analysis.confidence > 0.8
              ? 'border-green-500 text-green-400'
              : analysis.confidence > 0.5
              ? 'border-yellow-500 text-yellow-400'
              : 'border-red-500 text-red-400'
          }`}
        >
          {Math.round(analysis.confidence * 100)}% confident
        </Badge>
        <Badge variant="outline" className="border-zinc-600 text-zinc-300">
          {analysis.category}
        </Badge>
        {analysis.brand && (
          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
            {analysis.brand}
          </Badge>
        )}
      </div>

      {/* Title */}
      <CopyableField label={`Title (${title.length}/80)`} value={title} onChange={setTitle} />

      {/* Price + Format Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Price ($)</label>
            <div className="flex items-center gap-1">
              <CopyButton text={`$${price}`} label="price" />
              {priceDiff && (
                <span className={`text-xs ${parseFloat(priceDiff) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {parseFloat(priceDiff) > 0 ? '↑' : '↓'}{Math.abs(parseFloat(priceDiff))}% vs sold
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 text-lg font-semibold"
            />
            <Button
              onClick={onResearch}
              disabled={isResearching}
              className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold whitespace-nowrap shrink-0"
            >
              {isResearching ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Researching...
                </span>
              ) : (
                <span>🔍 Research</span>
              )}
            </Button>
          </div>
          {analysis.estimatedPrice.min > 0 && (
            <p className="text-xs text-zinc-500">
              AI estimate: ${analysis.estimatedPrice.min} – ${analysis.estimatedPrice.max}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">Listing Format</label>
          <div className="flex gap-2">
            <Button
              variant={format === 'FIXED_PRICE' ? 'default' : 'outline'}
              className={`flex-1 ${format === 'FIXED_PRICE' ? 'bg-yellow-400 text-black' : 'border-zinc-600 text-zinc-300'}`}
              onClick={() => setFormat('FIXED_PRICE')}
            >
              Buy It Now
            </Button>
            <Button
              variant={format === 'AUCTION' ? 'default' : 'outline'}
              className={`flex-1 ${format === 'AUCTION' ? 'bg-yellow-400 text-black' : 'border-zinc-600 text-zinc-300'}`}
              onClick={() => setFormat('AUCTION')}
            >
              Auction
            </Button>
          </div>
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-400">Condition</label>
          <CopyButton text={condition} label="condition" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['New', 'New Other', 'Refurbished', 'Used', 'For Parts'].map((c) => (
            <Button
              key={c}
              variant="outline"
              size="sm"
              className={condition === c ? 'bg-yellow-400 text-black border-yellow-400' : 'border-zinc-600 text-zinc-300'}
              onClick={() => setCondition(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Description */}
      <CopyableField label="Description" value={description} onChange={setDescription} multiline />

      <Separator className="bg-zinc-800" />

      {/* Key Features */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-400">Key Features</label>
          <CopyButton
            text={analysis.keyFeatures.join('\n')}
            label="features"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.keyFeatures.map((feature, i) => (
            <Badge key={i} variant="outline" className="border-zinc-600 text-zinc-300 py-1 px-3">
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* Item Specifics */}
      {Object.keys(analysis.itemSpecifics).length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Item Specifics</label>
            <CopyButton
              text={Object.entries(analysis.itemSpecifics).map(([k, v]) => `${k}: ${v}`).join('\n')}
              label="specifics"
            />
          </div>
          <Card className="bg-zinc-800/50 border-zinc-700 p-3">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(analysis.itemSpecifics).map(([key, value]) => (
                value ? (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{key}</span>
                    <span className="text-zinc-300 font-medium">{value}</span>
                  </div>
                ) : null
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Price Research Results */}
      {research && (
        <>
          <Separator className="bg-zinc-800" />
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-zinc-200">📊 Price Research Results</h3>
            <div className="grid grid-cols-4 gap-3">
              <Card className="bg-zinc-800/50 border-zinc-700 p-3 text-center">
                <p className="text-xs text-zinc-500">Average</p>
                <p className="text-lg font-bold text-zinc-200">${research.averagePrice.toFixed(2)}</p>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700 p-3 text-center">
                <p className="text-xs text-zinc-500">Median</p>
                <p className="text-lg font-bold text-yellow-400">${research.medianPrice.toFixed(2)}</p>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700 p-3 text-center">
                <p className="text-xs text-zinc-500">Range</p>
                <p className="text-lg font-bold text-zinc-200">${research.minPrice}–${research.maxPrice}</p>
              </Card>
              <Card className="bg-zinc-800/50 border-zinc-700 p-3 text-center">
                <p className="text-xs text-zinc-500">Sold</p>
                <p className="text-lg font-bold text-zinc-200">{research.totalSold}</p>
              </Card>
            </div>

            {research.comparableItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-400">Comparable Items</label>
                  <CopyButton
                    text={research.comparableItems.map(i => `${i.title} — $${i.price}`).join('\n')}
                    label="comparables"
                  />
                </div>
                <Card className="bg-zinc-800/50 border-zinc-700 p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {research.comparableItems.slice(0, 15).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm border-b border-zinc-800 pb-1">
                        <span className="text-zinc-400 truncate mr-4">{item.title}</span>
                        <span className="text-yellow-400 font-medium shrink-0">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {research.recommendedPrice > 0 && (
              <div className="flex items-center gap-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3">
                <span className="text-yellow-400 font-medium">💡 Recommended price: ${research.recommendedPrice.toFixed(2)}</span>
                <Button
                  size="sm"
                  className="bg-yellow-400 text-black hover:bg-yellow-300 text-xs"
                  onClick={() => setPrice(research.recommendedPrice.toFixed(2))}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
