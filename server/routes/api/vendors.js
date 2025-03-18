
const express = require('express');
const router = express.Router();

// TODO: Implement vendor routes
router.get('/', (req, res) => {
  res.json({ message: 'Vendors API' });
});

module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const vendor = new Vendor(req.body);
    await vendor.save();
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
