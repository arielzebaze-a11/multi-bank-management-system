const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');
const Bank = require('../models/Bank'); // Ajout du modèle Bank
const { Op } = require("sequelize");

// 3. Liste de tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    
    try {
        // Récupérer tous les users avec leurs comptes et banques associées
        const users = await User.findAll({
            attributes: { exclude: ['code_pin'] }, // On cache le PIN
            include: [{
            model: Account,
            as: 'Accounts',
            attributes: [
                'id',
                'bankId',
                'userId',
                'solde',
                'statut',
                'limite_virement'
            ],
                include: [{
                    model: Bank,
                    as: 'Bank',
                    attributes: ['nom', 'code_agence']
                }]
            }]
        });

        console.log(
        "BANKID TEST =",
        users[0]?.Accounts?.[0]
        );

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
                comptes: u.Accounts
                    ? u.Accounts.map(acc => ({

                        accountId: acc.id,

                        userId: acc.userId,

                        bankId: acc.bankId,

                        numero: `ACC-${String(acc.id).padStart(4, '0')}`,

                        banque: acc.Bank ? acc.Bank.nom : "Inconnue",

                        code_agence: acc.Bank
                            ? acc.Bank.code_agence
                            : "N/A",

                        solde: `${parseFloat(acc.solde).toLocaleString("fr-FR")} FCFA`,

                        statut: acc.statut,

                        limite_virement:
                            `${parseFloat(acc.limite_virement).toLocaleString("fr-FR")} FCFA`

                    }))
                    : []
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

// Archiver un compte utilisateur
exports.deleteUser = async (req, res) => {
    try {

        console.log("===== DELETE USER APPELE =====");
        console.log("PARAMS =", req.params);
        console.log("BODY =", req.body);

        const { userId } = req.params;
        const { bankId } = req.body; // On cible UNE banque spécifique

        console.log("userId =", userId);
        console.log("bankId =", bankId);

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

        console.log("ACCOUNT =", account);

        if (!account) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour cet utilisateur dans cette banque." 
            });
        }

        // ══ 3. VÉRIFIER LE STATUT ACTUEL ══
        if (account.statut === 'SUPPRIME') {
            return res.status(400).json({ 
                error: "❌ Ce compte est déjà archivé." 
            });
        }

        if (account.statut === 'BLOQUE') {
            return res.status(400).json({ 
                error: "🔒 Ce compte est déjà bloqué. Utilisez débloquer d'abord." 
            });
        }


        // ══ 4.  Archiver le compte ══
        await account.update({ statut: 'SUPPRIME' });

        console.log("On passe à update...");

        return res.status(200).json({ 
            message: "✅ Compte archivé avec succès.",
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                banque: account.Bank ? account.Bank.nom : 'Inconnue',
                bankId: bankId,
                nouveau_statut: 'SUPPRIME'
            }
        });

        console.log("UPDATE OK");

    } catch (error) {

        console.log("ERREUR COMPLETE =");
        console.log(error);

        return res.status(500).json({
            error: error.message
        });
    }
};

// 9. Changer le rôle d'un utilisateur (Promouvoir en ADMIN)
exports.changeUserRole = async (req, res) => {
    try {
        const { userId, newRole } = req.body;

        // ══ 1. VÉRIFIER QUE LE RÔLE EST VALIDE ══
        if (!['CLIENT', 'ADMIN'].includes(newRole)) {
            return res.status(400).json({ 
                error: "❌ Rôle invalide. Utilisez 'CLIENT' ou 'ADMIN'." 
            });
        }

        // ══ 2. VÉRIFIER QUE L'UTILISATEUR EXISTE ══
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Utilisateur non trouvé." 
            });
        }

        // ══ 3. VÉRIFIER SI RÔLE DÉJÀ IDENTIQUE ══
        if (user.role === newRole) {
            return res.status(400).json({ 
                error: `❌ Cet utilisateur a déjà le rôle ${newRole}.` 
            });
        }

        // ══ 4. METTRE À JOUR ══
        const ancienRole = user.role;
        await user.update({ role: newRole });

        return res.status(200).json({ 
            message: `✅ Rôle mis à jour avec succès.`,
            details: {
                userId: user.id,
                nom: user.nom,
                telephone: user.telephone,
                email: user.email,
                ancien_role: ancienRole,
                nouveau_role: newRole
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur changement de rôle : " + error.message 
        });
    }
};

