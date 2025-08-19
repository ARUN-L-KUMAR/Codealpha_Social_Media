const express = require('express');
const { body } = require('express-validator');
const {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const sendMessageValidation = [
  body('conversationId')
    .notEmpty()
    .withMessage('Conversation ID is required')
    .isMongoId()
    .withMessage('Invalid conversation ID'),
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Invalid message type')
];

const createConversationValidation = [
  body('participantId')
    .notEmpty()
    .withMessage('Participant ID is required')
    .isMongoId()
    .withMessage('Invalid participant ID')
];

// All message routes require authentication
router.use(protect);

// Routes
router.get('/conversations', getConversations);
router.post('/conversations', createConversationValidation, createOrGetConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/', sendMessageValidation, sendMessage);

module.exports = router;
