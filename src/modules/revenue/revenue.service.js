const sequelize = require('../../config/db');

const getRevenueData = async (filters) => {
  const { filter, startDate, endDate } = filters;

  let whereClauses = ['status NOT IN ("cancelled", "rejected")'];
  let queryParams = [];

  if (filter === 'today') {
    whereClauses.push('DATE(created_at) = CURDATE()');
  } else if (filter === 'yesterday') {
    whereClauses.push('DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)');
  } else if (filter === 'last7days') {
    whereClauses.push('created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
  } else if (filter === 'last30days') {
    whereClauses.push('created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
  } else if (filter === 'thismonth') {
    whereClauses.push('MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())');
  } else if (startDate && endDate) {
    whereClauses.push('created_at >= ? AND created_at <= ?');
    queryParams.push(startDate, endDate + ' 23:59:59');
  } else if (startDate) {
    whereClauses.push('created_at >= ?');
    queryParams.push(startDate);
  } else if (endDate) {
    whereClauses.push('created_at <= ?');
    queryParams.push(endDate + ' 23:59:59');
  }

  const whereString = 'WHERE ' + whereClauses.join(' AND ').replace(/created_at/g, 'o.created_at').replace(/status/g, 'o.status');

  const [totals] = await sequelize.query(`
    SELECT 
      COUNT(DISTINCT o.id) as total_orders,
      SUM(oi.price * oi.quantity) as total_revenue,
      SUM(oi.purchase_price * oi.quantity) as total_cost,
      SUM((oi.price - oi.purchase_price) * oi.quantity) as total_profit
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereString}
  `, { replacements: queryParams });

  const [daily] = await sequelize.query(`
    SELECT 
      DATE(o.created_at) as date,
      COUNT(DISTINCT o.id) as orders,
      SUM(oi.price * oi.quantity) as revenue,
      SUM(oi.purchase_price * oi.quantity) as cost,
      SUM((oi.price - oi.purchase_price) * oi.quantity) as profit
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ${whereString}
    GROUP BY DATE(o.created_at)
    ORDER BY date DESC
  `, { replacements: queryParams });

  const totalRevenue = parseFloat(totals[0].total_revenue || 0);
  const totalCost = parseFloat(totals[0].total_cost || 0);
  const totalProfit = parseFloat(totals[0].total_profit || 0);

  return {
    totalCost,
    totalRevenue,
    totalProfit,
    daily: daily.map(d => ({
      date: d.date,
      ordersCount: parseInt(d.orders || 0, 10),
      purchaseMoney: parseFloat(d.cost || 0),
      sellingMoney: parseFloat(d.revenue || 0),
      profitMoney: parseFloat(d.profit || 0)
    }))
  };
};

module.exports = {
  getRevenueData
};
