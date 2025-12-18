const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');

module.exports = () => {
  const router = express.Router();

  // Email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Signup
  router.post('/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) return res.status(400).json({ msg: 'User already exists' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      user = await prisma.user.create({ data: { name, email, password: hashedPassword, verificationToken, verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) } });

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Wedding Gifts',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center;">Welcome to Wedding Gifts!</h2>
              <p style="color: #666; text-align: center;">Thank you for signing up. Please verify your email address to get started.</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              </div>
              <p style="color: #666; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff; text-align: center;">${verificationUrl}</p>
              <p style="color: #666; text-align: center;">This link will expire in 24 hours.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ msg: 'User registered successfully. Please check your email to verify your account.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Verify email
  router.get('/verify/:token', async (req, res) => {
    try {
      const user = await prisma.user.findFirst({ where: { verificationToken: req.params.token } });
      if (!user) return res.status(400).json({ msg: 'Invalid verification token' });

      if (user.verificationTokenExpires < new Date()) return res.status(400).json({ msg: 'Verification token has expired' });

      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationToken: null, verificationTokenExpires: null },
      });

      res.json({ msg: 'Email verified successfully. You can now log in.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Login
  router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').exists().withMessage('Password is required'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

      if (!user.isVerified) return res.status(400).json({ msg: 'Please verify your email before logging in' });

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture, wallet: user.wallet } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Forgot password
  router.post('/forgot-password', [
    body('email').isEmail().withMessage('Valid email is required'),
  ], async (req, res) => {
    const { email } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ msg: 'If an account with that email exists, a reset link has been sent.' });

      const resetToken = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000),
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Reset Your Password - Wedding Gifts',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
              <p style="color: #666; text-align: center;">You requested a password reset. Click the button below to reset your password.</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #666; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff; text-align: center;">${resetUrl}</p>
              <p style="color: #666; text-align: center;">This link will expire in 1 hour.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ msg: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  // Reset password
  router.post('/reset-password/:token', [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ], async (req, res) => {
    const { password } = req.body;

    try {
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { gt: new Date() },
        },
      });

      if (!user) return res.status(400).json({ msg: 'Invalid or expired reset token' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      res.json({ msg: 'Password reset successful. You can now log in with your new password.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });

  return router;
};