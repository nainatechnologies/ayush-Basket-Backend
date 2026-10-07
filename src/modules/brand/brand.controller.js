const Brand = require('./brand.model');

exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands',
      error: error.message
    });
  }
};
