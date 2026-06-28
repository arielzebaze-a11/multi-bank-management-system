const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const Bank = require('../models/Bank'); // Ajout du modèle Bank
const PDFDocument = require('pdfkit'); // Pour générer le PDF du RIB
const MAX_SOLDE_AUTORISE = 1_000_000;
const bcrypt=require('bcrypt');

exports.getBalance = async (req, res) => {
    try {
        const { telephone, code_pin, code_agence } = req.body;

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

        // 3. Vérifier le compte dans CETTE banque avec ce PIN
       const account = await Account.findOne({
            where:{
                userId:user.id,
                bankId:bank.id
            }
        });

        if(!account){
            return res.status(401).json({
                error:"❌ Code PIN ou code agence incorrect."
            });
        }

        const pinOk = await bcrypt.compare(
            code_pin,
            account.code_pin
        );

        if(!pinOk){
            return res.status(401).json({
                error:"❌ Code PIN ou code agence incorrect."
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

        // 5. Compte ACTIF → afficher le solde
        return res.status(200).json({
            message: "✅ Solde récupéré avec succès",
            compte: {
                banque: bank.nom,
                titulaire: user.nom,
                telephone: user.telephone,
                solde: account.solde,
                statut: account.statut
            }
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur serveur",
            message: error.message 
        });
    }
};

// Historique des transactions
exports.getHistory = async (req, res) => {
    try {
        const { telephone, code_pin, code_agence } = req.body;

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

        // 3. Vérifier le compte dans CETTE banque avec ce PIN
        const account = await Account.findOne({ 
            where: { 
                userId: user.id, 
                bankId: bank.id,
            } 
        });

        if (!account) {
            return res.status(401).json({ 
                error: "❌ Code PIN ou code agence incorrect." 
            });
        }

        const pinOk = await bcrypt.compare(
            code_pin,
            account.code_pin
        );

        if(!pinOk){
            return res.status(401).json({
                error:"❌ Code PIN ou code agence incorrect."
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

        // 5. Récupérer les transactions liées à CE numéro
        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { expediteur_tel: telephone },
                    { destinataire_tel: telephone }
                ]
            },
            include: [
                { model: User, as: 'Expediteur', attributes: ['nom', 'email', 'telephone'] },
                { model: User, as: 'Destinataire', attributes: ['nom', 'email', 'telephone'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // 6. Formatage
        const historique = transactions.map(t => {
            const isSent = t.expediteur_tel === telephone;
            const correspondant = isSent ? t.Destinataire : t.Expediteur;

            return {
                date: t.createdAt,
                montant: `${t.montant} FCFA`,
                type: t.type,
                sens: isSent ? "💸 Argent envoyé" : "💰 Argent reçu",
                correspondant: {
                    nom: correspondant ? correspondant.nom : "Système/Inconnu",
                    telephone: isSent ? t.destinataire_tel : t.expediteur_tel
                },
                statut: t.status
            };
        });

        return res.status(200).json({
            message: "✅ Historique récupéré",
            client: user.nom,
            banque: bank.nom,
            solde_actuel: `${account.solde} FCFA`,
            nombre_transactions: historique.length,
            transactions: historique
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur serveur",
            message: error.message 
        });
    }
};

// --- VÉRIFICATION DU DESTINATAIRE ---
exports.verifyReceiver = async (req, res) => {
    try {
        const { telephone } = req.params;

        // 1. Validation du format
        if (!telephone || telephone.length < 9) {
            return res.status(400).json({ 
                error: "❌ Format incorrect.",
                message: "Le numéro est trop court ou invalide." 
            });
        }

        // 2. Vérifier que l'utilisateur existe
        const user = await User.findOne({ where: { telephone } });

        if (!user) {
            return res.status(404).json({ 
                error: "❌ Compte non trouvé.",
                message: "Ce numéro n'existe pas dans notre système." 
            });
        }

        // 3. Vérifier qu'il a AU MOINS un compte ACTIF
        const activeAccount = await Account.findOne({ 
            where: { 
                userId: user.id, 
                statut: 'ACTIF' 
            } 
        });

        if (!activeAccount) {
            return res.status(403).json({ 
                error: "❌ Accès interdit.",
                message: "Le compte de ce destinataire est bloqué ou inactif." 
            });
        }

        // 4. Succès → retourner le nom
        return res.status(200).json({ 
            nom: user.nom,
            telephone: user.telephone,
            message: "✅ Destinataire identifié" 
        });

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur serveur",
            message: error.message 
        });
    }
};

// Virement par numéro de téléphone et code pin
exports.transfer = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { expediteurTel, code_pin, code_agence, destinataireTel, montant, nomConfirme } = req.body;

        // ══ 1. VÉRIFIER LA BANQUE DE L'EXPÉDITEUR ══
        const bankExpediteur = await Bank.findOne({ where: { code_agence } });
        if (!bankExpediteur) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Code agence invalide." });
        }

        // ══ 2. VÉRIFIER L'EXPÉDITEUR ══
        const sender = await User.findOne({ where: { telephone: expediteurTel } });
        if (!sender) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Numéro expéditeur introuvable." });
        }

        // ══ 3. VÉRIFIER SON COMPTE DANS CETTE BANQUE ══
        const senderAccount = await Account.findOne({
            where: { 
                userId: sender.id, 
                bankId: bankExpediteur.id,
            }
        });

        if (!senderAccount) {
            await t.rollback();
            return res.status(401).json({ error: "❌ Code PIN ou code agence incorrect." });
        }
        
        const pinOk = await bcrypt.compare(
            code_pin,
            senderAccount.code_pin
        );

        if(!pinOk){
            await t.rollback();

            return res.status(401).json({
                error:"❌ Code PIN incorrect."
            });
        }

        // ══ 4. VÉRIFIER STATUT EXPÉDITEUR ══
        if (senderAccount.statut === 'BLOQUE') {
            await t.rollback();
            return res.status(403).json({ error: "🔒 Votre compte est bloqué. Contactez l'administrateur." });
        }

        if (senderAccount.statut === 'SUPPRIME') {
            await t.rollback();
            return res.status(403).json({ error: "🗑️ Votre compte a été supprimé." });
        }

        // ══ 5. VÉRIFIER LE DESTINATAIRE ══
        const receiver = await User.findOne({ where: { telephone: destinataireTel } });
        if (!receiver) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Numéro destinataire introuvable." });
        }

        // ══ 6. VÉRIFIER QUE LE DESTINATAIRE A UN COMPTE ACTIF (dans n'importe quelle banque) ══
        const receiverAccount = await Account.findOne({
            where: { 
                userId: receiver.id,
                statut: 'ACTIF'
            }
        });

        if (!receiverAccount) {
            await t.rollback();
            return res.status(403).json({ error: "❌ Le destinataire n'a pas de compte actif." });
        }

        // ══ 7. VÉRIFIER LE NOM DU DESTINATAIRE ══
        if (nomConfirme && receiver.nom !== nomConfirme) {
            await t.rollback();
            return res.status(400).json({ 
                error: "❌ Le nom du destinataire ne correspond pas. Veuillez recommencer." 
            });
        }

        // ══ 8. CALCULER LES FRAIS DE LA BANQUE EXPÉDITEUR ══
        const montantNet = parseFloat(montant);
        const fraisPourcentage = parseFloat(bankExpediteur.frais_virement); // ex: 1.5
        const frais = parseFloat(((montantNet * fraisPourcentage) / 100).toFixed(2));
        const montantTotal = parseFloat((montantNet + frais).toFixed(2)); // ce qui est débité

        // ══ 9. VÉRIFIER LE SOLDE (montant + frais) ══
        const soldeExp = parseFloat(senderAccount.solde);
        if (soldeExp < montantTotal) {
            await t.rollback();
            return res.status(400).json({ 
                error: "❌ Solde insuffisant.",
                details: {
                    solde_disponible: `${soldeExp} FCFA`,
                    montant_transfert: `${montantNet} FCFA`,
                    frais: `${frais} FCFA (${fraisPourcentage}%)`,
                    total_requis: `${montantTotal} FCFA`
                }
            });
        }

        // ══ 10. VÉRIFIER LA LIMITE DE VIREMENT ══
        if (montantNet > parseFloat(senderAccount.limite_virement)) {
            await t.rollback();
            return res.status(400).json({ 
                error: `❌ Montant dépasse votre limite de virement de ${senderAccount.limite_virement} FCFA.`
            });
        }

        // ══ 11. EXÉCUTER LE VIREMENT ══
        await senderAccount.update(
            { solde: parseFloat((soldeExp - montantTotal).toFixed(2)) }, 
            { transaction: t }
        );
        await receiverAccount.update(
            { solde: parseFloat((parseFloat(receiverAccount.solde) + montantNet).toFixed(2)) }, 
            { transaction: t }
        );

        // ══ 12. HISTORISER ══
        await Transaction.create({
            type: 'VIREMENT',
            montant: montantNet,
            expediteur_tel: expediteurTel,
            destinataire_tel: destinataireTel,
            status: 'SUCCESS'
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({
            message: "✅ Virement effectué avec succès !",
            details: {
                expediteur: sender.nom,
                destinataire: receiver.nom,
                montant_envoye: `${montantNet} FCFA`,
                frais_appliques: `${frais} FCFA (${fraisPourcentage}% - ${bankExpediteur.nom})`,
                total_debite: `${montantTotal} FCFA`,
                nouveau_solde: `${(soldeExp - montantTotal).toFixed(2)} FCFA`
            }
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "❌ Erreur technique : " + error.message });
    }
};

// Dépôt
exports.deposit = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { telephone, code_pin, code_agence, montant } = req.body;

        // ══ 1. VÉRIFIER LA BANQUE ══
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Code agence invalide." });
        }

        // ══ 2. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Numéro introuvable." });
        }

        // ══ 3. VÉRIFIER SON COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({
            where: { 
                userId: user.id, 
                bankId: bank.id,
            }
        });

        if (!account) {
            await t.rollback();
            return res.status(401).json({ error: "❌ Code PIN ou code agence incorrect." });
        }

        const pinOk = await bcrypt.compare(
            code_pin,
            account.code_pin
        );

        if(!pinOk){
            await t.rollback();

            return res.status(401).json({
                error:"❌ Code PIN incorrect."
            });
        }

        // ══ 4. VÉRIFIER LE STATUT ══
        if (account.statut === 'BLOQUE') {
            await t.rollback();
            return res.status(403).json({ error: "🔒 Ce compte est bloqué. Contactez l'administrateur." });
        }

        if (account.statut === 'SUPPRIME') {
            await t.rollback();
            return res.status(403).json({ error: "🗑️ Ce compte a été supprimé." });
        }

        // ══ 5. VÉRIFIER LE MONTANT ══
        const montantNet = parseFloat(montant);
        if (montantNet <= 0) {
            await t.rollback();
            return res.status(400).json({ error: "❌ Le montant doit être supérieur à 0 FCFA." });
        }

        // ══ 6. VÉRIFIER LE PLAFOND DU COMPTE (solde max 3 000 000) ══
        const soldeActuel = parseFloat(account.solde);
        if (soldeActuel + montantNet > 3000000) {
            await t.rollback();
            return res.status(400).json({ 
                error: "❌ Dépôt impossible : plafond de 3 000 000 FCFA atteint.",
                details: {
                    solde_actuel: `${soldeActuel} FCFA`,
                    montant_depot: `${montantNet} FCFA`,
                    plafond: "3 000 000 FCFA",
                    depot_max_possible: `${(3000000 - soldeActuel).toFixed(2)} FCFA`
                }
            });
        }

        // ══ 7. EFFECTUER LE DÉPÔT ══
        const nouveauSolde = parseFloat((soldeActuel + montantNet).toFixed(2));
        await account.update({ solde: nouveauSolde }, { transaction: t });

        // ══ 8. HISTORISER ══
        await Transaction.create({
            type: 'DEPOT',
            montant: montantNet,
            expediteur_tel: null,
            destinataire_tel: telephone,
            status: 'SUCCESS'
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({
            message: "✅ Dépôt effectué avec succès !",
            details: {
                titulaire: user.nom,
                banque: bank.nom,
                montant_depose: `${montantNet} FCFA`,
                ancien_solde: `${soldeActuel} FCFA`,
                nouveau_solde: `${nouveauSolde} FCFA`
            }
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "❌ Erreur technique : " + error.message });
    }
};

