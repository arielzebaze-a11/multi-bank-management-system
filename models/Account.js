const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Account = sequelize.define('Account', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    solde: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.00
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
    underscored: true
}); 

module.exports = Account;