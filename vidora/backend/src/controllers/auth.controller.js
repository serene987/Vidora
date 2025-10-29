const db = require('../config/db');
const { hashPassword, comparePassword, generateToken, hashToken } = require('../utils/crypto');
const emailService = require('../services/email.service');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    
    const [result] = await db.execute(
      'INSERT INTO users (fullName, email, passwordHash) VALUES (?, ?, ?)',
      [email.split('@')[0], email, passwordHash]
    );
    const userId = result.insertId;

    const verificationToken = generateToken();
    const hashedToken = hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await db.execute(
      'INSERT INTO tokens (userId, token, type, expiresAt) VALUES (?, ?, ?, ?)',
      [userId, hashedToken, 'email_verification', expiresAt]
    );

    await emailService.sendVerificationEmail(email, verificationToken);

    res.status(201).json({ message: 'User registered. Please check your email for verification.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const hashedToken = hashToken(token);

    const [tokenRecords] = await db.execute(
      'SELECT userId, expiresAt FROM tokens WHERE token = ? AND type = ?',
      [hashedToken, 'email_verification']
    );

    if (tokenRecords.length === 0 || new Date(tokenRecords[0].expiresAt) < new Date()) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    const userId = tokenRecords[0].userId;
    await db.execute('UPDATE users SET emailVerified = TRUE WHERE id = ?', [userId]);
    await db.execute('DELETE FROM tokens WHERE token = ? AND type = ?', [hashedToken, 'email_verification']);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Email verification failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check regular users table
    const [users] = await db.execute(
      'SELECT id, fullName, email, passwordHash, emailVerified, role, stripeCustomerId, failedAttempts, lockUntil FROM users WHERE email = ?',
      [email]
    );
    
    // If not found in users, check pending_users
    if (users.length === 0) {
      const [pendingUsers] = await db.execute(
        'SELECT pu.id, pu.fullName, pu.email, pu.passwordHash, pu.planId, p.title as planTitle, p.price FROM pending_users pu JOIN plans p ON pu.planId = p.id WHERE pu.email = ?',
        [email]
      );
      
      if (pendingUsers.length > 0) {
        const pendingUser = pendingUsers[0];
        const isValidPassword = await comparePassword(password, pendingUser.passwordHash);
        
        if (isValidPassword) {
          // Return pending user data with plan info for frontend to handle
          return res.json({
            isPending: true,
            pendingUser: {
              id: pendingUser.id,
              fullName: pendingUser.fullName,
              email: pendingUser.email,
              planId: pendingUser.planId,
              planTitle: pendingUser.planTitle,
              planPrice: pendingUser.price
            }
          });
        }
      }
      
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = users[0];
    
    // Check if account is locked
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = (user.failedAttempts || 0) + 1;
      
      if (newFailedAttempts >= 5) {
        // Lock account for 1 minute
        await db.execute(
          'UPDATE users SET failedAttempts = ?, lockUntil = DATE_ADD(NOW(), INTERVAL 1 MINUTE) WHERE id = ?',
          [newFailedAttempts, user.id]
        );
      } else {
        // Just increment failed attempts
        await db.execute(
          'UPDATE users SET failedAttempts = ? WHERE id = ?',
          [newFailedAttempts, user.id]
        );
      }
      
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Successful login - reset failed attempts and lockout
    await db.execute(
      'UPDATE users SET failedAttempts = 0, lockUntil = NULL WHERE id = ?',
      [user.id]
    );

    // Check if user has paid (has stripeSubscriptionId)
    const [subscriptions] = await db.execute(
      'SELECT stripeSubscriptionId FROM subscriptions WHERE userId = ? AND stripeSubscriptionId IS NOT NULL LIMIT 1',
      [user.id]
    );
    const hasPaid = subscriptions.length > 0;

    // Store user in session
    req.session.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
      hasPaid
    };

    res.json({
      user: req.session.user
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
};

const checkSession = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not logged in' });
    }
    res.json({ user: req.session.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check session' });
  }
};

const continuePendingPlan = async (req, res) => {
  try {
    const { pendingUserId } = req.body;
    
    const [pendingUsers] = await db.execute(
      'SELECT pu.*, p.title as planTitle, p.price FROM pending_users pu JOIN plans p ON pu.planId = p.id WHERE pu.id = ?',
      [pendingUserId]
    );
    
    if (pendingUsers.length === 0) {
      return res.status(404).json({ error: 'Pending user not found' });
    }
    
    const pendingUser = pendingUsers[0];
    res.json({ pendingUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pending user data' });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  checkSession,
  continuePendingPlan
};