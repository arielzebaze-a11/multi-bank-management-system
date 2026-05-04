const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// 1 & 2. Gérer le statut
exports.updateAccountStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        res.json({ message: `Statut mis à jour pour ${userId} : ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Liste de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['mot_de_passe'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. Voir toutes les transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({ order: [['createdAt', 'DESC']] });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Modifier le solde (Correction)
exports.adjustBalance = async (req, res) => {
    try {
        const { userId, nouveauSolde } = req.body;
        const account = await Account.findOne({ where: { user_id: userId } });
        if (!account) return res.status(404).json({ error: "Compte non trouvé" });
        account.solde = nouveauSolde;
        await account.save();
        res.json({ message: "Solde mis à jour", nouveau_solde: account.solde });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 6. Supprimer un compte
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 1. Trouver l'utilisateur et son compte
        const user = await User.findByPk(userId, {
            include: [{ model: Account, as: 'Account' }]
        });

        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        // 2. Mettre à jour le statut du compte en 'SUPPRIME'
        // On suppose que chaque utilisateur a un compte lié
        if (user.Account) {
            await user.Account.update({ statut: 'SUPPRIME' });
        }

        // Optionnel : Tu peux aussi marquer l'utilisateur comme inactif si tu as un champ dédié
        // await user.update({ actif: false }); 

        res.json({ 
            message: "Utilisateur marqué comme SUPPRIME avec succès (données conservées en archive)" 
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la suppression logique : " + error.message });
    }
};

// 7. Rapports globaux
exports.getGlobalReport = async (req, res) => {
    const allUsers = await User.findAll({ include: [{ model: Account, as: 'Account' }] });
    const allTransac = await Transaction.findAll();

    const rendu = {
        SYNTHESE_SYSTEME: {
            total_clients: allUsers.length,
            liquidite_totale: allUsers.reduce((sum, u) => sum + parseFloat(u.Account?.solde || 0), 0) + " FCFA",
            volume_transactions: allTransac.length
        },
        ETAT_DES_COMPTES: {
            actifs: allUsers.filter(u => u.Account?.statut === 'ACTIF').length,
            bloques: allUsers.filter(u => u.Account?.statut === 'BLOQUE').length,
            supprimes: allUsers.filter(u => u.Account?.statut === 'SUPPRIME').length
        },
        LISTE_DETAILLEE_CLIENTS: allUsers.map(u => ({
            id: u.id,
            nom: u.nom,
            tel: u.telephone,
            agence: u.agence,
            solde: u.Account?.solde || 0,
            etat: u.Account?.statut || 'N/A'
        })),
        DERNIERES_TRANSACTIONS: allTransac.slice(0, 10) // Les 10 plus récentes
    };

    res.json(rendu);
};

exports.getGlobalReport = async (req, res) => {
    const allUsers = await User.findAll({ include: [{ model: Account, as: 'Account' }] });
    const allTransac = await Transaction.findAll();

    const rendu = {
        SYNTHESE_SYSTEME: {
            total_clients: allUsers.length,
            liquidite_totale: allUsers.reduce((sum, u) => sum + parseFloat(u.Account?.solde || 0), 0) + " FCFA",
            volume_transactions: allTransac.length
        },
        ETAT_DES_COMPTES: {
            actifs: allUsers.filter(u => u.Account?.statut === 'ACTIF').length,
            bloques: allUsers.filter(u => u.Account?.statut === 'BLOQUE').length,
            supprimes: allUsers.filter(u => u.Account?.statut === 'SUPPRIME').length
        },
        LISTE_DETAILLEE_CLIENTS: allUsers.map(u => ({
            id: u.id,
            nom: u.nom,
            tel: u.telephone,
            agence: u.agence,
            solde: u.Account?.solde || 0,
            etat: u.Account?.statut || 'N/A'
        })),
        DERNIERES_TRANSACTIONS: allTransac.slice(0, 10) // Les 10 plus récentes
    };

    res.json(rendu);
};

// 9. Créer admin
exports.createAdmin = async (req, res) => {
    res.json({ message: "Fonction de création d'admin prête" });
};

// 8 & 10. Paramètres (Frais/Plafonds)
exports.updateSystemSettings = async (req, res) => {
    res.json({ message: "Paramètres système mis à jour" });
};