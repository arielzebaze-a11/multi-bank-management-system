const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const transacCtrl = require('../controllers/transactionController');
const adminCtrl = require('../controllers/adminController');
const transactionController = require('../controllers/transactionController');

// --- AUTHENTIFICATION ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/account/balance', transacCtrl.getBalance);

// --- UTILISATEUR (CLIENT) ---
router.post('/account/balance', accountController.getBalance);
router.get('/transactions/history/:userId', transacCtrl.getHistory);
router.post('/transactions/transfer', transacCtrl.transfer);
router.post('/transactions/deposit', transacCtrl.deposit);
router.post('/transactions/withdraw', transacCtrl.withdraw);    
router.get('/account/rib/:userId', transacCtrl.getRIB);
router.delete('/account/close', transacCtrl.closeAccount);

// --- ADMINISTRATION ---
router.get('/admin/users', adminCtrl.getAllUsers);
router.get('/admin/transactions', adminCtrl.getAllTransactions);
router.put('/admin/account/status', adminCtrl.updateAccountStatus);
router.put('/admin/account/adjust-balance', adminCtrl.adjustBalance);
router.delete('/admin/user/:userId', adminCtrl.deleteUser);
router.get('/admin/reports/global', adminCtrl.getGlobalReport);
router.post('/admin/create-admin', adminCtrl.createAdmin);
router.put('/admin/settings', adminCtrl.updateSystemSettings);

module.exports = router;