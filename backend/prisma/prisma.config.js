require('dotenv').config();

module.exports = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5000/mar_abu_pm"
    }
  }
};
