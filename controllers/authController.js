const User = require('../models/User');
const Account = require('../models/Account');

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

// LOGIN : Voir ses informations (Connexion via Téléphone, PIN et Agence)
exports.login = async (req, res) => {
    try {
        // On ne récupère que ce qui est nécessaire
        const { telephone, code_pin, agence } = req.body;

        // 1. Recherche uniquement par Téléphone et Agence
        const user = await User.findOne({ 
            where: { telephone, agence } 
        });

        // 2. Vérification de l'existence et du PIN
        if (!user || user.code_pin !== code_pin) {
            return res.status(401).json({ 
                error: "Accès refusé. Téléphone, Agence ou Code PIN incorrect." 
            });
        }

        // 3. Réponse avec les informations
        res.json({
            message: "Informations récupérées avec succès",
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

// UPDATE : Mise à jour du profil
exports.updateProfile = async (req, res) => {
    try {
        const { userId, nom, email, telephone, agence } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

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