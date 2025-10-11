import Constants from 'expo-constants';

// Usa extra config se definita (chiave e endpoint possono essere differenti su mobile)
const extra: any = Constants.expoConfig?.extra || {};
// L'utente usa una singola chiave GEMINI_API_KEY (stessa per web e mobile)
const API_KEY = extra.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
// Endpoint: usa v1 con il modello multimodale gemini-2.5-flash (supporta input testo+immagini)
const ENDPOINT_URL = extra.GEMINI_ENDPOINT_URL || process.env.GEMINI_ENDPOINT_URL || process.env.EXPO_PUBLIC_GEMINI_ENDPOINT_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

if (!API_KEY) console.warn('[geminiService] GEMINI_API_KEY non impostata. Le funzioni AI falliranno.');

export interface NutritionalInfo100g {
  product_name_corrected?: string;
  calories_100g?: number|null;
  protein_100g?: number|null;
  carbohydrates_100g?: number|null;
  fat_100g?: number|null;
  fiber_100g?: number|null;
  sugar_100g?: number|null;
  serving_unit_suggestion?: string|null;
}

export async function fetchNutritionalInfoFromGemini(productName: string, barcode?: string|null): Promise<NutritionalInfo100g|null> {
  if (!API_KEY || !ENDPOINT_URL) throw new Error('Configurazione API Gemini mancante');
  let promptText = `Per il prodotto alimentare "${productName}"`;
  if (barcode) promptText += ` (barcode: ${barcode})`;
  promptText += `, cerca online i suoi valori nutrizionali per 100 grammi (o 100 ml se liquido).\nRispondi SOLO con JSON con le chiavi specificate in precedenza.`;
  const body = { contents:[{ parts:[{ text: promptText }] }], generationConfig:{ temperature:0.2, maxOutputTokens:1024 } };
  const resp = await fetch(`${ENDPOINT_URL}?key=${API_KEY}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!resp.ok) throw new Error('Richiesta Gemini fallita');
  const json = await resp.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const first = raw.indexOf('{'); const last = raw.lastIndexOf('}');
  if(first===-1||last===-1) return null;
  try { return JSON.parse(raw.slice(first,last+1)); } catch { return null; }
}

export interface MacroEstimateResult { calories:number; protein:number; carbohydrates_total:number; fat_total:number; fiber?:number|null; sugar?:number|null; }

export async function estimateMacrosForEntry(name: string, quantity: number, unit: string): Promise<MacroEstimateResult> {
  if (!API_KEY || !ENDPOINT_URL) throw new Error('Configurazione API Gemini mancante');
  if (!name?.trim()) throw new Error('Nome mancante');
  if (!quantity || quantity<=0) throw new Error('Quantità non valida');
  const unitNorm = (unit||'g').toLowerCase();
  const prompt = `Dato l'alimento \"${name}\" fornisci una STIMA realistica dei suoi valori nutrizionali per ${quantity}${unitNorm}.\nRispondi SOLO con JSON con queste chiavi esatte: { \"calories\": <kcal>, \"protein\": <g>, \"carbohydrates_total\": <g>, \"fat_total\": <g>, \"fiber\": <g o null>, \"sugar\": <g o null> }`;
  const body = { contents:[{ parts:[{ text: prompt }] }], generationConfig:{ temperature:0.15, maxOutputTokens:512 } };
  const resp = await fetch(`${ENDPOINT_URL}?key=${API_KEY}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  if(!resp.ok) throw new Error('Richiesta Gemini fallita');
  const json = await resp.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const first = raw.indexOf('{'); const last = raw.lastIndexOf('}');
  if(first===-1||last===-1) throw new Error('Risposta AI non valida');
  let parsed:any; try { parsed = JSON.parse(raw.slice(first,last+1)); } catch { throw new Error('JSON AI non parseable'); }
  ['calories','protein','carbohydrates_total','fat_total'].forEach(k=>{ if(typeof parsed[k] !== 'number') throw new Error('Valori incompleti'); });
  return {
    calories: parsed.calories,
    protein: parsed.protein,
    carbohydrates_total: parsed.carbohydrates_total,
    fat_total: parsed.fat_total,
    fiber: (parsed.fiber===null||typeof parsed.fiber==='number')?parsed.fiber:null,
    sugar: (parsed.sugar===null||typeof parsed.sugar==='number')?parsed.sugar:null
  };
}

export default { fetchNutritionalInfoFromGemini, estimateMacrosForEntry };