// adminController.js
exports.toggleAccountStatus = async (req, res) => {

    
    try {

        const { userId, bankId, statut } = req.body;

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
        if (!['ACTIF', 'BLOQUE', 'SUPPRIME'].includes(statut)) {
            return res.status(400).json({
                error: "❌ Statut invalide."
            });
        }

        // ══ 4. VÉRIFIER LE STATUT ACTUEL ══
        if (account.statut === statut) {
            return res.status(400).json({
                error: `❌ Le compte est déjà ${statut}.`
            });
        }

        // ══ 5. APPLIQUER L'ACTION ══
        await account.update({
            statut
        });

        return res.status(200).json({
            message: "✅ Statut modifié avec succès.",
            details: {
                userId: user.id,
                nom: user.nom,
                banque: account.Bank?.nom,
                ancien_statut: account.statut,
                nouveau_statut: statut
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur : " + error.message 
        });
    }
};


exports.getGlobalReportPDF = async (req, res) => {
    try {
        // ══ 1. RÉCUPÉRATION COMPLÈTE DES DONNÉES ══
        const allBanks = await Bank.findAll();
        
        const allUsers = await User.findAll({
            attributes: { exclude: ['code_pin'] },
            include: [{
                model: Account,
                as: 'Accounts',
                include: [{
                    model: Bank,
                    as: 'Bank'
                }]
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
        const totalLiquidite = allUsers.reduce((sum, user) => {
            const totalUser = (user.Accounts || []).reduce(
                (s, account) => s + parseFloat(account.solde || 0),
                0
            );

            return sum + totalUser;
        }, 0);
        
        const stats = {
            total: allUsers.length,

            actifs: allUsers.filter(
                u => u.Accounts?.some(a => a.statut === 'ACTIF')
            ).length,

            bloques: allUsers.filter(
                u => u.Accounts?.some(a => a.statut === 'BLOQUE')
            ).length,

            supprimes: allUsers.filter(
                u => u.Accounts?.some(a => a.statut === 'SUPPRIME')
            ).length
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

        const doc = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        doc.pipe(res);

        doc.on('error', (err) => {
            console.error('Erreur PDF stream:', err.message);
        });

        // ── HEADER PAGE 1 ────────────────────────────────────
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

        allBanks.forEach((bank) => {
            if (doc.y > 700) { doc.addPage(); }

            const usersInBank = allUsers.filter(
                u => u.Accounts?.some(a => a.bankId === bank.id)
            );
            const liquiditeBank = usersInBank.reduce((sum, u) => {

                const totalUser = (u.Accounts || [])
                    .filter(a => a.bankId === bank.id)
                    .reduce(
                        (s, a) => s + parseFloat(a.solde || 0),
                        0
                    );

                return sum + totalUser;

            }, 0);

            doc.rect(40, doc.y, 515, 50).fill('#F5F5F5').stroke('#E0E0E0');
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

        const drawUserHeader = () => {
            doc.rect(40, doc.y, 515, 20).fill('#E3F2FD');
            const hY = doc.y + 5;
            doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold');
            doc.text('NOM', 50, hY);
            doc.text('TÉLÉPHONE', 150, hY);
            doc.text('BANQUE', 250, hY);
            doc.text('SOLDE', 360, hY);
            doc.text('STATUT', 460, hY);
            doc.moveDown(1.2);
        };
        drawUserHeader();

        allUsers.forEach((u, index) => {
            if (doc.y > 750) {
                doc.addPage();
                drawUserHeader();
            }
            const bgColor = index % 2 === 0 ? '#FAFAFA' : '#FFFFFF';
            const account = u.Accounts?.[0];

            const statutColor =
                account?.statut === 'ACTIF'
                    ? '#2E7D32'
                    : account?.statut === 'BLOQUE'
                    ? '#C62828'
                    : '#757575';

            const rowY = doc.y + 4;
            doc.fillColor('#212121')
            .fontSize(8)
            .font('Helvetica')
            .text(u.nom || 'N/A', 50, rowY)
            .text(u.telephone || 'N/A', 150, rowY)
            .text(account?.Bank?.nom || 'N/A', 250, rowY)
            .text(
                    account
                        ? `${parseFloat(account.solde).toLocaleString('fr-FR')} FCFA`
                        : 'N/A',
                    360,
                    rowY
                );

            doc.fillColor(statutColor)
            .text(account?.statut || 'N/A', 460, rowY);
            doc.moveDown(0.9);
        });

        // ── SECTION 4 : TOUTES LES TRANSACTIONS ─────────────
        doc.addPage();
        doc.rect(0, 0, 595, 40).fill('#1565C0');
        doc.fillColor('white').fontSize(13).font('Helvetica-Bold')
           .text('4. HISTORIQUE COMPLET DES TRANSACTIONS', 40, 13, { align: 'center' });
        doc.moveDown(2);

        const drawTransacHeader = () => {
            doc.rect(40, doc.y, 515, 20).fill('#E3F2FD');
            const hY = doc.y + 5;
            doc.fillColor('#1565C0').fontSize(9).font('Helvetica-Bold');
            doc.text('DATE', 50, hY);
            doc.text('TYPE', 130, hY);
            doc.text('MONTANT', 200, hY);
            doc.text('EXPÉDITEUR', 290, hY);
            doc.text('DESTINATAIRE', 390, hY);
            doc.text('STATUT', 490, hY);
            doc.moveDown(1.2);
        };
        drawTransacHeader();

        allTransac.forEach((t, index) => {
            if (doc.y > 750) {
                doc.addPage();
                drawTransacHeader();
            }
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

        // ══ FOOTERS sur toutes les pages ══
        const range = doc.bufferedPageRange();
        const dateStr = new Date().toLocaleString('fr-FR');

        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            const y = doc.page.height - 50;
            doc.save();
            doc.rect(0, y, doc.page.width, 50).fill('#1565C0');
            doc.fillColor('white').fontSize(8).font('Helvetica')
               .text("Document confidentiel — SGB Université de Yaoundé I",
                   40, y + 10, { align: 'center', width: 515 })
               .text(`Généré le ${dateStr}`,
                   40, y + 24, { align: 'center', width: 515 });
            doc.restore();
        }
        doc.end();

    } catch (error) {
        console.error('Erreur PDF:', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ 
                error: "❌ Erreur génération PDF : " + error.message 
            });
        }
    }
};


exports.updateAccountStatus = async (req, res) => {
    try {

        const { userId, bankId, statut } = req.body;

        const account = await Account.findOne({
            where: { userId, bankId }
        });

        if (!account) {
            return res.status(404).json({
                error: "Compte introuvable"
            });
        }

        if (
            !["ACTIF", "BLOQUE", "SUPPRIME"] 
            .includes(statut)
        ) {
            return res.status(400).json({
                error: "Statut invalide"
            });
        }

        if (account.statut === statut) {
            return res.status(400).json({
                error: "Le compte possède déjà ce statut"
            });
        }

        await account.update({
            statut
        });

        return res.status(200).json({
            message: "Statut modifié avec succès"
        });

    } catch (error) {

        console.error("ERREUR STATUS :", error);

        return res.status(500).json({
            error: error.message
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
                error: "🗑️ Impossible de modifier la limite d'un compte archivé." 
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


exports.getDashboardStats = async (req, res) => {
    try {

        const totalUsers = await User.count();
        const totalAccounts = await Account.count();
        const totalBanks = await Bank.count();
        const totalTransactions = await Transaction.count();

        const accounts = await Account.findAll();

        const totalBalance = accounts.reduce(
            (sum, acc) => sum + parseFloat(acc.solde || 0),
            0
        );

        res.status(200).json({
            users: totalUsers,
            accounts: totalAccounts,
            banks: totalBanks,
            transactions: totalTransactions,
            balance: totalBalance
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

exports.getBanks = async (req, res) => {
    try {

        const banks = await Bank.findAll({
            attributes: [
                'id',
                'nom',
                'code_agence'
            ]
        });

        return res.status(200).json(banks);

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });

    }
};

exports.restoreAccount = async (req, res) => {

    try {

        const { userId, bankId } = req.body;

        const account = await Account.findOne({
            where: { userId, bankId }
        });

        if (!account) {
            return res.status(404).json({
                error: "Compte introuvable."
            });
        }

        if (account.statut !== "SUPPRIME") {
            return res.status(400).json({
                error: "Ce compte n'est pas archivé."
            });
        }

        await account.update({
            statut: "ACTIF"
        });

        return res.json({
            message: "Compte restauré avec succès."
        });

    } catch (error) {

        return res.status(500).json({
            error: error.message
        });

    }

};


// ======================================================
// RAPPORT PDF D'UN COMPTE
// ======================================================

exports.generateAccountReport = async (req, res) => {

    try {

        const { userId, bankId } = req.body;

        if (!userId || !bankId) {
            return res.status(400).json({
                error: "userId et bankId sont obligatoires."
            });
        }

        //-------------------------------------------------
        // Utilisateur
        //-------------------------------------------------

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                error: "Utilisateur introuvable."
            });
        }

        //-------------------------------------------------
        // Compte
        //-------------------------------------------------

        const account = await Account.findOne({

            where: {
                userId,
                bankId
            },

            include: [
                {
                    model: Bank,
                    as: "Bank"
                }
            ]

        });

        if (!account) {
            return res.status(404).json({
                error: "Compte introuvable."
            });
        }

        //-------------------------------------------------
        // Transactions
        //-------------------------------------------------

        const transactions = await Transaction.findAll({

            where: {

                [Op.or]: [

                    {
                        expediteur_tel: user.telephone
                    },

                    {
                        destinataire_tel: user.telephone
                    }

                ]

            },

            order: [
                ["createdAt", "DESC"]
            ]

        });

        //-------------------------------------------------
        // PDF
        //-------------------------------------------------

        const filename =
            `Rapport_ACC-${String(account.id).padStart(4, "0")}.pdf`;

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        const doc = new PDFDocument({

            margin: 40,
            size: "A4"

        });

        doc.pipe(res);

        //==================================================
// EN-TÊTE
//==================================================

doc
    .rect(0, 0, 595, 80)
    .fill("#0F172A");

doc
    .fillColor("white")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text(
        "SGB BANKING SYSTEM",
        40,
        22,
        {
            align: "center"
        }
    );

doc
    .fontSize(11)
    .font("Helvetica")
    .text(
        "Rapport détaillé d'un compte bancaire",
        {
            align: "center"
        }
    );

doc.moveDown(4);

//==================================================
// INFORMATIONS TITULAIRE
//==================================================

doc
    .fillColor("#1E3A8A")
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("INFORMATIONS DU TITULAIRE");

doc.moveDown(.5);

doc
    .fillColor("black")
    .fontSize(11)
    .font("Helvetica");

doc.text(`Nom : ${user.nom}`);
doc.text(`Téléphone : ${user.telephone}`);
doc.text(`Email : ${user.email}`);
doc.text(`Rôle : ${user.role}`);

doc.moveDown(1);

//==================================================
// INFORMATIONS DU COMPTE
//==================================================

doc
    .fillColor("#1E3A8A")
    .fontSize(15)
    .font("Helvetica-Bold")
    .text("COMPTE BANCAIRE");

doc.moveDown(.5);

doc
    .fillColor("black")
    .fontSize(11)
    .font("Helvetica");

doc.text(
    `Numéro : ACC-${String(account.id).padStart(4, "0")}`
);

doc.text(
    `Banque : ${account.Bank.nom}`
);

doc.text(
    `Agence : ${account.Bank.code_agence}`
);

doc.text(
    `Statut : ${account.statut}`
);

doc.text(
    `Solde : ${parseFloat(account.solde).toLocaleString("fr-FR")} FCFA`
);

doc.text(
    `Limite : ${parseFloat(account.limite_virement).toLocaleString("fr-FR")} FCFA`
);

doc.moveDown(1);

//==================================================
// STATISTIQUES
//==================================================

const depots =
transactions.filter(t => t.type === "DEPOT");

const retraits =
transactions.filter(t => t.type === "RETRAIT");

const virements =
transactions.filter(t => t.type === "VIREMENT");

doc
.fillColor("#1E3A8A")
.fontSize(15)
.font("Helvetica-Bold")
.text("STATISTIQUES");

doc.moveDown(.5);

doc
.fillColor("black")
.fontSize(11);

doc.text(
`Nombre de transactions : ${transactions.length}`
);

doc.text(
`Dépôts : ${depots.length}`
);

doc.text(
`Retraits : ${retraits.length}`
);

doc.text(
`Virements : ${virements.length}`
);

doc.moveDown(1);

//==================================================
// HISTORIQUE DES TRANSACTIONS
//==================================================

doc.moveDown(1);

doc
.fillColor("#1E3A8A")
.fontSize(15)
.font("Helvetica-Bold")
.text("HISTORIQUE DES TRANSACTIONS");

doc.moveDown(0.8);

// ---------------- EN-TÊTE DU TABLEAU ----------------

let y = doc.y;

doc
.rect(40, y, 515, 22)
.fill("#0F172A");

doc.fillColor("white")
.fontSize(10)
.font("Helvetica-Bold");

doc.text("Date", 50, y + 6);
doc.text("Type", 150, y + 6);
doc.text("Montant", 260, y + 6);
doc.text("Statut", 430, y + 6);

y += 25;

// ---------------- LIGNES ----------------

doc.font("Helvetica");
doc.fontSize(9);

if (transactions.length === 0) {

    doc.fillColor("#666");

    doc.text(
        "Aucune transaction disponible.",
        50,
        y
    );

}
else {

    transactions.forEach((t, index) => {

        // Nouvelle page automatique
        if (y > 720) {

            doc.addPage();

            y = 40;

            doc
            .rect(40, y, 515, 22)
            .fill("#0F172A");

            doc.fillColor("white")
            .fontSize(10)
            .font("Helvetica-Bold");

            doc.text("Date", 50, y + 6);
            doc.text("Type", 150, y + 6);
            doc.text("Montant", 260, y + 6);
            doc.text("Statut", 430, y + 6);

            y += 25;

        }

        // Fond alterné
        if (index % 2 === 0) {

            doc
            .rect(40, y - 2, 515, 20)
            .fill("#F8FAFC");

        }

        doc.fillColor("black");
        doc.font("Helvetica");

        doc.text(
            new Date(t.createdAt)
            .toLocaleDateString("fr-FR"),
            50,
            y
        );

        doc.text(
            t.type,
            150,
            y
        );

        doc.text(
            parseFloat(t.montant)
            .toLocaleString("fr-FR") + " FCFA",
            260,
            y
        );

        doc.text(
            t.statut,
            430,
            y
        );

        y += 22;

    });

}

//==================================================
// FIN PAGE
//==================================================

doc.moveDown(2);

doc
.fontSize(9)
.fillColor("gray")
.text(
"Document généré automatiquement par SGB Banking System.",
{
align:"center"
}
);

doc.text(
new Date().toLocaleString("fr-FR"),
{
align:"center"
}
);

doc.end();


    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
                "Erreur génération rapport : "
                + error.message

        });

    }

};