const User = require('../models/User');
const Account = require('../models/Account');
const Bank = require('../models/Bank');
const mailer = require('../config/mailer'); // ← Import du mailer
const jwt = require("jsonwebtoken");

// ─────────────────────────────────────────────────────────
// 1. INSCRIPTION
// ─────────────────────────────────────────────────────────
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

        // ── Vérification de l'email ─────────────────────────────────────────────
        // Cas A : L'email est absent ou mal formaté → on bloque directement
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                error: "❌ Adresse email invalide ou manquante."
            });
        }

        // Cas B : L'email est déjà utilisé par un AUTRE utilisateur (téléphone différent)
        const existingEmailUser = await User.findOne({ where: { email } });
        if (existingEmailUser && existingEmailUser.telephone !== telephone) {
            // On tente d'envoyer un email d'erreur à l'adresse fournie
            try {
                await mailer.sendEmailErrorNotification(
                    email,
                    bank.nom,
                    "Cette adresse email est déjà associée à un autre compte dans notre système."
                );
            } catch (mailErr) {
                console.error("⚠️  Erreur envoi email d'erreur :", mailErr.message);
            }

            return res.status(409).json({ 
                error: "❌ Cette adresse email est déjà utilisée par un autre compte." 
            });
        }
        // ────────────────────────────────────────────────────────────────────────

        // 2. Vérifier si l'utilisateur existe déjà (par téléphone)
        let user = await User.findOne({ where: { telephone } });

        if (user) {
            // 3. Cet utilisateur existe → vérifier s'il a déjà un compte dans CETTE banque
            const existingAccount = await Account.findOne({ 
                where: { userId: user.id, bankId: bank.id } 
            });

            if (existingAccount) {

                // ❌ Compte ACTIF → déjà inscrit dans cette banque
                if (existingAccount.statut === 'ACTIF') {
                    // Email d'erreur : compte déjà actif
                    try {
                        await mailer.sendEmailErrorNotification(
                            user.email,
                            bank.nom,
                            `Vous possédez déjà un compte actif chez ${bank.nom}. Une seule inscription par banque est autorisée.`
                        );
                    } catch (mailErr) {
                        console.error("⚠️  Erreur envoi email d'erreur :", mailErr.message);
                    }

                    return res.status(400).json({ 
                        error: `❌ Vous avez déjà un compte actif chez ${bank.nom}.` 
                    });
                }

                // ❌ Compte BLOQUÉ → contacter admin
                if (existingAccount.statut === 'BLOQUE') {
                    try {
                        await mailer.sendEmailErrorNotification(
                            user.email,
                            bank.nom,
                            `Votre compte chez ${bank.nom} est actuellement bloqué. Veuillez contacter votre administrateur.`
                        );
                    } catch (mailErr) {
                        console.error("⚠️  Erreur envoi email d'erreur :", mailErr.message);
                    }

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

                    // ✅ Email de confirmation : nouveau compte après archivage
                    try {
                        await mailer.sendAccountCreatedEmail(
                            user.email,
                            user.nom,
                            bank.nom,
                            newAccount.id
                        );
                    } catch (mailErr) {
                        console.error("⚠️  Erreur envoi email de confirmation :", mailErr.message);
                    }

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

            // ✅ Email de confirmation
            try {
                await mailer.sendAccountCreatedEmail(
                    user.email,
                    user.nom,
                    bank.nom,
                    newAccount.id
                );
            } catch (mailErr) {
                console.error("⚠️  Erreur envoi email de confirmation :", mailErr.message);
            }

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

        // ✅ Email de confirmation pour tout nouvel utilisateur
        try {
            await mailer.sendAccountCreatedEmail(
                user.email,
                user.nom,
                bank.nom,
                newAccount.id
            );
        } catch (mailErr) {
            console.error("⚠️  Erreur envoi email de confirmation :", mailErr.message);
        }

        res.status(201).json({
            message: `✅ Compte créé avec succès chez ${bank.nom} !`,
            accountNumber: newAccount.id,
            bank: bank.nom
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur inscription : " + error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 2. LOGIN (Multi-banque)
// ─────────────────────────────────────────────────────────
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

        // 3. Chercher le compte de cet utilisateur dans CETTE banque avec ce PIN
        const account = await Account.findOne({ 
            where: { 
                userId: user.id, 
                bankId: bank.id,
                code_pin: code_pin
            } 
        });

        if (!account) {
            // ── Email d'erreur si l'utilisateur a un email enregistré ──────────
            if (user.email) {
                try {
                    await mailer.sendEmailErrorNotification(
                        user.email,
                        bank.nom,
                        `Tentative de connexion échouée sur votre compte chez ${bank.nom} : code PIN ou code agence incorrect.`
                    );
                } catch (mailErr) {
                    console.error("⚠️  Erreur envoi email d'erreur login :", mailErr.message);
                }
            }

            return res.status(401).json({ 
                error: "❌ Code PIN ou code agence incorrect." 
            });
        }

        // 4. Vérification du statut
        if (account.statut === 'BLOQUE') {
            if (user.email) {
                try {
                    await mailer.sendEmailErrorNotification(
                        user.email,
                        bank.nom,
                        `Tentative de connexion sur votre compte bloqué chez ${bank.nom}. Contactez l'administrateur.`
                    );
                } catch (mailErr) {
                    console.error("⚠️  Erreur envoi email compte bloqué :", mailErr.message);
                }
            }

            return res.status(403).json({ 
                error: "🔒 Ce compte est bloqué. Contactez l'administrateur." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            return res.status(403).json({ 
                error: "🗑️ Ce compte a été supprimé. Créez un nouveau compte." 
            });
        }

        // 5. Compte ACTIF → connexion réussie

        // ── Email de notification de connexion ──────────────────────────────────
        // Vérifie que l'email existe avant d'envoyer
        if (user.email) {
            try {
                await mailer.sendLoginSuccessEmail(user.email, user.nom, bank.nom);
            } catch (mailErr) {
                // On ne bloque PAS la connexion si l'email échoue
                console.error("⚠️  Erreur envoi email confirmation connexion :", mailErr.message);
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        const token = jwt.sign({
            userId: user.id,
            role: user.role,
            telephone: user.telephone,
            bankId: bank.id,
            accountId: account.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "24h"
        }
        );

        res.json({
        message: "✅ Connexion réussie",
        token,
        compte: {
            id: compte.id,
            banque: banque.nom,
            solde: compte.solde,
            user: utilisateur.nom,
            telephone: utilisateur.telephone,
            role: utilisateur.role
        }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────
// 3. UPDATE PROFILE
// ─────────────────────────────────────────────────────────
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
                code_pin: code_pin
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

        // 5. Si un nouvel email est fourni, vérifier qu'il n'est pas déjà pris
        if (email && email !== user.email) {
            const emailTaken = await User.findOne({ where: { email } });
            if (emailTaken) {
                return res.status(409).json({
                    error: "❌ Cette adresse email est déjà utilisée par un autre compte."
                });
            }
        }

        // 6. Mise à jour des informations
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
