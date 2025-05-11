// Vérification de l'authentification
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'user') {
    window.location.href = 'index.html';
}

// Variables globales
let mediaRecorder;
let audioChunks = [];
let lastRecordingId = null;
let isRecording = false;
let timerInterval;
let seconds = 0;
let currentShareMessageId = null;

// Formatage du temps
function formatTime(s) {
    const mins = String(Math.floor(s / 60)).padStart(2, '0');
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

// Gestion du timer
function startTimer() {
    seconds = 0;
    document.getElementById('timer').textContent = formatTime(seconds);
    timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('timer').textContent = formatTime(seconds);
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

// Gestion de l'enregistrement
document.getElementById('startBtn').addEventListener('click', async () => {
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                stopTimer();
                document.getElementById('startBtn').classList.remove('animate-pulse', 'bg-green-600');
                document.getElementById('startBtn').classList.add('bg-red-500');

                const encryptionCode = document.getElementById('encryptionCode').value;
                if (!encryptionCode) {
                    alert('Veuillez entrer un code de chiffrement');
                    return;
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');
                formData.append('encryptionCode', encryptionCode);

                try {
                    const response = await fetch('http://localhost:3000/api/audio/upload-audio', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: formData
                    });

                    const result = await response.json();
                    if (response.ok) {
                        alert('Message chiffré avec succès. Partagez le code de chiffrement de manière sécurisée.');
                        lastRecordingId = result.id;
                        document.getElementById('decryptKey').value = encryptionCode;
                        document.getElementById('playBtn').disabled = false;
                        loadMessages();
                    } else {
                        alert(result.message || 'Erreur lors de l\'envoi de l\'enregistrement');
                    }
                } catch (error) {
                    alert('Erreur de connexion au serveur');
                }
            };

            mediaRecorder.start();
            isRecording = true;
            startTimer();

            document.getElementById('startBtn').classList.remove('bg-red-500');
            document.getElementById('startBtn').classList.add('bg-green-600', 'animate-pulse');

        } catch (err) {
            console.error('Erreur microphone:', err);
            alert('Impossible d\'accéder au microphone.');
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
    }
});

// Lecture des messages
document.getElementById('playBtn').addEventListener('click', async () => {
    const encryptionCode = document.getElementById('decryptKey').value;
    if (lastRecordingId && encryptionCode) {
        try {
            const response = await fetch(`http://localhost:3000/api/audio/get-audio/${lastRecordingId}?encryptionCode=${encryptionCode}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = url;
                audioPlayer.play();
            } else {
                const error = await response.json();
                alert(error.message || 'Erreur lors de la récupération de l\'enregistrement');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur');
        }
    } else {
        alert('Veuillez entrer le code de déchiffrement');
    }
});

// Chargement des messages
async function loadMessages() {
    try {
        const response = await fetch('http://localhost:3000/api/audio/messages', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            const messagesList = document.getElementById('messagesList');
            messagesList.innerHTML = '';
            
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = 'bg-gray-50 p-4 rounded-md';
                messageElement.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">${new Date(message.created_at).toLocaleString()}</span>
                        <div class="flex space-x-2">
                            <button class="text-blue-500 hover:text-blue-600" onclick="openShareModal(${message.id})">
                                Partager
                            </button>
                            <button class="text-red-500 hover:text-red-600" onclick="deleteMessage(${message.id})">
                                Supprimer
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input type="text" placeholder="Code de déchiffrement" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2">
                        <button onclick="playMessage(${message.id}, this.previousElementSibling.value)"
                            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Lire
                        </button>
                    </div>
                `;
                messagesList.appendChild(messageElement);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
    }
}

// Suppression d'un message
async function deleteMessage(messageId) {
    if (confirm('Voulez-vous vraiment supprimer ce message ?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/audio/delete-message/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadMessages();
            } else {
                alert('Erreur lors de la suppression du message');
            }
        } catch (error) {
            alert('Erreur de connexion au serveur');
        }
    }
}

// Lecture d'un message spécifique
async function playMessage(messageId, encryptionCode) {
    if (!encryptionCode) {
        alert('Veuillez entrer le code de déchiffrement');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/audio/get-audio/${messageId}?encryptionCode=${encryptionCode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audioPlayer = document.getElementById('audioPlayer');
            audioPlayer.src = url;
            audioPlayer.play();
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors de la récupération du message');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
}

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

// Gestion de l'abonnement Premium
document.getElementById('upgradePremium').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('premiumModal').classList.remove('hidden');
});

document.getElementById('closePremium').addEventListener('click', () => {
    document.getElementById('premiumModal').classList.add('hidden');
});

document.getElementById('stripePayment').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/subscriptions/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const { sessionId } = await response.json();
            const stripe = Stripe('votre_cle_publique_stripe');
            await stripe.redirectToCheckout({ sessionId });
        } else {
            alert('Erreur lors de la création de la session de paiement');
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

// Chargement des utilisateurs disponibles pour le partage
async function loadAvailableUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/audio/available-users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const usersList = document.getElementById('usersList');
            usersList.innerHTML = '';
            
            users.forEach(user => {
                const userElement = document.createElement('div');
                userElement.className = 'flex items-center space-x-2';
                userElement.innerHTML = `
                    <input type="checkbox" id="user-${user.id}" value="${user.id}" 
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                    <label for="user-${user.id}" class="text-gray-700">${user.email}</label>
                `;
                usersList.appendChild(userElement);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
    }
}

// Chargement des messages partagés
async function loadSharedMessages() {
    try {
        const response = await fetch('http://localhost:3000/api/audio/shared-messages', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const messages = await response.json();
            const sharedMessagesList = document.getElementById('sharedMessagesList');
            sharedMessagesList.innerHTML = '';
            
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.className = 'bg-gray-50 p-4 rounded-md';
                messageElement.innerHTML = `
                    <div class="flex justify-between items-center">
                        <div>
                            <span class="text-gray-600">${new Date(message.created_at).toLocaleString()}</span>
                            <p class="text-sm text-gray-500">Partagé par : ${message.shared_by}</p>
                        </div>
                    </div>
                    <div class="mt-2">
                        <input type="text" placeholder="Code de déchiffrement" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2">
                        <button onclick="playMessage(${message.id}, this.previousElementSibling.value)"
                            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Lire
                        </button>
                    </div>
                `;
                sharedMessagesList.appendChild(messageElement);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des messages partagés:', error);
    }
}

// Gestion du partage de message
function openShareModal(messageId) {
    currentShareMessageId = messageId;
    document.getElementById('shareModal').classList.remove('hidden');
    loadAvailableUsers();
}

document.getElementById('closeShare').addEventListener('click', () => {
    document.getElementById('shareModal').classList.add('hidden');
    currentShareMessageId = null;
});

document.getElementById('confirmShare').addEventListener('click', async () => {
    if (!currentShareMessageId) return;

    const selectedUsers = Array.from(document.querySelectorAll('#usersList input[type="checkbox"]:checked'))
        .map(checkbox => parseInt(checkbox.value));

    if (selectedUsers.length === 0) {
        alert('Veuillez sélectionner au moins un utilisateur');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/audio/share-message/${currentShareMessageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sharedWith: selectedUsers })
        });
        
        if (response.ok) {
            alert('Message partagé avec succès');
            document.getElementById('shareModal').classList.add('hidden');
            currentShareMessageId = null;
            loadMessages();
            loadSharedMessages();
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors du partage du message');
        }
    } catch (error) {
        alert('Erreur de connexion au serveur');
    }
});

// Chargement initial
loadMessages();
loadSharedMessages(); 