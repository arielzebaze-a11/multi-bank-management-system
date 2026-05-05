const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.ENUM('VIREMENT', 'DEPOT', 'RETRAIT'),
        allowNull: false
    },
    montant: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: {
            min: 1 // On ne peut pas transférer 0 ou un montant négatif
        }
    },
    expediteur_tel: {
        type: DataTypes.STRING,
        allowNull: true, // Peut être nul lors d'un DEPOT externe
        references: {
            model: 'users',
            key: 'telephone'
        }
    },
    destinataire_tel: {
        type: DataTypes.STRING,
        allowNull: true, // Peut être nul lors d'un RETRAIT
        references: {
            model: 'users',
            key: 'telephone'
        }
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'SUCCESS'
    }
}, {
    tableName: 'transactions',
    timestamps: true,
    underscored: false
});

// Relations
Transaction.belongsTo(User, { as: 'Expediteur', foreignKey: 'expediteur_tel', targetKey: 'telephone' });
Transaction.belongsTo(User, { as: 'Destinataire', foreignKey: 'destinataire_tel', targetKey: 'telephone' });

module.exports = Transaction;