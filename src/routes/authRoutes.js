const express = require('express');
const { login, me } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate an admin and return a JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Verify authentication and return current user details (Authentication Required)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid and user data returned
 *       401:
 *         description: Unauthorized (Missing or invalid token)
 */
router.get('/me', authMiddleware, me);

module.exports = router;