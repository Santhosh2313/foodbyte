const form = document.getElementById('reservation-form');
const listContainer = document.getElementById('list-container');
const formMessage = document.getElementById('form-message');
const sqlForm = document.getElementById('sql-form');
const sqlMessage = document.getElementById('sql-message');
const saveBtn = document.getElementById('save-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const refreshListBtn = document.getElementById('refresh-list-btn');
const viewUpcomingBtn = document.getElementById('view-upcoming-btn');
const viewAllBtn = document.getElementById('view-all-btn');

let listMode = 'upcoming';

function normalizeDateTimeLocal(dateTimeLocalValue) {
  // datetime-local input gives YYYY-MM-DDTHH:mm; backend accepts ISO string.
  return new Date(dateTimeLocalValue).toISOString();
}

function toDateTimeLocal(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function setMode(nextMode) {
  listMode = nextMode;
  if (viewUpcomingBtn) {
    viewUpcomingBtn.classList.toggle('secondary-btn', listMode !== 'upcoming');
  }
  if (viewAllBtn) {
    viewAllBtn.classList.toggle('secondary-btn', listMode !== 'all');
  }
}

function setFormMode(mode) {
  if (!saveBtn || !cancelEditBtn) return;
  if (mode === 'edit') {
    saveBtn.textContent = 'Update Reservation';
    cancelEditBtn.style.display = 'inline-block';
  } else {
    saveBtn.textContent = 'Save Reservation';
    cancelEditBtn.style.display = 'none';
  }
}

function fillFormForEdit(reservation) {
  if (!form) return;
  form.elements.id.value = reservation.id;
  form.elements.customer_name.value = reservation.customer_name || '';
  form.elements.phone.value = reservation.phone || '';
  form.elements.email.value = reservation.email || '';
  form.elements.party_size.value = reservation.party_size || '';
  form.elements.reservation_time.value = toDateTimeLocal(reservation.reservation_time);
  form.elements.special_request.value = reservation.special_request || '';
  setFormMode('edit');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormToCreate() {
  if (!form) return;
  form.reset();
  form.elements.id.value = '';
  setFormMode('create');
}

async function loadReservations() {
  if (!listContainer) return;

  try {
    const endpoint = listMode === 'all' ? '/api/reservations' : '/api/reservations/upcoming';
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Failed to load reservations.');

    const reservations = await response.json();
    if (!Array.isArray(reservations) || !reservations.length) {
      listContainer.innerHTML = `<p>No ${listMode} reservations.</p>`;
      return;
    }

    listContainer.innerHTML = reservations
      .map(
        (r) => `
        <article class="reservation-item">
          <div class="row">
            <strong>${r.customer_name}</strong>
            <div class="row action-buttons">
              <button class="edit-btn secondary-btn" data-id="${r.id}">Edit</button>
              <button class="delete-btn" data-id="${r.id}">Delete</button>
            </div>
          </div>
          <div>Phone: ${r.phone}</div>
          <div>Email: ${r.email}</div>
          <div>Party Size: ${r.party_size}</div>
          <div>Time: ${formatDate(r.reservation_time)}</div>
          <div>Special Request: ${r.special_request || 'None'}</div>
        </article>
      `
      )
      .join('');

    document.querySelectorAll('.edit-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.id);
        const reservation = reservations.find((item) => Number(item.id) === id);
        if (!reservation) return;
        fillFormForEdit(reservation);
      });
    });

    document.querySelectorAll('.delete-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.id;
        const response = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
        if (!response.ok && formMessage) {
          formMessage.textContent = 'Failed to delete reservation.';
          formMessage.style.color = '#b42318';
        }
        if (form?.elements.id.value === id) {
          resetFormToCreate();
        }
        await loadReservations();
      });
    });
  } catch (_error) {
    listContainer.innerHTML = '<p>Could not load reservations right now.</p>';
  }
}

if (form) {
  setFormMode('create');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (formMessage) formMessage.textContent = '';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const editingId = payload.id;
    delete payload.id;
    payload.party_size = Number(payload.party_size);
    payload.reservation_time = normalizeDateTimeLocal(payload.reservation_time);

    const isEditing = Boolean(editingId);
    const endpoint = isEditing ? `/api/reservations/${editingId}` : '/api/reservations';
    const method = isEditing ? 'PUT' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      if (formMessage) {
        formMessage.textContent = body.error || 'Failed to save reservation.';
        formMessage.style.color = '#b42318';
      }
      return;
    }

    resetFormToCreate();
    if (formMessage) {
      formMessage.textContent = isEditing
        ? 'Reservation updated successfully.'
        : 'Reservation saved successfully.';
      formMessage.style.color = '#027a48';
    }
    await loadReservations();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
    resetFormToCreate();
    if (formMessage) formMessage.textContent = '';
  });
}

if (refreshListBtn) {
  refreshListBtn.addEventListener('click', async () => {
    await loadReservations();
  });
}

if (viewUpcomingBtn) {
  viewUpcomingBtn.addEventListener('click', async () => {
    setMode('upcoming');
    await loadReservations();
  });
}

if (viewAllBtn) {
  viewAllBtn.addEventListener('click', async () => {
    setMode('all');
    await loadReservations();
  });
}

setMode('upcoming');
loadReservations();

if (sqlForm) {
  sqlForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sqlMessage) sqlMessage.textContent = '';

    const formData = new FormData(sqlForm);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/db/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      if (sqlMessage) {
        sqlMessage.textContent = body.error || 'Failed to execute SQL.';
        sqlMessage.style.color = '#b42318';
      }
      return;
    }

    if (sqlMessage) {
      sqlMessage.textContent = `${body.message} Affected rows: ${body.rowcount}.`;
      sqlMessage.style.color = '#027a48';
    }
    await loadReservations();
  });
}
