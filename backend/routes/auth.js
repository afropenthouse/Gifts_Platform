const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, mailFrom } = require('../utils/email');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const prisma = require('../prismaClient');
const auth = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

module.exports = () => {
  const router = express.Router();

  // Signup
  router.post('/signup', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('agreedToTerms').custom(value => value === true || value === 'true').withMessage('You must agree to the Terms and Conditions'),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [SIGNUP VALIDATION ERROR]', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, referralCode, agreedToTerms } = req.body;

    try {
      console.log(`\n🔐 [SIGNUP] New signup request for: ${email}`);
      
      let user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        console.log(`⚠️  User already exists: ${email}`);
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Check referral code if provided
      let referrer = null;
      if (referralCode) {
        referrer = await prisma.user.findUnique({ where: { referralCode } });
        if (referrer) {
           console.log(`🤝 Referred by: ${referrer.name} (${referrer.email})`);
        } else {
           console.log(`⚠️ Invalid referral code provided: ${referralCode}`);
        }
      }

      console.log(`👤 Creating new user: ${name} (${email})`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Generate unique referral code for the new user
      let newReferralCode;
      let isUnique = false;
      while (!isUnique) {
        const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
        const namePart = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
        newReferralCode = `${namePart}${randomPart}`;
        const existing = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
        if (!existing) isUnique = true;
      }

      user = await prisma.user.create({ 
        data: { 
          name, 
          email, 
          password: hashedPassword, 
          verificationToken, 
          verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          referralCode: newReferralCode,
          referredById: referrer ? referrer.id : null,
          agreedToTerms: true,
          agreedToTermsAt: new Date()
        } 
      });
      console.log(`✅ User created with ID: ${user.id}`);

      // Send verification email
      const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
      console.log(`🔗 Verification URL: ${verificationUrl}`);
      
      const mailOptions = {
        from: mailFrom,
        to: email,
        subject: 'Verify Your Email - BeThere Experience',
        html: `
          <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
              <div style="padding: 28px 28px 18px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #2E235C; letter-spacing: 0.4px;">Welcome to BeThere!</h2>
                <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Verify your email address to get started</p>
              </div>

              <div style="padding: 0 24px 24px; text-align: center;">
                <div style="margin: 0 auto 8px; max-width: 420px; background: #f6f4ff; border: 1px solid #e7e4f5; border-radius: 14px; padding: 20px;">
                  <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                    Thank you for signing up for BeThere! Please click the button below to verify your email and unlock all features.
                  </p>

                  <div style="margin-top: 24px;">
                    <a href="${verificationUrl}" style="display: inline-block; background-color: #2E235C; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Verify Email
                    </a>
                  </div>
                </div>

                <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
                  If the button doesn't work, copy and paste this link: <br/>
                  <a href="${verificationUrl}" style="color: #2E235C; word-break: break-all;">${verificationUrl}</a>
                </p>
              </div>

              <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  This link will expire in 24 hours. &copy; ${new Date().getFullYear()} BeThere.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      try {
        await sendEmail(mailOptions);
        console.log(`✅ Verification email sent successfully to ${email}`);
      } catch (emailError) {
        console.error(`⚠️  Verification email failed to send for user ${user.id}:`, emailError?.response?.data || emailError?.message || emailError);
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

      // Send welcome email after verification
      try {
        await sendWelcomeEmail({ recipientEmail: user.email, recipientName: user.name });
        console.log(`✅ Welcome email sent to ${user.email} after verification`);
      } catch (welcomeError) {
        console.error(`⚠️  Failed to send welcome email to ${user.email} after verification:`, welcomeError);
      }

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
        subject: 'Reset Your Password - BeThere Experience',
        html: `
          <div style="background: #f3f2fb; padding: 24px; font-family: Arial, sans-serif; color: #1f2937;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #ebe9f7; box-shadow: 0 12px 30px rgba(46, 35, 92, 0.08); overflow: hidden;">
              <div style="padding: 28px 28px 18px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #2E235C; letter-spacing: 0.4px;">Reset Password</h2>
                <p style="margin: 12px 0 4px; font-size: 15px; color: #374151;">Securely reset your BeThere account password</p>
              </div>

              <div style="padding: 0 24px 24px; text-align: center;">
                <div style="margin: 0 auto 8px; max-width: 420px; background: #f6f4ff; border: 1px solid #e7e4f5; border-radius: 14px; padding: 20px;">
                  <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                    You requested a password reset for your BeThere account. Click the button below to choose a new password.
                  </p>

                  <div style="margin-top: 24px;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2E235C; color: #ffffff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </div>
                </div>

                <p style="margin: 24px 0 0; font-size: 12px; color: #9ca3af;">
                  If you did not request this, please ignore this email. <br/>
                  <a href="${resetUrl}" style="color: #2E235C; word-break: break-all;">${resetUrl}</a>
                </p>
              </div>

              <div style="background: #fafafa; padding: 16px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                  This link will expire in 1 hour. &copy; ${new Date().getFullYear()} BeThere.
                </p>
              </div>
            </div>
          </div>
        `,
      };

      await sendEmail(mailOptions);

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