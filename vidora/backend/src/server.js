const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// CORS
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin, credentials: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'vidora-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: null // Session persists until browser closes or logout
  }
}));

// Raw body parsing for Stripe webhooks
app.use('/api/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Setup MySQL connection pool
const db = require('./config/db');

const initializeDatabase = async () => {
  try {
    // Check if database is already initialized
    const [tables] = await db.execute("SHOW TABLES LIKE 'users'");
    if (tables.length > 0) {
      console.log('Database already initialized, skipping schema creation.✅');
      return;
    }
    
    console.log('Initializing database schema for first time...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'config/schema.sql'), 'utf8');
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      await db.execute(statement);
    }
    
    console.log('Database schema initialized successfully.✅');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/user', require('./routes/dashboard.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/subscriptions', require('./routes/subscription.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/webhooks', require('./routes/webhook.routes'));
app.use('/api', require('./routes/checkout.routes'));
app.use('/api/test', require('./routes/test.routes'));

console.log('✅ All routes loaded successfully');

// Health route
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

const startServer = async () => {
  try {
    // Test database connection
    await db.execute('SELECT 1');
    console.log('Database connection established successfully.');

    // Initialize database schema
    await initializeDatabase();

    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../dist')));
      app.get('*', (_, res) =>
        res.sendFile(path.join(__dirname, '../dist/index.html'))
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();