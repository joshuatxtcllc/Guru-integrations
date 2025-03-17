
const express = require('express');
const router = express.Router();

// TODO: Implement product routes
router.get('/', (req, res) => {
  res.json({ message: 'Products API' });
});

module.exports = router;
