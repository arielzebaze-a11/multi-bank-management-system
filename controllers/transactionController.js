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

exports.verifyReceiver = async (req, res) => {
    try {
        const { telephone } = req.params;
        const user = await User.findOne({ where: { telephone } });

        if (!user) {
            return res.status(404).json({ error: "Ce numéro n'appartient à aucun compte." });
        }

        res.json({ nom: user.nom }); // Renvoie le nom pour confirmation visuelle
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la vérification : " + error.message });
    }
};

// Virement par numéro de téléphone et code pin
exports.transfer = async (req, res) => {
    const t = await sequelize.transaction(); // Protection atomique

    try {
        const { expediteurTel, codePin, destinataireTel, montant, nomConfirme } = req.body;

        // 1. Authentification de l'expéditeur
        const sender = await User.findOne({ 
            where: { telephone: expediteurTel, code_pin: codePin },
            include: [{ model: Account, as: 'Account' }] 
        });

        if (!sender) {
            await t.rollback();
            return res.status(401).json({ error: "Numéro ou code PIN incorrect." });
        }

        // 2. Vérification du destinataire et de son nom
        const receiver = await User.findOne({ 
            where: { telephone: destinataireTel },
            include: [{ model: Account, as: 'Account' }] 
        });

        if (!receiver) {
            await t.rollback();
            return res.status(404).json({ error: "Le destinataire a disparu ou le numéro est erroné." });
        }

        // Sécurité : On compare le nom que l'utilisateur a vu avec celui en base
        if (nomConfirme && receiver.nom !== nomConfirme) {
            await t.rollback();
            return res.status(400).json({ error: "Le nom du destinataire ne correspond plus. Veuillez recommencer." });
        }

        // 3. Contrôle du solde
        const soldeExp = parseFloat(sender.Account.solde);
        if (soldeExp < parseFloat(montant)) {
            await t.rollback();
            return res.status(400).json({ 
                error: "Solde insuffisant.",
                solde_restant: `${soldeExp} FCFA` 
            });
        }

        // 4. Exécution simultanée des mises à jour
        await sender.Account.update({ solde: soldeExp - parseFloat(montant) }, { transaction: t });
        await receiver.Account.update({ solde: parseFloat(receiver.Account.solde) + parseFloat(montant) }, { transaction: t });

        // 5. Historisation
        await Transaction.create({
            type: 'VIREMENT',
            montant: montant,
            expediteur_tel: expediteurTel,
            destinataire_tel: destinataireTel,
            status: 'SUCCESS'
        }, { transaction: t });

        await t.commit(); // Tout est OK

        res.json({
            message: "Transfert réussi !",
            details: `Vous avez envoyé ${montant} FCFA à ${receiver.nom}.`,
            votre_nouveau_solde: `${sender.Account.solde} FCFA`
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: "Erreur technique : " + error.message });
    }
};

// Dépôt
exports.deposit = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { telephone, montant } = req.body;

        // 1. On cherche l'utilisateur pour afficher/vérifier son nom
        const receiver = await User.findOne({ 
            where: { telephone },
            include: [{ model: Account, as: 'Account' }] 
        });

        if (!receiver) {
            await t.rollback();
            return res.status(404).json({ error: "Aucun compte trouvé pour ce numéro." });
        }

        // 2. Mise à jour du solde
        const nouveauSolde = parseFloat(receiver.Account.solde) + parseFloat(montant);
        await receiver.Account.update({ solde: nouveauSolde }, { transaction: t });

        // 3. Historique (on met expediteur_tel à NULL pour un DEPOT externe)
        await Transaction.create({
            type: 'DEPOT',
            montant: montant,
            destinataire_tel: telephone,
            status: 'SUCCESS'
        }, { transaction: t });

        await t.commit();

        res.json({
            message: "Dépôt réussi !",
            beneficiaire: receiver.nom, // C'est ici qu'on confirme le nom à l'utilisateur
            montant_depose: `${montant} FCFA`,
            nouveau_solde_client: `${nouveauSolde} FCFA`
        });

    } catch (error) {
        if (t) await t.rollback();
        res.status(500).json({ error: "Erreur lors du dépôt : " + error.message });
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