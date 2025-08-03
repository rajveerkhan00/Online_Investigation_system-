const express = require('express');
const router = express.Router();
const signupController = require('../Controller/signupController');

router.post('/admin/signup', signupController.signupAdmin);

module.exports = router;