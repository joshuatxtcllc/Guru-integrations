
const express = require('express');
const router = express.Router();

// TODO: Implement admin routes
router.get('/', (req, res) => {
  res.json({ message: 'Admin API' });
});

module.exports = router;
