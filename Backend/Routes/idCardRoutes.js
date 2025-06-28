const express = require('express');
const { verifyIDCard } = require('../Controller/idCardController');
const router = express.Router();

// Middleware to handle CORS
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

router.post('/verify-id', verifyIDCard);

module.exports = router;