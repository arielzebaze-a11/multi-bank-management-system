const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const transacCtrl = require('../controllers/transactionController');
const adminCtrl = require('../controllers/adminController');

// --- AUTHENTIFICATION ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.put('/user/update', authCtrl.updateProfile); // Correction: authCtrl au lieu de transacCtrl

// --- UTILISATEUR (CLIENT) ---[cite: 9]
router.get('/transactions/verify-receiver/:telephone', transacCtrl.verifyReceiver);
router.post('/account/balance', transacCtrl.getBalance);
router.post('/transactions/history', transacCtrl.getHistory);
router.post('/transactions/transfer', transacCtrl.transfer);
router.post('/transactions/deposit', transacCtrl.deposit);
router.post('/transactions/withdraw', transacCtrl.withdraw);
router.post('/account/rib', transacCtrl.getRIB);
router.delete('/account/close', transacCtrl.closeAccount);

// --- ADMINISTRATION ---[cite: 9]
router.get('/admin/users', adminCtrl.getAllUsers); // Récupère tous les users[cite: 9]
router.get('/admin/transactions', adminCtrl.getAllTransactions); // Historique global[cite: 9]

// Ligne 41 : Mise à jour directe du statut[cite: 9]
router.put('/admin/account/status', adminCtrl.updateAccountStatus); 

// Ligne 44 : Définir le plafond (ex: 1 milliard)[cite: 9]
router.put('/admin/account/set-limit', adminCtrl.updateAccountLimit);

router.delete('/admin/user/:userId', adminCtrl.deleteUser); // Suppression logique[cite: 9]
router.get('/admin/reports/global', adminCtrl.getGlobalReportPDF); // Rapport financier[cite: 9]
router.put('/admin/update-role', adminCtrl.changeUserRole); // CLIENT <-> ADMIN[cite: 9]
router.put('/admin/compte/statut', adminCtrl.toggleAccountStatus); // Toggle BLOQUER/DEBLOQUER[cite: 9]

module.exports = router;