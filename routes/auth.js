const express = require('express');
const { register ,login, update, sendMoney
    } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/update', update); 
router.post('/sendMoney', sendMoney); 

module.exports = router;