// --- RETRAIT ---
exports.withdraw = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { telephone, code_pin, code_agence, montant } = req.body;

        // ══ 1. VÉRIFIER LA BANQUE ══
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Code agence invalide." });
        }

        // ══ 2. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            await t.rollback();
            return res.status(404).json({ error: "❌ Numéro introuvable." });
        }

        // ══ 3. VÉRIFIER SON COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({
            where: { 
                userId: user.id, 
                bankId: bank.id,
            },
            lock: t.LOCK.UPDATE // Empêche les retraits simultanés
        });

        if (!account) {
            await t.rollback();
            return res.status(401).json({ error: "❌ Code PIN ou code agence incorrect." });
        }

        const pinOk = await bcrypt.compare(
            code_pin,
            account.code_pin
        );

        if(!pinOk){
            await t.rollback();

            return res.status(401).json({
                error:"❌ Code PIN incorrect."
            });
        }

        // ══ 4. VÉRIFIER LE STATUT ══
        if (account.statut === 'BLOQUE') {
            await t.rollback();
            return res.status(403).json({ 
                error: "🔒 Ce compte est bloqué. Contactez l'administrateur." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            await t.rollback();
            return res.status(403).json({ 
                error: "🗑️ Ce compte a été supprimé." 
            });
        }

        // ══ 5. VÉRIFIER LE MONTANT ══
        const montantNet = parseFloat(montant);
        if (montantNet <= 0) {
            await t.rollback();
            return res.status(400).json({ 
                error: "❌ Le montant doit être supérieur à 0 FCFA." 
            });
        }

        // ══ 6. CALCULER LES FRAIS DE RETRAIT ══
        const fraisPourcentage = parseFloat(bank.frais_retrait); // ex: 2.0
        const frais = parseFloat(((montantNet * fraisPourcentage) / 100).toFixed(2));
        const montantTotal = parseFloat((montantNet + frais).toFixed(2)); // ce qui est débité

        // ══ 7. VÉRIFIER LE SOLDE (montant + frais) ══
        const soldeActuel = parseFloat(account.solde);
        if (soldeActuel < montantTotal) {
            await t.rollback();
            return res.status(400).json({ 
                error: "❌ Solde insuffisant.",
                details: {
                    solde_disponible: `${soldeActuel} FCFA`,
                    montant_retrait: `${montantNet} FCFA`,
                    frais: `${frais} FCFA (${fraisPourcentage}%)`,
                    total_requis: `${montantTotal} FCFA`
                }
            });
        }

        // ══ 8. VÉRIFIER LA LIMITE DE VIREMENT ══
        if (montantNet > parseFloat(account.limite_virement)) {
            await t.rollback();
            return res.status(400).json({ 
                error: `❌ Montant dépasse votre limite de retrait de ${account.limite_virement} FCFA.`
            });
        }

        // ══ 9. EFFECTUER LE RETRAIT ══
        const nouveauSolde = parseFloat((soldeActuel - montantTotal).toFixed(2));
        await account.update(
            { solde: nouveauSolde }, 
            { transaction: t }
        );

        // ══ 10. HISTORISER ══
        await Transaction.create({
            type: 'RETRAIT',
            montant: montantNet,
            expediteur_tel: telephone,
            destinataire_tel: null,
            status: 'SUCCESS'
        }, { transaction: t });

        await t.commit();

        return res.status(200).json({
            message: "✅ Retrait effectué avec succès !",
            details: {
                titulaire: user.nom,
                banque: bank.nom,
                montant_retire: `${montantNet} FCFA`,
                frais_appliques: `${frais} FCFA (${fraisPourcentage}% - ${bank.nom})`,
                total_debite: `${montantTotal} FCFA`,
                ancien_solde: `${soldeActuel} FCFA`,
                nouveau_solde: `${nouveauSolde} FCFA`
            }
        });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "❌ Erreur technique : " + error.message });
    }
};

