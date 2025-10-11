# nextRep - Fitness & Nutrition Tracker

**nextRep** è un'applicazione React Native (Expo) completa per il monitoraggio dell'alimentazione, degli allenamenti e degli obiettivi fitness personali. L'app integra intelligenza artificiale per l'analisi automatica di pasti tramite foto, parsing di schede di allenamento e ricerca automatica di prodotti alimentari tramite barcode.

---

## Funzionalità Principali

### Diario Alimentare
- **Registrazione pasti giornalieri** con calcolo automatico dei macronutrienti
- **Scansione barcode** con integrazione Open Food Repo e OpenFoodFacts come fallback
- **Ricerca alimenti** nel database Supabase con aggiunta rapida
- **Analisi pasti tramite foto AI** (Gemini Vision): scatta o carica una foto del piatto e ottieni automaticamente ingredienti e macros stimati
- **Cronologia giornaliera** con totali calorici e macro visualizzati in tempo reale
- **Modifica e eliminazione** voci del diario
- **Pasti composti AI**: salva automaticamente analisi multi-piatto dalla foto

### Gestione Allenamenti
- **Registrazione esercizi** con serie, ripetizioni e peso
- **Cronologia allenamenti** raggruppata per data
- **Grafici di progressione** per ogni esercizio con calcolo % miglioramento
- **Scheda settimanale**: pianifica allenamenti per ogni giorno della settimana
- **Parsing AI** (OpenRouter): incolla la tua scheda di allenamento testuale e l'AI la converte automaticamente in esercizi strutturati
- **Visualizzazione esercizi pianificati** per oggi

### Obiettivi Personalizzati
- **Creazione obiettivi custom** con target numerici e unità di misura
- **Tracciamento stato** (attivo/completato)
- **Dashboard centralizzata** con overview degli obiettivi

### Dashboard & Analytics
- **Panoramica giornaliera** con macro totali (calorie, proteine, carboidrati, grassi)
- **Grafico storico 7 giorni** dei valori nutrizionali
- **Scheda di allenamento settimanale** visibile e modificabile inline
- **Esercizi pianificati per oggi** con dettagli su serie/reps/peso

### Autenticazione
- **Login/Registrazione** tramite Supabase Auth
- **Sessioni persistenti** con auto-refresh
- **Role-based access**: supporto ruolo admin per funzionalità avanzate

---

## Stack Tecnologico

### Frontend
- **React Native** 0.81+ con **Expo SDK 54**
- **TypeScript** per type safety
- **React Navigation** (stack + bottom tabs)
- **Zustand** per state management
- **React Native Chart Kit** per grafici di progressione
- **expo-camera** per scansione barcode e foto pasti
- **expo-image-picker** per selezione immagini dalla galleria

### Backend & Database
- **Supabase** (PostgreSQL) per:
  - Autenticazione utenti
  - Tabelle: `foods`, `diary_entries`, `workouts`, `workout_plans`, `goal_items`, `composite_meals`
  - Storage e gestione sessioni
  - RLS (Row Level Security) per sicurezza dati

### AI & API Integrations
- **Google Gemini 1.5 Flash** (API diretta):
  - Analisi immagini pasti (Vision)
  - Stima macronutrienti da testo
  - Correzione/ricerca info nutrizionali prodotti
- **OpenRouter** (DeepSeek R1):
  - Parsing intelligente schede di allenamento
- **Open Food Repo** (API diretta client-side):
  - Ricerca prodotti tramite barcode (primaria)
- **OpenFoodFacts** (fallback):
  - Database pubblico prodotti alimentari internazionali

---

## Struttura del Progetto

