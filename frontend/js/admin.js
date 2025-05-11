// Vérification de l'authentification
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
}

// Chargement des utilisateurs
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const usersList = document.getElementById('usersList');
            usersList.innerHTML = '';
            
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${user.is_premium ? 'Oui' : 'Non'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                            Modifier
                        </button>
                        <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                            Supprimer
                        </button>
                    </td>
                `;
                usersList.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
    }
}

// Ajout d'un utilisateur
document.getElementById('addUserBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Ajouter un utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModal').classList.remove('hidden');
});

// Modification d'un utilisateur
async function editUser(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            document.getElementById('modalTitle').textContent = 'Modifier l\'utilisateur';
            document.getElementById('userId').value = user.id;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userPremium').checked = user.is_premium;
            document.getElementById('userPassword').value = '';
            document.getElementById('userModal').classList.remove('hidden');
        }
    } catch (error) {
        alert('Erreur lors de la récupération des données de l\'utilisateur');
    }
}

// Suppression d'un utilisateur
async function deleteUser(userId) {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadUsers();
            } else {
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur');
        }
    }
}

// Gestion du formulaire utilisateur
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const userData = {
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        is_premium: document.getElementById('userPremium').checked
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        const url = userId
            ? `http://localhost:3000/api/users/${userId}`
            : 'http://localhost:3000/api/users';
            
        const response = await fetch(url, {
            method: userId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            document.getElementById('userModal').classList.add('hidden');
            loadUsers();
        } else {
            alert('Erreur lors de l\'enregistrement de l\'utilisateur');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Fermeture du modal utilisateur
document.getElementById('closeUserModal').addEventListener('click', () => {
    document.getElementById('userModal').classList.add('hidden');
});

// Gestion du menu déroulant
document.getElementById('avatarBtn').addEventListener('click', () => {
    const menu = document.getElementById('dropdownMenu');
    menu.classList.toggle('hidden');
});

// Cacher le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    const menu = document.getElementById('dropdownMenu');
    const button = document.getElementById('avatarBtn');
    
    if (!menu.contains(e.target) && !button.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Gestion du changement de mot de passe
document.getElementById('changePassword').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('passwordModal').classList.remove('hidden');
});

document.getElementById('closePassword').addEventListener('click', () => {
    document.getElementById('passwordModal').classList.add('hidden');
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
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
            alert('Mot de passe changé avec succès');
            document.getElementById('passwordModal').classList.add('hidden');
        } else {
            alert('Erreur lors du changement de mot de passe');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Déconnexion
document.getElementById('logout').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

// Chargement initial des utilisateurs
loadUsers(); 