// Simulation RIB
exports.getRIB = async (req, res) => {
    try {
        const { telephone } = req.body;

        // ══ 1. VÉRIFIER QUE LE NUMÉRO EXISTE ══
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Numéro introuvable dans notre système." 
            });
        }

        // ══ 2. RÉCUPÉRER TOUS LES COMPTES ACTIFS DE CET UTILISATEUR ══
        const accounts = await Account.findAll({
            where: { userId: user.id },
            include: [{ model: Bank, as: 'Bank' }]
        });

        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ 
                error: "❌ Aucun compte trouvé pour ce numéro." 
            });
        }

        // ══ 3. RÉCUPÉRER TOUTES LES TRANSACTIONS ══
        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { expediteur_tel: telephone },
                    { destinataire_tel: telephone }
                ]
            },
            order: [['createdAt', 'DESC']]
        });

        // ══ 4. GÉNÉRER LE PDF ══
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const filename = `RIB_${user.nom.replace(/\s/g, '_')}.pdf`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // ── HEADER ──────────────────────────────────────────
        doc.rect(0, 0, 595, 80).fill('#1565C0');
        doc.fillColor('white')
           .fontSize(22)
           .font('Helvetica-Bold')
           .text('RELEVÉ D\'IDENTITÉ BANCAIRE', 40, 20, { align: 'center' });
        doc.fontSize(11)
           .font('Helvetica')
           .text('Système de Gestion Bancaire — Université de Yaoundé I', 40, 50, { align: 'center' });

        // ── INFOS PERSONNELLES ───────────────────────────────
        doc.moveDown(3);
        doc.rect(40, 95, 515, 25).fill('#E3F2FD');
        doc.fillColor('#1565C0')
           .fontSize(13)
           .font('Helvetica-Bold')
           .text('INFORMATIONS PERSONNELLES', 50, 101);

        doc.fillColor('#212121').fontSize(11).font('Helvetica');
        doc.moveDown(0.5);
        doc.text(`Titulaire       : ${user.nom}`, 50);
        doc.text(`Téléphone       : ${user.telephone}`);
        doc.text(`Email           : ${user.email}`);
        doc.text(`Date du relevé  : ${new Date().toLocaleDateString('fr-FR')}`);

        // ── COMPTES BANCAIRES ────────────────────────────────
        doc.moveDown(1);
        doc.rect(40, doc.y, 515, 25).fill('#1565C0');
        doc.fillColor('white')
           .fontSize(13)
           .font('Helvetica-Bold')
           .text('MES COMPTES BANCAIRES', 50, doc.y + 6);

        doc.moveDown(1.5);
        accounts.forEach((account, index) => {
            const bgColor = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
            const statutColor = account.statut === 'ACTIF' ? '#2E7D32' : '#C62828';

            doc.rect(40, doc.y, 515, 55).fill(bgColor).stroke('#E0E0E0');

            doc.fillColor('#1565C0')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(`${account.Bank ? account.Bank.nom : 'Banque inconnue'}`, 50, doc.y + 5);

            doc.fillColor('#212121')
               .fontSize(10)
               .font('Helvetica')
               .text(`N° Compte  : ACC-${String(account.id).padStart(4, '0')}`, 50, doc.y + 2);

            doc.text(`Solde      : ${parseFloat(account.solde).toLocaleString('fr-FR')} FCFA`, 50);

            doc.fillColor(statutColor)
               .text(`Statut     : ${account.statut}`, 50);

            doc.fillColor('#212121')
               .text(`Limite virement : ${parseFloat(account.limite_virement).toLocaleString('fr-FR')} FCFA`, 50);

            doc.moveDown(0.8);
        });

        // ── COMPTES BANCAIRES ────────────────────────────────
        accounts.forEach((account, index) => {
            const bgColor = index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';

            doc.rect(40, doc.y, 515, 55).fill(bgColor).stroke('#E0E0E0');

            doc.fillColor('#1565C0')
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`${account.Bank ? account.Bank.nom : 'Banque inconnue'}`, 50, doc.y + 5);

            // ══ BLOQUÉ → message rouge, pas d'infos ══
            if (account.statut === 'BLOQUE') {
                doc.fillColor('#C62828')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('🔒 COMPTE BLOQUÉ — Contactez l\'administrateur.', 50);
                doc.moveDown(0.8);
                return;
            }

            // ══ SUPPRIMÉ → message gris, pas d'infos ══
            if (account.statut === 'SUPPRIME') {
                doc.fillColor('#757575')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('🗑️ COMPTE SUPPRIMÉ — Ce compte est archivé.', 50);
                doc.moveDown(0.8);
                return;
            }

            // ══ ACTIF → on affiche toutes les infos ══
            doc.fillColor('#212121')
            .fontSize(10)
            .font('Helvetica')
            .text(`N° Compte       : ACC-${String(account.id).padStart(4, '0')}`, 50);
            doc.text(`Solde           : ${parseFloat(account.solde).toLocaleString('fr-FR')} FCFA`);
            doc.fillColor('#2E7D32')
            .text(`Statut          : ACTIF`);
            doc.fillColor('#212121')
            .text(`Limite virement : ${parseFloat(account.limite_virement).toLocaleString('fr-FR')} FCFA`);

            doc.moveDown(0.8);
        });
        // ── FOOTER ───────────────────────────────────────────
        doc.rect(0, 780, 595, 60).fill('#1565C0');
        doc.fillColor('white')
           .fontSize(9)
           .font('Helvetica')
           .text(
               'Document généré automatiquement — Confidentiel — Ne pas divulguer',
               40, 795, { align: 'center' }
           );
        doc.text(
            `Généré le ${new Date().toLocaleString('fr-FR')}`,
            40, 810, { align: 'center' }
        );

        doc.end();

    } catch (error) {
        return res.status(500).json({ 
            error: "❌ Erreur génération RIB : " + error.message 
        });
    }
};

