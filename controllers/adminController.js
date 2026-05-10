const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const Bank = require('../models/Bank'); // Ajout du modèle Bank

// 3. Liste de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        // Récupérer tous les users avec leurs comptes et banques associées
        const users = await User.findAll({
            attributes: { exclude: ['code_pin'] }, // On cache le PIN
            include: [{
                model: Account,
                as: 'Account',
                attributes: ['id', 'solde', 'statut', 'limite_virement'],
                include: [{
                    model: Bank,
                    as: 'Bank',
                    attributes: ['nom', 'code_agence']
                }]
            }]
        });

        if (!users || users.length === 0) {
            return res.status(404).json({ 
                error: "❌ Aucun utilisateur trouvé." 
            });
        }

        return res.status(200).json({
            message: "✅ Liste des utilisateurs récupérée",
            total: users.length,
            utilisateurs: users.map(u => ({
                id: u.id,
                nom: u.nom,
                email: u.email,
                telephone: u.telephone,
                role: u.role,
                comptes: u.Account ? [{
                    numero: `ACC-${String(u.Account.id).padStart(4, '0')}`,
                    banque: u.Account.Bank ? u.Account.Bank.nom : 'Inconnue',
                    code_agence: u.Account.Bank ? u.Account.Bank.code_agence : 'N/A',
                    solde: `${parseFloat(u.Account.solde).toLocaleString('fr-FR')} FCFA`,
                    statut: u.Account.statut,
                    limite_virement: `${parseFloat(u.Account.limite_virement).toLocaleString('fr-FR')} FCFA`
                }] : []
            }))
        });

    } catch (error) {
        return res.status(500).json({ error: "❌ Erreur serveur : " + error.message });
    }
};

// 4. Voir toutes les transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { 
                    model: User, 
                    as: 'Expediteur', 
                    attributes: ['nom', 'telephone'],
                },
                { 
                    model: User, 
                    as: 'Destinataire', 
                    attributes: ['nom', 'telephone'],
                }
            ]
        });

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ 
                error: "❌ Aucune transaction trouvée." 
            });
        }

        return res.status(200).json({
            message: "✅ Historique global récupéré",
            total: transactions.length,
            transactions: transactions.map(t => ({
                id: t.id,
                type: t.type,
                montant: `${parseFloat(t.montant).toLocaleString('fr-FR')} FCFA`,
                date: new Date(t.createdAt).toLocaleString('fr-FR'),
                statut: t.status,
                expediteur: {
                    nom: t.Expediteur ? t.Expediteur.nom : 'Système/Inconnu',
                    telephone: t.expediteur_tel || 'N/A'
                },
                destinataire: {
                    nom: t.Destinataire ? t.Destinataire.nom : 'Système/Inconnu',
                    telephone: t.destinataire_tel || 'N/A'
                }
            }))
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur serveur : " + error.message 
        });
    }
};

