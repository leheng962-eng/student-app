<script setup>
import { ref, computed, onMounted } from 'vue';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const students = ref([]);
const search = ref('');
const loading = ref(false);
const error = ref('');
const showForm = ref(false);
const editingId = ref(null);

const emptyForm = () => ({
  studentId: '',
  name: '',
  gender: 'Male',
  age: '',
  major: '',
  phone: '',
  email: '',
});
const form = ref(emptyForm());

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadStudents() {
  loading.value = true;
  error.value = '';
  try {
    students.value = await request(`${API}/students`);
  } catch (e) {
    error.value = 'Cannot connect to API: ' + e.message;
  } finally {
    loading.value = false;
  }
}

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return students.value;
  return students.value.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.major.toLowerCase().includes(q)
  );
});

const stats = computed(() => ({
  total: students.value.length,
  male: students.value.filter((s) => s.gender === 'Male').length,
  female: students.value.filter((s) => s.gender === 'Female').length,
}));

function openAdd() {
  editingId.value = null;
  form.value = emptyForm();
  error.value = '';
  showForm.value = true;
}

function openEdit(s) {
  editingId.value = s.id;
  form.value = { ...s };
  error.value = '';
  showForm.value = true;
}

async function save() {
  error.value = '';
  try {
    if (editingId.value) {
      await request(`${API}/students/${editingId.value}`, {
        method: 'PUT',
        body: JSON.stringify(form.value),
      });
    } else {
      await request(`${API}/students`, {
        method: 'POST',
        body: JSON.stringify(form.value),
      });
    }
    showForm.value = false;
    await loadStudents();
  } catch (e) {
    error.value = e.message;
  }
}

async function remove(s) {
  if (!confirm(`Delete ${s.name}?`)) return;
  try {
    await request(`${API}/students/${s.id}`, { method: 'DELETE' });
    await loadStudents();
  } catch (e) {
    error.value = e.message;
  }
}

onMounted(loadStudents);
</script>

<template>
  <div class="page">
    <header>
      <h1>🎓 Student Management System</h1>
      <p>Add, edit, search and delete students</p>
    </header>

    <section class="stats">
      <div class="card"><span>{{ stats.total }}</span>Total</div>
      <div class="card"><span>{{ stats.male }}</span>Male</div>
      <div class="card"><span>{{ stats.female }}</span>Female</div>
    </section>

    <section class="toolbar">
      <input v-model="search" placeholder="Search by name, ID or major..." />
      <button class="primary" @click="openAdd">+ Add Student</button>
    </section>

    <p v-if="error && !showForm" class="error">{{ error }}</p>
    <p v-if="loading">Loading...</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Age</th>
            <th>Major</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s.id">
            <td>{{ s.studentId }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.gender }}</td>
            <td>{{ s.age }}</td>
            <td>{{ s.major }}</td>
            <td>{{ s.phone }}</td>
            <td>{{ s.email }}</td>
            <td class="actions">
              <button @click="openEdit(s)">Edit</button>
              <button class="danger" @click="remove(s)">Delete</button>
            </td>
          </tr>
          <tr v-if="!filtered.length && !loading">
            <td colspan="8" class="empty">No students found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showForm" class="modal" @click.self="showForm = false">
      <form class="modal-box" @submit.prevent="save">
        <h2>{{ editingId ? 'Edit Student' : 'Add Student' }}</h2>
        <p v-if="error" class="error">{{ error }}</p>

        <label>Student ID<input v-model="form.studentId" required /></label>
        <label>Full Name<input v-model="form.name" required /></label>
        <div class="row">
          <label>Gender
            <select v-model="form.gender">
              <option>Male</option>
              <option>Female</option>
            </select>
          </label>
          <label>Age<input v-model="form.age" type="number" min="1" required /></label>
        </div>
        <label>Major<input v-model="form.major" required /></label>
        <label>Phone<input v-model="form.phone" /></label>
        <label>Email<input v-model="form.email" type="email" /></label>

        <div class="form-actions">
          <button type="button" @click="showForm = false">Cancel</button>
          <button type="submit" class="primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style>
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  background: #f3f4f8;
  color: #1f2937;
}
.page { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }
header h1 { margin: 0; }
header p { color: #6b7280; margin-top: 4px; }
.stats { display: flex; gap: 12px; margin: 20px 0; }
.card {
  flex: 1; background: #fff; border-radius: 10px; padding: 14px;
  text-align: center; color: #6b7280; box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.card span { display: block; font-size: 28px; font-weight: 700; color: #4f46e5; }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.toolbar input { flex: 1; }
input, select {
  width: 100%; padding: 10px; border: 1px solid #d1d5db;
  border-radius: 8px; font-size: 14px; background: #fff;
}
button {
  padding: 9px 14px; border: 1px solid #d1d5db; background: #fff;
  border-radius: 8px; cursor: pointer; font-size: 14px;
}
button.primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
button.danger { color: #dc2626; border-color: #fecaca; }
.table-wrap { background: #fff; border-radius: 10px; overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eef0f4; font-size: 14px; white-space: nowrap; }
th { background: #f9fafb; color: #6b7280; font-weight: 600; }
.actions { display: flex; gap: 6px; }
.empty { text-align: center; color: #9ca3af; padding: 28px; }
.error { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 8px; }
.modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.modal-box {
  background: #fff; border-radius: 12px; padding: 22px;
  width: 100%; max-width: 440px; max-height: 92vh; overflow-y: auto;
}
.modal-box h2 { margin-top: 0; }
.modal-box label { display: block; font-size: 13px; color: #6b7280; margin-bottom: 10px; }
.modal-box label input, .modal-box label select { margin-top: 4px; color: #1f2937; }
.row { display: flex; gap: 10px; }
.row label { flex: 1; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
</style>
