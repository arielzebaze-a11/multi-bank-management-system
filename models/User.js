const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: { msg: "L'adresse email doit être valide." } // Validation de format email
        }
    },
    telephone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    code_pin: { // Remplace mot_de_passe
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isNumeric: { msg: "Le code PIN doit contenir uniquement des chiffres." },
            len: {
                args: [6, 6],
                msg: "Le code PIN doit comporter exactement 6 chiffres."
            }
        }
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: 'CLIENT'
    },

    agence: {
        type: DataTypes.STRING,
        defaultValue: 'Siège',
        allowNull: false
  }
  
}, 

{
    tableName: 'users',
    timestamps: true 
});

module.exports = User;

const Account = require('./Account'); 
User.hasOne(Account, { foreignKey: 'userId', as: 'Account' });

const Bank = require('./Bank');

// Un compte appartient à une seule banque
Account.belongsTo(Bank, { foreignKey: 'bankId', as: 'Bank' });
Bank.hasMany(Account, { foreignKey: 'bankId' });