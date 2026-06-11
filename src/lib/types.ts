export interface AnalysisResult {
  title: string;
  description: string;
  category: string;
  categoryId: string;
  condition: string;
  brand: string;
  model: string;
  estimatedPrice: {
    min: number;
    max: number;
    recommended: number;
    currency: string;
  };
  listingFormat: 'AUCTION' | 'FIXED_PRICE';
  keyFeatures: string[];
  itemSpecifics: Record<string, string>;
  confidence: number;
}

export interface ResearchResult {
  query: string;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  totalSold: number;
  comparableItems: ComparableItem[];
  recommendedPrice: number;
  priceHistory: { price: number; date: string; title: string }[];
}

export interface ComparableItem {
  title: string;
  price: number;
  condition: string;
  soldDate: string;
  imageUrl?: string;
  listingUrl?: string;
}

export interface ListingDraft {
  id: string;
  images: string[];
  analysis?: AnalysisResult;
  research?: ResearchResult;
  status: 'uploading' | 'analyzing' | 'editing' | 'researching' | 'ready';
}
