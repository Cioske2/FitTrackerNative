# Guida al Setup e Manutenzione (FitTracker Native)

Questa guida spiega come configurare e gestire le nuove funzionalità introdotte: **Sentry (Analytics & Crash Reporting)**, **React Query (Caching & Offline)** e il **Repository Pattern**.

---

## 1. Configurazione Sentry (Monitoraggio Errori)

Per attivare il tracking dei crash e degli eventi:

1. **Crea un account**: Vai su [sentry.io](https://sentry.io).
2. **Crea un Progetto**: Seleziona "React Native" come piattaforma.
3. **Ottieni il DSN**: 
   - Vai in `Settings` > `Projects` > `[Tuo Progetto]` > `Client Keys (DSN)`.
   - Copia la URL del DSN.
4. **Configurazione Locale**:
   - Assicurati che nel file `app.config.js` o `.env` (se lo usi) sia presente il DSN.
   - Attualmente il codice cerca la chiave in `src/services/analyticsService.ts`.

---

## 2. Architettura Offline-First

L'app ora utilizza un sistema di coda per gestire le operazioni quando non c'è internet.

- **Cache Interne**: Gestite da `React Query`. I dati rimangono visibili anche senza connessione (persistenza su `AsyncStorage`).
- **Coda Mutazioni**: Se provi ad aggiungere un pasto o un allenamento mentre sei offline:
  1. L'operazione viene salvata localmente in `fittracker-offline-queue`.
  2. L'interfaccia si aggiorna "ottimisticamente" (mostra il dato come se fosse salvato).
  3. Al ritorno della connessione (o al prossimo riavvio), `offlineSyncService` invia i dati al server.

---

## 3. Repository Pattern (Sviluppo Moduli)

Non chiamare mai `supabaseClient` o i servizi direttamente dai componenti. Usa i **Repositories**.

### Esempio: Come aggiungere una nuova funzionalità
Se devi aggiungere la gestione di "Esercizi Preferiti":
1. **Validator**: Crea uno schema Zod in `src/validators/supabaseSchemas.ts`.
2. **Repository**: Crea `src/repositories/exerciseRepository.ts`.
   - Implementa i metodi (get, add, delete).
   - Usa `repositoryHelper.execute` per gestire errori e validazione.
3. **Store/UI**: Usa `useQuery` o `useMutation` (React Query) all'interno dello store Zustand per chiamare il repository.

---

## 4. Variabili d'Ambiente (.env)

Il progetto richiede un file `.env` nella root di `rn-app/` con:

```env
EXPO_PUBLIC_SUPABASE_URL=tua_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tua_chiave_anonima
SENTRY_DSN=tuo_dsn_sentry
```

---

## 5. Troubleshooting (Risoluzione Problemi)

- **I dati non si aggiornano**: Controlla la `staleTime` in `src/queryClient.ts`. React Query potrebbe servire dati vecchi per risparmiare API calls.
- **Sincronizzazione fallita**: Controlla i log in console. Se una mutazione offline fallisce (es. dato non valido), rimarrà nella coda finché non viene risolta o cancellata manualmente.
- **Errori di Tipo (TypeScript)**: Se i dati dal database cambiano, aggiorna prima gli schemi Zod in `src/validators/supabaseSchemas.ts`.
