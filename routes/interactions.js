import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Weighted random pick based on pick history
router.post('/random-pick', authenticateToken, (req, res) => {
  const { classId, count, excludeStudentIds } = req.body;

  if (!classId || !count || count < 1) {
    return res.status(400).json({ error: 'classId and count required' });
  }

  const db = getDb();

  // Get students in class
  const students = db.all(
    'SELECT id, name FROM students WHERE class_id = $1',
    [classId]
  );

  if (students.length === 0) {
    return res.status(400).json({ error: 'No students in class' });
  }

  // Get recent picks (last 30 minutes) for weighting
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const recentPicks = db.all(
    'SELECT student_id FROM pick_history WHERE class_id = $1 AND picked_at > $2',
    [classId, thirtyMinutesAgo]
  );

  // Count picks per student
  const pickCountMap = {};
  for (const pick of recentPicks) {
    pickCountMap[pick.student_id] = (pickCountMap[pick.student_id] || 0) + 1;
  }

  // Filter out excluded students
  let candidates = students.filter(s => !excludeStudentIds || !excludeStudentIds.includes(s.id));

  // Weighted selection: students with fewer recent picks have higher weight
  // Weight = max(1, 5 - pickCount)
  const weightedStudents = candidates.map(s => {
    const recentPicks = pickCountMap[s.id] || 0;
    const weight = Math.max(1, 5 - recentPicks);
    return { ...s, weight };
  });

  // Calculate total weight
  const totalWeight = weightedStudents.reduce((sum, s) => sum + s.weight, 0);

  // Pick students with weighted random
  const picked = [];
  const available = [...weightedStudents];

  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let j = 0; j < available.length; j++) {
      random -= available[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    const selected = available[selectedIndex];
    picked.push({ id: selected.id, name: selected.name });

    // Record this pick
    const pickId = generateId();
    db.run(
      'INSERT INTO pick_history (id, class_id, student_id) VALUES ($1, $2, $3)',
      [pickId, classId, selected.id]
    );

    // Remove from available and update total weight
    available.splice(selectedIndex, 1);
  }

  saveDb();
  res.json({ picked });
});

export default router;