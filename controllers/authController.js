const User = require('../models/User');
const Account = require('../models/Account');

// exports.register dans ton contrôleur d'authentification

exports.register = async (req, res) => {
    try {
        const { nom, email, telephone, code_pin, agence } = req.body;

        // 1. Vérifier si un utilisateur existe déjà avec ce numéro
        const existingUser = await User.findOne({ 
            where: { telephone },
            include: [{ model: Account, as: 'Account' }]
        });

        if (existingUser && existingUser.Account) {
            const status = existingUser.Account.statut;

            // CAS 1 : Le compte est BLOQUE
            if (status === 'BLOQUE') {
                return res.status(403).json({ 
                    error: "Inscription impossible", 
                    message: "Ce numéro est lié à un compte bloqué. Veuillez contacter l'administrateur pour changer le statut." 
                });
            }

            // CAS 2 : Le compte est SUPPRIME (Archivé) -> On détruit pour de vrai
            if (status === 'SUPPRIME') {
                // On détruit d'abord le compte puis l'utilisateur (à cause des contraintes de clé étrangère)
                await Account.destroy({ where: { userId: existingUser.id } });
                await User.destroy({ where: { id: existingUser.id } });
                
                console.log(`♻️ Ancien compte supprimé définitivement pour le numéro : ${telephone}`);
                // On continue ensuite vers la création du nouveau compte ci-dessous
            } else if (status === 'ACTIF') {
                // CAS 3 : Le compte est déjà ACTIF
                return res.status(400).json({ error: "Ce numéro de téléphone est déjà utilisé par un compte actif." });
            }
        }

        // 2. Création du nouvel utilisateur (si le numéro était libre ou si l'ancien a été détruit)
        const newUser = await User.create({
            nom,
            email,
            telephone,
            code_pin,
            agence
        });

        // 3. Création automatique du compte bancaire associé (par défaut 'ACTIF')
        await Account.create({
            userId: newUser.id,
            solde: 0.00,
            statut: 'ACTIF' // On s'assure qu'il commence comme actif
        });

        res.status(201).json({
            message: "✅ Compte créé avec succès !",
            user: {
                id: newUser.id,
                nom: newUser.nom,
                email: newUser.email,
                telephone: newUser.telephone,
                agence: newUser.agence
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'inscription : " + error.message });
    }
};

// LOGIN : Voir ses informations (Connexion via Téléphone, PIN et Agence)
// LOGIN : Voir ses informations (Connexion via Téléphone, PIN et Agence)
exports.login = async (req, res) => {
    try {
        const { telephone, code_pin, agence } = req.body;

        // 1. D'abord, on recherche l'utilisateur ET son compte lié
        const user = await User.findOne({ 
            where: { telephone, agence },
            include: [{ model: Account, as: 'Account' }] // INDISPENSABLE pour la barrière
        });

        // 2. Vérification de l'existence et du PIN[cite: 4]
        // On fusionne l'erreur 401 pour ne pas donner d'indices aux hackers
        if (!user || user.code_pin !== code_pin) {
            return res.status(401).json({ 
                error: "Accès refusé", 
                message: "Téléphone, Agence ou Code PIN incorrect." 
            });
        }

        // 3. LA BARRIÈRE CRITIQUE (Maintenant 'user' et 'user.Account' existent)[cite: 4]
        if (!user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif (Bloqué ou Supprimé). Contactez l'administrateur." 
            });
        }

        // 4. Réponse avec les informations[cite: 4]
        res.json({
            message: "Informations récupérées avec succès",
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                agence: user.agence,
                role: user.role,
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE : Mise à jour du profil
exports.updateProfile = async (req, res) => {
    try {
        const { telephone, code_pin, nom, email, agence } = req.body;

        // 1. On cherche l'utilisateur ET son compte immédiatement[cite: 4]
        const user = await User.findOne({ 
            where: { telephone },
            include: [{ model: Account, as: 'Account' }] // INDISPENSABLE[cite: 4, 5]
        });

        // 2. Vérification du PIN[cite: 4]
        if (!user || user.code_pin !== code_pin) {
            return res.status(401).json({ 
                error: "Accès refusé", 
                message: "Téléphone ou Code PIN incorrect." 
            });
        }

        // 3. LA BARRIÈRE CRITIQUE (Maintenant 'user' et 'user.Account' existent)[cite: 4]
        if (!user.Account || user.Account.statut !== 'ACTIF') {
            return res.status(403).json({ 
                error: "Accès interdit", 
                message: "Ce compte n'est plus actif. Contactez l'administrateur." 
            });
        }

        // 4. Si tout est bon, on applique les modifications[cite: 4]
        if (nom) user.nom = nom;
        if (email) user.email = email;
        if (agence) user.agence = agence;

        await user.save();

        res.json({
            message: "Profil mis à jour avec succès !",
            user: {
                nom: user.nom,
                email: user.email,
                telephone: user.telephone,
                agence: user.agence
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};