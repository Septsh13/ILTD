const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');
const {
  getDashboard,
  getUsers,
  getChapters,
  getMeetings,
  getLeaderboard,
  getAnalytics,
  createChapter,
  createUser,
  getSettings,
  updateProfile,
  updateSettings,
  changePassword,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} = require('../controllers/networkController');

const router = express.Router();

router.use(authenticate, auditLogger);

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.get('/chapters', getChapters);
router.get('/meetings', getMeetings);
router.get('/leaderboard', getLeaderboard);
router.get('/analytics', getAnalytics);
router.get('/settings', getSettings);
router.put('/settings/profile', updateProfile);
router.put('/settings/preferences', updateSettings);
router.post('/settings/change-password', changePassword);

router.post(
  '/chapters',
  requireRole('ADMIN'),
  [
    body('name').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('region').trim().notEmpty(),
  ],
  validate,
  createChapter
);

router.post(
  '/users',
  requireRole('ADMIN'),
  [
    body('employee_id').trim().notEmpty(),
    body('full_name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['CHAPTER_PRESIDENT', 'NORMAL_USER']),
    body('chapter_id').isUUID(),
    body('president_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  ],
  validate,
  createUser
);

router.post(
  '/meetings',
  requireRole('ADMIN', 'CHAPTER_PRESIDENT'),
  [
    body('title').trim().notEmpty(),
    body('meeting_date').isISO8601(),
    body('meeting_type').isIn(['Online', 'Offline']),
    body('chapter_id').optional({ nullable: true, checkFalsy: true }).isUUID(),
  ],
  validate,
  createMeeting
);

router.put(
  '/meetings/:id',
  requireRole('ADMIN', 'CHAPTER_PRESIDENT'),
  [param('id').isUUID()],
  validate,
  updateMeeting
);

router.delete(
  '/meetings/:id',
  requireRole('ADMIN', 'CHAPTER_PRESIDENT'),
  [param('id').isUUID()],
  validate,
  deleteMeeting
);

module.exports = router;
