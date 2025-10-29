const db = require('../config/db');
const bcrypt = require('bcrypt');
const { hashPassword } = require('../utils/crypto');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with subscription and plan details
    const [rows] = await db.execute(`
      SELECT 
        u.email,
        s.status as subscriptionStatus,
        p.id as planId,
        p.title as planName
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.userId AND s.status = 'active'
      LEFT JOIN plans p ON s.planId = p.id
      WHERE u.id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = rows[0];
    
    res.json({
      email: userData.email,
      planId: userData.planId,
      planName: userData.planName,
      subscriptionStatus: userData.subscriptionStatus || 'inactive'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Get current password hash
    const [userRows] = await db.execute('SELECT passwordHash FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    
    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await db.execute('UPDATE users SET passwordHash = ? WHERE id = ?', [newPasswordHash, userId]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find active subscription
    const [subscriptions] = await db.execute(
      'SELECT id FROM subscriptions WHERE userId = ? AND status = "active"', 
      [userId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription and stop auto-renewal
    await db.execute(
      'UPDATE subscriptions SET status = "cancelled", endDate = NOW() WHERE id = ?',
      [subscriptions[0].id]
    );

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Placeholder functions for existing routes
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.execute('SELECT id, fullName, email, emailVerified FROM users WHERE id = ?', [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  res.status(501).json({ error: 'Profile update not implemented' });
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🗑️ Deleting user account:', userId);
    
    // Delete user (cascades to subscriptions and tokens)
    await db.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✅ User account deleted successfully:', userId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

const exportData = async (req, res) => {
  res.status(501).json({ error: 'Data export not implemented' });
};

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  exportData,
  getDashboard,
  updatePassword,
  cancelSubscription
};