```
rn-app/
├── src/
│   ├── App.tsx                          # Entry point principale
│   ├── components/                      # Componenti riutilizzabili
│   │   ├── DailyTotalsDisplay.tsx      # Widget totali giornalieri
│   │   ├── charts/                      # Componenti grafici
│   │   └── layout/
│   │       └── Card.tsx                 # Card UI generica
│   ├── navigation/                      # Configurazione navigazione
│   │   ├── RootNavigator.tsx           # Navigator principale (Auth/Main)
│   │   ├── AuthNavigator.tsx           # Stack autenticazione
│   │   └── MainTabNavigator.tsx        # Tab bar principale
│   ├── screens/                         # Schermate app
│   │   ├── Auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── Dashboard/
│   │   │   └── DashboardScreen.tsx     # Home con overview
│   │   ├── Diary/
│   │   │   ├── FoodDiaryScreen.tsx     # Diario alimentare
│   │   │   ├── BarcodeScannerScreen.tsx # Scanner barcode
│   │   │   ├── MealAnalysisScreen.tsx   # Analisi pasti AI
│   │   │   └── EditDiaryEntryModal.tsx  # Modifica voce diario
│   │   ├── Workouts/
│   │   │   └── WorkoutScreen.tsx        # Allenamenti + grafici
│   │   ├── Goals/
│   │   │   └── GoalsScreen.tsx          # Gestione obiettivi
│   │   └── Admin/
│   │       └── FoodAdminScreen.tsx      # Admin alimenti (placeholder)
│   ├── services/                        # Logica business & API
│   │   ├── supabaseClient.ts           # Client Supabase configurato
│   │   ├── foodService.ts              # CRUD alimenti
│   │   ├── diaryService.ts             # CRUD diario
│   │   ├── workoutService.ts           # CRUD allenamenti + scheda
│   │   ├── barcodeService.ts           # Lookup barcode (FoodRepo + OFF)
│   │   ├── geminiService.ts            # Integrazioni Gemini AI
│   │   ├── imageMealAnalysisService.ts # Analisi foto pasti
│   │   ├── workoutParser.ts            # Parsing AI schede allenamento
│   │   ├── goalItemsService.ts         # CRUD obiettivi custom
│   │   └── nutritionService.ts         # (eventuali calcoli nutrizionali)
│   ├── store/                           # State management Zustand
│   │   ├── authStore.ts                # Autenticazione e sessione
│   │   ├── diaryStore.ts               # Stato diario alimentare
│   │   ├── foodStore.ts                # Ricerca e cache alimenti
│   │   ├── workoutStore.ts             # Allenamenti e progressi
│   │   ├── goalItemsStore.ts           # Obiettivi custom
│   │   └── goalsStore.ts               # (eventuale store macro goals)
│   ├── theme/
│   │   └── colors.ts                    # Palette colori dark theme
│   └── utils/                           # Utility functions
├── assets/                              # Immagini e risorse
│   ├── icon.png
│   └── nextRep.png
├── app.config.js                        # Configurazione Expo dinamica
├── App.tsx                              # Re-export da src/App.tsx
├── babel.config.js
├── tsconfig.json
├── package.json
└── eas.json                             # Config build EAS
```

---

## Setup & Installazione

### Prerequisiti

- **Node.js** 18+ (consigliato LTS)
- **Yarn** o **npm**
- **Expo CLI** (installabile globalmente: `npm install -g expo-cli`)
- Account **Supabase** con progetto configurato e tabelle create
- API Keys:
  - **Gemini API Key** (Google AI Studio)
  - **OpenRouter API Key** (per parsing allenamenti AI)
  - **Open Food Repo API Key** (per barcode scanning)

### 1. Clona il Repository

```bash
git clone https://github.com/your-repo/FitTrackerNative.git
cd FitTrackerNative/rn-app
```

### 2. Installa le Dipendenze

```bash
yarn install
# oppure
npm install
```

### 3. Configurazione Environment Variables

