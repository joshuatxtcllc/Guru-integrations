
const express = require('express');
const router = express.Router();

// TODO: Implement vendor routes
router.get('/', (req, res) => {
  res.json({ message: 'Vendors API' });
});

module.exports = router;