//supprimer une utilisateur (en changeant le statut du compte à SUPPRIME)
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { bankId } = req.body; // On cible UNE banque spécifique

        // ══ 1. VÉRIFIER QUE L'UTILISATEUR EXISTE ══
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Utilisateur non trouvé." 
            });
        }

        // ══ 2. VÉRIFIER QUE LE COMPTE EXISTE DANS CETTE BANQUE ══
        const account = await Account.findOne({
            where: { userId: userId, bankId: bankId },
            include: [{ model: Bank, as: 'Bank' }]
        });

        if (!account) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour cet utilisateur dans cette banque." 
            });
        }

        // ══ 3. VÉRIFIER LE STATUT ACTUEL ══
        if (account.statut === 'SUPPRIME') {
            return res.status(400).json({ 
                error: "❌ Ce compte est déjà supprimé." 
            });
        }

        if (account.statut === 'BLOQUE') {
            return res.status(400).json({ 
                error: "🔒 Ce compte est déjà bloqué. Utilisez débloquer d'abord." 
            });
        }

        // ══ 4. PASSER LE STATUT À SUPPRIME ══
        await account.update({ statut: 'SUPPRIME' });

        return res.status(200).json({ 
            message: "✅ Compte supprimé avec succès (données conservées en archive).",
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                banque: account.Bank ? account.Bank.nom : 'Inconnue',
                bankId: bankId,
                nouveau_statut: 'SUPPRIME'
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur suppression : " + error.message 
        });
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
        const { userId, bankId, action } = req.body;

        // ══ 1. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Utilisateur non trouvé." 
            });
        }

        // ══ 2. VÉRIFIER LE COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({ 
            where: { userId, bankId },
            include: [{ model: Bank, as: 'Bank' }]
        });

        if (!account) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour cet utilisateur dans cette banque." 
            });
        }

        // ══ 3. VÉRIFIER L'ACTION ══
        if (!['BLOQUER', 'DEBLOQUER'].includes(action)) {
            return res.status(400).json({ 
                error: "❌ Action invalide. Utilisez 'BLOQUER' ou 'DEBLOQUER'." 
            });
        }

        // ══ 4. VÉRIFIER LE STATUT ACTUEL ══
        if (action === 'BLOQUER' && account.statut === 'BLOQUE') {
            return res.status(400).json({ 
                error: "❌ Ce compte est déjà bloqué." 
            });
        }

        if (action === 'BLOQUER' && account.statut === 'SUPPRIME') {
            return res.status(400).json({ 
                error: "❌ Ce compte est supprimé. Impossible de le bloquer." 
            });
        }

        if (action === 'DEBLOQUER' && account.statut === 'ACTIF') {
            return res.status(400).json({ 
                error: "❌ Ce compte est déjà actif." 
            });
        }

        if (action === 'DEBLOQUER' && account.statut === 'SUPPRIME') {
            return res.status(400).json({ 
                error: "❌ Ce compte est supprimé. Impossible de le débloquer." 
            });
        }

        // ══ 5. APPLIQUER L'ACTION ══
        const nouveauStatut = action === 'BLOQUER' ? 'BLOQUE' : 'ACTIF';
        await account.update({ statut: nouveauStatut });

        return res.status(200).json({ 
            message: action === 'BLOQUER' 
                ? "🔒 Compte bloqué avec succès." 
                : "✅ Compte débloqué avec succès.",
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                banque: account.Bank ? account.Bank.nom : 'Inconnue',
                ancien_statut: account.statut,
                nouveau_statut: nouveauStatut
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur : " + error.message 
        });
    }
};

