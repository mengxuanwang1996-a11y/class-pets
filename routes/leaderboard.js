import express from 'express';
import { getDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get rankings for a class with tie handling
router.get('/', authenticateToken, (req, res) => {
  const { classId } = req.query;
  if (!classId) {
    return res.status(400).json({ error: 'classId required' });
  }

  const db = getDb();

  // Verify class belongs to user
  const classItem = db.all(
    'SELECT * FROM classes WHERE id = $1 AND user_id = $2',
    [classId, req.user.id]
  );
  if (classItem.length === 0) {
    return res.status(404).json({ error: 'Class not found' });
  }

  // Get all students with points, sorted by points descending
  const students = db.all(
    'SELECT id, name, points, level FROM students WHERE class_id = $1 ORDER BY points DESC',
    [classId]
  );

  // Assign ranks with tie handling
  let rank = 1;
  let prevPoints = null;
  const rankings = students.map((s, index) => {
    if (prevPoints !== null && s.points < prevPoints) {
      rank = index + 1;
    }
    prevPoints = s.points;
    return { ...s, rank };
  });

  // Get group rankings (sum of points per group)
  const groups = db.all(
    'SELECT g.id, g.name, SUM(s.points) as totalPoints, COUNT(s.id) as memberCount FROM groups_table g LEFT JOIN students s ON g.id = s.group_id WHERE g.class_id = $1 GROUP BY g.id ORDER BY totalPoints DESC',
    [classId]
  );

  let groupRank = 1;
  let prevGroupPoints = null;
  const groupRankings = groups.map((g, index) => {
    if (prevGroupPoints !== null && g.totalPoints < prevGroupPoints) {
      groupRank = index + 1;
    }
    prevGroupPoints = g.totalPoints;
    return { ...g, rank: groupRank };
  });

  res.json({ rankings: rankings, groupRankings });
});

export default router;