// Gestion du formulaire de connexion
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirection selon le rôle
            if (data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

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

// Gestion du formulaire d'inscription
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation du mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        alert(passwordValidation.message);
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            document.getElementById('registerModal').classList.add('hidden');
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors de l\'inscription');
        }
    } catch (error) {
        alert('Erreur lors de l\'inscription');
    }
});

// Gestion du mot de passe oublié
document.getElementById('forgotPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = prompt('Entrez votre adresse email :');
    if (!email) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Gestion de l'affichage/masquage du modal d'inscription
document.getElementById('showRegister').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerModal').classList.remove('hidden');
});

document.getElementById('closeRegister').addEventListener('click', () => {
    document.getElementById('registerModal').classList.add('hidden');
});

// Gestionnaire de soumission du formulaire de changement de mot de passe
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    // Validation du mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        alert(passwordValidation.message);
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ newPassword })
        });
        
        if (response.ok) {
            alert('Mot de passe modifié avec succès !');
            document.getElementById('passwordModal').classList.add('hidden');
        } else {
            const data = await response.json();
            alert(data.message || 'Erreur lors du changement de mot de passe');
        }
    } catch (error) {
        alert('Erreur lors du changement de mot de passe');
    }
}); 