const express = require('express');
const router = express.Router();

// In-memory storage for demo purposes
// In production, this should be stored in a database
let homepageSettings = {
  trendingItems: [
    {
      name: "Fresh Vegetables",
      price: "₹50-200/kg",
      shopName: "Green Mart",
      distance: "500m",
      icon: "🥬"
    },
    {
      name: "Mobile Accessories",
      price: "₹100-500",
      shopName: "Tech Store",
      distance: "800m",
      icon: "📱"
    },
    {
      name: "Dairy Products",
      price: "₹30-150",
      shopName: "Milk Corner",
      distance: "300m",
      icon: "🥛"
    }
  ],
  recentlyRestocked: [
    {
      name: "Snacks & Beverages",
      price: "₹20-100",
      shopName: "Quick Mart",
      distance: "400m",
      icon: "🍿"
    },
    {
      name: "Stationery Items",
      price: "₹10-200",
      shopName: "Paper Plus",
      distance: "600m",
      icon: "📝"
    }
  ],
  showTrending: true,
  showRestocked: true
};

// GET homepage settings
router.get('/homepage', (req, res) => {
  try {
    res.json(homepageSettings);
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    res.status(500).json({ error: 'Failed to fetch homepage settings' });
  }
});

// POST update homepage settings
router.post('/homepage', (req, res) => {
  try {
    homepageSettings = { ...homepageSettings, ...req.body };
    res.json({ success: true, data: homepageSettings });
  } catch (error) {
    console.error('Error updating homepage settings:', error);
    res.status(500).json({ error: 'Failed to update homepage settings' });
  }
});

module.exports = router;