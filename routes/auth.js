import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, authenticateToken } from '../middleware/auth.js';
import { registerValidation, loginValidation, changePasswordValidation, validate } from '../middleware/validate.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Register
router.post('/register', registerValidation, validate, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = getDb();

    const existingUser = db.get('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateId();

    db.run(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [userId, email, passwordHash, name]
    );
    saveDb();

    const classId = generateId();
    db.run(
      'INSERT INTO classes (id, user_id, name) VALUES ($1, $2, $3)',
      [classId, userId, '默认班级']
    );

    const defaultPointItems = [
      { icon: '📝', name: '完成作业', points: 1 },
      { icon: '✋', name: '举手回答', points: 2 },
      { icon: '📖', name: '阅读', points: 2 },
      { icon: '🏃', name: '体育活动', points: 2 },
      { icon: '🎨', name: '美术作品', points: 3 },
      { icon: '🎵', name: '音乐表现', points: 3 },
      { icon: '🤝', name: '帮助同学', points: 3 },
      { icon: '🧹', name: '值日工作', points: 2 },
    ];

    defaultPointItems.forEach((item, index) => {
      db.run(
        'INSERT INTO point_items (id, user_id, icon, name, points, sort_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [generateId(), userId, item.icon, item.name, item.points, index]
      );
    });

    const levelFood = [0, 10, 25, 45, 70, 100, 135, 175, 220, 270];
    levelFood.forEach((food, index) => {
      db.run(
        'INSERT INTO level_config (id, user_id, level, food_required) VALUES ($1, $2, $3, $4)',
        [generateId(), userId, index + 1, food]
      );
    });

    const defaultStoreItems = [
      { name: '座位券', icon: '🪑', badgesRequired: 3, stock: -1 },
      { name: '小零食券', icon: '🍪', badgesRequired: 2, stock: -1 },
      { name: '课外书券', icon: '📚', badgesRequired: 5, stock: -1 },
      { name: '玩具券', icon: '🎁', badgesRequired: 8, stock: -1 },
      { name: '电影券', icon: '🎬', badgesRequired: 15, stock: -1 },
      { name: '大奖券', icon: '🏆', badgesRequired: 30, stock: -1 },
    ];

    defaultStoreItems.forEach(item => {
      db.run(
        'INSERT INTO store_items (id, user_id, name, icon, badges_required, stock) VALUES ($1, $2, $3, $4, $5, $6)',
        [generateId(), userId, item.name, item.icon, item.badgesRequired, item.stock]
      );
    });

    saveDb();

    const user = { id: userId, email, name };
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({ accessToken, refreshToken, user: { id: userId, email, name } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', loginValidation, validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    const user = db.get('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'class-pets-secret-key-change-in-production';
    const decoded = jwt.default.verify(refreshToken, JWT_SECRET);
    const db = getDb();
    const user = db.get('SELECT * FROM users WHERE id = $1', [decoded.id]);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.get('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

// Change password
router.post('/change-password', authenticateToken, changePasswordValidation, validate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const db = getDb();

    const user = db.get('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, req.user.id]);
    saveDb();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;