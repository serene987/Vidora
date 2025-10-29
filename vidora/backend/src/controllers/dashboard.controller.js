const db = require('../config/db');
const { hashPassword } = require('../utils/crypto');

const getDashboardData = async (req, res) => {
  try {
    console.log('🚀 DASHBOARD BACKEND: getDashboardData called');
    console.log('📝 DASHBOARD BACKEND: User from session:', req.user);
    const userId = req.user.id;
    console.log('📝 DASHBOARD BACKEND: User ID:', userId);
    
    // Get user with current subscription and plan
    const [userRows] = await db.execute(`
      SELECT 
        u.id, u.fullName, u.email, u.emailVerified,
        s.id as subscriptionId, s.status as subscriptionStatus, s.startDate, s.nextBillingDate,
        p.id as planId, p.title as planTitle, p.price, p.billingCycle
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.userId AND s.status IN ('active', 'cancelled')
      LEFT JOIN plans p ON s.planId = p.id
      WHERE u.id = ?
    `, [userId]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userRows[0];
    
    const dashboardData = {
      user: {
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        emailVerified: userData.emailVerified,
        planId: userData.planId
      },
      subscription: userData.subscriptionId ? {
        id: userData.subscriptionId,
        status: userData.subscriptionStatus,
        startDate: userData.startDate,
        nextBillingDate: userData.nextBillingDate,
        plan: {
          id: userData.planId,
          title: userData.planTitle,
          price: userData.price,
          billingCycle: userData.billingCycle
        }
      } : null
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    console.log('🔄 Change password request for user:', userId);

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Get current password hash
    const [userRows] = await db.execute('SELECT passwordHash FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    
    // Verify current password
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    console.log('🔐 Password verification result:', isValidPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);
    
    // Update password
    await db.execute('UPDATE users SET passwordHash = ? WHERE id = ?', [newPasswordHash, userId]);
    console.log('✅ Password updated successfully for user:', userId);
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const cancelPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🚫 Cancel plan request for user:', userId);
    
    // Get user data and active subscription with planId
    const [userRows] = await db.execute(
      'SELECT u.fullName, u.email, u.passwordHash, s.id as subscriptionId, s.planId FROM users u JOIN subscriptions s ON u.id = s.userId WHERE u.id = ? AND s.status = "active"',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const userData = userRows[0];
    console.log('📊 Found user with subscription:', userData.subscriptionId);

    // Move user to pending_users table first
    await db.execute(
      'INSERT INTO pending_users (fullName, email, passwordHash, planId) VALUES (?, ?, ?, ?)',
      [userData.fullName, userData.email, userData.passwordHash, userData.planId]
    );
    console.log('✅ User moved to pending_users:', userData.email);

    // Cancel subscription
    await db.execute(
      'UPDATE subscriptions SET status = "cancelled", endDate = NOW() WHERE id = ?',
      [userData.subscriptionId]
    );
    console.log('✅ Subscription cancelled successfully:', userData.subscriptionId);

    res.json({ message: 'Plan cancelled successfully' });
  } catch (error) {
    console.error('Cancel plan error:', error);
    res.status(500).json({ error: 'Failed to cancel plan' });
  }
};

module.exports = {
  getDashboardData,
  changePassword,
  cancelPlan
};