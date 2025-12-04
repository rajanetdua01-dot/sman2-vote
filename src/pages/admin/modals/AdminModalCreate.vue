<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>➕ Buat Sesi Pemilihan Baru</h3>
        <button @click="$emit('close')" class="btn-close">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit" class="create-form">
          <div class="form-group">
            <label for="nama_sesi">Nama Sesi *</label>
            <input
              id="nama_sesi"
              type="text"
              v-model="form.nama_sesi"
              placeholder="Contoh: Pemilihan Waka SMAN 2 2025/2026"
              required
              :disabled="loading"
            />
            <small class="form-hint">Nama yang akan ditampilkan di seluruh sistem</small>
          </div>

          <div class="form-group">
            <label for="tahun_ajaran">Tahun Ajaran *</label>
            <input
              id="tahun_ajaran"
              type="text"
              v-model="form.tahun_ajaran"
              placeholder="Contoh: 2025/2026"
              required
              :disabled="loading"
            />
            <small class="form-hint">Format: Tahun/Tahun (2025/2026)</small>
          </div>

          <div class="form-info">
            <p><strong>📌 Sistem akan menggunakan kontrol manual:</strong></p>
            <ul>
              <li><span class="status-draft">DRAFT</span> → Buat sesi (status awal)</li>
              <li><span class="status-pendaftaran">PENDAFTARAN</span> → Buka pendaftaran calon</li>
              <li>
                <span class="status-voting">VOTING</span> → Auto generate token & mulai voting
              </li>
              <li><span class="status-selesai">SELESAI</span> → Tutup voting & umumkan hasil</li>
            </ul>
          </div>

          <div class="modal-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel" :disabled="loading">
              Batal
            </button>
            <button type="submit" class="btn-submit" :disabled="!isFormValid || loading">
              {{ loading ? 'Membuat...' : 'Buat Sesi' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

const emit = defineEmits(['close', 'create'])

const loading = ref(false)
const form = reactive({
  nama_sesi: '',
  tahun_ajaran: '',
})

const isFormValid = computed(() => {
  return form.nama_sesi.trim().length > 3 && form.tahun_ajaran.trim().length > 4
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    emit('create', {
      nama_sesi: form.nama_sesi.trim(),
      tahun_ajaran: form.tahun_ajaran.trim(),
    })

    // Reset form
    form.nama_sesi = ''
    form.tahun_ajaran = ''
  } catch (error) {
    console.error('Error creating session:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 1.3rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.form-group input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-hint {
  color: #6b7280;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.form-info {
  background: #f0f9ff;
  padding: 1rem;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.9rem;
}

.form-info p {
  margin: 0 0 0.5rem;
  font-weight: 600;
}

.form-info ul {
  margin: 0;
  padding-left: 1.5rem;
}

.form-info li {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-draft,
.status-pendaftaran,
.status-voting,
.status-selesai {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-pendaftaran {
  background: #fef3c7;
  color: #92400e;
}

.status-voting {
  background: #d1fae5;
  color: #065f46;
}

.status-selesai {
  background: #fee2e2;
  color: #991b1b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  background: #6b7280;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-cancel:hover:not(:disabled) {
  background: #4b5563;
}

.btn-submit {
  background: #1e3a8a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover:not(:disabled) {
  background: #1e40af;
}

.btn-cancel:disabled,
.btn-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .modal {
    margin: 1rem;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>
