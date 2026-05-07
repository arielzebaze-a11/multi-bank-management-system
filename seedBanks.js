const Bank = require('./models/Bank');
const sequelize = require('./config/db');

const initialBanks = [
    { nom: 'AFRILAND FIRST BANK', code_agence: 'AFRI-CM-01', frais_virement: 1.5, frais_retrait: 2.0 },
    { nom: 'UBA CAMEROON', code_agence: 'UBAC-CM-02', frais_virement: 2.0, frais_retrait: 1.5 },
    { nom: 'SGC (Société Générale)', code_agence: 'SGCC-CM-03', frais_virement: 1.8, frais_retrait: 1.8 },
    { nom: 'CBC BANK', code_agence: 'CBCC-CM-04', frais_virement: 1.0, frais_retrait: 1.0 },
    { nom: 'UBC (United Bank)', code_agence: 'UBCC-CM-05', frais_virement: 0.5, frais_retrait: 0.5 }
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connexion pour remplissage...');
        
        // On insère les banques
        await Bank.bulkCreate(initialBanks);
        
        console.log('✨ Les 5 banques ont été ajoutées avec succès !');
        process.exit();
    } catch (error) {
        console.error('❌ Erreur lors du remplissage:', error.message);
        process.exit(1);
    }
}

seed();