const axios = require('axios');

// Funzione helper per formattare la risposta di Open Food Facts
function formatProductData(product) {
    // Verifica iniziale più robusta
    if (!product || typeof product !== 'object') {
        console.warn("formatProductData: Prodotto non valido o mancante", product);
        return null;
    }
    if (!product.product_name && !product.product_name_it && !product.product_name_en && !product.generic_name) {
        console.warn("formatProductData: Nome del prodotto essenziale mancante", product);
        return null; // Dati essenziali mancanti
    }

    const nutriments = product.nutriments || {}; // Assicura che nutriments sia un oggetto

    // Funzione helper per ottenere valori nutritivi con fallback
    const getNutrimentValue = (keys, unit = '') => {
        for (const key of keys) {
            if (nutriments[key] !== undefined && nutriments[key] !== null && nutriments[key] !== "") {
                // Potrebbe essere necessario convertire in numero se sono stringhe, ma l'API di OFF di solito li dà come numeri
                // Per ora, li lasciamo come sono, il frontend li formatterà se necessario.
                return nutriments[key];
            }
        }
        return null; // o 'N/D' se si preferisce una stringa
    };

    const productName = product.product_name_it || product.product_name_en || product.product_name || product.generic_name || "N/A";

    return {
        product_name: productName,
        generic_name: product.generic_name_it || product.generic_name_en || product.generic_name || "",
        image_url: product.image_front_url || product.image_url || product.image_small_url || null,
        quantity: product.quantity || null,
        brands: product.brands || null,
        categories: product.categories || null,
        ingredients_text: product.ingredients_text_it || product.ingredients_text_en || product.ingredients_text || null,
        nutriments: {
            "energy-kcal_100g": getNutrimentValue(["energy-kcal_100g", "energy-kcal_value", "energy_value"]),
            "fat_100g": getNutrimentValue(["fat_100g"]),
            "saturated-fat_100g": getNutrimentValue(["saturated-fat_100g"]),
            "carbohydrates_100g": getNutrimentValue(["carbohydrates_100g"]),
            "sugars_100g": getNutrimentValue(["sugars_100g"]),
            "fiber_100g": getNutrimentValue(["fiber_100g"]),
            "proteins_100g": getNutrimentValue(["proteins_100g"]),
            "salt_100g": getNutrimentValue(["salt_100g"]),
            "sodium_100g": getNutrimentValue(["sodium_100g"])
        },
        nutriscore_grade: product.nutriscore_grade || null,
        nova_group: product.nova_group || null, // Potrebbe essere product.nova_groups
        ecoscore_grade: product.ecoscore_grade || null,
        gtin: product.code || product.id || null
    };
}

module.exports = async (req, res) => {
    console.log("[PROXY] Received request for openfoodfacts-proxy");
    const { gtin } = req.query;

    if (!gtin) {
        console.error("[PROXY] GTIN parameter is missing");
        return res.status(400).json({ error: 'GTIN parameter is required' });
    }
    console.log(`[PROXY] Processing GTIN: ${gtin}`);

    const OFF_API_URL = `https://world.openfoodfacts.org/api/v2/product/${gtin}.json`;
    const USER_AGENT = "NutriApp/1.0 (Node.js Backend; +https://github.com/your-repo) - Educational Project";

    try {
        console.log(`[PROXY] Fetching data from URL: ${OFF_API_URL}`);
        const response = await axios.get(OFF_API_URL, {
            headers: { 'User-Agent': USER_AGENT },
            timeout: 10000
        });
        console.log("[PROXY] Received response from Open Food Facts API");
        // console.log("[PROXY] Raw response data:", JSON.stringify(response.data, null, 2)); // Log completo, può essere molto verboso

        if (response.data && response.data.product) {
            console.log("[PROXY] Product data found in response. Status:", response.data.status);
            if (response.data.status === 0 && response.data.product && Object.keys(response.data.product).length === 0) {
                 // Caso speciale: status 0 ma product è un oggetto vuoto (prodotto non trovato effettivamente)
                console.warn(`[PROXY] Product with GTIN ${gtin} not truly found (status 0, empty product object).`);
                return res.status(404).json({ error: `Product with GTIN ${gtin} not found. Reason: ${response.data.status_verbose || 'Product not found (empty product data)'}` });
            }

            let formattedProduct;
            try {
                console.log("[PROXY] Attempting to format product data...");
                // console.log("[PROXY] Raw product data for formatting:", JSON.stringify(response.data.product, null, 2));
                formattedProduct = formatProductData(response.data.product);
                console.log("[PROXY] Product data formatted successfully.");
            } catch (formatError) {
                console.error(`[PROXY] Error during product data formatting for GTIN ${gtin}:`, formatError);
                // Questo errore interno durante la formattazione è un 500 per il nostro proxy
                return res.status(500).json({ error: `Internal server error during data formatting: ${formatError.message}` });
            }

            if (formattedProduct) {
                console.log(`[PROXY] Sending formatted product data for GTIN ${gtin} to client.`);
                return res.status(200).json(formattedProduct);
            } else {
                console.warn(`[PROXY] Product data for GTIN ${gtin} was considered incomplete or missing essential fields after formatting.`);
                return res.status(404).json({ error: `Product data for GTIN ${gtin} is incomplete or missing essential fields after formatting.` });
            }
        } else if (response.data && response.data.status === 0) {
            console.warn(`[PROXY] Product with GTIN ${gtin} not found according to API status 0. Verbose: ${response.data.status_verbose}`);
            return res.status(404).json({ error: `Product with GTIN ${gtin} not found. Reason: ${response.data.status_verbose || 'Not specified'}` });
        } else {
            console.warn(`[PROXY] Unexpected response structure or product not found for GTIN ${gtin}. Raw data:`, JSON.stringify(response.data, null, 2).substring(0, 500) + "...");
            return res.status(404).json({ error: `Product with GTIN ${gtin} not found or API returned an unexpected response.` });
        }
    } catch (error) {
        console.error(`[PROXY] General error fetching/processing data for GTIN ${gtin}:`, error);
        if (error.response) {
            console.error(`[PROXY] Error response from Open Food Facts API: Status ${error.response.status}`, error.response.data);
            return res.status(error.response.status).json({
                error: `Open Food Facts API error: ${error.response.statusText || error.message}`,
                details: error.response.data
            });
        } else if (error.request) {
            console.error("[PROXY] No response received from Open Food Facts API (error.request)");
            return res.status(504).json({ error: 'No response from Open Food Facts API (Gateway Timeout)' });
        } else {
            console.error("[PROXY] Error in setting up the request to Open Food Facts API (error.message):", error.message);
            return res.status(500).json({ error: `Internal server error: ${error.message}` });
        }
    }
};
