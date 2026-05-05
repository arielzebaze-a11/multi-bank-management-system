const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    solde: {
        type: DataTypes.DECIMAL(20, 2), // Évite les débordements de type FLOAT
        allowNull: false,
        validate: {
            max: 1000000000, // Sécurité au niveau de la base de données
            min: 0
        }
    },
    userId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userId', 
        references: { model: 'users', key: 'id' }
    },
    statut: {
        type: DataTypes.ENUM('ACTIF', 'BLOQUE', 'SUPPRIME'),
        defaultValue: 'ACTIF'
    }
}, {
    tableName: 'accounts',
    timestamps: true,
    underscored: false
}); 

module.exports = Account;