# FitTrackerNative React Native (Expo) Setup

## Prerequisites

- Node.js (18+ recommended)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- Supabase project & credentials
- Gemini API key (for meal analysis)
- OpenRouter API key (for workout parsing)
- (Optional) Spoonacular API key (for fallback food analysis)

## 1. Install dependencies

```
yarn install
# or
npm install
```

## 2. Environment Variables

Create a `.env` file in `rn-app/` with the following (ATTENZIONE: la chiave Open Food Repo sarà inclusa nell’APK e visibile a chiunque decompili l’app):

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

OPENFOODREPO_API_KEY=la-tua-api-key-di-openfoodrepo

```

> You may need to restart the Expo server after changing `.env`.

## 3. Running the App

```
cd rn-app
expo start
```

## Barcode scanning (Open Food Repo + OpenFoodFacts fallback)

La scansione dei codici a barre ora chiama direttamente l’API di Open Food Repo dal client, usando la chiave `OPENFOODREPO_API_KEY` dal `.env` (inclusa nell’APK!). Se il prodotto non viene trovato o c’è errore, la ricerca passa automaticamente a OpenFoodFacts.

**Sicurezza:** la chiave Open Food Repo sarà visibile a chiunque decompili l’APK. Usa questa modalità solo se accetti questo rischio.

## 4. Notes

- All data is real, stored in Supabase (no mock data).
- For AI features, ensure Gemini and OpenRouter keys are valid and have quota.
- If you see import errors, clear Metro cache:
  ```
  expo start -c
  ```
- If you see TypeScript errors about `expo/tsconfig.base`, ensure Expo is installed and try `yarn install` again.

## 5. Project Structure

- `src/components/` — UI components
- `src/services/` — API, AI, and data logic
- `src/store/` — Zustand stores
- `src/screens/` — App screens
- `src/navigation/` — Navigation setup

## 6. Troubleshooting

- Metro bundler errors: prefer static imports, avoid dynamic imports for services.
- API errors: check your `.env` and Supabase/AI keys.
- For further help, see the Expo and Supabase docs.

---

For any issues, check the README and ensure all environment variables are set correctly.
