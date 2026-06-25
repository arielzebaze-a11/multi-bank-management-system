const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');
const transacCtrl = require('../controllers/transactionController');
const adminCtrl = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

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
// Récupère tous les users
router.get(
    '/admin/users',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.getAllUsers
);

// Historique global
router.get(
    '/admin/transactions',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.getAllTransactions
);

router.put(
    '/admin/account/status',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.updateAccountStatus
); 

router.put(
    '/admin/account/set-limit',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.updateAccountLimit
);

 // Suppression logique
router.delete(
    '/admin/user/:userId', 
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.deleteUser
);

router.get(
    '/admin/reports/global', 
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.getGlobalReportPDF
); 

// CLIENT <-> ADMIN
router.put(
    '/admin/update-role', 
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.changeUserRole
); 

// Toggle BLOQUER/DEBLOQUER
router.put(
    '/admin/compte/statut', 
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.toggleAccountStatus
); 

router.get(
    '/admin/dashboard',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.getDashboardStats
);


router.get(
    '/admin/banks',
    authMiddleware,
    roleMiddleware('ADMIN'),
    adminCtrl.getBanks
);

module.exports = router;