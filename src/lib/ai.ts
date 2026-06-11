import { AnalysisResult, ResearchResult } from './types';

const ZAI_API_KEY = process.env.ZAI_API_KEY || '';
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/coding/paas/v4';
const ZAI_VISION_MODEL = process.env.ZAI_VISION_MODEL || 'glm-4.6v';

export async function analyzeImage(imageBase64: string): Promise<AnalysisResult> {
  const prompt = `Analyze this image for creating an eBay listing. You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text). Use this exact structure:

{
  "title": "eBay listing title, max 80 characters, optimized for search",
  "description": "Detailed HTML description for eBay listing, professional and honest",
  "category": "eBay category name (e.g. Cell Phones & Smartphones)",
  "categoryId": "best guess eBay category ID if known, otherwise empty string",
  "condition": "one of: New, New Other, Refurbished, Used, For Parts",
  "brand": "brand name if identifiable",
  "model": "model name/number if identifiable",
  "estimatedPrice": {
    "min": 0,
    "max": 0,
    "recommended": 0,
    "currency": "USD"
  },
  "listingFormat": "AUCTION or FIXED_PRICE",
  "keyFeatures": ["feature1", "feature2"],
  "itemSpecifics": {"Brand": "", "Model": "", "Color": "", "Storage": ""},
  "confidence": 0.0
}

Rules:
- Be specific and accurate — identify the exact product if possible
- Price should be realistic for the current market
- Condition must match what you see in the image
- Key features should highlight selling points
- Item specifics should match common eBay fields for this category
- Confidence is 0-1 based on how certain you are of the identification
- Title should include brand, model, key specs, and condition
- Description should be honest about condition, highlight features, include measurements/specs`;

  const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ZAI_VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` }
          }
        ]
      }],
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`z.ai API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // glm-4.6v uses reasoning tokens - content may be in different places
  let content = data.choices?.[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('No content in vision model response');
  }

  // Clean up the response - remove markdown code fences if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title || 'Unknown Item',
      description: parsed.description || '',
      category: parsed.category || 'Other',
      categoryId: parsed.categoryId || '',
      condition: parsed.condition || 'Used',
      brand: parsed.brand || '',
      model: parsed.model || '',
      estimatedPrice: {
        min: parsed.estimatedPrice?.min || 0,
        max: parsed.estimatedPrice?.max || 0,
        recommended: parsed.estimatedPrice?.recommended || 0,
        currency: parsed.estimatedPrice?.currency || 'USD',
      },
      listingFormat: parsed.listingFormat || 'FIXED_PRICE',
      keyFeatures: parsed.keyFeatures || [],
      itemSpecifics: parsed.itemSpecifics || {},
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
    };
  } catch {
    throw new Error(`Failed to parse AI response: ${content.slice(0, 200)}`);
  }
}

export async function researchPrice(title: string, category: string, brand: string, model: string): Promise<ResearchResult> {
  // Use web search to find eBay sold listings
  const searchQuery = `${brand} ${model} ${category}`.trim().replace(/\s+/g, '+');
  
  // Try multiple sources for price research
  const prices: { price: number; date: string; title: string; source: string }[] = [];
  
  // Source 1: Scrape eBay sold listings via Jina reader
  try {
    const ebayUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&LH_Sold=1&LH_Complete=1&_ipg=60`;
    const jinaUrl = `https://r.jina.ai/${ebayUrl}`;
    
    const response = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.ok) {
      const text = await response.text();
      
      // Extract prices from eBay sold listings page
      const priceRegex = /\$\s*([\d,]+\.?\d*)/g;
      let match;
      while ((match = priceRegex.exec(text)) !== null) {
        const price = parseFloat(match[1].replace(',', ''));
        if (price > 0 && price < 100000) {
          prices.push({
            price,
            date: 'recent',
            title: text.substring(Math.max(0, match.index - 100), match.index).slice(-60).trim(),
            source: 'ebay',
          });
        }
      }
    }
  } catch (e) {
    console.error('eBay research failed:', e);
  }

  // Source 2: Use z.ai to estimate based on knowledge (fallback)
  if (prices.length < 3) {
    try {
      const response = await fetch(`${ZAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'glm-5.1',
          messages: [{
            role: 'user',
            content: `Estimate the current market value of this item for an eBay listing: "${title}" in category "${category}". Brand: "${brand}", Model: "${model}". 
            Consider typical eBay sold prices for similar items. Be realistic and conservative.
            Respond with ONLY a JSON object: {"min": number, "max": number, "recommended": number, "notes": "brief explanation"}`
          }],
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || '';
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(content);
        
        // Add AI-estimated prices as data points
        prices.push(
          { price: parsed.min, date: 'estimated', title: 'AI estimate (low)', source: 'ai' },
          { price: parsed.max, date: 'estimated', title: 'AI estimate (high)', source: 'ai' },
          { price: parsed.recommended, date: 'estimated', title: 'AI recommendation', source: 'ai' },
        );
      }
    } catch (e) {
      console.error('AI price estimation failed:', e);
    }
  }

  // Calculate statistics
  const allPrices = prices.map(p => p.price).filter(p => p > 0);
  const sorted = [...allPrices].sort((a, b) => a - b);
  
  const avg = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
  const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
  
  return {
    query: searchQuery,
    averagePrice: Math.round(avg * 100) / 100,
    medianPrice: Math.round(median * 100) / 100,
    minPrice: sorted[0] || 0,
    maxPrice: sorted[sorted.length - 1] || 0,
    totalSold: prices.filter(p => p.source === 'ebay').length,
    recommendedPrice: Math.round(median * 100) / 100,
    comparableItems: prices.slice(0, 20).map(p => ({
      title: p.title,
      price: p.price,
      condition: 'Unknown',
      soldDate: p.date,
      listingUrl: p.source === 'ebay' ? `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&LH_Sold=1` : undefined,
    })),
    priceHistory: prices.slice(0, 20),
  };
}