Crea un file `.env` nella cartella `rn-app/` con le seguenti variabili:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Food APIs
OPENFOODREPO_API_KEY=your-foodrepo-api-key
```

> ⚠️ **Nota Sicurezza**: Le API keys inserite nel file `.env` vengono incluse nell'APK finale tramite `app.config.js` (extra config). La chiave Open Food Repo sarà visibile a chiunque decompili l'app. Usa questa configurazione solo se accetti questo rischio. Per ambienti di produzione, considera un backend proxy per proteggere le chiavi.

### 4. Configurazione Database Supabase

Assicurati di avere le seguenti tabelle nel tuo progetto Supabase:

- **`foods`**: id, name, serving_size, serving_unit, calories, protein_g, carbohydrates_total_g, carbohydrates_fiber_g, carbohydrates_sugar_g, fat_total_g, fat_saturated_g, barcode, brand, is_generic, created_at
- **`diary_entries`**: id, user_id, food_id, food_name_snapshot, consumed_quantity, consumed_unit, conversion_factor, calories_calculated, protein_g_calculated, carbohydrates_total_g_calculated, fat_total_g_calculated, fiber_g_calculated, sugar_g_calculated, meal_type, consumption_date, notes, created_at
- **`workouts`**: id, user_id, exercise, workout_date, sets, reps, weight, notes, created_at
- **`workout_plans`**: id, user_id, weekday (0-6), exercise, sets, reps, notes, created_at
- **`goal_items`**: id, user_id, title, description, type, direction, target_value, unit, status, created_at
- **`composite_meals`**: id, user_id, name, meal_type, date, items (JSONB), total_calories, total_protein, total_carbs, total_fat, created_at

Abilita **Row Level Security (RLS)** su tutte le tabelle per proteggere i dati degli utenti.

### 5. Avvia l'App

```bash
cd rn-app
expo start
```

Oppure per avviare direttamente su piattaforma specifica:

```bash
expo start --android  # Android
expo start --ios      # iOS (richiede macOS)
expo start --web      # Web browser
```

Usa l'app **Expo Go** (iOS/Android) per testare su dispositivo fisico, oppure un emulatore/simulatore.

---

## Guida d'Uso

### 1. **Registrazione & Login**
- All'avvio, se non autenticato, appare la schermata di login
- Crea un nuovo account o accedi con credenziali esistenti
- L'autenticazione è gestita da Supabase Auth con sessioni persistenti

### 2. **Dashboard**
- Panoramica macro giornalieri (calorie, proteine, carboidrati, grassi)
- Grafico storico 7 giorni per visualizzare trend nutrizionali
- Vista rapida della scheda di allenamento settimanale con possibilità di modifica inline
- Esercizi pianificati per oggi (basati su giorno della settimana)

### 3. **Diario Alimentare**
- **Aggiungi alimento**:
  - Ricerca nel database tramite barra di ricerca
  - Scansiona barcode (tap icona scanner) per aggiunta automatica da Open Food Repo/OpenFoodFacts
  - Inserimento manuale rapido con nome, quantità e macro
  - Analisi pasto AI: scatta foto o scegli dalla galleria, l'AI identifica piatti e stima macro
- **Modifica/Elimina**: tap su una voce per modificare quantità/macro o eliminarla
- **Cronologia**: cambia data con frecce per visualizzare giorni precedenti/successivi
- **Totali giornalieri**: widget sempre visibile con somma calorie e macro

### 4. **Allenamenti**
- **Aggiungi allenamento**: inserisci esercizio, serie, ripetizioni, peso
- **Parsing AI**: incolla testo scheda (es. "Panca piana 4x8 80kg") e l'AI struttura automaticamente
- **Cronologia**: vedi allenamenti raggruppati per data
- **Grafici progressione**: seleziona un esercizio e visualizza l'andamento del peso nel tempo
- **Scheda settimanale**: pianifica esercizi per ogni giorno (DOM=0, LUN=1, ..., SAB=6)

### 5. **Obiettivi**
- Crea obiettivi personalizzati (es. "Peso corporeo 75kg", "Corsa 10km")
- Imposta target numerico e unità di misura
- Marca come completato o elimina

### 6. **Scanner Barcode**
- Inquadra il codice a barre del prodotto
- Ricerca automatica su Open Food Repo (primaria) e OpenFoodFacts (fallback)
- Conferma quantità e aggiungi al diario
- Badge visivo indica la fonte del prodotto (FoodRepo / OpenFoodFacts)

### 7. **Analisi Pasto AI (Gemini Vision)**
- Tap su "Analisi Pasto" nel diario
- Scatta foto o scegli dalla galleria
- L'AI identifica piatti, ingredienti e stima macro
- Modifica nome/quantità/macro se necessario
- Salva: il pasto viene registrato come "Pasto AI" composito nel diario

---

## 🔧 Configurazione Avanzata

### Build con EAS (Expo Application Services)

Per creare build standalone (APK/IPA):

```bash
# Installa EAS CLI globalmente
npm install -g eas-cli

