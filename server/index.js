const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(cors({
  origin: [
    'https://amirh031.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Import routes
const webhookRouter = require('./whatsapp/webhook');
const analyticsRouter = require('./routes/analytics');
const adminDataRouter = require('./routes/adminData');
const searchRouter = require('./routes/search');
const shopsRouter = require('./routes/shops');
const feedbackRouter = require('./routes/feedback');
const ratingsRouter = require('./routes/ratings');
const itemsRouter = require('./routes/items');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const bagRouter = require('./routes/bag');

// Routes
app.use('/webhook', webhookRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin-data', adminDataRouter);
app.use('/api/search', searchRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);
app.use('/api/bag', bagRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SamanKhojo WhatsApp Bot Server running on port ${PORT}`);
  console.log(`📱 WhatsApp webhook endpoint: /webhook`);
  console.log(`🤖 AI-powered responses enabled`);
});

module.exports = app;