const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const sequelize = require('../config/db');
const { Op } = require('sequelize');

exports.getBalance = async (req, res) => {
    try {
        const { telephone, code_pin } = req.body;

        // 1. On vérifie d'abord si l'utilisateur existe avec ce téléphone et ce PIN
        const user = await User.findOne({ 
            where: { telephone, code_pin } 
        });

        if (!user) {
            return res.status(401).json({ 
                error: "Accès refusé. Téléphone ou Code PIN incorrect." 
            });
        }

        // 2. Si l'utilisateur est bon, on cherche son compte bancaire
        const account = await Account.findOne({ 
            where: { userId: user.id } 
        });

        if (!account) {
            return res.status(404).json({ error: "Compte bancaire introuvable." });
        }

        // 3. On renvoie le solde
        res.json({
            nom: user.nom,
            telephone: user.telephone,
            solde: account.solde,
            devise: "FCFA"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Historique des transactions
exports.getHistory = async (req, res) => {
    try {
        const { telephone, code_pin } = req.body;

        // 1. Authentification stricte
        const user = await User.findOne({ where: { telephone, code_pin } });
        if (!user) {
            return res.status(401).json({ error: "Accès refusé. Téléphone ou Code PIN incorrect." });
        }

        // 2. Récupération avec les infos du correspondant (Email, Nom, Tel)
        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [{ expediteur_tel: telephone }, { destinataire_tel: telephone }]
            },
            include: [
                { model: User, as: 'Expediteur', attributes: ['nom', 'email', 'telephone'] },
                { model: User, as: 'Destinataire', attributes: ['nom', 'email', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 3. Formatage selon tes exigences
        const historique = transactions.map(t => {
            const isSent = t.expediteur_tel === telephone;
            const correspondant = isSent ? t.Destinataire : t.Expediteur;

            return {
                date: t.createdAt,
                montant: `${t.montant} FCFA`,
                statut: isSent ? "Argent envoyé" : "Argent reçu",
                type: t.type,
                correspondant: {
                    nom: correspondant ? correspondant.nom : "Système/Inconnu",
                    email: correspondant ? correspondant.email : "N/A",
                    telephone: isSent ? t.destinataire_tel : t.expediteur_tel
                },
                etat_transaction: t.status // Affiche SUCCESS ou autre
            };
        });

        res.json({
            client: user.nom,
            devise: "FCFA",
            transactions: historique
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Virement par numéro de téléphone
const { User, Account, Transaction } = require('../models');
const sequelize = require('../config/db');

exports.transfer = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { expediteurTel, codePin, destinataireTel, montant } = req.body;

        // 1. Authentification de l'expéditeur (Téléphone + PIN)
        const sender = await User.findOne({ 
            where: { telephone: expediteurTel, code_pin: codePin },
            include: [{ model: Account, as: 'Account' }] 
        });

        if (!sender) {
            await t.rollback();
            return res.status(401).json({ error: "Numéro ou code PIN incorrect." });
        }

        // 2. Vérification du destinataire
        const receiver = await User.findOne({ 
            where: { telephone: destinataireTel },
            include: [{ model: Account, as: 'Account' }] 
        });

        if (!receiver) {
            await t.rollback();
            return res.status(404).json({ error: "Le numéro du destinataire n'existe pas." });
        }

        if (expediteurTel === destinataireTel) {
            await t.rollback();
            return res.status(400).json({ error: "Impossible de s'envoyer de l'argent à soi-même." });
        }

        // 3. Vérification du solde
        const soldeExpediteur = parseFloat(sender.Account.solde);
        if (soldeExpediteur < parseFloat(montant)) {
            await t.rollback();
            return res.status(400).json({ 
                error: "Solde insuffisant.",
                solde_restant: `${soldeExpediteur} FCFA` 
            });
        }

        // 4. Mise à jour atomique des comptes
        await sender.Account.update({ solde: soldeExpediteur - parseFloat(montant) }, { transaction: t });
        await receiver.Account.update({ solde: parseFloat(receiver.Account.solde) + parseFloat(montant) }, { transaction: t });

        // 5. Enregistrement de l'historique
        await Transaction.create({
            type: 'VIREMENT',
            montant: montant,
            expediteur_tel: expediteurTel,
            destinataire_tel: destinataireTel,
            status: 'SUCCESS'
        }, { transaction: t });

        // Confirmation de toutes les étapes
        await t.commit();

        res.json({
            message: "Virement réussi !",
            envoye_a: receiver.nom,
            montant_envoye: `${montant} FCFA`,
            votre_solde_restant: `${sender.Account.solde} FCFA`
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: "Erreur technique : " + error.message });
    }
};

// Dépôt
exports.deposit = async (req, res) => {
    try {
        const { userId, montant } = req.body;
        const account = await Account.findOne({ where: { user_id: userId } });
        if (!account) return res.status(404).json({ error: "Compte non trouvé" });
        
        account.solde = parseFloat(account.solde) + parseFloat(montant);
        await account.save();
        
        res.json({ message: "✅ Dépôt réussi", nouveau_solde: account.solde });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Retrait
exports.withdraw = async (req, res) => {
    try {
        const { userId, montant } = req.body;
        const account = await Account.findOne({ where: { user_id: userId } });
        if (!account) return res.status(404).json({ error: "Compte non trouvé" });
        
        if (parseFloat(account.solde) < parseFloat(montant)) {
            return res.status(400).json({ error: "❌ Solde insuffisant" });
        }
        
        account.solde = parseFloat(account.solde) - parseFloat(montant);
        await account.save();
        
        res.json({ message: "✅ Retrait réussi", nouveau_solde: account.solde });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulation RIB
exports.getRIB = async (req, res) => {
    res.json({ 
        message: "📄 Génération du RIB en cours...", 
        info: "Cette fonction simulera bientôt l'envoi d'un PDF." 
    });
};

// Clôture
exports.closeAccount = async (req, res) => {
    try {
        const { userId } = req.body;
        await Account.destroy({ where: { user_id: userId } });
        res.json({ message: "⚠️ Compte clôturé. Action irréversible effectuée." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};