exports.closeAccount = async (req, res) => {
    try {
        const { telephone, code_pin, code_agence } = req.body;

        // ══ 1. VÉRIFIER LA BANQUE ══
        const bank = await Bank.findOne({ where: { code_agence } });
        if (!bank) {
            return res.status(404).json({ 
                error: "❌ Code agence invalide." 
            });
        }

        // ══ 2. VÉRIFIER L'UTILISATEUR ══
        const user = await User.findOne({ where: { telephone } });
        if (!user) {
            return res.status(404).json({ 
                error: "❌ Numéro introuvable." 
            });
        }

        // ══ 3. VÉRIFIER SON COMPTE DANS CETTE BANQUE ══
        const account = await Account.findOne({
            where: { 
                userId: user.id, 
                bankId: bank.id,
            }
        });

        if (!account) {
            return res.status(401).json({ 
                error: "❌ Code PIN ou code agence incorrect." 
            });
        }

        const pinOk = await bcrypt.compare(
            code_pin,
            account.code_pin
        );

        if(!pinOk){
            return res.status(401).json({
                error:"❌ Code PIN incorrect."
            });
        }

        // ══ 4. VÉRIFIER LE STATUT ══
        if (account.statut === 'BLOQUE') {
            return res.status(403).json({ 
                error: "🔒 Ce compte est déjà bloqué. Contactez l'administrateur." 
            });
        }

        if (account.statut === 'SUPPRIME') {
            return res.status(403).json({ 
                error: "🗑️ Ce compte est déjà clôturé." 
            });
        }

        // ══ 5. CLÔTURER → statut passe à SUPPRIME ══
        await account.update({ statut: 'SUPPRIME' });

        return res.status(200).json({ 
            message: "✅ Compte clôturé avec succès.",
            details: {
                titulaire: user.nom,
                banque: bank.nom,
                statut: "SUPPRIME",
                info: "Vos données sont conservées en archive."
            }
        });

    } catch (error) {
        return res.status(500).json({ error: "❌ Erreur : " + error.message });
    }
};