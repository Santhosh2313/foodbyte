const form = document.getElementById('reservation-form');
const listContainer = document.getElementById('list-container');
const formMessage = document.getElementById('form-message');
const sqlForm = document.getElementById('sql-form');
const sqlMessage = document.getElementById('sql-message');

function normalizeDateTimeLocal(dateTimeLocalValue) {
  // datetime-local input gives YYYY-MM-DDTHH:mm; backend accepts ISO string.
  return new Date(dateTimeLocalValue).toISOString();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

async function loadReservations() {
  const response = await fetch('/api/reservations');
  const reservations = await response.json();

  if (!reservations.length) {
    listContainer.innerHTML = '<p>No reservations yet.</p>';
    return;
  }

  listContainer.innerHTML = reservations
    .map(
      (r) => `
      <article class="reservation-item">
        <div class="row">
          <strong>${r.customer_name}</strong>
          <button class="delete-btn" data-id="${r.id}">Delete</button>
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

  document.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      await loadReservations();
    });
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.party_size = Number(payload.party_size);
  payload.reservation_time = normalizeDateTimeLocal(payload.reservation_time);

  const response = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    formMessage.textContent = body.error || 'Failed to save reservation.';
    formMessage.style.color = '#b42318';
    return;
  }

  form.reset();
  formMessage.textContent = 'Reservation saved successfully.';
  formMessage.style.color = '#027a48';
  await loadReservations();
});

loadReservations();

sqlForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  sqlMessage.textContent = '';

  const formData = new FormData(sqlForm);
  const payload = Object.fromEntries(formData.entries());

  const response = await fetch('/api/db/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json();
  if (!response.ok) {
    sqlMessage.textContent = body.error || 'Failed to execute SQL.';
    sqlMessage.style.color = '#b42318';
    return;
  }

  sqlMessage.textContent = `${body.message} Affected rows: ${body.rowcount}.`;
  sqlMessage.style.color = '#027a48';
  await loadReservations();
});
