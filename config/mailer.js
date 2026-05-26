const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Transporteur SMTP configuré via les variables d'environnement.
 * Fonctionne avec Gmail, Outlook, ou tout serveur SMTP.
 */
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,        // ex: smtp.gmail.com
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true', // true pour port 465, false pour 587
    auth: {
        user: process.env.MAIL_USER,    // votre adresse email expéditeur
        pass: process.env.MAIL_PASS     // mot de passe ou App Password Gmail
    }
});

/**
 * Envoie un email de confirmation de création de compte.
 * Appelé après une inscription réussie.
 *
 * @param {string} destinataire - Adresse email du nouvel utilisateur
 * @param {string} nomUser      - Nom complet de l'utilisateur
 * @param {string} nomBanque    - Nom de la banque (ex: "AFRILAND FIRST BANK")
 * @param {string|number} accountNumber - Identifiant du compte créé
 */
exports.sendAccountCreatedEmail = async (destinataire, nomUser, nomBanque, accountNumber) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Système Bancaire'}" <${process.env.MAIL_USER}>`,
        to: destinataire,
        subject: `✅ Votre compte chez ${nomBanque} a été créé avec succès`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a5276; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🏦 ${nomBanque}</h1>
                <p style="color: #aed6f1; margin: 5px 0 0;">Système de Gestion Bancaire</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <p style="font-size: 16px;">Bonjour <strong>${nomUser}</strong>,</p>
                <p style="font-size: 15px; color: #333;">
                    Nous vous confirmons que votre compte bancaire chez <strong>${nomBanque}</strong> 
                    a été créé avec succès.
                </p>
                <div style="background-color: #eaf4fb; border-left: 4px solid #1a5276; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #555;">Numéro de compte</p>
                    <p style="margin: 5px 0 0; font-size: 22px; font-weight: bold; color: #1a5276;">#${accountNumber}</p>
                </div>
                <p style="font-size: 14px; color: #555;">
                    Vous pouvez dès maintenant vous connecter à votre espace bancaire 
                    avec votre numéro de téléphone et votre code PIN.
                </p>
                <p style="font-size: 13px; color: #e74c3c;">
                    ⚠️ Ne communiquez jamais votre code PIN à personne, y compris au personnel de la banque.
                </p>
            </div>
            <div style="background-color: #1a5276; padding: 15px; text-align: center;">
                <p style="color: #aed6f1; font-size: 12px; margin: 0;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                </p>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Envoie un email d'erreur quand l'adresse email fournie lors de l'inscription
 * n'est pas valide ou déjà utilisée par un autre utilisateur.
 *
 * @param {string} destinataire - Adresse email fournie (même si suspecte, on tente l'envoi)
 * @param {string} nomBanque    - Nom de la banque concernée
 * @param {string} raisonErreur - Message décrivant le problème
 */
exports.sendEmailErrorNotification = async (destinataire, nomBanque, raisonErreur) => {
    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Système Bancaire'}" <${process.env.MAIL_USER}>`,
        to: destinataire,
        subject: `❌ Problème lors de la création de votre compte chez ${nomBanque}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #922b21; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🏦 ${nomBanque}</h1>
                <p style="color: #f1948a; margin: 5px 0 0;">Système de Gestion Bancaire</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <p style="font-size: 16px; color: #333;">Bonjour,</p>
                <p style="font-size: 15px; color: #333;">
                    Une tentative d'inscription chez <strong>${nomBanque}</strong> 
                    a échoué pour la raison suivante :
                </p>
                <div style="background-color: #fdf2f2; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 15px; color: #922b21; font-weight: bold;">
                        ${raisonErreur}
                    </p>
                </div>
                <p style="font-size: 14px; color: #555;">
                    Si vous êtes à l'origine de cette demande, veuillez contacter 
                    votre agence bancaire pour obtenir de l'aide.
                </p>
                <p style="font-size: 13px; color: #555;">
                    Si vous n'avez pas effectué cette demande, veuillez ignorer cet email.
                </p>
            </div>
            <div style="background-color: #922b21; padding: 15px; text-align: center;">
                <p style="color: #f1948a; font-size: 12px; margin: 0;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                </p>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

/**
 * Envoie un email de notification de connexion réussie.
 * Permet à l'utilisateur de savoir qu'une connexion a eu lieu sur son compte.
 *
 * @param {string} destinataire - Adresse email de l'utilisateur
 * @param {string} nomUser      - Nom complet de l'utilisateur
 * @param {string} nomBanque    - Nom de la banque
 */
exports.sendLoginSuccessEmail = async (destinataire, nomUser, nomBanque) => {
    const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Douala' });

    const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'Système Bancaire'}" <${process.env.MAIL_USER}>`,
        to: destinataire,
        subject: `🔐 Connexion à votre compte ${nomBanque} détectée`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a5276; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">🏦 ${nomBanque}</h1>
                <p style="color: #aed6f1; margin: 5px 0 0;">Notification de sécurité</p>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9;">
                <p style="font-size: 16px;">Bonjour <strong>${nomUser}</strong>,</p>
                <p style="font-size: 15px; color: #333;">
                    Une connexion a été effectuée sur votre compte bancaire chez 
                    <strong>${nomBanque}</strong>.
                </p>
                <div style="background-color: #eaf4fb; border-left: 4px solid #1a5276; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #555;">Date et heure de connexion</p>
                    <p style="margin: 5px 0 0; font-size: 16px; font-weight: bold; color: #1a5276;">${now}</p>
                </div>
                <p style="font-size: 13px; color: #e74c3c;">
                    ⚠️ Si vous n'êtes pas à l'origine de cette connexion, contactez immédiatement votre agence.
                </p>
            </div>
            <div style="background-color: #1a5276; padding: 15px; text-align: center;">
                <p style="color: #aed6f1; font-size: 12px; margin: 0;">
                    Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
                </p>
            </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);
};
