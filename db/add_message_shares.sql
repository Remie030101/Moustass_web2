USE moustass;

-- Supprimer l'ancien champ is_shared de la table messages
ALTER TABLE messages DROP COLUMN IF EXISTS is_shared;

-- Créer la table message_shares
CREATE TABLE IF NOT EXISTS message_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_share (message_id, user_id)
);

-- Ajouter les index pour optimiser les performances
CREATE INDEX idx_message_shares_message ON message_shares(message_id);
CREATE INDEX idx_message_shares_user ON message_shares(user_id); 