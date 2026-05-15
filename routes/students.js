import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

function getLevelConfig(userId) {
  const db = getDb();
  const items = db.all('SELECT level, food_required FROM level_config WHERE user_id = $1 ORDER BY level', [userId]);
  return items.map(i => i.food_required);
}

function calculateLevel(food, levelConfig) {
  let level = 1;
  for (let i = 0; i < levelConfig.length; i++) {
    if (food >= levelConfig[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, levelConfig.length);
}

// Get students by class
router.get('/', authenticateToken, (req, res) => {
  const { classId } = req.query;
  if (!classId) {
    return res.status(400).json({ error: 'classId required' });
  }

  const db = getDb();

  // Verify class belongs to user
  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const students = db.all('SELECT * FROM students WHERE class_id = $1 ORDER BY name', [classId]);

  // Get group names for each student
  const studentsWithGroups = students.map(s => {
    let groupName = null;
    if (s.group_id) {
      const group = db.get('SELECT name FROM groups_table WHERE id = $1', [s.group_id]);
      groupName = group ? group.name : null;
    }
    return { ...s, groupName };
  });

  res.json(studentsWithGroups);
});

// Create student
router.post('/', authenticateToken, (req, res) => {
  const { classId, name } = req.body;

  if (!classId || !name || !name.trim()) {
    return res.status(400).json({ error: 'classId and name required' });
  }

  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const id = generateId();
  db.run(
    'INSERT INTO students (id, class_id, name, points, badges, pet_type, level, current_food) VALUES ($1, $2, $3, 0, 5, NULL, 1, 0)',
    [id, classId, name.trim()]
  );
  saveDb();

  const student = db.get('SELECT * FROM students WHERE id = $1', [id]);
  res.status(201).json(student);
});

// Batch create students
router.post('/batch', authenticateToken, (req, res) => {
  const { classId, names } = req.body;

  if (!classId || !names || !Array.isArray(names)) {
    return res.status(400).json({ error: 'classId and names array required' });
  }

  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const created = [];
  for (const name of names) {
    if (!name || !name.trim()) continue;
    const id = generateId();
    db.run(
      'INSERT INTO students (id, class_id, name, points, badges, pet_type, level, current_food) VALUES ($1, $2, $3, 0, 5, NULL, 1, 0)',
      [id, classId, name.trim()]
    );
    const student = db.get('SELECT * FROM students WHERE id = $1', [id]);
    created.push(student);
  }

  saveDb();
  res.status(201).json(created);
});

// Update student (name, pet, points, badges, etc)
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, petType, points, badges, level, currentFood, groupId } = req.body;
  const db = getDb();

  const student = db.get('SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(name.trim());
  }
  if (petType !== undefined) {
    updates.push(`pet_type = $${paramIndex++}`);
    params.push(petType);
  }
  if (points !== undefined) {
    updates.push(`points = $${paramIndex++}`);
    params.push(points);
  }
  if (badges !== undefined) {
    updates.push(`badges = $${paramIndex++}`);
    params.push(badges);
  }
  if (level !== undefined) {
    updates.push(`level = $${paramIndex++}`);
    params.push(level);
  }
  if (currentFood !== undefined) {
    updates.push(`current_food = $${paramIndex++}`);
    params.push(currentFood);
  }
  if (groupId !== undefined) {
    updates.push(`group_id = $${paramIndex++}`);
    params.push(groupId || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push('updated_at = NOW()');
  params.push(id);

  db.run(`UPDATE students SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
  saveDb();

  const updated = db.get('SELECT * FROM students WHERE id = $1', [id]);
  res.json(updated);
});

// Add points to student
router.post('/:id/points', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { itemName, points } = req.body;

  if (points === undefined || !itemName) {
    return res.status(400).json({ error: 'itemName and points required' });
  }

  const db = getDb();

  const student = db.get('SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const levelConfig = getLevelConfig(req.user.id);
  const newPoints = student.points + points;
  const newFood = student.current_food + Math.max(0, points);
  const newLevel = calculateLevel(newFood, levelConfig);
  const leveledUp = newLevel > student.level;

  db.run(
    'UPDATE students SET points = $1, current_food = $2, level = $3, updated_at = NOW() WHERE id = $4',
    [newPoints, newFood, newLevel, id]
  );

  // Record point history
  const historyId = generateId();
  db.run(
    'INSERT INTO point_history (id, student_id, item_name, points) VALUES ($1, $2, $3, $4)',
    [historyId, id, itemName, points]
  );

  saveDb();

  const updated = db.get('SELECT * FROM students WHERE id = $1', [id]);
  res.json({ ...updated, leveledUp });
});

// Assign pet to student
router.post('/:id/pet', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { petType } = req.body;

  if (!petType) {
    return res.status(400).json({ error: 'petType required' });
  }

  const db = getDb();

  const student = db.get('SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  db.run(
    'UPDATE students SET pet_type = $1, level = 1, current_food = 0, updated_at = NOW() WHERE id = $2',
    [petType, id]
  );
  saveDb();

  const updated = db.get('SELECT * FROM students WHERE id = $1', [id]);
  res.json(updated);
});

// Get point history for student
router.get('/:id/history', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const student = db.get('SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const history = db.all(
    'SELECT * FROM point_history WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50',
    [id]
  );

  res.json(history);
});

// Delete student
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const student = db.get('SELECT s.* FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  db.run('DELETE FROM students WHERE id = $1', [id]);
  saveDb();
  res.json({ message: 'Student deleted' });
});

export default router;