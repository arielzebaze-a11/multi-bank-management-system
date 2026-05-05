const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');

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

// 9. Changer le rôle d'un utilisateur (Promouvoir en ADMIN)
exports.changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body; // newRole peut être 'ADMIN' ou 'CLIENT'

        // On vérifie si l'utilisateur existe
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        // Mise à jour du rôle
        await user.update({ role: newRole });

        res.json({ 
            message: `✅ Le rôle de ${user.nom} a été mis à jour avec succès en ${newRole}.`,
            user: {
                id: user.id,
                nom: user.nom,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du changement de rôle : " + error.message });
    }
};

// adminController.js
exports.toggleAccountStatus = async (req, res) => {
    try {
        const { userId, action } = req.body; // action peut être 'BLOQUER' ou 'DEBLOQUER'

        const account = await Account.findOne({ where: { userId: userId } });

        if (!account) {
            return res.status(404).json({ error: "Compte bancaire non trouvé." });
        }

        let nouveauStatut;
        let messageSucces;

        if (action === 'BLOQUER') {
            nouveauStatut = 'BLOQUE';
            messageSucces = "🔒 Le compte a été suspendu avec succès.";
        } else if (action === 'DEBLOQUER') {
            nouveauStatut = 'ACTIF';
            messageSucces = "✅ Le compte a été réactivé. L'utilisateur peut à nouveau se connecter.";
        } else {
            return res.status(400).json({ error: "Action invalide. Utilisez 'BLOQUER' ou 'DEBLOQUER'." });
        }

        // Mise à jour effective dans la base de données
        await account.update({ statut: nouveauStatut });

        res.json({ 
            message: messageSucces,
            statut_actuel: nouveauStatut 
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors du changement de statut : " + error.message });
    }
};

// Pour la ligne 57 de api.js
exports.updateAccountLimit = async (req, res) => {
    try {
        const { userId, limite } = req.body;
        const account = await Account.findOne({ where: { userId } });
        
        if (!account) return res.status(404).json({ error: "Compte non trouvé" });
        
        // Supposons que tu as un champ 'limite_virement' dans ton modèle Account
        await account.update({ limite_virement: limite });
        res.json({ message: `Nouvelle limite fixée à : ${limite} FCFA` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. Rapports globaux
exports.getGlobalReportPDF = async (req, res) => {
    try {
        // 1. Récupération des données (comme avant)
        const allUsers = await User.findAll({ include: [{ model: Account, as: 'Account' }] });
        const allTransac = await Transaction.findAll();

        const totalLiquidite = allUsers.reduce((sum, u) => sum + parseFloat(u.Account?.solde || 0), 0);
        const stats = {
            actifs: allUsers.filter(u => u.Account?.statut === 'ACTIF').length,
            bloques: allUsers.filter(u => u.Account?.statut === 'BLOQUE').length,
            supprimes: allUsers.filter(u => u.Account?.statut === 'SUPPRIME').length
        };

        // 2. Configuration de la réponse HTTP pour le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Rapport_Global_SGB.pdf');

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // --- EN-TÊTE DU PDF ---
        doc.fontSize(20).text('SGB - RAPPORT FINANCIER GLOBAL', { align: 'center' });
        doc.fontSize(10).text(`Généré le : ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);

        // --- SECTION 1 : SYNTHÈSE ---
        doc.fontSize(14).fillColor('blue').text('1. SYNTHÈSE DU SYSTÈME');
        doc.fontSize(12).fillColor('black').moveDown(0.5);
        doc.text(`Nombre total de clients : ${allUsers.length}`);
        doc.text(`Liquidité totale en coffre : ${totalLiquidite.toLocaleString()} FCFA`);
        doc.text(`Volume total des transactions : ${allTransac.length}`);
        doc.moveDown(1.5);

        // --- SECTION 2 : ÉTAT DES COMPTES ---
        doc.fontSize(14).fillColor('blue').text('2. ÉTAT DES COMPTES');
        doc.fontSize(12).fillColor('black').moveDown(0.5);
        doc.text(`Comptes Actifs : ${stats.actifs}`);
        doc.text(`Comptes Bloqués : ${stats.bloques}`);
        doc.text(`Comptes Supprimés (Archivés) : ${stats.supprimes}`);
        doc.moveDown(1.5);

        // --- SECTION 3 : TABLEAU DES DERNIÈRES TRANSACTIONS ---
        doc.fontSize(14).fillColor('blue').text('3. HISTORIQUE DES TRANSACTIONS');
        doc.moveDown(1);
        
        const tableTop = doc.y;
        doc.fontSize(10).fillColor('grey');
        doc.text('ID', 50, tableTop);
        doc.text('TYPE', 100, tableTop);
        doc.text('MONTANT', 180, tableTop);
        doc.text('EXPÉDITEUR', 280, tableTop);
        doc.text('DESTINATAIRE', 400, tableTop);
        doc.text('STATUT', 500, tableTop);
        
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();
        
        let y = tableTop + 25;
        allTransac.forEach(t => {
            doc.fillColor('black');
            doc.text(t.id, 50, y);
            doc.text(t.type, 100, y);
            doc.text(`${t.montant} F`, 180, y);
            doc.text(t.expediteur_tel || '-', 280, y);
            doc.text(t.destinataire_tel || '-', 400, y);
            doc.text(t.status, 500, y);
            y += 20;

            if (y > 700) { // Nouvelle page si nécessaire
                doc.addPage();
                y = 50;
            }
        });

        // Finalisation
        doc.end();

    } catch (error) {
        res.status(500).json({ error: "Erreur génération PDF : " + error.message });
    }
};

// Pour la ligne 41 de api.js (si elle cause aussi une erreur)
exports.updateAccountStatus = async (req, res) => {
    try {
        const { userId, status } = req.body; // status attendu : 'ACTIF', 'BLOQUE', ou 'EN_ATTENTE'[cite: 8]
        const account = await Account.findOne({ where: { userId } });
        
        if (!account) return res.status(404).json({ error: "Compte non trouvé" });
        
        await account.update({ statut: status });
        res.json({ message: `Statut mis à jour avec succès : ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};