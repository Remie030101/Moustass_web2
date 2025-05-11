// Récupérer le token depuis l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    alert('Token de réinitialisation manquant');
    window.location.href = 'index.html';
}

// Vérifier la validité du token
async function verifyToken() {
    try {
        const response = await fetch(`http://localhost:3000/api/auth/verify-reset-token/${token}`);
        if (!response.ok) {
            alert('Token invalide ou expiré');
            window.location.href = 'index.html';
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
        window.location.href = 'index.html';
    }
}

// Vérifier le token au chargement de la page
verifyToken();

// Fonction de validation du mot de passe
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
    }
    if (!hasUpperCase) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre majuscule' };
    }
    if (!hasLowerCase) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre minuscule' };
    }
    if (!hasNumbers) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }
    if (!hasSpecialChar) {
        return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial' };
    }
    
    return { valid: true };
}

// Gestion du formulaire de réinitialisation
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation du mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        alert(passwordValidation.message);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        if (response.ok) {
            alert('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
            window.location.href = 'index.html';
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}); 