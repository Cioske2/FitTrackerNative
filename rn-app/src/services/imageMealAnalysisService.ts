import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

interface DishResult {
  id: string;
  name: string;
  quantityText: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Read env values from app config extra or process env fallback
const GEMINI_API_KEY = (Constants.expoConfig?.extra as any)?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
// Usa v1 con gemini-2.5-flash, che supporta input immagini per l'analisi
const GEMINI_ENDPOINT = (Constants.expoConfig?.extra as any)?.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
const SPOON_KEY = (Constants.expoConfig?.extra as any)?.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY;

export async function analyzeMealImage(localUri: string): Promise<DishResult[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key mancante');
  // Spoonacular facoltativo: se assente ritorniamo solo struttura con macro a 0

  // Use legacy API to read as base64 (Expo SDK 54+)
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

  const payload = { contents: [{ parts: [{ inline_data: { mime_type: guessMime(localUri), data: base64 } }, { text: PROMPT }] }] };
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Gemini status ${res.status}`);
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const arr = extractArray(raw);
  const mapped: DishResult[] = arr.map((o: any) => ({
    id: `dish-${slug(o.Dish || o.Piatto)}-${Math.random().toString(36).slice(2)}`,
    name: o.Dish || o.Piatto || 'Dish',
    quantityText: '',
    ingredients: o.Ingredients || o.Ingredienti || [],
    calories: numberOr(o.EstimatedCalories, 0),
    protein: numberOr(o.EstimatedProtein, 0),
    carbs: numberOr(o.EstimatedCarbohydrates, 0),
    fat: numberOr(o.EstimatedFat, 0)
  }));
  return mapped;
}

function numberOr(v: any, d: number) { const n = Number(v); return isFinite(n) ? n : d; }
function slug(s: string) { return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$|/g, ''); }
function guessMime(uri: string) { if (uri.endsWith('.png')) return 'image/png'; if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) return 'image/jpeg'; return 'image/*'; }

function extractArray(text: string) {
  try {
    let t = text.trim();
    if (t.startsWith('```')) t = t.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
    const match = t.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch { return []; }
}

const PROMPT = `You are an expert nutritionist and computer vision specialist. Analyze this food image carefully.

INSTRUCTIONS:
1. Identify each distinct dish/food item in the image
2. For each item, estimate realistic nutritional values based on visual portion size
3. Use standard Italian food names when possible
4. Be conservative with calorie estimates - avoid overestimating
5. If multiple servings are visible, calculate for ONE typical serving

OUTPUT FORMAT:
Return ONLY a valid JSON array with this exact structure:
[
  {
    "Dish": "Nome del piatto in italiano",
    "Ingredients": ["ingrediente1", "ingrediente2"],
    "EstimatedCalories": <number in kcal>,
    "EstimatedProtein": <number in grams>,
    "EstimatedCarbohydrates": <number in grams>,
    "EstimatedFat": <number in grams>
  }
]

IMPORTANT:
- If no food is recognizable, return []
- All nutritional values must be numbers (not strings)
- Use realistic portion sizes (e.g., one plate, one bowl)
- Calories should be reasonable for the portion shown`;
