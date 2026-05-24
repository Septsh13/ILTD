const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const roleLabels = {
  ADMIN: 'Global Admin',
  CHAPTER_PRESIDENT: 'Chapter President',
  NORMAL_USER: 'Member',
};

const defaultSettings = {
  notifications: {
    enabled: true,
    email: true,
    meetingReminders: true,
    referralUpdates: true,
    chapterAnnouncements: true,
    securityAlerts: true,
  },
  privacy: {
    profileVisibility: 'chapter',
    contactVisibility: false,
    activityVisibility: true,
    dataSharing: false,
  },
  security: {
    mfaEnabled: false,
    sessionAlerts: true,
  },
  account: {
    visibility: 'active',
    linkedEmail: true,
  },
  language: 'English',
};

const formatUser = (row) => ({
  id: row.id,
  employee_id: row.employee_id,
  full_name: row.full_name,
  email: row.email,
  phone: row.phone,
  age: row.age,
  gender: row.gender,
  bio: row.bio,
  profile_image_url: row.profile_image_url,
  role: row.role,
  roleLabel: roleLabels[row.role] || row.role,
  status: row.status,
  member_category: row.member_category,
  chapter_designation: row.chapter_designation,
  company_name: row.company_name,
  company_designation: row.company_designation,
  company_location: row.company_location,
  region: row.region,
  chapter_id: row.chapter_id,
  chapter_name: row.chapter_name,
  president_id: row.president_id,
  president_name: row.president_name,
  total_referrals: Number(row.total_referrals || 0),
  referrals_received: Number(row.referrals_received || 0),
  business_generated_inr: Number(row.business_generated_inr || 0),
  meetings_attended: Number(row.meetings_attended || 0),
  created_at: row.created_at,
});

const scopedUserWhere = (user, alias = 'u') => {
  if (user.role === 'ADMIN') return { clause: '', params: [] };
  if (user.role === 'CHAPTER_PRESIDENT') {
    return { clause: `WHERE (${alias}.chapter_id = $1 OR ${alias}.id = $2)`, params: [user.chapter_id, user.id] };
  }
  return { clause: `WHERE ${alias}.id = $1`, params: [user.id] };
};

const scopedChapterWhere = (user, alias = 'c') => {
  if (user.role === 'ADMIN') return { clause: '', params: [] };
  return { clause: `WHERE ${alias}.id = $1`, params: [user.chapter_id] };
};

const scopedMeetingWhere = (user, alias = 'm') => {
  if (user.role === 'ADMIN') return { clause: '', params: [] };
  return { clause: `WHERE ${alias}.chapter_id = $1`, params: [user.chapter_id] };
};

const getCurrentUser = async (id) => {
  const { rows } = await pool.query(`
    SELECT u.*, c.name AS chapter_name, p.full_name AS president_name
    FROM users u
    LEFT JOIN chapters c ON c.id = u.chapter_id
    LEFT JOIN users p ON p.id = u.president_id
    WHERE u.id = $1
  `, [id]);
  return rows[0] || null;
};

