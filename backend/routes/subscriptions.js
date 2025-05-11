const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');

// Créer une session de paiement Stripe
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Vérifier si l'utilisateur a déjà un abonnement
        const [subscriptions] = await db.query(
            'SELECT * FROM subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        
        if (subscriptions.length > 0) {
            return res.status(400).json({ message: 'Vous avez déjà un abonnement actif' });
        }
        
        // Créer une session de paiement Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Abonnement Premium Moustass',
                            description: 'Accès aux fonctionnalités premium'
                        },
                        unit_amount: 999, // 9.99 EUR
                        recurring: {
                            interval: 'month'
                        }
                    },
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.FRONTEND_URL}/user.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/user.html`,
            client_reference_id: userId.toString()
        });
        
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Erreur Stripe:', error);
        res.status(500).json({ message: 'Erreur lors de la création de la session de paiement' });
    }
});

// Webhook Stripe pour gérer les événements
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Gérer les différents types d'événements
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                const userId = parseInt(session.client_reference_id);
                
                // Mettre à jour le statut de l'utilisateur
                await db.query(
                    'UPDATE users SET is_premium = TRUE WHERE id = ?',
                    [userId]
                );
                
                // Enregistrer l'abonnement
                await db.query(
                    'INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status) VALUES (?, ?, ?, ?)',
                    [userId, session.customer, session.subscription, 'active']
                );
                break;
                
            case 'customer.subscription.deleted':
                const subscription = event.data.object;
                
                // Mettre à jour le statut de l'utilisateur
                await db.query(
                    'UPDATE users SET is_premium = FALSE WHERE id IN (SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?)',
                    [subscription.id]
                );
                
                // Mettre à jour le statut de l'abonnement
                await db.query(
                    'UPDATE subscriptions SET status = "cancelled" WHERE stripe_subscription_id = ?',
                    [subscription.id]
                );
                break;
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Erreur webhook:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// Annuler un abonnement
router.post('/cancel-subscription', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Récupérer l'abonnement actif
        const [subscriptions] = await db.query(
            'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        
        if (subscriptions.length === 0) {
            return res.status(400).json({ message: 'Aucun abonnement actif trouvé' });
        }
        
        // Annuler l'abonnement dans Stripe
        await stripe.subscriptions.del(subscriptions[0].stripe_subscription_id);
        
        res.json({ message: 'Abonnement annulé avec succès' });
    } catch (error) {
        console.error('Erreur annulation:', error);
        res.status(500).json({ message: 'Erreur lors de l\'annulation de l\'abonnement' });
    }
});

module.exports = router; 