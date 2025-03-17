
const express = require('express');
const router = express.Router();

// TODO: Implement order routes
router.get('/', (req, res) => {
  res.json({ message: 'Orders API' });
});

module.exports = router;
