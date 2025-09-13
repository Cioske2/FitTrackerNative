import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};
const USDA_API_KEY = extra.USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';
const OPENFOODFACTS_API_URL = extra.OPENFOODFACTS_API_URL || 'https://world.openfoodfacts.org/api/v2';

async function searchOpenFoodFacts(searchTerm: string) {
  const resp = await fetch(`${OPENFOODFACTS_API_URL}/search?search_terms=${encodeURIComponent(searchTerm)}&search_tag=food&json=1&page_size=10&fields=product_name,nutriments,code,brands,quantity,serving_size,categories_tags,product_name_en,product_name_it`);
  const json = await resp.json();
  if (!json?.products) return [];
  const searchTermLower = searchTerm.toLowerCase();
  const relevant = json.products.filter((p: any) => {
    const name = (p.product_name_en || p.product_name_it || p.product_name || '').toLowerCase();
    if (!name || !name.includes(searchTermLower)) return false;
    return true;
  });
  return relevant.map((p: any) => ({
    source: 'Open Food Facts',
    id: p.code,
    name: p.product_name_en || p.product_name_it || p.product_name || 'Nome non disponibile',
    brand: p.brands || '',
    servingSize: p.serving_size || 'Non specificato',
    nutrients: {
      calories: p.nutriments?.['energy-kcal_100g'] || (p.nutriments?.energy_100g ? p.nutriments.energy_100g / 4.184 : 0),
      protein: p.nutriments?.proteins_100g || 0,
      carbs: p.nutriments?.carbohydrates_100g || 0,
      fat: p.nutriments?.fat_100g || 0,
      sugar: p.nutriments?.sugars_100g,
      fiber: p.nutriments?.fiber_100g,
    }
  })).slice(0,5);
}

async function searchUSDA(searchTerm: string) {
  if (!USDA_API_KEY) return [];
  const url = `${USDA_API_URL}/foods/search?query=${encodeURIComponent(searchTerm)}&api_key=${USDA_API_KEY}&pageSize=5&dataType=${encodeURIComponent('Survey (FNDDS),Branded')}`;
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json?.foods) return [];
    return json.foods.map((food: any) => {
      const nutrients = { calories:0, protein:0, carbs:0, fat:0 };
      (food.foodNutrients || []).forEach((n: any) => {
        const name = n.nutrientName?.toLowerCase();
        if (name?.includes('energy') && (n.unitName?.toLowerCase() === 'kcal' || n.nutrientNumber === '208')) nutrients.calories = n.value;
        else if (name?.includes('protein') && (n.unitName?.toLowerCase() === 'g' || n.nutrientNumber === '203')) nutrients.protein = n.value;
        else if (name?.includes('carbohydrate, by difference') && (n.unitName?.toLowerCase() === 'g' || n.nutrientNumber === '205')) nutrients.carbs = n.value;
        else if (name?.includes('total lipid (fat)') && (n.unitName?.toLowerCase() === 'g' || n.nutrientNumber === '204')) nutrients.fat = n.value;
      });
      return {
        source: 'USDA',
        id: food.fdcId,
        name: food.description,
        brand: food.brandOwner || '',
        servingSize: food.servingSize ? `${food.servingSize} ${food.servingSizeUnit}` : 'Non specificato',
        nutrients,
      };
    });
  } catch { return []; }
}

export async function fetchNutritionInfo(foodName: string) {
  if (!foodName?.trim()) return [];
  let results: any[] = [];
  try { results = results.concat(await searchOpenFoodFacts(foodName)); } catch {}
  if (results.length < 3) {
    try { results = results.concat(await searchUSDA(foodName)); } catch {}
  }
  const unique: any[] = [];
  results.forEach(r => {
    if (!unique.find(u => u.name.toLowerCase() === r.name.toLowerCase() && (u.brand||'').toLowerCase() === (r.brand||'').toLowerCase())) unique.push(r);
  });
  return unique.slice(0,10);
}

export const nutritionService = { fetchNutritionInfo, searchOpenFoodFacts, searchUSDA };
export default nutritionService;