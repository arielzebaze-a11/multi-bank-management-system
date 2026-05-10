const User = require('../models/User');
const Account = require('../models/Account');
const Bank = require('../models/Bank'); // Ajout du modèle Bank

// 1. INSCRIPTION
exports.register = async (req, res) => {
    try {
        const { nom, email, telephone, code_pin, code_agence } = req.body;

        // 1. Vérifier que la banque existe
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            return res.status(404).json({ 
                error: "❌ Code agence invalide. Vérifiez le code de votre agence." 
            });
        }

        // 2. Vérifier si l'utilisateur existe déjà
        let user = await User.findOne({ where: { telephone } });

        if (user) {
            // 3. Cet utilisateur existe → vérifier s'il a déjà un compte dans CETTE banque
            const existingAccount = await Account.findOne({ 
                where: { userId: user.id, bankId: bank.id } 
            });

            if (existingAccount) {

                // ❌ Compte ACTIF → déjà inscrit dans cette banque
                if (existingAccount.statut === 'ACTIF') {
                    return res.status(400).json({ 
                        error: `❌ Vous avez déjà un compte actif chez ${bank.nom}.` 
                    });
                }

                // ❌ Compte BLOQUÉ → contacter admin
                if (existingAccount.statut === 'BLOQUE') {
                    return res.status(403).json({ 
                        error: `🔒 Votre compte chez ${bank.nom} est bloqué. Contactez l'administrateur.` 
                    });
                }

                // 📦 Compte SUPPRIMÉ → on archive, on crée un nouveau
                if (existingAccount.statut === 'SUPPRIME') {
                    const newAccount = await Account.create({
                        userId: user.id,
                        bankId: bank.id,
                        code_pin: code_pin,
                        solde: 0.00,
                        statut: 'ACTIF'
                    });

                    return res.status(201).json({ 
                        message: `✅ Ancien compte archivé. Nouveau compte créé chez ${bank.nom} !`,
                        accountNumber: newAccount.id,
                        bank: bank.nom
                    });
                }
            }

            // Cet utilisateur n'a pas encore de compte dans CETTE banque → on le crée
            const newAccount = await Account.create({
                userId: user.id,
                bankId: bank.id,
                code_pin: code_pin,
                solde: 0.00,
                statut: 'ACTIF'
            });

            return res.status(201).json({ 
                message: `✅ Nouveau compte créé chez ${bank.nom} !`,
                accountNumber: newAccount.id,
                bank: bank.nom
            });
        }

        // 4. Nouvel utilisateur → on crée le user ET le compte
        user = await User.create({ nom, email, telephone, code_pin });

        const newAccount = await Account.create({
            userId: user.id,
            bankId: bank.id,
            code_pin: code_pin,
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

        // 1. Vérifier que la banque existe
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            return res.status(404).json({ 
                error: "❌ Code agence invalide." 
            });
        }

        // 2. Vérifier que l'utilisateur existe via téléphone
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé avec ce numéro." 
            });
        }

        // 3. Chercher le compte de cet utilisateur dans CETTE banque
        const account = await Account.findOne({ 
            where: { 
                userId: user.id, 
                bankId: bank.id,
                code_pin: code_pin  // PIN vérifié ici sur le compte
            } 
        });

        if (!account) {
            return res.status(401).json({ 
                error: "❌ Code PIN ou code agence incorrect." 
            });
        }

        // 4. Vérification du statut
        if (account.statut === 'BLOQUE') {
            return res.status(403).json({ 
                error: "🔒 Ce compte est bloqué. Contactez l'administrateur." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            return res.status(403).json({ 
                error: "🗑️ Ce compte a été supprimé. Créez un nouveau compte." 
            });
        }

        // 5. Compte ACTIF → on affiche les infos
        res.json({
            message: "✅ Connexion réussie",
            compte: {
                id: account.id,
                banque: bank.nom,
                solde: account.solde,
                user: user.nom,
                telephone: user.telephone,
                email: user.email
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

        // 1. Vérifier que la banque existe
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            return res.status(404).json({ 
                error: "❌ Code agence invalide." 
            });
        }

        // 2. Vérifier que l'utilisateur existe
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Aucun utilisateur trouvé avec ce numéro." 
            });
        }

        // 3. Vérifier que ce user a bien un compte dans CETTE banque
        const account = await Account.findOne({ 
            where: { 
                userId: user.id, 
                bankId: bank.id,
                code_pin: code_pin  // PIN vérifié sur le compte
            } 
        });

        if (!account) {
            return res.status(401).json({ 
                error: "❌ Code PIN ou code agence incorrect." 
            });
        }

        // 4. Vérification du statut
        if (account.statut === 'BLOQUE') {
            return res.status(403).json({ 
                error: "🔒 Ce compte est bloqué. Contactez l'administrateur." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            return res.status(403).json({ 
                error: "🗑️ Ce compte a été supprimé." 
            });
        }

        // 5. Mise à jour des informations
        if (nom) user.nom = nom;
        if (email) user.email = email;
        await user.save();

        res.json({
            message: "✅ Profil mis à jour avec succès !",
            user: {
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                banque: bank.nom
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};