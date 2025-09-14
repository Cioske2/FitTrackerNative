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
const GEMINI_ENDPOINT = (Constants.expoConfig?.extra as any)?.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const SPOON_KEY = (Constants.expoConfig?.extra as any)?.SPOONACULAR_API_KEY || process.env.SPOONACULAR_API_KEY;

export async function analyzeMealImage(localUri: string): Promise<DishResult[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key mancante');
  // Spoonacular facoltativo: se assente ritorniamo solo struttura con macro a 0

  // Use legacy API to read as base64 (Expo SDK 54+)
  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

  const payload = { contents:[{ parts:[ { inline_data:{ mime_type: guessMime(localUri), data: base64 } }, { text: PROMPT } ] }] };
  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Gemini status ${res.status}`);
  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const arr = extractArray(raw);
  const mapped: DishResult[] = arr.map((o:any)=> ({
    id: `dish-${slug(o.Dish || o.Piatto)}-${Math.random().toString(36).slice(2)}`,
    name: o.Dish || o.Piatto || 'Dish',
    quantityText: o['Estimated quantity'] || o['Quantità stimata'] || '1 serving',
    ingredients: o.Ingredients || o.Ingredienti || [],
    calories: numberOr(o.EstimatedCalories, 0),
    protein: numberOr(o.EstimatedProtein, 0),
    carbs: numberOr(o.EstimatedCarbohydrates, 0),
    fat: numberOr(o.EstimatedFat, 0)
  }));
  return mapped;
}

function numberOr(v:any, d:number){ const n = Number(v); return isFinite(n)? n : d; }
function slug(s:string){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$|/g,''); }
function guessMime(uri:string){ if (uri.endsWith('.png')) return 'image/png'; if (uri.endsWith('.jpg')||uri.endsWith('.jpeg')) return 'image/jpeg'; return 'image/*'; }

function extractArray(text:string){
  try {
    let t = text.trim();
    if (t.startsWith('```')) t = t.replace(/^```[a-zA-Z]*\n/, '').replace(/```$/, '').trim();
    const match = t.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch { return []; }
}

const PROMPT = `You are an expert in computer vision and nutrition. Analyze this food image.
Return ONLY a JSON array of dishes with keys: Dish, "Estimated quantity", Ingredients[], EstimatedCalories, EstimatedProtein, EstimatedCarbohydrates, EstimatedFat.
If nothing recognizable return [].`;
