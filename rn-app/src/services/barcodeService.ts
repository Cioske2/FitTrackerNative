import Constants from "expo-constants";
import foodService from "./foodService";

const extra = Constants.expoConfig?.extra || {};
// Proxy base URL (può essere configurato in app.config.js -> extra.PROXY_BASE_URL)
const PROXY_BASE_URL = extra.PROXY_BASE_URL || extra.API_BASE_URL || "";

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
  foodRecord: any; // record nella tabella foods
}

function mapToFoodInsert(p: OpenFoodFactsProduct) {
  return {
    name: p.product_name,
    servingSize: 100,
    serving_unit: "g",
    calories: Number(p.nutriments["energy-kcal_100g"]) || 0,
    protein: Number(p.nutriments["proteins_100g"]) || 0,
    carbsTotal: Number(p.nutriments["carbohydrates_100g"]) || 0,
    fatTotal: Number(p.nutriments["fat_100g"]) || 0,
    fiber: p.nutriments["fiber_100g"] ?? null,
    sugar: p.nutriments["sugars_100g"] ?? null,
    barcode: p.gtin,
    brand: p.brands || null,
    isGeneric: true,
  };
}

// Chiamata diretta Open Food Repo dal client
export async function fetchProductFromOpenFoodRepo(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  if (!barcode) return null;
  const apiKey = Constants.expoConfig?.extra?.OPENFOODREPO_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.foodrepo.org/api/v3/products?barcodes=${encodeURIComponent(
    barcode
  )}&page[size]=1`;
  try {
    const resp = await fetch(url, {
      headers: {
        authorization: `Token token=\"${apiKey}\"`,
        accept: "application/json",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (
      !data ||
      !data.data ||
      !Array.isArray(data.data) ||
      data.data.length === 0
    )
      return null;
    const p = data.data[0];
    // Mappa la risposta Food Repo al formato atteso
    const names = p.name_translations || {};
    const product_name =
      names.it || names.en || names.de || p.name || p.barcode || "";
    const images = p.images || [];
    let image_url = null;
    if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      image_url =
        (first && (first.large_url || first.original_url || first.thumb_url)) ||
        null;
    }
    const nutrients = p.nutrients || {};
    function get(pathArr: string[]) {
      let cur: any = nutrients;
      for (const seg of pathArr) {
        if (!cur) return null;
        cur = cur[seg];
      }
      return cur === undefined || cur === null || cur === "" ? null : cur;
    }
    return {
      product_name,
      image_url,
      brands: p.brand || p.brands || null,
      quantity: p.quantity || null,
      categories: null,
      nutriments: {
        "energy-kcal_100g": get(["energy", "per_hundred"]),
        fat_100g: get(["fat", "per_hundred"]),
        "saturated-fat_100g":
          get(["saturated_fat", "per_hundred"]) ||
          get(["saturated-fat", "per_hundred"]),
        carbohydrates_100g: get(["carbohydrates", "per_hundred"]),
        sugars_100g: get(["sugars", "per_hundred"]),
        fiber_100g:
          get(["fibers", "per_hundred"]) || get(["fiber", "per_hundred"]),
        proteins_100g: get(["proteins", "per_hundred"]),
      },
      gtin: p.barcode || null,
    };
  } catch {
    return null;
  }
}

// Fallback: OpenFoodFacts API pubblica
export async function fetchProductFromOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  if (!barcode) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data || !data.product) return null;
    const p = data.product;
    return {
      product_name: p.product_name || p.generic_name || "",
      image_url: p.image_front_url || p.image_url || p.image_small_url || null,
      brands: p.brands || null,
      quantity: p.quantity || null,
      categories: p.categories || null,
      nutriments: {
        "energy-kcal_100g": p.nutriments?.["energy-kcal_100g"] ?? null,
        fat_100g: p.nutriments?.["fat_100g"] ?? null,
        "saturated-fat_100g": p.nutriments?.["saturated-fat_100g"] ?? null,
        carbohydrates_100g: p.nutriments?.["carbohydrates_100g"] ?? null,
        sugars_100g: p.nutriments?.["sugars_100g"] ?? null,
        fiber_100g: p.nutriments?.["fiber_100g"] ?? null,
        proteins_100g: p.nutriments?.["proteins_100g"] ?? null,
        salt_100g: p.nutriments?.["salt_100g"] ?? null,
        sodium_100g: p.nutriments?.["sodium_100g"] ?? null,
      },
      gtin: p.code || p.id || null,
    };
  } catch {
    return null;
  }
}

export async function lookupAndEnsureFood(
  barcode: string
): Promise<BarcodeLookupResult | null> {
  // 1. Cerca già in Supabase
  const existing = await foodService.getFoodByBarcode(barcode);
  if (existing) {
    return {
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
        gtin: barcode,
      },
      created: false,
      foodRecord: existing,
    };
  }
  // 2. Solo Open Food Repo, nessun fallback
  const product = await fetchProductFromOpenFoodRepo(barcode);
  if (!product) return null;
  // 3. Inserisci in Supabase
  const insertPayload = mapToFoodInsert(product);
  const created = await foodService.addFood(insertPayload);
  return { product, created: true, foodRecord: created };
}

export const barcodeService = {
  fetchProductFromOpenFoodRepo,
  fetchProductFromOpenFoodFacts,
  lookupAndEnsureFood,
};
export default barcodeService;
