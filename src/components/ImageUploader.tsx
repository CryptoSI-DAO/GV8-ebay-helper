'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  isAnalyzing: boolean;
}

export default function ImageUploader({ onImageSelected, isAnalyzing }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleCamera = useCallback(() => {
    fileInputRef.current?.setAttribute('capture', 'environment');
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.removeAttribute('capture');
    }
  }, []);

  if (preview) {
    return (
      <Card className="relative overflow-hidden border-2 border-zinc-700 bg-zinc-900">
        <div className="aspect-video w-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Uploaded item" className="w-full h-full object-contain" />
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-yellow-400 font-medium">Analyzing your item...</p>
                <p className="text-zinc-400 text-sm mt-1">AI is identifying the product</p>
              </div>
            </div>
          )}
        </div>
        {!isAnalyzing && (
          <div className="p-3 flex gap-2">
            <Button variant="outline" onClick={reset} className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800">
              📷 New Photo
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card
      className={`border-2 border-dashed transition-all cursor-pointer ${
        dragActive
          ? 'border-yellow-400 bg-yellow-400/5'
          : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="aspect-video flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">📸</div>
        <h3 className="text-xl font-semibold text-zinc-200 mb-2">
          Upload an item photo
        </h3>
        <p className="text-zinc-400 mb-6 text-sm">
          Drag & drop, click to browse, or use your camera
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            📁 Browse
          </Button>
          <Button
            className="bg-yellow-400 text-black hover:bg-yellow-300 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              handleCamera();
            }}
          >
            📷 Camera
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </Card>
  );
}
