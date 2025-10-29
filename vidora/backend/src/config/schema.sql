-- Create database tables for Vidora TV

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  emailVerified BOOLEAN DEFAULT FALSE,
  role ENUM('user', 'admin') DEFAULT 'user',
  stripeCustomerId VARCHAR(255),
  failedAttempts INT DEFAULT 0,
  lockUntil DATETIME NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billingCycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
  channelCount INT NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  planId INT NOT NULL,
  status ENUM('active', 'cancelled', 'trialing', 'inactive') DEFAULT 'active',
  stripeSubscriptionId VARCHAR(255),
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endDate TIMESTAMP NULL,
  nextBillingDate TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  type ENUM('email_verification', 'password_reset') NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pending_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  planId INT NOT NULL,
  stripePaymentIntentId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (planId) REFERENCES plans(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_users_stripe_payment ON pending_users(stripePaymentIntentId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripeSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(userId, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert sample plans only if they don't exist
INSERT INTO plans (title, description, price, billingCycle, channelCount, isActive) 
SELECT 'Basic Plan', 'Essential channels for everyday viewing', 29.99, 'monthly', 50, TRUE
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE title = 'Basic Plan');

INSERT INTO plans (title, description, price, billingCycle, channelCount, isActive) 
SELECT 'Premium Plan', 'Premium channels with sports and movies', 49.99, 'monthly', 150, TRUE
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE title = 'Premium Plan');

INSERT INTO plans (title, description, price, billingCycle, channelCount, isActive) 
SELECT 'Ultimate Plan', 'All channels including premium content', 79.99, 'monthly', 300, TRUE
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE title = 'Ultimate Plan');

