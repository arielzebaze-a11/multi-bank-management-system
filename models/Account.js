const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    solde: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0.00,
        validate: {
            max: 3000000,
            min: 0
        }
    },
    // Le code PIN est désormais lié au compte spécifique (Point 1)
    code_pin: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    // Lien vers la banque (Point 2)
    bankId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'banks', key: 'id' }
    },
    statut: {
        type: DataTypes.ENUM('ACTIF', 'BLOQUE', 'SUPPRIME'),
        defaultValue: 'ACTIF'
    },
    // Pour gérer les limites par compte (Point 4)
    limite_virement: {
        type: DataTypes.DECIMAL(20, 2),
        defaultValue: 500000.00
    }
}, {
    tableName: 'accounts',
    timestamps: true,
    underscored: false
}); 

module.exports = Account;