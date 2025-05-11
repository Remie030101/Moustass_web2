const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const { authMiddleware } = require('../middleware/auth');
const db = require('../config/database');

// Configuration de multer pour le stockage des fichiers audio
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '.webm');
    }
});

const upload = multer({ storage });

// Générer une clé AES à partir d'un code
function generateAESKeyFromCode(code) {
    // Utiliser le code comme "salt" pour générer une clé déterministe
    const key = crypto.pbkdf2Sync(code, 'salt', 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);  // IV aléatoire pour chaque message
    return {
        key: key.toString('hex'),
        iv: iv.toString('hex')
    };
}

// Chiffrer un fichier audio
async function encryptAudio(filePath, key, iv) {
    const fileBuffer = await fs.readFile(filePath);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
    
    // Calculer le hash SHA-256
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    return { encrypted, hash };
}

// Déchiffrer un fichier audio
async function decryptAudio(encryptedData, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// Upload d'un message audio
router.post('/upload-audio', authMiddleware, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Aucun fichier audio fourni' });
        }

        const { encryptionCode } = req.body;
        if (!encryptionCode) {
            return res.status(400).json({ message: 'Code de chiffrement requis' });
        }

        const { key, iv } = generateAESKeyFromCode(encryptionCode);
        const { encrypted, hash } = await encryptAudio(req.file.path, key, iv);

        // Sauvegarder le fichier chiffré
        const encryptedPath = req.file.path + '.encrypted';
        await fs.writeFile(encryptedPath, encrypted);

        // Supprimer le fichier original
        await fs.unlink(req.file.path);

        // Enregistrer dans la base de données
        const [result] = await db.query(
            'INSERT INTO messages (user_id, filename, encrypted_data, sha256_hash, aes_key, aes_iv) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, req.file.filename, encrypted, hash, key, iv]
        );

        res.json({ 
            id: result.insertId,
            message: 'Message chiffré avec succès. Partagez le code de chiffrement de manière sécurisée.'
        });
    } catch (error) {
        console.error('Erreur upload:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload du message audio' });
    }
});

// Récupérer un message audio
router.get('/get-audio/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { encryptionCode } = req.query;

        if (!encryptionCode) {
            return res.status(400).json({ message: 'Code de déchiffrement requis' });
        }

        // Récupérer le message
        const [messages] = await db.query(
            `SELECT m.* FROM messages m 
             LEFT JOIN message_shares ms ON m.id = ms.message_id AND ms.user_id = ?
             WHERE m.id = ? AND (m.user_id = ? OR ms.id IS NOT NULL)`,
            [req.user.id, id, req.user.id]
        );

        if (messages.length === 0) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        const message = messages[0];
        
        // Générer la clé à partir du code fourni
        const { key } = generateAESKeyFromCode(encryptionCode);
        
        // Vérifier la clé de déchiffrement
        if (message.aes_key !== key) {
            return res.status(403).json({ message: 'Code de déchiffrement invalide' });
        }

        // Déchiffrer le message
        const decrypted = await decryptAudio(message.encrypted_data, key, message.aes_iv);

        // Envoyer le fichier audio
        res.setHeader('Content-Type', 'audio/webm');
        res.send(decrypted);
    } catch (error) {
        console.error('Erreur détaillée lors de la récupération:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query
        });
        res.status(500).json({ 
            message: 'Erreur lors de la récupération du message audio',
            details: error.message 
        });
    }
});

// Partager un message avec des utilisateurs spécifiques
router.post('/share-message/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { sharedWith } = req.body; // Tableau d'IDs d'utilisateurs
        
        if (!Array.isArray(sharedWith) || sharedWith.length === 0) {
            return res.status(400).json({ message: 'Veuillez spécifier au moins un utilisateur avec qui partager' });
        }

        // Vérifier que le message appartient à l'utilisateur
        const [messages] = await db.query(
            'SELECT * FROM messages WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (messages.length === 0) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        // Vérifier que tous les utilisateurs existent
        const [users] = await db.query(
            'SELECT id FROM users WHERE id IN (?)',
            [sharedWith]
        );

        if (users.length !== sharedWith.length) {
            return res.status(400).json({ message: 'Un ou plusieurs utilisateurs n\'existent pas' });
        }

        // Supprimer les anciens partages
        await db.query('DELETE FROM message_shares WHERE message_id = ?', [id]);

        // Ajouter les nouveaux partages
        const shareValues = sharedWith.map(userId => [id, userId]);
        await db.query(
            'INSERT INTO message_shares (message_id, user_id) VALUES ?',
            [shareValues]
        );

        res.json({ message: 'Message partagé avec succès' });
    } catch (error) {
        console.error('Erreur partage:', error);
        res.status(500).json({ message: 'Erreur lors du partage du message' });
    }
});

// Récupérer les utilisateurs disponibles pour le partage
router.get('/available-users', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email FROM users WHERE id != ?',
            [req.user.id]
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
    }
});

// Récupérer les messages partagés avec l'utilisateur
router.get('/shared-messages', authMiddleware, async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT m.*, u.email as shared_by 
             FROM messages m 
             JOIN message_shares ms ON m.id = ms.message_id 
             JOIN users u ON m.user_id = u.id 
             WHERE ms.user_id = ? 
             ORDER BY m.created_at DESC`,
            [req.user.id]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des messages partagés' });
    }
});

// Récupérer tous les messages d'un utilisateur
router.get('/messages', authMiddleware, async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT id, filename, created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
    }
});

// Supprimer un message
router.delete('/delete-message/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que le message appartient à l'utilisateur
        const [messages] = await db.query(
            'SELECT * FROM messages WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (messages.length === 0) {
            return res.status(404).json({ message: 'Message non trouvé' });
        }

        // Supprimer le fichier chiffré
        const filePath = path.join(__dirname, '../../uploads', messages[0].filename + '.encrypted');
        await fs.unlink(filePath).catch(() => {}); // Ignorer l'erreur si le fichier n'existe pas

        // Supprimer de la base de données
        await db.query('DELETE FROM messages WHERE id = ?', [id]);

        res.json({ message: 'Message supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du message' });
    }
});

module.exports = router; 