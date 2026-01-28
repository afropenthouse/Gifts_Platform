const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');

module.exports = () => {
  const router = express.Router();

  // Email transporter with explicit SMTP config and timeouts for reliability
  const smtpHost = process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '465', 10);
  const smtpSecure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === 'true'
    : process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : true;
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const mailFrom = process.env.MAIL_FROM || smtpUser;

  console.log('📧 Email Configuration:');
  console.log(`   Host: ${smtpHost}`);
  console.log(`   Port: ${smtpPort}`);
  console.log(`   Secure: ${smtpSecure}`);
  console.log(`   User: ${smtpUser ? '✓ Set' : '✗ NOT SET'}`);
  console.log(`   Pass: ${smtpPass ? '✓ Set' : '✗ NOT SET'}`);
  console.log(`   From: ${mailFrom}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  async function sendEmail(mailOptions) {
    try {
      console.log(`\n📨 Attempting to send email to: ${mailOptions.to}`);
      console.log(`   From: ${mailOptions.from}`);
      console.log(`   Subject: ${mailOptions.subject}`);
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully!`);
      console.log(`   Response: ${info.response}`);
      return { delivered: true };
    } catch (error) {
      console.error(`❌ Email send failed!`);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   Error Message: ${error?.message || error}`);
      console.error(`   Full Error:`, error);
      return { delivered: false, error };
    }
  }

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
      console.log(`\n🔐 [SIGNUP] New signup request for: ${email}`);
      
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        console.log(`⚠️  User already exists: ${email}`);
        return res.status(400).json({ msg: 'User already exists' });
      }

      console.log(`👤 Creating new user: ${name} (${email})`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verificationToken = crypto.randomBytes(32).toString('hex');

      user = await prisma.user.create({ 
        data: { 
          name, 
          email, 
          password: hashedPassword, 
          verificationToken, 
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) 
        } 
      });
      console.log(`✅ User created with ID: ${user.id}`);

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
      console.log(`🔗 Verification URL: ${verificationUrl}`);
      
      const mailOptions = {
        from: mailFrom,
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

      const emailResult = await sendEmail(mailOptions);

      if (!emailResult.delivered) {
        console.error(`⚠️  Verification email failed to send for user ${user.id}:`, emailResult?.error?.message || emailResult?.error);
      } else {
        console.log(`✅ Verification email sent successfully to ${email}`);
      }

      res.json({
        msg: 'User registered successfully. Verify your email now.',
      });
    } catch (err) {
      console.error(`❌ [SIGNUP ERROR]`, err);
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
      if (!user) return res.status(400).json({ msg: 'User not found' });

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

  // Get current user
  router.get('/me', auth(), async (req, res) => {
    try {
      res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        profilePicture: req.user.profilePicture,
        wallet: parseFloat(req.user.wallet) || 0
      });
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
        from: mailFrom,
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