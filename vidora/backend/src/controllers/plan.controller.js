const db = require('../config/db');

const getPlans = async (req, res) => {
  try {
    const [plans] = await db.execute('SELECT * FROM plans WHERE isActive = TRUE ORDER BY price ASC');
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

const getPlan = async (req, res) => {
  try {
    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ? AND isActive = TRUE', [req.params.id]);
    
    if (plans.length === 0) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    
    res.json(plans[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
};

const createPlan = async (req, res) => {
  try {
    const { title, description, price, billingCycle, channelCount } = req.body;
    
    const [result] = await db.execute(
      'INSERT INTO plans (title, description, price, billingCycle, channelCount) VALUES (?, ?, ?, ?, ?)',
      [title, description, price, billingCycle, channelCount]
    );
    
    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ?', [result.insertId]);
    res.status(201).json(plans[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { title, description, price, billingCycle, channelCount, isActive } = req.body;
    
    const [result] = await db.execute(
      'UPDATE plans SET title = ?, description = ?, price = ?, billingCycle = ?, channelCount = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [title, description, price, billingCycle, channelCount, isActive, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }
    
    const [plans] = await db.execute('SELECT * FROM plans WHERE id = ?', [req.params.id]);
    res.json(plans[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

module.exports = {
  getPlans,
  getPlan,
  createPlan,
  updatePlan
};