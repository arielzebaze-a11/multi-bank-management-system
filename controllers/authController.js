const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// CREATE : Inscription d'un utilisateur avec Code PIN
exports.register = async (req, res) => {
    try {
        const { nom, email, telephone, code_pin, agence } = req.body;

        // 1. Création de l'utilisateur avec agence et code_pin
        const newUser = await User.create({ 
            nom, 
            email, 
            telephone, 
            code_pin,
            agence 
        });

        // 2. Automatisme : Création du compte bancaire lié
        const { Account } = require('../models'); 
        await Account.create({ 
            userId: newUser.id, 
            solde: 0.00 
        });

        res.status(201).json({ 
            message: "✅ Compte créé avec succès !", 
            user: {
                id: newUser.id,
                nom: newUser.nom,
                email: newUser.email,
                telephone: newUser.telephone,
                agence: newUser.agence
            }
        });

    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ 
                error: "Validation échouée", 
                details: error.errors.map(e => e.message) 
            });
        }
        res.status(500).json({ error: error.message });
    }
};

// LOGIN : Connexion via Téléphone et Code PIN
exports.login = async (req, res) => {
    try {
        const { email, telephone, code_pin, agence } = req.body;

        // 1. Recherche par Email, Téléphone ET Agence
        const user = await User.findOne({ 
            where: { email, telephone, agence } 
        });

        // 2. Vérification de l'existence et du PIN
        if (!user || user.code_pin !== code_pin) {
            return res.status(401).json({ 
                error: "Identifiants ou Agence incorrects. Vérifiez votre email, téléphone, agence et code PIN." 
            });
        }

        res.json({
            message: "Connexion réussie",
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                agence: user.agence,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE : Mise à jour du profil par l'utilisateur lui-même
exports.updateProfile = async (req, res) => {
    try {
        const { userId, nom, email, telephone, agence } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        // Mise à jour des champs si fournis
        if (nom) user.nom = nom;
        if (email) user.email = email;
        if (telephone) user.telephone = telephone;
        if (agence) user.agence = agence;

        await user.save();
        
        res.json({ 
            message: "Profil mis à jour avec succès !", 
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                agence: user.agence
            } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};