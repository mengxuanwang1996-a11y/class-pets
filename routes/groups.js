import express from 'express';
import { getDb, saveDb } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateId } from '../utils/uuid.js';

const router = express.Router();

// Get groups for a class
router.get('/', authenticateToken, (req, res) => {
  const { classId } = req.query;
  if (!classId) {
    return res.status(400).json({ error: 'classId required' });
  }

  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const groups = db.all('SELECT * FROM groups_table WHERE class_id = $1 ORDER BY name', [classId]);

  // Get members for each group
  const groupsWithMembers = groups.map(g => {
    const members = db.all(
      'SELECT s.id, s.name FROM group_members gm JOIN students s ON gm.student_id = s.id WHERE gm.group_id = $1',
      [g.id]
    );
    return { ...g, members };
  });

  res.json(groupsWithMembers);
});

// Create group
router.post('/', authenticateToken, (req, res) => {
  const { classId, name, memberIds } = req.body;

  if (!classId || !name || !name.trim()) {
    return res.status(400).json({ error: 'classId and name required' });
  }

  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const id = generateId();
  db.run('INSERT INTO groups_table (id, class_id, name) VALUES ($1, $2, $3)', [id, classId, name.trim()]);

  // Add members if provided
  if (memberIds && Array.isArray(memberIds)) {
    for (const studentId of memberIds) {
      db.run('INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)', [id, studentId]);
    }
  }

  saveDb();

  const group = db.get('SELECT * FROM groups_table WHERE id = $1', [id]);
  const members = db.all('SELECT s.id, s.name FROM group_members gm JOIN students s ON gm.student_id = s.id WHERE gm.group_id = $1', [id]);

  res.status(201).json({ ...group, members });
});

// Random group assignment
router.post('/random', authenticateToken, (req, res) => {
  const { classId, groupCount } = req.body;

  if (!classId || !groupCount || groupCount < 1) {
    return res.status(400).json({ error: 'classId and groupCount required' });
  }

  const db = getDb();

  const classItem = db.get('SELECT * FROM classes WHERE id = $1 AND user_id = $2', [classId, req.user.id]);
  if (!classItem) {
    return res.status(404).json({ error: 'Class not found' });
  }

  // Get all students
  const students = db.all('SELECT id, name FROM students WHERE class_id = $1', [classId]);
  if (students.length === 0) {
    return res.status(400).json({ error: 'No students in class' });
  }

  // Shuffle students
  for (let i = students.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [students[i], students[j]] = [students[j], students[i]];
  }

  // Clear existing groups for this class
  const existingGroups = db.all('SELECT id FROM groups_table WHERE class_id = $1', [classId]);
  for (const g of existingGroups) {
    db.run('DELETE FROM group_members WHERE group_id = $1', [g.id]);
  }
  db.run('DELETE FROM groups_table WHERE class_id = $1', [classId]);

  // Create new groups
  const groups = [];
  for (let i = 0; i < groupCount; i++) {
    const groupId = generateId();
    db.run('INSERT INTO groups_table (id, class_id, name) VALUES ($1, $2, $3)', [groupId, classId, `Group ${i + 1}`]);
    groups.push({ id: groupId, name: `Group ${i + 1}`, members: [] });
  }

  // Distribute students round-robin
  students.forEach((student, index) => {
    const groupIndex = index % groupCount;
    const groupId = groups[groupIndex].id;
    db.run('INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)', [groupId, student.id]);
    groups[groupIndex].members.push({ id: student.id, name: student.name });
  });

  saveDb();

  res.status(201).json(groups);
});

// Update group
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, memberIds } = req.body;
  const db = getDb();

  const group = db.get('SELECT g.* FROM groups_table g JOIN classes c ON g.class_id = c.id WHERE g.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  if (name !== undefined && name.trim()) {
    db.run('UPDATE groups_table SET name = $1 WHERE id = $2', [name.trim(), id]);
  }

  if (memberIds !== undefined && Array.isArray(memberIds)) {
    db.run('DELETE FROM group_members WHERE group_id = $1', [id]);
    for (const studentId of memberIds) {
      db.run('INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)', [id, studentId]);
    }
  }

  saveDb();

  const updated = db.get('SELECT * FROM groups_table WHERE id = $1', [id]);
  const members = db.all('SELECT s.id, s.name FROM group_members gm JOIN students s ON gm.student_id = s.id WHERE gm.group_id = $1', [id]);

  res.json({ ...updated, members });
});

// Delete group
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const group = db.get('SELECT g.* FROM groups_table g JOIN classes c ON g.class_id = c.id WHERE g.id = $1 AND c.user_id = $2', [id, req.user.id]);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  db.run('DELETE FROM group_members WHERE group_id = $1', [id]);
  db.run('DELETE FROM groups_table WHERE id = $1', [id]);
  saveDb();

  res.json({ message: 'Group deleted' });
});

export default router;