/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Module [support]: support.service
 */

const { SupportTicket, User } = require('../../models');

const createNewTicket = async (userId, data) => {
  return await SupportTicket.create({
    userId,
    subject: data.subject,
    message: data.message,
    status: 'open'
  });
};

const getTicketsForUser = async (userId) => {
  return await SupportTicket.findAll({
    where: { userId },
    order: [['created_at', 'DESC']]
  });
};

const getAllTicketsList = async (filters) => {
  let whereClause = {};
  if (filters.status) {
    whereClause.status = filters.status;
  }

  const tickets = await SupportTicket.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'phone'] }
    ],
    order: [['created_at', 'DESC']]
  });

  return tickets.map(t => {
    const ticket = t.toJSON();
    ticket.user_name = ticket.user ? ticket.user.name : null;
    ticket.user_email = ticket.user ? ticket.user.email : null;
    ticket.user_phone = ticket.user ? ticket.user.phone : null;
    return ticket;
  });
};

const resolveExistingTicket = async (id, adminReply) => {
  const ticket = await SupportTicket.findByPk(id);

  if (!ticket) {
    const error = new Error('Support ticket not found.');
    error.statusCode = 404;
    throw error;
  }
  
  ticket.status = 'resolved';
  ticket.adminReply = adminReply || null;
  await ticket.save();
};

module.exports = {
  createNewTicket,
  getTicketsForUser,
  getAllTicketsList,
  resolveExistingTicket
};
