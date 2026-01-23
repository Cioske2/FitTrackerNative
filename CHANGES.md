# Registro delle Modifiche Dettagliate - FitTracker Native

Data dell'aggiornamento: 23 Gennaio 2026

Questo documento descrive in dettaglio i cambiamenti strutturali, funzionali e tecnici apportati al progetto per modernizzare l'architettura e migliorare la resilienza dell'app.

---

## 1. Architettura e Data Loading
### Migrazione a React Query
È stata rimossa la dipendenza diretta dei componenti dai servizi Supabase.
- **Caching**: Implementata la libreria @tanstack/react-query per gestire il recupero dei dati. I dati vengono ora salvati in una cache locale (staleTime preimpostato a 5 minuti) per ridurre le chiamate di rete.
- **Invalidazione Automatica**: Al salvataggio di un pasto o un allenamento, l'app invalida automaticamente la query correlata, forzando un aggiornamento silenzioso.
- **Persistenza**: Grazie a AsyncStorage, i dati scaricati rimangono disponibili anche se l'app viene chiusa e riaperta completamente offline.

### Repository Pattern
Introdotto un nuovo strato tra i servizi e l'interfaccia utente (cartella src/repositories/).
- **Disaccoppiamento**: I componenti caricano i dati dai repository, che si occupano di decidere se usare la cache o chiamare il server.
- **Helper Unificato**: Creato repositoryHelper.ts per standardizzare la gestione degli errori e il parsing dei dati tramite Zod.

---

## 2. Sistema Offline-First & Resilienza
È stata implementata una logica "Offline-First" completa per garantire che l'utente non perda dati in assenza di connessione.
- **Mutation Queue**: Se un utente aggiunge un alimento o elimina un allenamento mentre è offline, l'azione viene inserita in una coda locale (fittracker-offline-queue).
- **Sync Service**: Creato offlineSyncService che monitora lo stato della connessione e svuota la coda inviando i dati al server Supabase non appena la linea torna disponibile.
- **Aggiornamenti Ottimistici**: L'interfaccia utente si aggiorna istantaneamente quando viene eseguita un'operazione, senza attendere la risposta del server.

---

## 3. Validazione Runtime con Zod
Per prevenire crash dovuti a dati non conformi o modifiche nel database:
- **Schemi Centralizzati**: Creati schemi di validazione in [src/validators/supabaseSchemas.ts](rn-app/src/validators/supabaseSchemas.ts) per ogni tabella (meals, workouts, foods).
- **Type Safety**: TypeScript ora riceve i tipi derivati direttamente dai validatori Zod, garantendo che i dati usati nel codice corrispondano ai tipi del database.

---

## 4. Performance e UI/UX
- **Ottimizzazione Liste**: In [FoodDiaryScreen.tsx](rn-app/src/screens/Diary/FoodDiaryScreen.tsx), il componente ScrollView è stato sostituito con FlatList, migliorando le prestazioni con molti elementi.
- **Ricerca Debounced**: Aggiunto un ritardo di 500ms sulla ricerca dei cibi per evitare chiamate API eccessive.
- **Accessibilità**: Aggiunti accessibilityLabel e accessibilityRole a tutti i pulsanti critici per supportare TalkBack e VoiceOver.

---

## 5. Monitoraggio e Diagnostica (Sentry)
Integrata la piattaforma Sentry per il monitoraggio professionale dell'app:
- **Crash Reporting**: Invio automatico di report in caso di errori fatali.
- **Event Tracking**: Implementate breadcrumbs per tracciare il percorso dell'utente (es. "apertura schermo diario", "scansione barcode fallita").

---

## 6. Logica Funzionale (Workout Parser)
- **Supporto Ripetizioni Variabili**: L'app ora riconosce stringhe come 3x10/8/6.
- **Dettaglio Serie**: I valori specifici di ogni serie vengono salvati nel campo notes del database (es. reps_detail: [10, 8, 6]).