const getDashboard = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    if (!currentUser) return res.status(404).json({ error: 'User not found.' });

    const scope = scopedUserWhere(currentUser, 'u');
    const { rows: userRows } = await pool.query(`
      SELECT u.*, c.name AS chapter_name, p.full_name AS president_name
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      LEFT JOIN users p ON p.id = u.president_id
      ${scope.clause}
      ORDER BY u.business_generated_inr DESC, u.total_referrals DESC
    `, scope.params);

    const chapterParams = [];
    let chapterWhere = '';
    if (currentUser.role === 'CHAPTER_PRESIDENT') {
      chapterWhere = 'WHERE c.president_id = $1 OR c.id = $2';
      chapterParams.push(currentUser.id, currentUser.chapter_id);
    } else if (currentUser.role === 'NORMAL_USER') {
      chapterWhere = 'WHERE c.id = $1';
      chapterParams.push(currentUser.chapter_id);
    }

    const { rows: chapterRows } = await pool.query(`
      SELECT c.*,
             p.full_name AS president_name,
             COUNT(m.id)::int AS member_count,
             ca.reported_member_count,
             ca.total_business_generated_inr,
             ca.total_referrals_generated,
             ca.total_meetings_conducted
      FROM chapters c
      LEFT JOIN users p ON p.id = c.president_id
      LEFT JOIN users m ON m.chapter_id = c.id AND m.role != 'ADMIN'
      LEFT JOIN chapter_analytics ca ON ca.chapter_id = c.id
      ${chapterWhere}
      GROUP BY c.id, p.full_name, ca.reported_member_count, ca.total_business_generated_inr,
               ca.total_referrals_generated, ca.total_meetings_conducted
      ORDER BY c.created_at DESC
    `, chapterParams);

    const meetingWhere = currentUser.role === 'ADMIN' ? '' : 'WHERE m.chapter_id = $1';
    const meetingParams = currentUser.role === 'ADMIN' ? [] : [currentUser.chapter_id];
    const { rows: meetingRows } = await pool.query(`
      SELECT m.*, c.name AS chapter_name, u.full_name AS created_by_name
      FROM meetings m
      LEFT JOIN chapters c ON c.id = m.chapter_id
      LEFT JOIN users u ON u.id = m.created_by
      ${meetingWhere}
      ORDER BY m.starts_at DESC
    `, meetingParams);

    const users = userRows.map(formatUser);
    const current = formatUser(currentUser);
    const totalBusiness = users.reduce((sum, user) => sum + user.business_generated_inr, 0);
    const totalReferrals = users.reduce((sum, user) => sum + user.total_referrals, 0);
    const totalReceived = users.reduce((sum, user) => sum + user.referrals_received, 0);
    const analyticsMeetings = chapterRows.reduce((sum, chapter) => sum + Number(chapter.total_meetings_conducted || 0), 0);
    const normalUsers = users.filter((user) => user.role === 'NORMAL_USER');

    return res.status(200).json({
      currentUser: current,
      users,
      chapters: chapterRows,
      meetings: meetingRows,
      metrics: {
        totalGsnMembers: currentUser.role === 'ADMIN' ? users.filter((u) => u.role !== 'ADMIN').length : normalUsers.length,
        chapterMembers: currentUser.role === 'ADMIN' ? normalUsers.length : normalUsers.length,
        totalChapters: chapterRows.length,
        chapterPresidents: users.filter((u) => u.role === 'CHAPTER_PRESIDENT').length,
        referralsGiven: current.total_referrals,
        referralsReceived: current.referrals_received,
        totalReferrals,
        totalReferralsReceived: totalReceived,
        businessGeneratedInr: totalBusiness,
        totalMeetings: analyticsMeetings || meetingRows.length,
        upcomingMeetings: meetingRows.filter((m) => m.status === 'UPCOMING').length,
        completedMeetings: meetingRows.filter((m) => m.status === 'COMPLETED').length,
      },
      leaderboards: {
        global: users.filter((u) => u.role !== 'ADMIN').slice(0, 10),
        chapter: users.filter((u) => u.chapter_id && u.chapter_id === current.chapter_id && u.role !== 'ADMIN').slice(0, 10),
      },
      memberBreakdown: [
        { label: 'Business Consultant', value: users.filter((u) => u.member_category === 'Business Consultant').length || 0 },
        { label: 'Financial Advisor', value: users.filter((u) => u.member_category === 'Financial Advisor').length || 0 },
        { label: 'Digital Marketing', value: users.filter((u) => u.member_category === 'Digital Marketing').length || 0 },
        { label: 'IT Services', value: users.filter((u) => u.member_category === 'IT Services').length || 0 },
        { label: 'Other', value: users.filter((u) => !['Business Consultant', 'Financial Advisor', 'Digital Marketing', 'IT Services'].includes(u.member_category)).length },
      ],
    });
  } catch (err) {
    console.error('[NETWORK] dashboard error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const parsePagination = (req) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  return { limit, offset };
};

const getUsers = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    const scope = scopedUserWhere(currentUser, 'u');
    const { limit, offset } = parsePagination(req);
    const { rows } = await pool.query(`
      SELECT u.*, c.name AS chapter_name, p.full_name AS president_name
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      LEFT JOIN users p ON p.id = u.president_id
      ${scope.clause}
      ORDER BY u.business_generated_inr DESC, u.full_name ASC
      LIMIT $${scope.params.length + 1} OFFSET $${scope.params.length + 2}
    `, [...scope.params, limit, offset]);
    return res.status(200).json({ users: rows.map(formatUser), limit, offset });
  } catch (err) {
    console.error('[NETWORK] users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getChapters = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    const scope = scopedChapterWhere(currentUser, 'c');
    const { rows } = await pool.query(`
      SELECT c.*, p.full_name AS president_name, COUNT(u.id)::int AS member_count,
             ca.reported_member_count, ca.total_business_generated_inr,
             ca.total_referrals_generated, ca.total_meetings_conducted
      FROM chapters c
      LEFT JOIN users p ON p.id = c.president_id
      LEFT JOIN users u ON u.chapter_id = c.id AND u.role != 'ADMIN'
      LEFT JOIN chapter_analytics ca ON ca.chapter_id = c.id
      ${scope.clause}
      GROUP BY c.id, p.full_name, ca.reported_member_count, ca.total_business_generated_inr,
               ca.total_referrals_generated, ca.total_meetings_conducted
      ORDER BY c.name ASC
    `, scope.params);
    return res.status(200).json({ chapters: rows });
  } catch (err) {
    console.error('[NETWORK] chapters error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getMeetings = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    const scope = scopedMeetingWhere(currentUser, 'm');
    const { rows } = await pool.query(`
      SELECT m.*, c.name AS chapter_name, u.full_name AS created_by_name
      FROM meetings m
      LEFT JOIN chapters c ON c.id = m.chapter_id
      LEFT JOIN users u ON u.id = m.created_by
      ${scope.clause}
      ORDER BY m.starts_at DESC
    `, scope.params);
    return res.status(200).json({ meetings: rows });
  } catch (err) {
    console.error('[NETWORK] meetings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    const scope = req.query.scope === 'chapter'
      ? { clause: 'WHERE u.chapter_id = $1 AND u.role != $2', params: [currentUser.chapter_id, 'ADMIN'] }
      : scopedUserWhere(currentUser, 'u');
    const { rows } = await pool.query(`
      SELECT u.*, c.name AS chapter_name, p.full_name AS president_name
      FROM users u
      LEFT JOIN chapters c ON c.id = u.chapter_id
      LEFT JOIN users p ON p.id = u.president_id
      ${scope.clause ? `${scope.clause} ${scope.clause.includes('role') ? '' : "AND u.role != 'ADMIN'"}` : "WHERE u.role != 'ADMIN'"}
      ORDER BY u.business_generated_inr DESC, u.total_referrals DESC
      LIMIT 100
    `, scope.params);
    return res.status(200).json({ leaderboard: rows.map(formatUser) });
  } catch (err) {
    console.error('[NETWORK] leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const currentUser = await getCurrentUser(req.user.id);
    const scope = scopedChapterWhere(currentUser, 'c');
    const { rows } = await pool.query(`
      SELECT c.id AS chapter_id, c.name AS chapter_name, c.region,
             ca.reported_member_count, ca.total_business_generated_inr,
             ca.total_referrals_generated, ca.total_meetings_conducted,
             ca.updated_at
      FROM chapters c
      LEFT JOIN chapter_analytics ca ON ca.chapter_id = c.id
      ${scope.clause}
      ORDER BY c.name ASC
    `, scope.params);
    return res.status(200).json({ analytics: rows });
  } catch (err) {
    console.error('[NETWORK] analytics error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const createChapter = async (req, res) => {
  const { name, city, region } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO chapters (name, city, region)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET city = EXCLUDED.city, region = EXCLUDED.region
       RETURNING *`,
      [name, city, region]
    );
    return res.status(201).json({ chapter: rows[0] });
  } catch (err) {
    console.error('[NETWORK] create chapter error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const createUser = async (req, res) => {
  const {
    employee_id,
    full_name,
    email,
    password,
    role,
    member_category,
    region,
    chapter_id,
    president_id,
  } = req.body;

  if (!['CHAPTER_PRESIDENT', 'NORMAL_USER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (!chapter_id) {
    return res.status(400).json({ error: 'Chapter is required.' });
  }
  if (role === 'NORMAL_USER' && !president_id) {
    return res.status(400).json({ error: 'Normal users require a chapter president.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await client.query(
      `INSERT INTO users
        (employee_id, full_name, email, password_hash, role, member_category, region, chapter_id, president_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULLIF($9, '')::uuid)
       RETURNING id, employee_id, full_name, email, role, member_category, region, chapter_id, president_id`,
      [employee_id, full_name, email, hash, role, member_category, region, chapter_id, president_id || null]
    );

    if (role === 'CHAPTER_PRESIDENT') {
      await client.query('UPDATE chapters SET president_id = $1 WHERE id = $2', [rows[0].id, chapter_id]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ user: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[NETWORK] create user error:', err);
    return res.status(500).json({ error: err.code === '23505' ? 'Username or email already exists.' : 'Internal server error.' });
  } finally {
    client.release();
  }
};

const getSettings = async (req, res) => {
  try {
    const current = await getCurrentUser(req.user.id);
    const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
    const saved = rows[0] || {};
    return res.status(200).json({
      profile: formatUser(current),
      settings: {
        notifications: { ...defaultSettings.notifications, ...(saved.notification_preferences || {}) },
        privacy: { ...defaultSettings.privacy, ...(saved.privacy_preferences || {}) },
        security: { ...defaultSettings.security, ...(saved.security_preferences || {}) },
        account: { ...defaultSettings.account, ...(saved.account_preferences || {}) },
        language: saved.language_preference || defaultSettings.language,
      },
    });
  } catch (err) {
    console.error('[NETWORK] settings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateProfile = async (req, res) => {
  const { full_name, email, phone, age, gender, bio, region, profile_image_url } = req.body;
  try {
    const { rows } = await pool.query(`
      UPDATE users
      SET full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          age = COALESCE($4, age),
          gender = COALESCE($5, gender),
          bio = COALESCE($6, bio),
          region = COALESCE($7, region),
          profile_image_url = COALESCE($8, profile_image_url)
      WHERE id = $9
      RETURNING *
    `, [full_name, email, phone, age || null, gender, bio, region, profile_image_url, req.user.id]);
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('[NETWORK] profile update error:', err);
    return res.status(500).json({ error: err.code === '23505' ? 'Email already exists.' : 'Internal server error.' });
  }
};

const updateSettings = async (req, res) => {
  const { notifications, privacy, security, account, language } = req.body;
  try {
    const { rows } = await pool.query(`
      INSERT INTO user_settings
        (user_id, notification_preferences, privacy_preferences, security_preferences, account_preferences, language_preference)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE SET
        notification_preferences = COALESCE(EXCLUDED.notification_preferences, user_settings.notification_preferences),
        privacy_preferences = COALESCE(EXCLUDED.privacy_preferences, user_settings.privacy_preferences),
        security_preferences = COALESCE(EXCLUDED.security_preferences, user_settings.security_preferences),
        account_preferences = COALESCE(EXCLUDED.account_preferences, user_settings.account_preferences),
        language_preference = COALESCE(EXCLUDED.language_preference, user_settings.language_preference),
        updated_at = NOW()
      RETURNING *
    `, [
      req.user.id,
      notifications ? JSON.stringify(notifications) : null,
      privacy ? JSON.stringify(privacy) : null,
      security ? JSON.stringify(security) : null,
      account ? JSON.stringify(account) : null,
      language || null,
    ]);
    return res.status(200).json({ settings: rows[0] });
  } catch (err) {
    console.error('[NETWORK] settings update error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const changePassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'All password fields are required.' });
  }
  if (new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  if (new_password !== confirm_password) return res.status(400).json({ error: 'New password and confirmation do not match.' });

  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length || !(await bcrypt.compare(current_password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[NETWORK] change password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const assertMeetingAccess = async (user, meetingId) => {
  if (user.role === 'ADMIN') return true;
  const { rows } = await pool.query('SELECT chapter_id FROM meetings WHERE id = $1', [meetingId]);
  return rows[0] && rows[0].chapter_id === user.chapter_id;
};

const createMeeting = async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  const chapterId = user.role === 'ADMIN' ? req.body.chapter_id : user.chapter_id;
  const { title, description, meeting_date, meeting_time, meeting_type, location, meeting_link, status = 'UPCOMING' } = req.body;
  const startsAt = new Date(`${meeting_date}T${meeting_time || '09:00'}:00`);

  try {
    const { rows } = await pool.query(`
      INSERT INTO meetings
        (title, description, starts_at, meeting_type, location, meeting_link, status, chapter_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [title, description, startsAt, meeting_type, location, meeting_link, status, chapterId, req.user.id]);
    return res.status(201).json({ meeting: rows[0] });
  } catch (err) {
    console.error('[NETWORK] create meeting error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const updateMeeting = async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  if (!(await assertMeetingAccess(user, req.params.id))) return res.status(403).json({ error: 'Access denied.' });
  const { title, description, meeting_date, meeting_time, meeting_type, location, meeting_link, status, chapter_id } = req.body;
  const startsAt = meeting_date ? new Date(`${meeting_date}T${meeting_time || '09:00'}:00`) : null;
  const nextChapterId = user.role === 'ADMIN' ? chapter_id : user.chapter_id;

  try {
    const { rows } = await pool.query(`
      UPDATE meetings
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          starts_at = COALESCE($3, starts_at),
          meeting_type = COALESCE($4, meeting_type),
          location = COALESCE($5, location),
          meeting_link = COALESCE($6, meeting_link),
          status = COALESCE($7, status),
          chapter_id = COALESCE($8, chapter_id),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, startsAt, meeting_type, location, meeting_link, status, nextChapterId, req.params.id]);
    return res.status(200).json({ meeting: rows[0] });
  } catch (err) {
    console.error('[NETWORK] update meeting error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const deleteMeeting = async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  if (!(await assertMeetingAccess(user, req.params.id))) return res.status(403).json({ error: 'Access denied.' });
  await pool.query('DELETE FROM meetings WHERE id = $1', [req.params.id]);
  return res.status(200).json({ message: 'Meeting deleted.' });
};

module.exports = {
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
};
