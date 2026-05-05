const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit'); // Pour générer le PDF du RIB
const MAX_SOLDE_AUTORISE = 1_000_000_000;

exports.getBalance = async (req, res) => {
    try {
        const { telephone, code_pin } = req.body;

        // 1. On vérifie d'abord si l'utilisateur existe avec ce téléphone et ce PIN
        const user = await User.findOne({ 
            where: { telephone, code_pin },
            include: [{ model: Account, as: 'Account' }]
        });
        
        // LA BARRIÈRE CRITIQUE
        if (!user || !user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif (Bloqué ou Supprimé). Contactez l'administrateur." 
            });
        }

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
        const user = await User.findOne({ where: { telephone, code_pin },
        include: [{ model: Account, as: 'Account' }]});
        if (!user) {
            return res.status(401).json({ error: "Accès refusé. Téléphone ou Code PIN incorrect." });
        }

        // LA BARRIÈRE CRITIQUE
        if (!user || !user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif (Bloqué ou Supprimé). Contactez l'administrateur." 
            });
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

// --- VÉRIFICATION DU DESTINATAIRE ---
exports.verifyReceiver = async (req, res) => {
    try {
        const { telephone } = req.params;

        // 1. Validation de base
        if (!telephone || telephone.length < 9) {
            return res.status(400).json({ 
                error: "Format incorrect", 
                message: "Le numéro est trop court ou invalide." 
            });
        }

        // AJOUT DE L'INCLUDE ICI
        const user = await User.findOne({ 
            where: { telephone },
            include: [{ model: Account, as: 'Account' }] 
        });

        // 2. Erreur 404 propre
        if (!user) {
            return res.status(404).json({ 
                error: "Compte non trouvé", 
                message: "Ce numéro n'existe pas dans notre système." 
            });
        }

        // 3. LA BARRIÈRE CRITIQUE (Maintenant user.Account existe)
        if (user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Le compte du destinataire est bloqué ou inactif." 
            });
        }

        // 3. Succès 200
        return res.status(200).json({ 
            nom: user.nom,
            message: "Destinataire identifié"
        });

    } catch (error) {
        // 4. Erreur 500 propre en JSON
        return res.status(500).json({ 
            error: "Erreur serveur", 
            message: error.message 
        });
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

        // 2. LA BARRIÈRE CRITIQUE (Corrigée avec 'sender')
        if (!sender || !sender.Account || sender.Account.statut !== 'ACTIF') {
            await t.rollback();
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Votre compte est inactif ou vos identifiants sont incorrects." 
            });
        }

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

        // Correction ligne 254 de transactionController.js
        if (!receiver || !receiver.Account || receiver.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif." 
            });
        }
        
        if (!receiver) {
            await t.rollback();
            return res.status(404).json({ error: "Aucun compte trouvé pour ce numéro." });
        }

        if (futurSolde > MAX_SOLDE_AUTORISE) {
            return res.status(400).json({ 
                error: "Limite de solde atteinte",
                message: `Le solde total ne peut pas dépasser ${MAX_SOLDE_AUTORISE.toLocaleString()} FCFA. Veuillez effectuer un dépôt plus petit ou retirer des fonds.`
            });
        }
        // ----------------------------------

        // Si tout est bon, on procède au dépôt...
        account.solde = futurSolde;
        await account.save();

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

// --- RETRAIT ---
exports.withdraw = async (req, res) => {
    // Utilisation d'une transaction pour garantir l'atomicité
    const t = await sequelize.transaction(); 

    try {
        const { telephone, codePin, montant } = req.body;

        // 1. Authentification avec verrouillage de ligne (lock)
        const user = await User.findOne({
            where: { telephone, code_pin: codePin },
            include: [{ model: Account, as: 'Account' }],
            transaction: t,
            lock: t.LOCK.UPDATE // Empêche d'autres transactions de lire ce solde en même temps
        });

        if (!user) {
            await t.rollback();
            return res.status(401).json({ error: "❌ Téléphone ou code PIN incorrect" });
        }

        // LA BARRIÈRE CRITIQUE
        if (user.Account.statut !== 'ACTIF') {
            await t.rollback();
            return res.status(403).json({
                error: "Accès interdit",
                message: "Ce compte n'est plus actif. Contactez l'administrateur."
            });
        }

        // 2. Vérification solde
        const account = user.Account;
        const montantRetrait = parseFloat(montant);
        const soldeActuel = parseFloat(account.solde);

        if (soldeActuel < montantRetrait) {
            await t.rollback();
            return res.status(400).json({ error: "❌ Solde insuffisant" });
        }

        // 3. Mise à jour sécurisée
        account.solde = soldeActuel - montantRetrait;
        await account.save({ transaction: t });

        // 4. Historique[cite: 4]
        await Transaction.create({
            type: 'RETRAIT',
            montant: montantRetrait,
            expediteur_tel: telephone,
            status: 'SUCCESS'
        }, { transaction: t });

        // Validation de toutes les étapes[cite: 1]
        await t.commit();

        res.json({ 
            message: "✅ Retrait réussi", 
            nouveau_solde: `${account.solde} FCFA` 
        });

    } catch (error) {
        // En cas d'erreur, on annule tout[cite: 1]
        if (t) await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

// Simulation RIB
exports.getRIB = async (req, res) => {
    try {
        const { telephone, code_pin } = req.body;

       // 1. Vérification sécurité et récupération des données du compte
        const user = await User.findOne({ 
            where: { telephone, code_pin },
            include: [{ model: Account, as: 'Account' }] 
        });

        // LA BARRIÈRE CRITIQUE (Gère l'absence d'utilisateur ET le statut)
        if (!user || !user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Identifiants incorrects ou compte inactif. Contactez l'administrateur." 
            });
        }

        if (!user) return res.status(401).json({ error: "PIN incorrect" });

        // 2. Préparation du PDF
        const doc = new PDFDocument();
        let filename = `RIB_${user.nom.replace(/\s/g, '_')}.pdf`;
        
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        // 3. Contenu du RIB
        doc.fontSize(20).text('RELEVÉ D\'IDENTITÉ BANCAIRE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Titulaire : ${user.nom}`);
        doc.text(`Agence : ${user.agence}`);
        doc.text(`Téléphone : ${user.telephone}`);
        doc.text(`Numéro de Compte : ACC-00${user.id}`);
        doc.moveDown();
        doc.text(`Solde Actuel : ${user.Account.solde} FCFA`);
        
        doc.pipe(res);
        doc.end();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- CLÔTURE (Harmonisé avec Swagger) ---
exports.closeAccount = async (req, res) => {
    try {
        const { telephone, codePin } = req.body;

        // 1. Authentification ET récupération du compte
        const user = await User.findOne({ 
            where: { telephone, code_pin: codePin },
            include: [{ model: Account, as: 'Account' }] 
        });

        // 2. LA BARRIÈRE CRITIQUE
        // On vérifie si l'utilisateur existe et si son compte est déjà actif
        if (!user || !user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Identifiants incorrects ou compte déjà inactif/clôturé." 
            });
        }

        // 3. Changement de statut (Soft Delete)[cite: 4]
        // Utilise 'BLOQUE' ou 'SUPPRIME' selon ta logique métier
        await Account.update(
            { statut: 'SUPPRIME' }, 
            { where: { userId: user.id } }
        );

        res.json({ 
            message: "⚠️ Compte clôturé (archivé) avec succès." 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};