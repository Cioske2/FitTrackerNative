import Constants from 'expo-constants';
import foodService from './foodService';

const extra = Constants.expoConfig?.extra || {};
// Proxy base URL (può essere configurato in app.config.js -> extra.PROXY_BASE_URL)
const PROXY_BASE_URL = extra.PROXY_BASE_URL || extra.API_BASE_URL || '';

export interface OpenFoodFactsProduct {
  product_name: string;
  image_url?: string|null;
  brands?: string|null;
  quantity?: string|null;
  categories?: string|null;
  nutriments: {
    'energy-kcal_100g'?: number|null;
    'fat_100g'?: number|null;
    'saturated-fat_100g'?: number|null;
    'carbohydrates_100g'?: number|null;
    'sugars_100g'?: number|null;
    'fiber_100g'?: number|null;
    'proteins_100g'?: number|null;
    'salt_100g'?: number|null;
    'sodium_100g'?: number|null;
  };
  gtin: string|null;
}

export interface BarcodeLookupResult {
  product: OpenFoodFactsProduct;
  created: boolean; // true se inserito in Supabase ora
  foodRecord: any;  // record nella tabella foods
}

function mapToFoodInsert(p: OpenFoodFactsProduct){
  return {
    name: p.product_name,
    servingSize: 100,
    serving_unit: 'g',
    calories: p.nutriments['energy-kcal_100g'] || 0,
    protein: p.nutriments['proteins_100g'] || 0,
    carbsTotal: p.nutriments['carbohydrates_100g'] || 0,
    fatTotal: p.nutriments['fat_100g'] || 0,
    fiber: p.nutriments['fiber_100g'] ?? null,
    sugar: p.nutriments['sugars_100g'] ?? null,
    barcode: p.gtin,
    brand: p.brands || null,
    isGeneric: true
  };
}

export async function fetchProductFromProxy(barcode: string): Promise<OpenFoodFactsProduct|null> {
  if (!barcode) return null;
  // Atteso endpoint: <PROXY_BASE_URL>/api/openfoodfacts-proxy?gtin=CODE
  const url = PROXY_BASE_URL ? `${PROXY_BASE_URL}/api/openfoodfacts-proxy?gtin=${encodeURIComponent(barcode)}` : `/api/openfoodfacts-proxy?gtin=${encodeURIComponent(barcode)}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  if (!json || !json.product_name) return null;
  return json as OpenFoodFactsProduct;
}

export async function lookupAndEnsureFood(barcode: string): Promise<BarcodeLookupResult|null> {
  // 1. Cerca già in Supabase
  const existing = await foodService.getFoodByBarcode(barcode);
  if (existing) {
    return { product: {
      product_name: existing.name,
      image_url: null,
      brands: existing.brand,
      quantity: existing.serving_size ? `${existing.serving_size}${existing.serving_unit}`: null,
      categories: null,
      nutriments: {
        'energy-kcal_100g': existing.calories,
        'fat_100g': existing.fat_total_g,
        'carbohydrates_100g': existing.carbohydrates_total_g,
        'proteins_100g': existing.protein_g,
        'fiber_100g': existing.carbohydrates_fiber_g,
        'sugars_100g': existing.carbohydrates_sugar_g
      } as any,
      gtin: barcode
    }, created:false, foodRecord: existing };
  }
  // 2. Proxy OFF
  const product = await fetchProductFromProxy(barcode);
  if (!product) return null;
  // 3. Inserisci in Supabase
  const insertPayload = mapToFoodInsert(product);
  const created = await foodService.addFood(insertPayload);
  return { product, created:true, foodRecord: created };
}

export const barcodeService = { fetchProductFromProxy, lookupAndEnsureFood };
export default barcodeService;
