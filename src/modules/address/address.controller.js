const addressService = require('./address.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess, sendError } = require('../../utils/response');

// @desc    Get all addresses for logged in user
// @route   GET /api/addresses
// @access  Private
const getAddresses = asyncHandler(async (req, res) => {
  try {
    const addresses = await addressService.getAddressesForUser(req.user.id);
    return sendSuccess(res, 200, 'Addresses fetched successfully', addresses, { count: addresses.length });
  } catch (error) {
    return sendError(res, 500, 'Server error fetching addresses');
  }
});

// @desc    Add new address
// @route   POST /api/addresses
// @access  Private
const addAddress = asyncHandler(async (req, res) => {
  try {
    const address = await addressService.addAddress(req.user.id, req.body);
    return sendSuccess(res, 201, 'Address added', address);
  } catch (error) {
    return sendError(res, 500, 'Server error adding address');
  }
});

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = asyncHandler(async (req, res) => {
  try {
    const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 200, 'Address updated', address);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error updating address');
  }
});

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = asyncHandler(async (req, res) => {
  try {
    await addressService.deleteAddress(req.user.id, req.params.id);
    return sendSuccess(res, 200, 'Address deleted');
  } catch (error) {
    if (error.statusCode) return sendError(res, error.statusCode, error.message);
    return sendError(res, 500, 'Server error deleting address');
  }
});

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress
};