// Pour la ligne 57 de api.js
exports.getGlobalReportPDF = async (req, res) => {
    try {
        // ══ 1. RÉCUPÉRATION COMPLÈTE DES DONNÉES ══
        const allBanks = await Bank.findAll();
        
        const allUsers = await User.findAll({
            attributes: { exclude: ['code_pin'] },
            include: [{
                model: Account,
                as: 'Account',
                include: [{ model: Bank, as: 'Bank' }]
            }]
        });

        const allTransac = await Transaction.findAll({
            order: [['createdAt', 'DESC']],
            include: [
                { model: User, as: 'Expediteur', attributes: ['nom', 'telephone'] },
                { model: User, as: 'Destinataire', attributes: ['nom', 'telephone'] }
            ]
        });

        // ══ 2. CALCUL DES STATISTIQUES GLOBALES ══
        const totalLiquidite = allUsers.reduce((sum, u) => 
            sum + parseFloat(u.Account?.solde || 0), 0);
        
        const stats = {
            total: allUsers.length,
            actifs: allUsers.filter(u => u.Account?.statut === 'ACTIF').length,
            bloques: allUsers.filter(u => u.Account?.statut === 'BLOQUE').length,
            supprimes: allUsers.filter(u => u.Account?.statut === 'SUPPRIME').length
        };

        const statsTransac = {
            total: allTransac.length,
            virements: allTransac.filter(t => t.type === 'VIREMENT').length,
            depots: allTransac.filter(t => t.type === 'DEPOT').length,
            retraits: allTransac.filter(t => t.type === 'RETRAIT').length,
        };

        // ══ 3. CONFIGURATION PDF ══
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Rapport_Global_SGB.pdf');

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        // ── HEADER ──────────────────────────────────────────
        doc.rect(0, 0, 595, 80).fill('#1565C0');
        doc.fillColor('white')
           .fontSize(20).font('Helvetica-Bold')
           .text('SGB — RAPPORT FINANCIER GLOBAL', 40, 20, { align: 'center' });
        doc.fontSize(10).font('Helvetica')
           .text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 40, 52, { align: 'center' });

        // ── SECTION 1 : SYNTHÈSE ─────────────────────────────
        doc.moveDown(3);
        doc.rect(40, doc.y, 515, 25).fill('#E3F2FD');
        doc.fillColor('#1565C0').fontSize(13).font('Helvetica-Bold')
           .text('1. SYNTHÈSE GLOBALE', 50, doc.y + 6);
        doc.moveDown(1.5);

        doc.fillColor('#212121').fontSize(11).font('Helvetica');
        doc.text(`Total utilisateurs      : ${stats.total}`);
        doc.text(`Comptes ACTIFS          : ${stats.actifs}`);
        doc.text(`Comptes BLOQUÉS         : ${stats.bloques}`);
        doc.text(`Comptes SUPPRIMÉS       : ${stats.supprimes}`);
        doc.text(`Liquidité totale        : ${totalLiquidite.toLocaleString('fr-FR')} FCFA`);
        doc.text(`Total transactions      : ${statsTransac.total}`);
        doc.text(`  → Virements           : ${statsTransac.virements}`);
        doc.text(`  → Dépôts              : ${statsTransac.depots}`);
        doc.text(`  → Retraits            : ${statsTransac.retraits}`);

        // ── SECTION 2 : BANQUES ──────────────────────────────
        doc.moveDown(1);
        doc.rect(40, doc.y, 515, 25).fill('#1565C0');
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text('2. BANQUES DU SYSTÈME', 50, doc.y + 6);
        doc.moveDown(1.5);

        allBanks.forEach((bank, index) => {
            const bgColor = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
            const usersInBank = allUsers.filter(u => u.Account?.bankId === bank.id);
            const liquiditeBank = usersInBank.reduce((sum, u) => 
                sum + parseFloat(u.Account?.solde || 0), 0);

            doc.rect(40, doc.y, 515, 50).fill(bgColor).stroke('#E0E0E0');
            const bankY = doc.y + 5;

            doc.fillColor('#1565C0').fontSize(11).font('Helvetica-Bold')
               .text(`${bank.nom} — ${bank.code_agence}`, 50, bankY);
            doc.fillColor('#212121').fontSize(10).font('Helvetica')
               .text(`Clients : ${usersInBank.length} | Liquidité : ${liquiditeBank.toLocaleString('fr-FR')} FCFA`, 50)
               .text(`Frais virement : ${bank.frais_virement}% | Frais retrait : ${bank.frais_retrait}%`, 50);
            doc.moveDown(0.8);
        });

        // ── SECTION 3 : TOUS LES UTILISATEURS ───────────────
        doc.addPage();
        doc.rect(0, 0, 595, 40).fill('#1565C0');
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text('3. LISTE COMPLÈTE DES UTILISATEURS', 40, 13, { align: 'center' });
        doc.moveDown(2);

        // En-tête tableau users
        doc.rect(40, doc.y, 515, 20).fill('#E3F2FD');
        const uhY = doc.y + 5;
        doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold');
        doc.text('NOM', 50, uhY);
        doc.text('TÉLÉPHONE', 150, uhY);
        doc.text('BANQUE', 250, uhY);
        doc.text('SOLDE', 360, uhY);
        doc.text('STATUT', 460, uhY);
        doc.moveDown(1.2);

        allUsers.forEach((u, index) => {
            if (doc.y > 700) { doc.addPage(); }

            const bgColor = index % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
            const statutColor = u.Account?.statut === 'ACTIF' ? '#2E7D32' :
                               u.Account?.statut === 'BLOQUE' ? '#C62828' : '#757575';

            doc.rect(40, doc.y, 515, 18).fill(bgColor).stroke('#EEEEEE');
            const rowY = doc.y + 4;

            doc.fillColor('#212121').fontSize(8).font('Helvetica')
               .text(u.nom || 'N/A', 50, rowY)
               .text(u.telephone || 'N/A', 150, rowY)
               .text(u.Account?.Bank?.nom || 'N/A', 250, rowY)
               .text(u.Account ? `${parseFloat(u.Account.solde).toLocaleString('fr-FR')} FCFA` : 'N/A', 360, rowY);

            doc.fillColor(statutColor)
               .text(u.Account?.statut || 'N/A', 460, rowY);

            doc.moveDown(0.9);
        });

        // ── SECTION 4 : TOUTES LES TRANSACTIONS ─────────────
        doc.addPage();
        doc.rect(0, 0, 595, 40).fill('#1565C0');
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text('4. HISTORIQUE COMPLET DES TRANSACTIONS', 40, 13, { align: 'center' });
        doc.moveDown(2);

        // En-tête tableau transactions
        doc.rect(40, doc.y, 515, 20).fill('#E3F2FD');
        const thY = doc.y + 5;
        doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold');
        doc.text('DATE', 50, thY);
        doc.text('TYPE', 130, thY);
        doc.text('MONTANT', 200, thY);
        doc.text('EXPÉDITEUR', 290, thY);
        doc.text('DESTINATAIRE', 390, thY);
        doc.text('STATUT', 490, thY);
        doc.moveDown(1.2);

        allTransac.forEach((t, index) => {
            if (doc.y > 700) { doc.addPage(); }

            const bgColor = index % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
            const typeColor = t.type === 'VIREMENT' ? '#1565C0' :
                             t.type === 'DEPOT' ? '#2E7D32' : '#E65100';

            doc.rect(40, doc.y, 515, 18).fill(bgColor).stroke('#EEEEEE');
            const rowY = doc.y + 4;

            doc.fillColor(typeColor).fontSize(8).font('Helvetica-Bold')
               .text(t.type, 130, rowY);

            doc.fillColor('#212121').fontSize(8).font('Helvetica')
               .text(new Date(t.createdAt).toLocaleDateString('fr-FR'), 50, rowY)
               .text(`${parseFloat(t.montant).toLocaleString('fr-FR')} FCFA`, 200, rowY)
               .text(t.Expediteur ? t.Expediteur.nom : (t.expediteur_tel || 'Système'), 290, rowY)
               .text(t.Destinataire ? t.Destinataire.nom : (t.destinataire_tel || 'Système'), 390, rowY)
               .text(t.status, 490, rowY);

            doc.moveDown(0.9);
        });

        // ── FOOTER ───────────────────────────────────────────
        doc.rect(0, 780, 595, 60).fill('#1565C0');
        doc.fillColor('white').fontSize(9).font('Helvetica')
           .text('Document confidentiel — Réservé à l\'administration — SGB Université de Yaoundé I',
               40, 795, { align: 'center' })
           .text(`Généré le ${new Date().toLocaleString('fr-FR')}`, 40, 810, { align: 'center' });

        doc.end();

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur génération PDF : " + error.message 
        });
    }
};

