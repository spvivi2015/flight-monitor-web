const form = document.getElementById('form');
const flightInput = document.getElementById('flight');
const autoBox = document.getElementById('auto');
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');

let timer = null;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await run();
  syncAutoRefresh();
});

autoBox.addEventListener('change', syncAutoRefresh);

function syncAutoRefresh() {
  if (timer) clearInterval(timer);
  if (autoBox.checked) {
    timer = setInterval(() => run(), 60_000);
  }
}

async function run() {
  const flight = flightInput.value.trim().toUpperCase();
  if (!flight) return;

  showError('');
  statusEl.classList.remove('hidden');
  statusEl.innerHTML = '查詢中...';

  try {
    const resp = await fetch(`/api/flight?flight=${encodeURIComponent(flight)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || '查詢失敗');

    statusEl.innerHTML = render(data);
  } catch (err) {
    statusEl.classList.add('hidden');
    showError(err.message || '發生錯誤');
  }
}

function showError(msg) {
  if (!msg) {
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
    return;
  }
  errorEl.textContent = `❌ ${msg}`;
  errorEl.classList.remove('hidden');
}

function fmt(t) {
  if (!t) return '-';
  try {
    return new Date(t).toLocaleString('zh-TW', { hour12: false });
  } catch {
    return t;
  }
}

function render(x) {
  const cls = statusClass(x.status);
  return `
    <h3>${x.flight} <span class="status-pill ${cls}">${x.status}</span></h3>
    <div class="grid">
      <div><div class="k">航空公司</div><div class="v">${x.airline}</div></div>
      <div><div class="k">更新時間</div><div class="v">${fmt(x.updatedAt)}</div></div>
      <div><div class="k">出發機場</div><div class="v">${x.departure.airport} (${x.departure.iata})</div></div>
      <div><div class="k">抵達機場</div><div class="v">${x.arrival.airport} (${x.arrival.iata})</div></div>
      <div><div class="k">預定出發</div><div class="v">${fmt(x.departure.scheduled)}</div></div>
      <div><div class="k">預估出發</div><div class="v">${fmt(x.departure.estimated)}</div></div>
      <div><div class="k">預定抵達</div><div class="v">${fmt(x.arrival.scheduled)}</div></div>
      <div><div class="k">預估抵達</div><div class="v">${fmt(x.arrival.estimated)}</div></div>
    </div>
  `;
}

function statusClass(status){
  const s=(status||'').toLowerCase();
  if(['landed','active','scheduled'].includes(s)) return 'ok';
  if(['delayed','incident','diverted'].includes(s)) return 'warn';
  if(['cancelled'].includes(s)) return 'bad';
  return '';
}
