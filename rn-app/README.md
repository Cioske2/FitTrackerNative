# FitTracker Native (Expo)

Base di partenza per migrazione da progetto React Web.

## Comandi
```bash
npm install
npm run start
```

## Struttura principale
Vedi cartelle in `src/` per navigatori, screens, store e services.

## Env
Creare file `.env` con variabili:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
CLARIFAI_API_KEY=...
OPENFOOD_API_KEY=...
GEMINI_API_KEY=...
```
(Non inserire chiavi segrete service role.)

## TODO Migrazione
- Portare logica servizi esistenti in `services/`
- Implementare fetch reali per diario / alimenti
- Integrare chart kit nelle schermate Progress/Dashboard
- Aggiungere dark theme dinamico e preferenze utente
- Gestire ruoli (admin) in store auth

