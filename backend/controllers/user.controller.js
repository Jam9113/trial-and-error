const User = require('../models/User');
const bcrypt = require('bcrypt');


exports.signup = async (req, res) => {
  const { name, email, department, username, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !department || !username || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      department,
      username,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: `Welcome, ${user.name}!` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
