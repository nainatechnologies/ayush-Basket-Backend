require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const DailyRevenue = require('../../src/modules/revenue/dailyRevenue.model');

(async () => {
  try {
    await DailyRevenue.sync({ alter: true });
    console.log('daily_revenue table successfully created/synced in DB!');
  } catch (error) {
    console.error('Error syncing daily_revenue table:', error.message);
  } finally {
    process.exit();
  }
})();
