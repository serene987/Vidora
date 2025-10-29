# Vidora TV Backend

A complete TV Service Subscription System backend built with Node.js, Express, TypeScript, and MySQL.

## Features

- **Authentication**: JWT-based auth with email verification and password reset
- **Subscription Management**: Create, view, and cancel TV subscriptions
- **Payment Processing**: Stripe integration for secure payments
- **Admin Panel**: Admin routes for managing TV plans
- **GDPR Compliance**: Account deletion and data export
- **Security**: Rate limiting, CORS, Helmet, bcrypt password hashing

## Tech Stack

- Node.js + Express + JavaScript (ESM)
- MySQL + Sequelize ORM
- JWT Authentication
- Stripe Payments
- Nodemailer for emails
- Jest for testing

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=vidora_tv
DB_USER=root
DB_PASSWORD=your_password

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# App Config
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 3. Database Setup
Create MySQL database:
```sql
CREATE DATABASE vidora_tv;
```

### 4. Seed Database
```bash
npm run seed
```
This creates sample TV plans and an admin user (admin@vidora.com / admin123).

### 5. Run Development Server
```bash
npm run dev
```

### 6. Run Production Server
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify-email?token=` - Email verification
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/request-password-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### User Management
- `GET /api/users/me` - Get user profile
- `PATCH /api/users/me` - Update profile
- `DELETE /api/users/me` - Delete account (GDPR)
- `GET /api/users/me/export` - Export user data (GDPR)

### TV Plans
- `GET /api/plans` - List all active plans
- `GET /api/plans/:id` - Get specific plan

### Subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions/:id/cancel` - Cancel subscription

### Admin Routes
- `POST /api/admin/plans` - Create TV plan
- `PATCH /api/admin/plans/:id` - Update TV plan

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

## Stripe Test Mode Setup

1. Create a Stripe account and get test API keys
2. Create products and prices in Stripe Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Add webhook events: `invoice.payment_succeeded`, `invoice.payment_failed`

## Testing

```bash
npm test
```

## Database Models

### User
- id (UUID), fullName, email, phone
- passwordHash, emailVerified, role
- stripeCustomerId, timestamps

### Plan
- id (UUID), title, description, price
- billingCycle, channelCount, isActive

### Subscription
- id (UUID), userId, planId, status
- stripeSubscriptionId, dates, timestamps

### Token
- id (UUID), userId, token, type
- expiresAt (for email verification & password reset)

## Security Features

- JWT access/refresh token system
- bcrypt password hashing
- Rate limiting (100 req/15min)
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection prevention (Sequelize)

## Development Notes

- Email verification links are logged to console in development
- Stripe webhooks require HTTPS in production
- Database auto-syncs on startup (no force in production)
- All secrets must be in environment variables