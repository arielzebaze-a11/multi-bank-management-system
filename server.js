const express = require('express');
const swaggerUi = require('swagger-ui-express');
const sequelize = require('./config/db');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
app.use(express.json());

// Configuration complète de Swagger (Zéro crash)
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'SYSTEME DE GESTION BANCAIRE - API Documentation',
    version: '1.0.0',
    description: 'API Bancaire - Université de Yaoundé I'
  },
  tags: [
    { name: 'Authentification' },
    { name: 'Utilisateur (Client)' },
    { name: 'Administration' }
  ],
  paths: {
    // --- AUTHENTIFICATION ---
'/api/auth/register': {
  post: {
    tags: ['Authentification'],
    summary: 'Inscription',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              nom: { type: 'string', example: 'Ariel' },
              email: { type: 'string', example: 'ariel@example.com' },
              telephone: { type: 'string', example: '677000000' },
              // Remplace 'mot_de_passe' par 'code_pin' ici :
              code_pin: { type: 'string', example: '123456' },
              agence: { type: 'string', example: 'Bastos' }
            }
          }
        }
      }
    },
    responses: { 201: { description: 'Utilisateur créé' } }
  }
},
'/api/auth/login': {
  post: {
    tags: ['Authentification'],
    summary: 'Connexion',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              // Remplace email par telephone
              telephone: { 
                type: 'string', 
                example: '677000000' 
              },
              // Remplace mot_de_passe par code_pin
              code_pin: { type: 'string', example: '123456' },
              agence: { type: 'string', example: 'Bastos' }
            }
          }
        }
      }
    },
    responses: { 200: { description: 'Connecté' } }
  }
},
        // --- UTILISATEUR (CLIENT) ---
        '/api/account/balance/{userId}': {
          get: { 
            tags: ['Utilisateur (Client)'], 
            summary: 'Consulter son solde',
            parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
            responses: { 200: { description: 'OK' } } 
          }
        },
        '/api/transactions/history/{userId}': {
          get: { 
            tags: ['Utilisateur (Client)'], 
            summary: 'Historique des transactions',
            parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
            responses: { 200: { description: 'OK' } } 
          }
        },
        '/api/transactions/transfer': {
      post: { 
        tags: ['Transactions'], 
        summary: 'Effectuer un virement entre deux comptes',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['expediteurId', 'destinataireTel', 'montant'], // Obligatoire pour voir les astérisques rouges
                properties: {
                  expediteurId: { 
                    type: 'integer', 
                    description: 'ID de l\'utilisateur qui envoie',
                    example: 11 
                  },
                  destinataireTel: { 
                    type: 'string', 
                    description: 'Téléphone du destinataire',
                    example: '670000002' 
                  },
                  montant: { 
                    type: 'number', 
                    description: 'Somme à envoyer en FCFA',
                    example: 5000 
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Virement réussi' },
          400: { description: 'Solde insuffisant ou données invalides' },
          500: { description: 'Erreur serveur' }
        }
      }
    },
    '/api/transactions/deposit': {
      post: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Déposer de l\'argent',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              userId: { type: 'integer', example: 1 },
              montant: { type: 'number', example: 5000 }
            }
          }}}
        },
        responses: { 200: { description: 'Dépôt réussi' } } 
      }
    },
    '/api/transactions/withdraw': {
      post: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Retirer de l\'argent',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              userId: { type: 'integer', example: 1 },
              montant: { type: 'number', example: 2000 }
            }
          }}}
        },
        responses: { 200: { description: 'Retrait réussi' } } 
      }
    },
    '/api/account/rib/{userId}': {
      get: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Télécharger RIB (PDF)', 
        parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: { 200: { description: 'OK' } } 
      }
    },
    '/api/account/close': {
      delete: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Clôturer le compte',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              userId: { type: 'integer', example: 1 },
              mot_de_passe: { type: 'string', example: 'password123' }
            }
          }}}
        },
        responses: { 200: { description: 'Compte clôturé' } } 
      }
    },
    '/api/transactions/history/{userId}': {
      get: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Historique des transactions',
        parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' } } 
      }
    },
    '/api/transactions/transfer': {
      post: { tags: ['Utilisateur (Client)'], summary: 'Effectuer un virement', responses: { 200: { description: 'OK' } } }
    },
    '/api/transactions/deposit': {
      post: { tags: ['Utilisateur (Client)'], summary: 'Déposer de l\'argent', responses: { 200: { description: 'OK' } } }
    },
    '/api/transactions/withdraw': {
      post: { tags: ['Utilisateur (Client)'], summary: 'Retirer de l\'argent', responses: { 200: { description: 'OK' } } }
    },
    '/api/account/rib/{userId}': {
      get: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Télécharger RIB (PDF)', 
        parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' } } 
      }
    },
    '/api/account/close': {
      delete: { tags: ['Utilisateur (Client)'], summary: 'Clôturer le compte', responses: { 200: { description: 'OK' } } }
    },

    // --- ADMINISTRATION ---
    '/api/admin/users': {
      get: { 
        tags: ['Administration'], 
        summary: 'Liste de tous les utilisateurs',
        responses: { 200: { description: 'Liste récupérée' } } 
      }
    },
    '/api/admin/user/{userId}': {
      delete: { 
        tags: ['Administration'], 
        summary: 'Supprimer un utilisateur',
        parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'integer' }, example: 1 }],
        responses: { 200: { description: 'Utilisateur supprimé' } } 
      }
    },
    '/api/admin/transactions': {
      get: { 
        tags: ['Administration'], 
        summary: 'Voir toutes les transactions du système',
        responses: { 200: { description: 'Historique global récupéré' } } 
      }
    },
    '/api/admin/reports/global': {
      get: { 
        tags: ['Administration'], 
        summary: 'Générer des rapports financiers globaux',
        responses: { 200: { description: 'Rapport généré' } } 
      }
    },
    '/api/admin/create-admin': {
      post: { 
        tags: ['Administration'], 
        summary: 'Créer d\'autres comptes administrateurs',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              nom: { type: 'string', example: 'Admin Ariel' },
              email: { type: 'string', example: 'admin@bank.com' },
              mot_de_passe: { type: 'string', example: 'adminPass123' }
            }
          }}}
        },
        responses: { 201: { description: 'Admin créé' } } 
      }
    },
    '/api/admin/settings': {
      put: { 
        tags: ['Administration'], 
        summary: 'Définir plafonds et frais bancaires',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              plafond_virement: { type: 'number', example: 1000000 },
              frais_retrait_pourcentage: { type: 'number', example: 1.5 }
            }
          }}}
        },
        responses: { 200: { description: 'Paramètres mis à jour' } } 
      }
    },
    '/api/admin/compte/statut': {
      put: { 
        tags: ['Administration'], 
        summary: 'Valider/Bloquer un compte',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              userId: { type: 'integer', example: 1 },
              statut: { type: 'string', enum: ['ACTIF', 'BLOQUE', 'EN_ATTENTE'], example: 'BLOQUE' }
            }
          }}}
        },
        responses: { 200: { description: 'Statut mis à jour' } } 
      }
    },
    '/api/admin/compte/ajuster-balance': {
      put: { 
        tags: ['Administration'], 
        summary: 'Modifier le solde (Correction)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              userId: { type: 'integer', example: 1 },
              nouveauSolde: { type: 'number', example: 50000 }
            }
          }}}
        },
        responses: { 200: { description: 'Solde ajusté' } } 
      }
    },
    '/api/admin/transactions': {
      get: { tags: ['Administration'], summary: 'Voir toutes les transactions du système', responses: { 200: { description: 'OK' } } }
    },
    '/api/admin/reports/global': {
      get: { tags: ['Administration'], summary: 'Générer des rapports financiers globaux', responses: { 200: { description: 'OK' } } }
    },
    '/api/admin/create-admin': {
      post: { tags: ['Administration'], summary: 'Créer d\'autres comptes administrateurs', responses: { 201: { description: 'Admin créé' } } }
    },
    '/api/admin/settings': {
      put: { tags: ['Administration'], summary: 'Définir plafonds et frais bancaires', responses: { 200: { description: 'Paramètres mis à jour' } } }
    },
    '/api/admin/account/status': {
      put: { tags: ['Administration'], summary: 'Valider, Activer ou Bloquer un compte', responses: { 200: { description: 'OK' } } }
    },
    '/api/admin/account/adjust-balance': {
      put: { tags: ['Administration'], summary: 'Modifier le solde (Correction)', responses: { 200: { description: 'OK' } } }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;

// Fonction de démarrage
async function startServer() {
    try {
        console.log('⏳ Connexion à la base de données...');
        await sequelize.authenticate();
        console.log('✅ Connecté à PostgreSQL sur Neon');

        // AJOUTE CETTE LIGNE ICI :
        // alter: true permet de mettre à jour les tables si tu modifies tes modèles
        await sequelize.sync(); 
        console.log('✅ Tables synchronisées avec succès');
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Serveur actif sur http://localhost:${PORT}/api-docs`);
        });

        server.keepAliveTimeout = 60000; 

    } catch (err) {
        console.error('❌ Erreur fatale au démarrage:', err.message);
        process.exit(1);
    }
}

startServer();

