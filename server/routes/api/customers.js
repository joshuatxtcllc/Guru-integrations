
const express = require('express');
const router = express.Router();

// TODO: Implement customer routes
router.get('/', (req, res) => {
  res.json({ message: 'Customers API' });
});

module.exports = router;
