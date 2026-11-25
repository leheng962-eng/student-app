const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Simple JSON-file storage (persisted via docker volume at /data)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'students.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

const seed = [
  { id: 1, studentId: 'S001', name: 'Sok Dara', gender: 'Male', age: 20, major: 'Computer Science', phone: '012345678', email: 'dara@example.com' },
  { id: 2, studentId: 'S002', name: 'Chan Sreyneang', gender: 'Female', age: 19, major: 'Business', phone: '098765432', email: 'sreyneang@example.com' },
];

function load() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    save(seed);
    return seed;
  }
}
function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function validate(body) {
  const required = ['studentId', 'name', 'gender', 'age', 'major'];
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || String(body[f]).trim() === '') {
      return `${f} is required`;
    }
  }
  if (isNaN(Number(body.age)) || Number(body.age) < 1) return 'age must be a valid number';
  return null;
}

app.get('/', (req, res) => {
  res.json({ message: 'Student Management API is running', endpoints: ['/api/students'] });
});

// List (with optional ?search=)
app.get('/api/students', (req, res) => {
  let students = load();
  const q = (req.query.search || '').toLowerCase();
  if (q) {
    students = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.major.toLowerCase().includes(q)
    );
  }
  res.json(students);
});

// Get one
app.get('/api/students/:id', (req, res) => {
  const s = load().find((x) => x.id === Number(req.params.id));
  if (!s) return res.status(404).json({ error: 'Student not found' });
  res.json(s);
});

// Create
app.post('/api/students', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const students = load();
  if (students.some((s) => s.studentId === req.body.studentId)) {
    return res.status(409).json({ error: 'Student ID already exists' });
  }
  const id = students.length ? Math.max(...students.map((s) => s.id)) + 1 : 1;
  const student = {
    id,
    studentId: String(req.body.studentId).trim(),
    name: String(req.body.name).trim(),
    gender: req.body.gender,
    age: Number(req.body.age),
    major: String(req.body.major).trim(),
    phone: req.body.phone || '',
    email: req.body.email || '',
  };
  students.push(student);
  save(students);
  res.status(201).json(student);
});

// Update
app.put('/api/students/:id', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const students = load();
  const i = students.findIndex((x) => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Student not found' });
  if (students.some((s) => s.studentId === req.body.studentId && s.id !== students[i].id)) {
    return res.status(409).json({ error: 'Student ID already exists' });
  }
  students[i] = {
    ...students[i],
    studentId: String(req.body.studentId).trim(),
    name: String(req.body.name).trim(),
    gender: req.body.gender,
    age: Number(req.body.age),
    major: String(req.body.major).trim(),
    phone: req.body.phone || '',
    email: req.body.email || '',
  };
  save(students);
  res.json(students[i]);
});

// Delete
app.delete('/api/students/:id', (req, res) => {
  const students = load();
  const i = students.findIndex((x) => x.id === Number(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Student not found' });
  const [removed] = students.splice(i, 1);
  save(students);
  res.json(removed);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on port ${PORT}`));
