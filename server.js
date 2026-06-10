require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const sequelize = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
app.use(express.json());

// Configuration complète de Swagger (Zéro crash)
const swaggerDocs = {
  openapi: '3.0.0',
  info: {
    title: 'SYSTEME DE GESTION BANCAIRE : Multi-banque',
    version: '1.2.0',
    description: 'API - Multi-banque avec gestion complète des comptes, transactions et administration',
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
                  required: ['nom', 'email', 'telephone', 'code_pin', 'code_agence'],
                  properties: {
                    nom: { type: 'string', example: 'Ariel' },
                    email: { type: 'string', example: 'ariel@example.com' },
                    telephone: { type: 'string', example: '677000000' },
                    code_pin: { type: 'string', example: '123456' },
                    code_agence: { type: 'string', example: 'AFRI-CM-01' }
                  }
                }
              }
            }
          },
          responses: { 
            201: { description: '✅ Compte créé avec succès' },
            400: { description: '❌ Compte déjà actif dans cette banque' },
            403: { description: '🔒 Compte bloqué' },
            404: { description: '❌ Code agence introuvable' },
            500: { description: 'Erreur serveur' }
          }
        }
      },

    //voir ses informations (login) - avec code_agence pour différencier les banques
    '/api/auth/login': {
      post: {
        tags: ['Authentification'],
        summary: 'Voir ses informations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' } // ← corrigé
                }
              }
            }
          }
        },
        responses: { 
          200: { description: 'Connecté' },
          401: { description: 'PIN incorrect' },
          403: { description: 'Compte bloqué ou supprimé' },
          404: { description: 'Numéro ou agence introuvable' }
        }
      }
    },

    //mettre à jour son profil (nom, email) - avec code_agence pour différencier les banques
    '/api/user/update': {
      put: {
        tags: ['Authentification'],
        summary: 'Mettre à jour son profil (Sécurisé par PIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' },
                  nom: { type: 'string', example: 'Ariel Nouveau' },
                  email: { type: 'string', example: 'ariel.update@example.com' }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: 'Mis à jour avec succès' },
          401: { description: 'PIN incorrect' },
          403: { description: 'Compte bloqué ou supprimé' },
          404: { description: 'Numéro ou agence introuvable' }
        }
      }
    },

    //UTILISATEUR (CLIENT)
    '/api/transactions/verify-receiver/{telephone}': {
      get: { 
        tags: ['Utilisateur (Client)'], 
        summary: 'Vérifier le nom du destinataire avant un virement/dépôt',
        parameters: [
          { 
            in: 'path', 
            name: 'telephone', 
            required: true, 
            description: 'Numéro de téléphone du destinataire (ex: 677000000)',
            schema: { type: 'string', example: '677000001' } 
          }
        ],
        responses: { 
          200: { description: '✅ Destinataire identifié' },
          400: { description: '❌ Format du numéro incorrect' },
          403: { description: '❌ Compte bloqué ou inactif' },
          404: { description: '❌ Numéro introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/account/balance': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Consulter mon solde (Sécurisé par PIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Solde récupéré' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/transactions/history': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Historique des transactions (Sécurisé par PIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Historique récupéré avec montants en FCFA' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },


    '/api/transactions/transfer': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Effectuer un virement',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['expediteurTel', 'code_pin', 'code_agence', 'destinataireTel', 'montant'],
                properties: {
                  expediteurTel: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' },
                  destinataireTel: { type: 'string', example: '670000002' },
                  nomConfirme: { type: 'string', example: 'Ariel' },
                  montant: { type: 'number', example: 5000 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: '✅ Virement réussi avec détail des frais en FCFA' },
          400: { description: '❌ Solde insuffisant ou limite dépassée' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/transactions/deposit': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Déposer de l\'argent sur son compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence', 'montant'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' },
                  montant: { type: 'number', example: 10000 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: '✅ Dépôt réussi avec détail en FCFA' },
          400: { description: '❌ Montant invalide ou plafond atteint' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/transactions/withdraw': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Effectuer un retrait',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence', 'montant'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' },
                  montant: { type: 'number', example: 5000 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: '✅ Retrait réussi avec détail des frais en FCFA' },
          400: { description: '❌ Solde insuffisant ou limite dépassée' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    
    '/api/account/rib': {
      post: {
        tags: ['Utilisateur (Client)'],
        summary: 'Télécharger le RIB complet en PDF',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone'],
                properties: {
                  telephone: { type: 'string', example: '677000000' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: '✅ PDF RIB généré avec tous les comptes et transactions' },
          404: { description: '❌ Numéro introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },
    
    '/api/account/close': {
      delete: {
        tags: ['Utilisateur (Client)'],
        summary: 'Clôturer son compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['telephone', 'code_pin', 'code_agence'],
                properties: {
                  telephone: { type: 'string', example: '677000000' },
                  code_pin: { type: 'string', example: '123456' },
                  code_agence: { type: 'string', example: 'AFRI-CM-01' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: '✅ Compte clôturé avec succès' },
          401: { description: '❌ PIN incorrect' },
          403: { description: '🔒 Compte déjà bloqué ou clôturé' },
          404: { description: '❌ Numéro ou agence introuvable' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    // --- ADMINISTRATION ---
    '/api/admin/users': {
      get: { 
        tags: ['Administration'], 
        summary: 'Liste de tous les utilisateurs avec leurs comptes et banques',
        responses: { 
          200: { description: '✅ Liste récupérée avec comptes et soldes en FCFA' },
          404: { description: '❌ Aucun utilisateur trouvé' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

   '/api/admin/user/{userId}': {
      delete: { 
        tags: ['Administration'], 
        summary: 'Supprimer un compte utilisateur dans une banque spécifique',
        parameters: [{ 
          in: 'path', 
          name: 'userId', 
          required: true, 
          schema: { type: 'integer' }, 
          example: 1 
        }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bankId'],
                properties: {
                  bankId: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Compte supprimé avec succès' },
          400: { description: '❌ Compte déjà bloqué ou supprimé' },
          404: { description: '❌ Utilisateur ou compte introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/admin/transactions': {
      get: { 
        tags: ['Administration'], 
        summary: 'Voir toutes les transactions du système',
        responses: { 
          200: { description: '✅ Historique global récupéré avec noms et montants en FCFA' },
          404: { description: '❌ Aucune transaction trouvée' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/admin/reports/global': {
      get: { 
        tags: ['Administration'], 
        summary: 'Générer le rapport financier global complet en PDF',
        responses: { 
          200: { description: '✅ PDF généré avec banques, utilisateurs et transactions' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/admin/account/status': {
      put: { 
        tags: ['Administration'], 
        summary: 'Mettre à jour directement le statut d\'un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'bankId', 'status'],
                properties: {
                  userId: { type: 'integer', example: 1 },
                  bankId: { type: 'integer', example: 1 },
                  status: { 
                    type: 'string', 
                    enum: ['ACTIF', 'BLOQUE', 'SUPPRIME'], 
                    example: 'BLOQUE' 
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Statut mis à jour' },
          400: { description: '❌ Statut invalide ou déjà identique' },
          404: { description: '❌ Utilisateur ou compte introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/admin/account/set-limit': {
      put: { 
        tags: ['Administration'], 
        summary: 'Définir la limite de virement d\'un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'bankId', 'limite'],
                properties: {
                  userId: { type: 'integer', example: 1 },
                  bankId: { type: 'integer', example: 1 },
                  limite: { type: 'number', example: 500000 }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Limite mise à jour en FCFA' },
          400: { description: '❌ Limite invalide' },
          403: { description: '🔒 Compte bloqué ou supprimé' },
          404: { description: '❌ Utilisateur ou compte introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },
   
    '/api/admin/compte/statut': {
      put: { 
        tags: ['Administration'], 
        summary: 'Bloquer ou Débloquer un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'bankId', 'action'],
                properties: {
                  userId: { type: 'integer', example: 1 },
                  bankId: { type: 'integer', example: 1 },
                  action: { 
                    type: 'string', 
                    enum: ['BLOQUER', 'DEBLOQUER'], 
                    example: 'BLOQUER' 
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Statut mis à jour avec succès' },
          400: { description: '❌ Action invalide ou statut déjà identique' },
          404: { description: '❌ Utilisateur ou compte introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    },

    '/api/admin/update-role': {
      put: { 
        tags: ['Administration'], 
        summary: 'Changer le rôle d\'un utilisateur (CLIENT / ADMIN)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'newRole'],
                properties: {
                  userId: { type: 'integer', example: 1 },
                  newRole: { 
                    type: 'string', 
                    enum: ['CLIENT', 'ADMIN'], 
                    example: 'ADMIN' 
                  }
                }
              }
            }
          }
        },
        responses: { 
          200: { description: '✅ Rôle mis à jour avec succès' },
          400: { description: '❌ Rôle invalide ou déjà identique' },
          404: { description: '❌ Utilisateur introuvable' },
          500: { description: 'Erreur serveur' }
        } 
      }
    }
    }
  };

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api', apiRoutes);

// Redirection routes inexistantes
app.use((req, res) => {
    res.redirect('/api-docs');
});

const PORT = process.env.PORT || 3000;

// ══ ANTI-SLEEP ══
const https = require('https');
const RENDER_URL = 'https://bank-api-v2-wmp3.onrender.com/api-docs';
setInterval(() => {
    https.get(RENDER_URL, (res) => {
        console.log(`🏓 Ping : ${res.statusCode}`);
    }).on('error', (err) => {
        console.log(`⚠️ Ping échoué : ${err.message}`);
    });
}, 14 * 60 * 1000);

// ══ NEON KEEP-ALIVE ══
const { Pool } = require('pg');
const keepAlive = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});
setInterval(async () => {
    try {
        await keepAlive.query('SELECT 1');
        console.log('🟢 Neon keep-alive OK');
    } catch(e) {
        console.log('🔴 Neon keep-alive failed:', e.message);
    }
}, 4 * 60 * 1000);

process.on('uncaughtException', (err) => {
    console.error('⚠️ Erreur non gérée:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Promise rejetée:', reason);
});

async function startServer() {
    try {
        console.log('⏳ Connexion à la base de données...');
        await sequelize.authenticate();
        console.log('✅ Connecté à PostgreSQL sur Neon');
        await sequelize.sync(); 
        console.log('✅ Tables synchronisées avec succès');
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Serveur actif sur le port ${PORT}`);
            console.log(`📖 Documentation : http://0.0.0.0:${PORT}/api-docs`);
        });
        server.keepAliveTimeout = 60000; 

    } catch (err) {
        console.error('❌ Erreur fatale au démarrage:', err);
        process.exit(1);
    }
}

startServer();

//psql "$(node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)")" -c "SELECT 1;" && sleep 2 && node server.js