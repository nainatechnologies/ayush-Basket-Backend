/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [support]: support.controller
 */

const supportService = require('./support.service');

// @desc    Customer submits a support ticket
// @route   POST /api/support
// @access  Private (Customer)
const createTicket = async (req, res) => {
  try {
    const ticket = await supportService.createNewTicket(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Support ticket submitted. Our team will get back to you soon.',
      data: ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Server error submitting support ticket.' });
  }
};

// @desc    Customer views their own tickets
// @route   GET /api/support/my
// @access  Private (Customer)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await supportService.getTicketsForUser(req.user.id);
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ success: false, message: 'Server error fetching tickets.' });
  }
};

// @desc    Admin – Get all support tickets
// @route   GET /api/admin/support
// @access  Private/Admin
const getAllTickets = async (req, res) => {
  try {
    const formatted = await supportService.getAllTicketsList(req.query);
    res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ success: false, message: 'Server error fetching support tickets.' });
  }
};

// @desc    Admin – Resolve a support ticket
// @route   PUT /api/admin/support/:id/resolve
// @access  Private/Admin
const resolveTicket = async (req, res) => {
  try {
    await supportService.resolveExistingTicket(req.params.id, req.body.admin_reply);
    res.status(200).json({ success: true, message: 'Ticket resolved.' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    console.error('Error resolving ticket:', error);
    res.status(500).json({ success: false, message: 'Server error resolving ticket.' });
  }
};

module.exports = { createTicket, getMyTickets, getAllTickets, resolveTicket };
