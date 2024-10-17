const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('sequelize');
const User = require('../models/user');
const Payment = require('../models/payment');

const JWT_SECRET = '3sIueX5FbB9B1G4vX9+OwI7zFt/P9FPW3sLd0R9MxHQ=';

exports.register = async (req, res) => {
  const { name, phone, email, password, balance } = req.body;
  console.log(name + phone + email + password);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      email,
      password: hashedPassword,
      balance,
    });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {

    console.error('Registration error:', error);
    res.status(400).json({ error: 'User registration failed!' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials!' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(201).json({ message: 'Login Successful!' });
  } catch (error) {
    res.status(400).json({ error: 'Login failed!' });
  }
};

exports.update = async (req, res) => {
  const { email,currentPassword, newName, newPassword, newPhone } = req.body;

  console.log('Incoming request:', { email, currentPassword, newName, newPassword, newPhone});

  try {

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found!' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password!' });
    }

    if (newName) {
      user.name = newName;
      console.log('Name updated:', newName);
    }

    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      console.log('Password updated:', newPassword);
    }

    if (newPhone) {
      user.phone = newPhone;
      console.log('Phone updated:', newPhone);
    }

    await user.save({ fields: ['name', 'password', 'phone'] });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'User information updated successfully!',
      token,
      userId: user.id,
      updatedUser: {
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user information!' });
  }
};

exports.sendMoney = async (req, res) => {
  const { senderEmail, recipientEmail, amount } = req.body;
  const transaction = await sequelize.transaction();

  try {
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const sender = await User.findOne({ where: { email: senderEmail }, transaction });
    const recipient = await User.findOne({ where: { email: recipientEmail }, transaction });

    if (!sender || !recipient) {
      await transaction.rollback();
      return res.status(404).json({ error: 'User not found!' });
    }

    if (sender.balance < amount) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    sender.balance -= amount;
    await sender.save({ transaction });

    recipient.balance += amount;
    await recipient.save({ transaction });

    const payment = await Payment.create({
      amount: amount,
      senderId: sender.id,
      receiverId: recipient.id
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: `Successfully sent ${amount} to ${recipientEmail}`,
      transaction: {
        paymentId: payment.id,
        amount: payment.amount,
        date: payment.date,
        senderEmail: senderEmail,
        recipientEmail: recipientEmail
      },
      sender: {
        email: senderEmail,
        balance: sender.balance
      },
      recipient: {
        email: recipientEmail,
        balance: recipient.balance
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error transferring money:', error);
    res.status(500).json({ error: 'Failed to send money' });
  }
};

exports.sendMoney = async (req, res) => {
  const { senderEmail, recipientEmail, amount } = req.body;
  try {
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const sender = await User.findOne({ where: { email: senderEmail } });
    const recipient = await User.findOne({ where: { email: recipientEmail } });

    if (!sender || !recipient) {
      return res.status(404).json({ error: 'User not found!' });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    sender.balance -= amount;
    await sender.save();

    recipient.balance += amount;
    await recipient.save();

    const payment = await Payment.create({
      amount: amount,
      senderId: sender.id,
      receiverId: recipient.id
    });

    res.status(200).json({
      message: `Successfully sent ${amount} to ${recipientEmail}`,
      transaction: {
        paymentId: payment.id,
        amount: payment.amount,
        date: payment.date,
        senderEmail: senderEmail,
        recipientEmail: recipientEmail
      },
      sender: {
        email: senderEmail,
        balance: sender.balance
      },
      recipient: {
        email: recipientEmail,
        balance: recipient.balance
      }
    });

  } catch (error) {
    console.error('Error transferring money:', error);
    res.status(500).json({ error: 'Failed to send money' });
  }
};








