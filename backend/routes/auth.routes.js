const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

// TEMPORARY: For debugging user creation
router.get('/create-test-user', async (req, res) => {
  const User = require('../models/User');
  const bcrypt = require('bcrypt');

  try {
    const hashedPassword = await bcrypt.hash("password123", 10);

    const testUser = new User({
      name: "Tester",
      email: "tester@example.com",
      department: "IT",
      username: "test",
      password: hashedPassword
    });

    await testUser.save();
    res.send("Test user created.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create test user.");
  }
});

router.post('/signup', userController.signup);
router.post('/login', userController.login);

module.exports = router;

