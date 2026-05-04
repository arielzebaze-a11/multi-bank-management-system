const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const sequelize = require('../config/db');

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
            devise: "XAF" // Ou ta devise par défaut
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Historique
exports.getHistory = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: {
                [sequelize.Op.or]: [
                    { expediteur_tel: req.params.userId }, // Simplifié pour le test
                    { destinataire_tel: req.params.userId }
                ]
            },
            order: [['createdAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Virement par numéro de téléphone
exports.transfer = async (req, res) => {
    const { telephoneExpediteur, telephoneDestinataire, montant } = req.body;
    const t = await sequelize.transaction();

    try {
        if (montant <= 0) throw new Error("Le montant doit être supérieur à 0");

        // 1. Trouver les utilisateurs par téléphone
        const userExp = await User.findOne({ where: { telephone: telephoneExpediteur }, transaction: t });
        const userDest = await User.findOne({ where: { telephone: telephoneDestinataire }, transaction: t });

        if (!userExp || !userDest) {
            throw new Error("Expéditeur ou destinataire introuvable");
        }

        // 2. Trouver les comptes bancaires via les IDs des utilisateurs trouvés
        const compteExp = await Account.findOne({ where: { userId: userExp.id }, transaction: t });
        const compteDest = await Account.findOne({ where: { userId: userDest.id }, transaction: t });

        if (!compteExp || !compteDest) {
            throw new Error("L'un des comptes bancaires n'est pas activé");
        }

        // 3. Vérifier le solde
        if (parseFloat(compteExp.solde) < montant) {
            throw new Error("❌ Solde insuffisant");
        }

        // 4. Exécuter le mouvement d'argent
        await compteExp.update({ solde: parseFloat(compteExp.solde) - montant }, { transaction: t });
        await compteDest.update({ solde: parseFloat(compteDest.solde) + montant }, { transaction: t });

        // 5. Enregistrer la transaction dans l'historique
        await Transaction.create({
            expediteurId: userExp.id,
            destinataireId: userDest.id,
            montant,
            type: 'VIREMENT',
            statut: 'SUCCES'
        }, { transaction: t });

        await t.commit();
        res.json({ message: "✅ Virement réussi de " + montant + " FCFA vers " + userDest.nom });

    } catch (error) {
        await t.rollback();
        res.status(400).json({ error: error.message });
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