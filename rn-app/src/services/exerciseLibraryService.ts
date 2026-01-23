import { supabase } from './supabaseClient';

export interface Exercise {
    id: number;
    canonical_name: string;
    canonical_name_en: string | null;
    canonical_name_it: string | null;
    aliases: string[];
    muscle_group: string | null;
    equipment: string | null;
}

class ExerciseLibraryService {
    private cachedExercises: Exercise[] | null = null;
    private cacheTimestamp: number = 0;
    private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Fetch all exercises from the library (cached for performance)
     */
    async getAllExercises(): Promise<Exercise[]> {
        const now = Date.now();
        if (this.cachedExercises && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return this.cachedExercises;
        }

        const { data, error } = await supabase
            .from('exercise_library')
            .select('*')
            .order('canonical_name');

        if (error) throw new Error(error.message);

        this.cachedExercises = data || [];
        this.cacheTimestamp = now;
        return this.cachedExercises;
    }

    /**
     * Find the best matching canonical exercise name for user input
     * Uses exact match, alias match, and fuzzy matching
     */
    async findBestMatch(inputName: string): Promise<string> {
        if (!inputName || inputName.trim().length === 0) {
            return inputName;
        }

        const exercises = await this.getAllExercises();
        const normalized = inputName.trim().toLowerCase();

        // 1. Exact match (case-insensitive) on canonical names
        for (const ex of exercises) {
            if (ex.canonical_name.toLowerCase() === normalized) {
                return ex.canonical_name;
            }
            if (ex.canonical_name_en?.toLowerCase() === normalized) {
                return ex.canonical_name;
            }
            if (ex.canonical_name_it?.toLowerCase() === normalized) {
                return ex.canonical_name;
            }
        }

        // 2. Alias match (exact)
        for (const ex of exercises) {
            if (ex.aliases?.some(a => a.toLowerCase() === normalized)) {
                return ex.canonical_name;
            }
        }

        // 3. Partial match (contains)
        for (const ex of exercises) {
            const canonicalLower = ex.canonical_name.toLowerCase();
            if (canonicalLower.includes(normalized) || normalized.includes(canonicalLower)) {
                return ex.canonical_name;
            }
        }

        // 4. Fuzzy match using similarity scoring
        let bestMatch: Exercise | null = null;
        let bestScore = 0;

        for (const ex of exercises) {
            // Check similarity with canonical name
            const score1 = this.calculateSimilarity(normalized, ex.canonical_name.toLowerCase());
            if (score1 > bestScore) {
                bestScore = score1;
                bestMatch = ex;
            }

            // Check similarity with aliases
            if (ex.aliases) {
                for (const alias of ex.aliases) {
                    const score2 = this.calculateSimilarity(normalized, alias.toLowerCase());
                    if (score2 > bestScore) {
                        bestScore = score2;
                        bestMatch = ex;
                    }
                }
            }
        }

        // Return match if similarity is above threshold (70%)
        if (bestMatch && bestScore > 0.7) {
            return bestMatch.canonical_name;
        }

        // 5. No match found - return original (capitalized)
        return this.capitalizeWords(inputName.trim());
    }

    /**
     * Calculate similarity between two strings using Dice's coefficient
     * Returns a value between 0 (no similarity) and 1 (identical)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        if (str1 === str2) return 1;
        if (str1.length < 2 || str2.length < 2) return 0;

        const bigrams1 = this.getBigrams(str1);
        const bigrams2 = this.getBigrams(str2);

        const intersection = bigrams1.filter(b => bigrams2.includes(b));
        return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
    }

    /**
     * Get bigrams (pairs of consecutive characters) from a string
     */
    private getBigrams(str: string): string[] {
        const bigrams: string[] = [];
        for (let i = 0; i < str.length - 1; i++) {
            bigrams.push(str.slice(i, i + 2));
        }
        return bigrams;
    }

    /**
     * Capitalize first letter of each word
     */
    private capitalizeWords(str: string): string {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Get exercises filtered by muscle group
     */
    async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
        const exercises = await this.getAllExercises();
        return exercises.filter(ex =>
            ex.muscle_group?.toLowerCase() === muscleGroup.toLowerCase()
        );
    }

    /**
     * Search exercises by partial name match
     */
    async searchExercises(query: string): Promise<Exercise[]> {
        if (!query || query.trim().length === 0) return [];

        const exercises = await this.getAllExercises();
        const normalized = query.trim().toLowerCase();

        return exercises.filter(ex => {
            const matchCanonical = ex.canonical_name.toLowerCase().includes(normalized);
            const matchEn = ex.canonical_name_en?.toLowerCase().includes(normalized);
            const matchIt = ex.canonical_name_it?.toLowerCase().includes(normalized);
            const matchAliases = ex.aliases?.some(a => a.toLowerCase().includes(normalized));

            return matchCanonical || matchEn || matchIt || matchAliases;
        });
    }

    /**
     * Add new exercise to library (for admin or user submissions)
     */
    async addExercise(exercise: Omit<Exercise, 'id'>): Promise<Exercise> {
        const { data, error } = await supabase
            .from('exercise_library')
            .insert([exercise])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Invalidate cache
        this.cachedExercises = null;

        return data;
    }

    /**
     * Clear the exercise cache (useful after adding new exercises)
     */
    clearCache(): void {
        this.cachedExercises = null;
        this.cacheTimestamp = 0;
    }
}

const exerciseLibraryService = new ExerciseLibraryService();
export default exerciseLibraryService;
