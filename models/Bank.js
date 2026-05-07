const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Bank = sequelize.define('Bank', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Exemple: UBA, AFRILAND...
    },
    code_agence: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
            len: [10, 10] // Force exactement 10 caractères
        }
    },
    frais_virement: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    frais_retrait: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    statut: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    },
    date_modification: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'banks',
    timestamps: true, // Crée automatiquement createdAt (date de création)
    hooks: {
        beforeUpdate: (bank) => {
            bank.date_modification = new Date(); // Met à jour la date de modif automatiquement
        }
    }
});

module.exports = Bank;