require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connecté à MongoDB'))
    .catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Schéma utilisateur
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalide' });
        }
        req.user = user;
        next();
    });
};

// Middleware pour vérifier si l'utilisateur est un admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }
    next();
};

// Routes pour l'administration
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        console.log('Tentative de récupération des utilisateurs');
        console.log('Token reçu:', req.headers['authorization']);
        console.log('Utilisateur authentifié:', req.user);
        
        const users = await User.find({}, { password: 0 });
        console.log('Utilisateurs trouvés:', users);
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route temporaire pour vérifier les utilisateurs (à supprimer en production)
app.get('/api/check-users', async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role: role || 'user' });
        await user.save();
        res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Identifiants invalides' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour les données privées
app.get('/api/private-data', authenticateToken, (req, res) => {
    res.json({ message: 'Données privées', user: req.user });
});

// Port d'écoute
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 