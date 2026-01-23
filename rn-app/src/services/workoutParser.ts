// Porting of workoutParser.js for React Native (no window refs)
export interface ParsedWorkout {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  rest: string;
  notes: string;
}

class WorkoutParserService {
  apiKey: string | undefined;
  baseURL: string;
  model: string;
  isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.model = 'deepseek/deepseek-r1:free';
    this.isConfigured = !!this.apiKey && this.apiKey !== 'your-openrouter-key-here';
  }

  async parseWorkoutText(workoutText: string): Promise<ParsedWorkout[]> {
    if (!this.isConfigured) throw new Error('OpenRouter API non configurata');
    const prompt = `Sei un esperto personal trainer. Analizza il seguente testo di allenamento ed estrai SOLO gli esercizi concreti.

TESTO ALLENAMENTO:
"${workoutText}"

ISTRUZIONI:
1. IGNORA completamente righe che contengono solo: nomi di gruppi muscolari (es. "Petto", "Gambe"), giorni della settimana, titoli generici
2. Estrai SOLO righe che descrivono esercizi specifici con serie/ripetizioni
3. Per ogni esercizio identifica:
   - exercise: nome completo dell'esercizio (es. "Panca piana", "Squat", "Lat machine")
   - sets: numero di serie (numero intero)
   - reps: numero di ripetizioni (numero intero)
   - weight: peso in kg (numero, 0 se non specificato)
   - rest: tempo di recupero (stringa, vuota se non specificato)
   - notes: eventuali note aggiuntive (stringa)

FORMATO OUTPUT:
Rispondi SOLO con JSON valido in questo formato esatto:
{
  "workouts": [
    {
      "exercise": "Nome esercizio",
      "sets": 3,
      "reps": 10,
      "weight": 50,
      "rest": "90s",
      "notes": ""
    }
  ]
}

IMPORTANTE:
- Se il testo non contiene esercizi validi, ritorna {"workouts": []}
- Tutti i valori numerici devono essere numeri, non stringhe
- Se mancano informazioni (peso, recupero), usa valori predefiniti (0 per weight, "" per rest/notes)`;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'FitTracker - Workout Parser'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'Sei un esperto di fitness. Rispondi SOLO con JSON valido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });
    if (!response.ok) throw new Error(`OpenRouter API error: ${response.status}`);
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) throw new Error('Risposta AI vuota');
    try {
      let jsonContent = aiResponse.trim();
      if (jsonContent.startsWith('```json')) jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      else if (jsonContent.startsWith('```')) jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonContent = jsonMatch[0];
      const parsed = JSON.parse(jsonContent);
      if (!parsed.workouts || !Array.isArray(parsed.workouts)) throw new Error('Formato workouts non valido');

      // Normalize exercise names using the exercise library
      const exerciseLibraryService = (await import('./exerciseLibraryService')).default;
      const normalized = await Promise.all(
        parsed.workouts.map(async (workout: any) => ({
          ...workout,
          exercise: await exerciseLibraryService.findBestMatch(workout.exercise),
        }))
      );
      return normalized;
    } catch {
      return this.parseWorkoutTextSimple(workoutText);
    }
  }

  async parseWorkoutTextSimple(workoutText: string): Promise<ParsedWorkout[]> {
    const workouts: ParsedWorkout[] = [];
    const lines = workoutText.split(/[\n,]/).map(line => line.trim()).filter(line => line);
    const skipWords = ['spalle', 'gambe', 'petto', 'dorsali', 'schiena', 'bicipiti', 'tricipiti', 'addome', 'addominali', 'oggi ho fatto'];
    for (const line of lines) {
      if (skipWords.some(w => line.toLowerCase().startsWith(w))) continue;
      const match1 = line.match(/^([a-zA-Zàèéìòùç' ]+)\s+(\d+)x(\d+)(?:\/(\d+))?\s*(\d+)?\s*kg?\s*([\d\/.]+)?/i);
      if (match1) {
        const exercise = match1[1].trim();
        const sets = parseInt(match1[2]);
        const reps = match1[4] ? parseInt(match1[4]) : parseInt(match1[3]);
        const weight = match1[5] ? parseFloat(match1[5]) : 0;
        const rest = match1[6] ? match1[6].replace(/recupero|rec/gi, '').replace(/\//g, '-').trim() + ' min' : '';
        workouts.push({ exercise, sets, reps, weight, rest, notes: '' });
        continue;
      }
      const match2 = line.match(/^([a-zA-Zàèéìòùç' ]+(?:da|con))\s*(\d+)\s*kg\s+(\d+)x(\d+)(?:\/(\d+))?\s*([\d\/.]+)?/i);
      if (match2) {
        const exercise = match2[1].replace(/\s*(da|con)\s*$/i, '').trim();
        const weight = parseFloat(match2[2]);
        const sets = parseInt(match2[3]);
        const reps = match2[5] ? parseInt(match2[5]) : parseInt(match2[4]);
        const rest = match2[6] ? match2[6].replace(/recupero|rec/gi, '').replace(/\//g, '-').trim() + ' min' : '';
        workouts.push({ exercise, sets, reps, weight, rest, notes: '' });
        continue;
      }
      const match3 = line.match(/^([a-zA-Zàèéìòùç' ]+)\s+(\d+)x(\d+)\s*(\d+)?\s*kg?/i);
      if (match3) {
        const exercise = match3[1].trim();
        const sets = parseInt(match3[2]);
        const reps = parseInt(match3[3]);
        const weight = match3[4] ? parseFloat(match3[4]) : 0;
        workouts.push({ exercise, sets, reps, weight, rest: '', notes: '' });
        continue;
      }
      const match4 = line.match(/^([a-zA-Zàèéìòùç' ]+)\s+(\d+)x(\d+)/i);
      if (match4) {
        const exercise = match4[1].trim();
        const sets = parseInt(match4[2]);
        const reps = parseInt(match4[3]);
        workouts.push({ exercise, sets, reps, weight: 0, rest: '', notes: '' });
        continue;
      }
    }

    // Normalize all exercise names
    const exerciseLibraryService = (await import('./exerciseLibraryService')).default;
    const normalized = await Promise.all(
      workouts.map(async (workout) => ({
        ...workout,
        exercise: await exerciseLibraryService.findBestMatch(workout.exercise),
      }))
    );

    return normalized;
  }

  async parseWorkout(workoutText: string): Promise<ParsedWorkout[]> {
    if (!workoutText || workoutText.trim().length < 3) throw new Error('Testo workout troppo corto');
    try {
      if (this.isConfigured) return await this.parseWorkoutText(workoutText);
    } catch {
      // fallback
    }
    return this.parseWorkoutTextSimple(workoutText);
  }
}

const workoutParser = new WorkoutParserService();
export default workoutParser;
