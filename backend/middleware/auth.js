/**
 * Authentication middleware
 */

const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // For demo purposes, we'll skip authentication
  // In production, implement proper JWT verification
  next();
}

function optionalAuth(req, res, next) {
  // Optional authentication for public endpoints
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
