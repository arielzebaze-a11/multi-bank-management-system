const User = require('../models/User');
const Account = require('../models/Account');
const Bank = require('../models/Bank'); // Ajout du modèle Bank

// 1. INSCRIPTION
exports.register = async (req, res) => {
    try {
        const { nom, email, telephone, code_pin, code_agence } = req.body;

        // A. Vérifier si l'agence existe via son code à 10 caractères
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            return res.status(404).json({ error: "Agence introuvable. Veuillez vérifier le code d'agence." });
        }

        // B. Vérifier si un compte existe déjà pour ce numéro DANS CETTE BANQUE
        // Un utilisateur peut avoir un compte chez UBA et un chez Afriland
        const existingAccount = await Account.findOne({
            include: [{
                model: User,
                where: { telephone }
            }],
            where: { bankId: bank.id }
        });

        if (existingAccount) {
            if (existingAccount.statut === 'BLOQUE') {
                return res.status(403).json({ error: "Ce numéro est lié à un compte bloqué dans cette banque." });
            }
            if (existingAccount.statut === 'ACTIF') {
                return res.status(400).json({ error: "Vous possédez déjà un compte actif dans cette banque." });
            }
            // Si SUPPRIME, on pourrait techniquement recréer ici
        }

        // C. Création ou récupération de l'utilisateur
        let user = await User.findOne({ where: { telephone } });
        if (!user) {
            user = await User.create({ nom, email, telephone, code_pin });
        }

        // D. Création du compte lié à la banque spécifique
        const newAccount = await Account.create({
            userId: user.id,
            bankId: bank.id, // Liaison cruciale
            solde: 0.00,
            statut: 'ACTIF'
        });

        res.status(201).json({
            message: `✅ Compte créé avec succès chez ${bank.nom} !`,
            accountNumber: newAccount.id,
            bank: bank.nom
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur inscription : " + error.message });
    }
};

// 2. LOGIN (Multi-banque)
exports.login = async (req, res) => {
    try {
        const { telephone, code_pin, code_agence } = req.body;

        // Trouver la banque
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) return res.status(404).json({ error: "Code agence invalide." });

        // Trouver l'utilisateur et le compte associé à CETTE banque
        const account = await Account.findOne({
            where: { bankId: bank.id },
            include: [{ 
                model: User, 
                where: { telephone, code_pin } 
            }]
        });

        if (!account) {
            return res.status(401).json({ error: "Identifiants ou banque incorrects." });
        }

        if (account.statut !== 'ACTIF') {
            return res.status(403).json({ error: "Ce compte bancaire est inactif." });
        }

        res.json({
            message: "Connexion réussie",
            compte: {
                banque: bank.nom,
                solde: account.solde,
                user: account.User.nom
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE : Mise à jour du profil
exports.updateProfile = async (req, res) => {
    try {
        const { telephone, code_pin, nom, email, code_agence } = req.body;

        // 1. Recherche de la banque si un changement d'agence est demandé
        let bank = null;
        if (code_agence) {
            bank = await Bank.findOne({ where: { code_agence } });
            if (!bank) return res.status(404).json({ error: "Code agence invalide." });
        }

        // 2. Recherche de l'utilisateur
        const user = await User.findOne({ 
            where: { telephone },
            include: [{ model: Account, as: 'Account' }] 
        });

        // 3. Vérification de sécurité (PIN)
        if (!user || user.code_pin !== code_pin) {
            return res.status(401).json({ 
                error: "Accès refusé", 
                message: "Téléphone ou Code PIN incorrect." 
            });
        }

        // 4. Barrière sur le statut du compte
        if (!user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif." 
            });
        }

        // 5. Application des modifications
        if (nom) user.nom = nom;
        if (email) user.email = email;
        
        // Si l'utilisateur change d'agence, on met à jour le bankId sur le compte
        if (bank) {
            user.Account.bankId = bank.id;
            await user.Account.save();
        }

        await user.save();

        res.json({
            message: "Profil mis à jour avec succès !",
            user: {
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                agence: bank ? bank.nom : "Non modifiée"
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};