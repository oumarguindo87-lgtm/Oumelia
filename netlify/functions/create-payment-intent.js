// netlify/functions/create-payment-intent.js
// Cette fonction tourne sur les serveurs Netlify — la clé secrète Stripe n'est jamais exposée

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Autoriser les requêtes CORS depuis oumelia.com
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Gérer la requête OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { type, email } = JSON.parse(event.body);

    // Prix selon le type de paiement
    const prices = {
      profil:   599,  // 5,99€ en centimes
      demandes: 299,  // 2,99€ en centimes
      boost:    299,  // 2,99€ en centimes
    };

    const descriptions = {
      profil:   'Activation profil Oumelia',
      demandes: 'Pack 3 demandes Oumelia',
      boost:    'Boost 7 jours Oumelia',
    };

    const amount = prices[type];
    if (!amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Type de paiement invalide' }),
      };
    }

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      description: descriptions[type],
      receipt_email: email || undefined,
      metadata: { type, platform: 'oumelia' },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        amount,
        type,
      }),
    };

  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
