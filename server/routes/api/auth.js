
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { AppError } = require('../../middleware/errorHandler');

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // TODO: Implement actual user authentication
    // This is a placeholder implementation
    if (email === 'admin@frameguru.com' && password === 'admin123') {
      const payload = {
        id: '1',
        email,
        isAdmin: true,
        isStaff: true
      };
      
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } else {
      throw new AppError('Invalid credentials', 401);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
