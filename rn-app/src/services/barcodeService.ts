import { z } from "zod";
import foodService from "./foodService";
import { fetchWithRetry } from "../utils/http";
import { logError } from "../utils/logger";
import type { FoodRecord } from "../types/supabase";

export interface OpenFoodFactsProduct {
  product_name: string;
  image_url?: string | null;
  brands?: string | null;
  quantity?: string | null;
  categories?: string | null;
  nutriments: {
    "energy-kcal_100g"?: number | null;
    fat_100g?: number | null;
    "saturated-fat_100g"?: number | null;
    carbohydrates_100g?: number | null;
    sugars_100g?: number | null;
    fiber_100g?: number | null;
    proteins_100g?: number | null;
    salt_100g?: number | null;
    sodium_100g?: number | null;
  };
  gtin: string | null;
}

export interface BarcodeLookupResult {
  product: OpenFoodFactsProduct;
  created: boolean; // true se inserito in Supabase ora
  foodRecord: FoodRecord; // record nella tabella foods
  // visual source — OpenFoodFacts (Supabase is ignored for UI)
  source: 'OpenFoodFacts';
}

const BARCODE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const barcodeCache = new Map<
  string,
  { ts: number; result: BarcodeLookupResult | null }
>();

const openFoodFactsSchema = z.object({
  product: z
    .object({
      product_name: z.string().optional().nullable(),
      generic_name: z.string().optional().nullable(),
      product_name_it: z.string().optional().nullable(),
      product_name_en: z.string().optional().nullable(),
      image_front_url: z.string().optional().nullable(),
      image_url: z.string().optional().nullable(),
      image_small_url: z.string().optional().nullable(),
      brands: z.string().optional().nullable(),
      quantity: z.string().optional().nullable(),
      categories: z.string().optional().nullable(),
      nutriments: z.record(z.any()).optional().nullable(),
      code: z.string().optional().nullable(),
      id: z.string().optional().nullable(),
    })
    .optional(),
});

function normalizeBarcode(barcode: string) {
  return barcode.replace(/\s+/g, "");
}

function mapToFoodInsert(p: OpenFoodFactsProduct) {
  const safeNum = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  return {
    name: p.product_name,
    servingSize: 100,
    serving_unit: "g",
    calories: safeNum(p.nutriments["energy-kcal_100g"]),
    protein: safeNum(p.nutriments["proteins_100g"]),
    carbsTotal: safeNum(p.nutriments["carbohydrates_100g"]),
    fatTotal: safeNum(p.nutriments["fat_100g"]),
    fiber: p.nutriments["fiber_100g"] ?? null,
    sugar: p.nutriments["sugars_100g"] ?? null,
    barcode: p.gtin,
    brand: p.brands || null,
    isGeneric: true,
  };
}

// Fallback: OpenFoodFacts API pubblica
export async function fetchProductFromOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  if (!barcode) return null;
  const normalizedBarcode = normalizeBarcode(barcode);
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    normalizedBarcode
  )}.json`;
  try {
    const resp = await fetchWithRetry(url, undefined, {
      retries: 2,
      backoffMs: 400,
      timeoutMs: 8000,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const parsed = openFoodFactsSchema.safeParse(data);
    if (!parsed.success || !parsed.data.product) return null;
    const p = parsed.data.product;
    const product_name =
      p.product_name ||
      p.generic_name ||
      p.product_name_it ||
      p.product_name_en ||
      p.brands ||
      `Prodotto ${normalizedBarcode}`;
    const toNumber = (value: unknown) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };
    return {
      product_name,
      image_url: p.image_front_url || p.image_url || p.image_small_url || null,
      brands: p.brands || null,
      quantity: p.quantity || null,
      categories: p.categories || null,
      nutriments: {
        "energy-kcal_100g": toNumber(p.nutriments?.["energy-kcal_100g"]),
        fat_100g: toNumber(p.nutriments?.["fat_100g"]),
        "saturated-fat_100g": toNumber(p.nutriments?.["saturated-fat_100g"]),
        carbohydrates_100g: toNumber(p.nutriments?.["carbohydrates_100g"]),
        sugars_100g: toNumber(p.nutriments?.["sugars_100g"]),
        fiber_100g: toNumber(p.nutriments?.["fiber_100g"]),
        proteins_100g: toNumber(p.nutriments?.["proteins_100g"]),
        salt_100g: toNumber(p.nutriments?.["salt_100g"]),
        sodium_100g: toNumber(p.nutriments?.["sodium_100g"]),
      },
      gtin: p.code || p.id || normalizedBarcode || null,
    };
  } catch (error) {
    logError(error, "OpenFoodFacts lookup failed", { barcode: normalizedBarcode });
    return null;
  }
}

export async function lookupAndEnsureFood(
  barcode: string
): Promise<BarcodeLookupResult | null> {
  const normalizedBarcode = normalizeBarcode(barcode);
  if (!normalizedBarcode) return null;
  const cached = barcodeCache.get(normalizedBarcode);
  if (cached && Date.now() - cached.ts < BARCODE_CACHE_TTL) {
    return cached.result;
  }
  // 1. Cerca già in Supabase
  const existing = await foodService.getFoodByBarcode(normalizedBarcode);
  if (existing) {
    const result = {
      product: {
        product_name: existing.name,
        image_url: null,
        brands: existing.brand,
        quantity: existing.serving_size
          ? `${existing.serving_size}${existing.serving_unit}`
          : null,
        categories: null,
        nutriments: {
          "energy-kcal_100g": existing.calories,
          fat_100g: existing.fat_total_g,
          carbohydrates_100g: existing.carbohydrates_total_g,
          proteins_100g: existing.protein_g,
          fiber_100g: existing.carbohydrates_fiber_g,
          sugars_100g: existing.carbohydrates_sugar_g,
        } as any,
        gtin: normalizedBarcode,
      },
      created: false,
      foodRecord: existing,
      source: 'OpenFoodFacts',
    };
    barcodeCache.set(normalizedBarcode, { ts: Date.now(), result });
    return result;
  }
  // 2. OpenFoodFacts
  const product = await fetchProductFromOpenFoodFacts(normalizedBarcode);
  if (!product) {
    barcodeCache.set(normalizedBarcode, { ts: Date.now(), result: null });
    return null;
  }
  // 3. Inserisci in Supabase
  const insertPayload = mapToFoodInsert(product);
  const created = await foodService.addFood(insertPayload);
  const result = { product, created: true, foodRecord: created, source: 'OpenFoodFacts' };
  barcodeCache.set(normalizedBarcode, { ts: Date.now(), result });
  return result;
}

export const barcodeService = {
  fetchProductFromOpenFoodFacts,
  lookupAndEnsureFood,
};
export default barcodeService;
