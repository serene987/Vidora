-- Database migrations for existing installations
-- Run these manually if you have existing data

-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS failedAttempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockUntil DATETIME NULL;

-- Update enum values
ALTER TABLE subscriptions MODIFY COLUMN status ENUM('active', 'cancelled', 'trialing', 'inactive') DEFAULT 'active';
ALTER TABLE tokens MODIFY COLUMN type ENUM('email_verification', 'password_reset') NOT NULL;

-- Fix pending_users fullName column
ALTER TABLE pending_users MODIFY COLUMN fullName VARCHAR(255) NOT NULL DEFAULT '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pending_users_stripe_payment ON pending_users(stripePaymentIntentId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripeSubscriptionId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(userId, status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ensure proper column sizes
ALTER TABLE pending_users MODIFY COLUMN stripePaymentIntentId VARCHAR(255) NULL;
ALTER TABLE subscriptions MODIFY COLUMN stripeSubscriptionId VARCHAR(255) NULL;