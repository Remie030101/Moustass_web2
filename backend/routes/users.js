const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const db = require('../config/database');

// Récupérer tous les utilisateurs (admin uniquement)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, role, is_premium, created_at FROM users'
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// Récupérer un utilisateur spécifique (admin uniquement)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, role, is_premium, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        res.json(users[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
    }
});

// Créer un nouvel utilisateur (admin uniquement)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email, password, role, is_premium } = req.body;
        
        // Vérifier si l'email existe déjà
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'utilisateur
        const [result] = await db.query(
            'INSERT INTO users (email, password, role, is_premium) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, is_premium]
        );
        
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
    }
});

// Mettre à jour un utilisateur (admin uniquement)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { email, password, role, is_premium } = req.body;
        const userId = req.params.id;
        
        // Vérifier si l'utilisateur existe
        const [users] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? AND id != ?',
            [email, userId]
        );
        
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        
        // Préparer la requête de mise à jour
        let updateQuery = 'UPDATE users SET email = ?, role = ?, is_premium = ?';
        let queryParams = [email, role, is_premium];
        
        // Ajouter le mot de passe à la mise à jour si fourni
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            queryParams.push(hashedPassword);
        }
        
        updateQuery += ' WHERE id = ?';
        queryParams.push(userId);
        
        await db.query(updateQuery, queryParams);
        
        res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
});

// Supprimer un utilisateur (admin uniquement)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Vérifier si l'utilisateur existe
        const [users] = await db.query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Supprimer l'utilisateur
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
    }
});

module.exports = router; 