# Login
eas login

# Configura progetto (se non già fatto)
eas build:configure

# Build Android (development/preview/production)
eas build --platform android --profile preview

# Build iOS (richiede Apple Developer account)
eas build --platform ios --profile preview
```

Le configurazioni di build sono in `eas.json`.

### Personalizzazione Tema

I colori dell'app sono definiti in `src/theme/colors.ts`:

```typescript
export const colors = {
  background: '#0a0e13',
  card: '#161b22',
  cardAlt: '#1f242d',
  accent: '#38bdf8',
  textPrimary: '#e6edf3',
  textSecondary: '#bfc6d1',
  textMuted: '#768390',
  border: '#30363d',
  borderAlt: '#21262d',
  danger: '#d32f2f',
  success: '#7ee787',
};
```

Modifica questi valori per cambiare l'aspetto dell'app (attualmente dark theme).

### Aggiungere Nuovi Alimenti al Database

Usa la schermata Admin (visibile solo per utenti con `role='admin'` in Supabase):
- Tab "Admin" nella bottom bar
- (Placeholder: implementa form CRUD per aggiungere/modificare alimenti)

In alternativa, usa il client Supabase web o aggiungi direttamente tramite API `foodService.addFood()`.

---

## Troubleshooting

### Metro Bundler Errors
Se vedi errori di import o cache corrotta:
```bash
expo start -c
# oppure
yarn start --reset-cache
```

### TypeScript Errors (expo/tsconfig.base)
Assicurati di avere Expo installato:
```bash
yarn add expo@latest
```

### API Errors / Unauthorized
- Verifica che le API keys nel `.env` siano corrette e attive
- Controlla i log di Supabase per errori di autenticazione
- Verifica che le tabelle abbiano RLS configurato correttamente

### Barcode Scanner Non Funziona
- Assicurati di aver concesso i permessi fotocamera
- Verifica che `expo-camera` sia installato: `expo install expo-camera`
- Riavvia l'app dopo aver concesso i permessi

### Gemini AI Errors
- Verifica che la chiave `GEMINI_API_KEY` sia valida
- Controlla quota API su Google AI Studio
- Verifica connessione internet e endpoint API

### OpenRouter Parsing Fails
- Controlla quota OpenRouter e validità chiave
- Usa il fallback "parsing semplice" se il modello AI non risponde

---

## Dipendenze Principali

```json
{
  "@expo/vector-icons": "^15.0.2",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "@react-navigation/bottom-tabs": "^7.4.7",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.3.26",
  "@supabase/supabase-js": "^2.45.0",
  "expo": "^54.0.7",
  "expo-camera": "~17.0.7",
  "expo-constants": "~18.0.8",
  "expo-file-system": "~19.0.14",
  "expo-image-picker": "~17.0.8",
  "react": "19.1.0",
  "react-native": "^0.81.4",
  "react-native-chart-kit": "^6.12.0",
  "react-native-svg": "15.12.1",
  "zustand": "^4.5.2"
}
```

---

## Contribuire

Contributi, issue e feature request sono benvenuti!

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi file `LICENSE` per dettagli.

---

## Autore

**Cioske2**

- GitHub: [@Cioske2](https://github.com/Cioske2)
- Repository: [FitTrackerNative](https://github.com/Cioske2/FitTrackerNative)

---

## Ringraziamenti

- **Expo** per il framework React Native
- **Supabase** per backend e autenticazione
- **Google Gemini** per AI vision e analisi testi
- **OpenRouter** per parsing intelligente
- **Open Food Repo** e **OpenFoodFacts** per database prodotti alimentari

---

## Supporto

Per domande o problemi:
- Apri una issue su GitHub
- Consulta la documentazione Expo: https://docs.expo.dev
- Consulta la documentazione Supabase: https://supabase.com/docs

---

**Happy tracking!**
