const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');


// All routes are protected and for admin only
router.use(protect);
router.use(authorize('admin'));

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/stats', expenseController.getFinancialStats);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
