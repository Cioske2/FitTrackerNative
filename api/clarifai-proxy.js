// File: api/clarifai-proxy.js

import axios from 'axios';

export default async function handler(req, res) {
  // Assicurati che sia una richiesta POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Leggi le variabili d'ambiente dal server (Vercel le inietta da process.env)
  // Nota: Nelle funzioni serverless di Vercel, le variabili definite nelle impostazioni del progetto
  // sono accessibili tramite process.env.NOME_VARIABILE.
  const CLARIFAI_API_KEY = process.env.VITE_CLARIFAI_API_KEY;
  const USER_ID_FOR_API = process.env.VITE_CLARIFAI_USER_ID || 'clarifai';
  const APP_ID_FOR_API = process.env.VITE_CLARIFAI_APP_ID || 'main';
  const MODEL_ID_FOR_API = process.env.VITE_CLARIFAI_MODEL_ID || 'food-item-recognition';
  // Usiamo la MODEL_VERSION_ID specifica dall'esempio di Clarifai come default,
  // a meno che non sia sovrascritta da una variabile d'ambiente.
  const MODEL_VERSION_ID_FOR_API = process.env.VITE_CLARIFAI_MODEL_VERSION_ID || '1d5fd481e0cf4826aa72ec3ff049e044';

  if (!CLARIFAI_API_KEY) {
    console.error("SERVER PROXY ERROR: Clarifai API Key non è configurata nelle variabili d'ambiente del server (VITE_CLARIFAI_API_KEY).");
    return res.status(500).json({ error: 'Configurazione del server proxy incompleta: API Key mancante.' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Nessuna immagine fornita (imageBase64 mancante nel corpo della richiesta).' });
    }

    // Payload per l'endpoint /outputs quando si specifica modello e versione nell'URL
    // Model_id e version_id non sono nel corpo del payload ma nell'URL.
    const finalRequestPayload = {
      user_app_id: { // Includerlo è una buona pratica per specificare il contesto, anche se a volte opzionale con PAT.
        user_id: USER_ID_FOR_API,
        app_id: APP_ID_FOR_API
      },
      inputs: [
        {
          data: {
            image: {
              base64: imageBase64,
            },
          },
        },
      ],
    };

    // Costruisci l'URL con la versione del modello. Se MODEL_VERSION_ID_FOR_API è una stringa vuota,
    // la chiamata potrebbe fallire o usare l'ultima versione, a seconda di come Clarifai gestisce.
    // L'esempio JS di Clarifai USA la version_id, quindi la includiamo.
    const clarifaiApiUrl = `https://api.clarifai.com/v2/users/${USER_ID_FOR_API}/apps/${APP_ID_FOR_API}/models/${MODEL_ID_FOR_API}/versions/${MODEL_VERSION_ID_FOR_API}/outputs`;

    // console.log(`Proxy: Chiamata a Clarifai URL: ${clarifaiApiUrl}`);
    // console.log("Proxy: Payload per Clarifai (parziale):", { user_app_id: finalRequestPayload.user_app_id });


    const clarifaiResponse = await axios.post(
      clarifaiApiUrl,
      finalRequestPayload, // Usa il payload semplificato/corretto
      {
        headers: {
          'Authorization': `Key ${CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Inoltra la risposta di Clarifai al client
    return res.status(clarifaiResponse.status).json(clarifaiResponse.data);

  } catch (error) {
    console.error('SERVER PROXY ERROR: Errore nel proxy Clarifai:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    const statusCode = error.response ? error.response.status : 500;
    const errorDetails = error.response?.data?.status?.description ||
                         error.response?.data?.message ||
                         error.message ||
                         'Errore interno del server proxy.';

    // Aggiungi dettagli sulla richiesta originale se disponibili e non contengono dati sensibili
    let requestInfo = {};
    if (error.config) {
        requestInfo.method = error.config.method;
        requestInfo.url = error.config.url;
        // Non loggare error.config.data se contiene l'immagine base64
    }
    console.error('SERVER PROXY ERROR: Dettagli richiesta fallita:', requestInfo)

    return res.status(statusCode).json({
        error: 'Errore durante la comunicazione con il servizio di analisi immagini via proxy.',
        details: errorDetails,
        proxy_error_details: error.response?.data // Includi l'intero oggetto errore da Clarifai se disponibile
    });
  }
}
