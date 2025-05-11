const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/auth');
const db = require('../config/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuration de l'envoi d'emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, 'user']
    );

    const token = generateToken({ id: result.insertId, email, role: 'user' });
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Réinitialisation du mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // Expire dans 1 heure

    // Supprimer les anciennes demandes de réinitialisation
    await db.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

    // Créer une nouvelle demande de réinitialisation
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    const resetLink = `http://localhost:5173/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien suivant pour définir un nouveau mot de passe :</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      `
    });

    res.json({ message: 'Un email a été envoyé avec les instructions de réinitialisation' });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

// Vérifier le token de réinitialisation
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const [resets] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la vérification du token' });
  }
});

// Réinitialiser le mot de passe avec le token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Vérifier le token
    const [resets] = await db.query(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (resets.length === 0) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    const reset = resets[0];

    // Valider le nouveau mot de passe
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < minLength) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    if (!hasUpperCase) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une lettre majuscule' });
    }
    if (!hasLowerCase) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une lettre minuscule' });
    }
    if (!hasNumbers) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un chiffre' });
    }
    if (!hasSpecialChar) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un caractère spécial' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.user_id]);

    // Supprimer la demande de réinitialisation
    await db.query('DELETE FROM password_resets WHERE id = ?', [reset.id]);

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ message: 'Erreur lors de la réinitialisation du mot de passe' });
  }
});

module.exports = router; 