exports.updateAccountStatus = async (req, res) => {
    try {
        const { userId, bankId, status } = req.body;

        // ══ 1. VÉRIFIER QUE LE STATUT EST VALIDE ══
        if (!['ACTIF', 'BLOQUE', 'SUPPRIME'].includes(status)) {
            return res.status(400).json({ 
                error: "❌ Statut invalide. Utilisez 'ACTIF', 'BLOQUE' ou 'SUPPRIME'." 
            });
        }

        // ══ 2. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Utilisateur non trouvé." 
            });
        }

        // ══ 3. VÉRIFIER LE COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({ 
            where: { userId, bankId },
            include: [{ model: Bank, as: 'Bank' }]
        });

        if (!account) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour cet utilisateur dans cette banque." 
            });
        }

        // ══ 4. VÉRIFIER SI STATUT DÉJÀ IDENTIQUE ══
        if (account.statut === status) {
            return res.status(400).json({ 
                error: `❌ Ce compte est déjà en statut ${status}.` 
            });
        }

        // ══ 5. METTRE À JOUR ══
        const ancienStatut = account.statut;
        await account.update({ statut: status });

        return res.status(200).json({ 
            message: `✅ Statut mis à jour avec succès.`,
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                banque: account.Bank ? account.Bank.nom : 'Inconnue',
                ancien_statut: ancienStatut,
                nouveau_statut: status
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur : " + error.message 
        });
    }
};

exports.updateAccountLimit = async (req, res) => {
    try {
        const { userId, bankId, limite } = req.body;

        // ══ 1. VÉRIFIER QUE LA LIMITE EST VALIDE ══
        if (!limite || parseFloat(limite) <= 0) {
            return res.status(400).json({ 
                error: "❌ La limite doit être supérieure à 0 FCFA." 
            });
        }

        if (parseFloat(limite) > 1000000000) {
            return res.status(400).json({ 
                error: "❌ La limite ne peut pas dépasser 1 000 000 000 FCFA." 
            });
        }

        // ══ 2. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Utilisateur non trouvé." 
            });
        }

        // ══ 3. VÉRIFIER LE COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({ 
            where: { userId, bankId },
            include: [{ model: Bank, as: 'Bank' }]
        });

        if (!account) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour cet utilisateur dans cette banque." 
            });
        }

        // ══ 4. VÉRIFIER LE STATUT DU COMPTE ══
        if (account.statut === 'BLOQUE') {
            return res.status(403).json({ 
                error: "🔒 Impossible de modifier la limite d'un compte bloqué." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            return res.status(403).json({ 
                error: "🗑️ Impossible de modifier la limite d'un compte supprimé." 
            });
        }

        // ══ 5. METTRE À JOUR LA LIMITE ══
        const ancienneLimite = account.limite_virement;
        await account.update({ limite_virement: parseFloat(limite) });

        return res.status(200).json({ 
            message: "✅ Limite de virement mise à jour avec succès.",
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                banque: account.Bank ? account.Bank.nom : 'Inconnue',
                ancienne_limite: `${parseFloat(ancienneLimite).toLocaleString('fr-FR')} FCFA`,
                nouvelle_limite: `${parseFloat(limite).toLocaleString('fr-FR')} FCFA`
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur : " + error.message 
        });
    }
};