

nextRep è un'applicazione web progettata per aiutare gli utenti a gestire la propria alimentazione, monitorare i progressi e pianificare allenamenti. Di seguito sono descritte le principali funzionalità e il flusso di utilizzo dell'applicazione.

## 1. Autenticazione
L'accesso all'applicazione avviene tramite un sistema di autenticazione. Gli utenti possono registrarsi o effettuare il login per accedere alle funzionalità personali. L'autenticazione è gestita tramite Supabase.

## 2. Dashboard
Dopo l'accesso, l'utente viene indirizzato alla dashboard, dove può visualizzare una panoramica dei propri dati, come i progressi giornalieri, le statistiche nutrizionali e gli allenamenti recenti.

## 3. Diario Alimentare
L'utente può registrare i pasti giornalieri tramite il diario alimentare:
- Inserimento manuale degli alimenti
- Scansione del codice a barre per aggiungere rapidamente un alimento
- Modifica dei nutrienti degli alimenti
- Visualizzazione dei totali giornalieri

## 4. Gestione Allenamenti
L'app consente di pianificare e registrare gli allenamenti:
- Inserimento di nuovi workout
- Visualizzazione della cronologia degli allenamenti
- Analisi dei progressi tramite grafici

## 5. Analisi e Progressi
Sono disponibili grafici e statistiche per monitorare l'andamento di dieta e allenamenti nel tempo.

## 6. Altre funzionalità
- Gestione degli obiettivi personali
- Amministrazione degli alimenti (per utenti admin)
- Integrazione con servizi esterni tramite API (es. Clarifai, OpenFoodFacts)

## 7. Tecnologie utilizzate
- **Frontend:** React, Vite
- **Backend/API:** Node.js (proxy), Supabase
- **Stile:** CSS personalizzato

---

Per ulteriori dettagli tecnici, consultare i file `README.md` e la documentazione nelle cartelle `src/components` e `src/services`.
