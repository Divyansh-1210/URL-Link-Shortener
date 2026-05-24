/* ═══════════════════════════════════════════════════════════════
   Trimly — app.js
   All frontend JavaScript logic
═══════════════════════════════════════════════════════════════ */

const API = '';
let chartInstance = null;
let currentView = 'all'; // 'all' or 'mine'

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggles
  ['theme-toggle', 'mobile-theme-toggle'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => document.documentElement.classList.toggle('dark'));
  });

  // Enter key on URL input
  document.getElementById('longUrlInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') shortenURL();
  });

  // Restore session if token exists
  const token = localStorage.getItem('token');
  if (token) updateNavAuth(localStorage.getItem('username'));

  loadLinks();
});

// ── Auth State ────────────────────────────────────────────────
function updateNavAuth(username) {
  // Desktop
  document.getElementById('navGuest').classList.add('hidden');
  document.getElementById('navUser').classList.remove('hidden');
  document.getElementById('navUser').classList.add('flex');
  document.getElementById('navUsername').textContent = username;
  // Mobile
  document.getElementById('mobileNavGuest').classList.add('hidden');
  document.getElementById('mobileNavUser').classList.remove('hidden');
  // Show My Links toggle
  document.getElementById('myLinksToggle').classList.remove('hidden');
  document.getElementById('myLinksToggle').classList.add('flex');
}

function updateNavGuest() {
  document.getElementById('navGuest').classList.remove('hidden');
  document.getElementById('navUser').classList.add('hidden');
  document.getElementById('navUser').classList.remove('flex');
  document.getElementById('mobileNavGuest').classList.remove('hidden');
  document.getElementById('mobileNavUser').classList.add('hidden');
  document.getElementById('myLinksToggle').classList.add('hidden');
}

// ── Auth Modal ────────────────────────────────────────────────
function openAuthModal(tab = 'login') {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
  clearAuthErrors();
}

function switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  const loginTab = document.getElementById('tabLogin');
  const regTab   = document.getElementById('tabRegister');
  if (isLogin) {
    loginTab.classList.add('bg-surface-container-lowest', 'dark:bg-[#1a1a2e]', 'text-primary', 'shadow-sm');
    loginTab.classList.remove('text-on-surface-variant', 'dark:text-outline-variant');
    regTab.classList.remove('bg-surface-container-lowest', 'dark:bg-[#1a1a2e]', 'text-primary', 'shadow-sm');
    regTab.classList.add('text-on-surface-variant', 'dark:text-outline-variant');
  } else {
    regTab.classList.add('bg-surface-container-lowest', 'dark:bg-[#1a1a2e]', 'text-primary', 'shadow-sm');
    regTab.classList.remove('text-on-surface-variant', 'dark:text-outline-variant');
    loginTab.classList.remove('bg-surface-container-lowest', 'dark:bg-[#1a1a2e]', 'text-primary', 'shadow-sm');
    loginTab.classList.add('text-on-surface-variant', 'dark:text-outline-variant');
  }
}

function clearAuthErrors() {
  document.getElementById('loginError').classList.add('hidden');
  document.getElementById('regError').classList.add('hidden');
}

// ── Login ─────────────────────────────────────────────────────
async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const spinner  = document.getElementById('loginSpinner');
  const btn      = document.getElementById('loginBtn');
  if (!username || !password) { showAuthError('login', 'Please fill in all fields.'); return; }

  btn.disabled = true; spinner.style.display = 'block';
  try {
    const res  = await fetch(`${API}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError('login', data.detail); return; }
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', data.username);
    updateNavAuth(data.username);
    closeAuthModal();
    showToast(`👋 Welcome back, ${data.username}!`);
    loadLinks();
  } catch { showAuthError('login', 'Network error.'); }
  finally { btn.disabled = false; spinner.style.display = 'none'; }
}

// ── Register ──────────────────────────────────────────────────
async function doRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const spinner  = document.getElementById('registerSpinner');
  const btn      = document.getElementById('registerBtn');
  if (!username || !email || !password) { showAuthError('reg', 'Please fill in all fields.'); return; }

  btn.disabled = true; spinner.style.display = 'block';
  try {
    const res  = await fetch(`${API}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) { showAuthError('reg', data.detail); return; }
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('username', data.username);
    updateNavAuth(data.username);
    closeAuthModal();
    showToast(`🎉 Account created! Welcome, ${data.username}!`);
    loadLinks();
  } catch { showAuthError('reg', 'Network error.'); }
  finally { btn.disabled = false; spinner.style.display = 'none'; }
}

function showAuthError(form, msg) {
  const prefix = form === 'login' ? 'login' : 'reg';
  document.getElementById(`${prefix}Error`).classList.remove('hidden');
  document.getElementById(`${prefix}ErrorMsg`).textContent = msg;
}

// ── Logout ────────────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  updateNavGuest();
  currentView = 'all';
  switchLinksView('all');
  showToast('👋 Logged out successfully!');
  loadLinks();
}

// ── Links View Toggle (All / Mine) ────────────────────────────
function switchLinksView(view) {
  currentView = view;
  document.getElementById('btnAllLinks').classList.toggle('text-primary', view === 'all');
  document.getElementById('btnAllLinks').classList.toggle('bg-surface-container-lowest', view === 'all');
  document.getElementById('btnAllLinks').classList.toggle('dark:bg-[#1a1a2e]', view === 'all');
  document.getElementById('btnAllLinks').classList.toggle('shadow-sm', view === 'all');
  document.getElementById('btnAllLinks').classList.toggle('text-on-surface-variant', view !== 'all');
  document.getElementById('btnMyLinks').classList.toggle('text-primary', view === 'mine');
  document.getElementById('btnMyLinks').classList.toggle('bg-surface-container-lowest', view === 'mine');
  document.getElementById('btnMyLinks').classList.toggle('dark:bg-[#1a1a2e]', view === 'mine');
  document.getElementById('btnMyLinks').classList.toggle('shadow-sm', view === 'mine');
  document.getElementById('btnMyLinks').classList.toggle('text-on-surface-variant', view !== 'mine');
  loadLinks();
}

// ── Shorten URL ───────────────────────────────────────────────
async function shortenURL() {
  const longUrl    = document.getElementById('longUrlInput').value.trim();
  const customCode = document.getElementById('customCodeInput').value.trim();
  const btn        = document.getElementById('shortenBtn');
  const spinner    = document.getElementById('spinner');
  const btnIcon    = document.getElementById('btnIcon');
  const btnText    = document.getElementById('btnText');
  const resultBox  = document.getElementById('resultBox');
  const errorBox   = document.getElementById('errorBox');

  if (!longUrl) { showError('Please enter a URL first.'); return; }

  btn.disabled = true; spinner.style.display = 'block';
  btnIcon.style.display = 'none'; btnText.textContent = 'Shortening...';
  resultBox.classList.add('hidden'); errorBox.classList.add('hidden');

  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const body = { long_url: longUrl };
    if (customCode) body.custom_code = customCode;

    const res  = await fetch(`${API}/shorten`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showError(data.detail || 'Something went wrong.'); return; }

    const urlEl = document.getElementById('resultUrl');
    urlEl.textContent = data.short_url; urlEl.href = data.short_url;
    document.getElementById('resultMeta').textContent =
      `Code: ${data.short_code}  ·  ${data.owner ? '👤 ' + data.owner : '🌐 Anonymous'}  ·  ${formatDate(data.created_at)}`;
    document.getElementById('resultQrBtn').onclick = () => openQrModal(data.short_code, data.short_url);

    resultBox.classList.remove('hidden'); resultBox.classList.add('slide-down');
    document.getElementById('longUrlInput').value = '';
    document.getElementById('customCodeInput').value = '';
    loadLinks();
  } catch { showError('Network error. Is the server running?'); }
  finally {
    btn.disabled = false; spinner.style.display = 'none';
    btnIcon.style.display = ''; btnText.textContent = 'Shorten URL';
  }
}

// ── Load Links ────────────────────────────────────────────────
async function loadLinks() {
  try {
    const token = localStorage.getItem('token');
    const endpoint = (currentView === 'mine' && token) ? '/my-urls' : '/urls';
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res  = await fetch(`${API}${endpoint}`, { headers });
    const data = await res.json();
    renderTable(data);
    renderStats(data);
    renderChart(data);
  } catch (err) { console.error('Failed to load links:', err); }
}

// ── Render Table ──────────────────────────────────────────────
function renderTable(urls) {
  const tbody = document.getElementById('linksBody');
  if (!urls.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-on-surface-variant dark:text-outline-variant">
      <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">link_off</span>
      <span class="font-label-caps text-label-caps opacity-50">No links yet. Shorten your first URL above!</span>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = urls.map(u => {
    const hasClicks = u.click_count > 0;
    const badgeCls  = hasClicks
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-surface-variant dark:bg-white/5 text-on-surface-variant dark:text-outline-variant border-outline-variant/20 dark:border-white/10';
    const truncated = u.long_url.length > 38 ? u.long_url.slice(0, 38) + '...' : u.long_url;
    const ownerBadge = u.owner
      ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"><span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1;">account_circle</span>${u.owner}</span>`
      : `<span class="text-on-surface-variant dark:text-outline-variant opacity-50 text-xs">guest</span>`;

    return `<tr class="border-b border-outline-variant/10 dark:border-white/5 hover:bg-surface-container/30 dark:hover:bg-white/[0.02] transition-colors group">
      <td class="py-4 px-6 text-primary dark:text-inverse-primary font-bold">
        <a href="${u.short_url}" target="_blank" class="hover:underline">/${u.short_code}</a>
      </td>
      <td class="py-4 px-6 text-on-surface-variant dark:text-outline-variant w-[240px] max-w-[240px]" title="${u.long_url}"><span class="block truncate">${truncated}</span></td>
      <td class="py-4 px-6">
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${badgeCls}">
          <span class="material-symbols-outlined text-[14px]">visibility</span> ${u.click_count}
        </span>
      </td>
      <td class="py-4 px-6">${ownerBadge}</td>
      <td class="py-4 px-6 text-on-surface-variant dark:text-outline-variant">${formatDate(u.created_at)}</td>
      <td class="py-4 px-6 text-right">
        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="copyText('${u.short_url}')" class="px-2 py-1 rounded-DEFAULT border border-outline-variant/20 dark:border-white/10 text-on-surface-variant dark:text-outline-variant hover:text-on-surface dark:hover:text-white transition-colors text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]">content_copy</span> Copy
          </button>
          <button onclick="openQrModal('${u.short_code}','${u.short_url}')" class="px-2 py-1 rounded-DEFAULT border border-primary/20 text-primary hover:bg-primary/10 transition-colors text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]">qr_code</span> QR
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Render Stats ──────────────────────────────────────────────
function renderStats(urls) {
  const clicks = urls.reduce((acc, u) => acc + u.click_count, 0);
  const top    = urls.reduce((best, u) => u.click_count > (best?.click_count ?? -1) ? u : best, null);
  document.getElementById('statTotal').textContent  = urls.length;
  document.getElementById('statClicks').textContent = clicks;
  document.getElementById('statTop').textContent    = top && top.click_count > 0 ? top.click_count : '—';
}

// ── Chart.js ──────────────────────────────────────────────────
function renderChart(urls) {
  const canvas = document.getElementById('analyticsChart');
  const empty  = document.getElementById('chartEmpty');

  const top5 = [...urls].sort((a, b) => b.click_count - a.click_count).slice(0, 5).filter(u => u.click_count > 0);

  if (!top5.length) { canvas.style.display = 'none'; empty.style.display = 'flex'; return; }
  canvas.style.display = 'block'; empty.style.display = 'none';

  const isDark  = document.documentElement.classList.contains('dark');
  const labels  = top5.map(u => '/' + u.short_code);
  const data    = top5.map(u => u.click_count);
  const gridClr = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const txtClr  = isDark ? '#94a3b8' : '#49454f';

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Clicks',
        data,
        backgroundColor: 'rgba(124,58,237,0.7)',
        borderColor: 'rgba(124,58,237,1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#12121A' : '#fff',
          borderColor: 'rgba(124,58,237,0.3)', borderWidth: 1,
          titleColor: isDark ? '#e4e1e9' : '#1c1b1f',
          bodyColor: isDark ? '#94a3b8' : '#49454f',
          padding: 12, cornerRadius: 8,
          callbacks: { label: ctx => ` ${ctx.parsed.y} clicks` }
        }
      },
      scales: {
        x: { grid: { color: gridClr }, ticks: { color: txtClr, font: { family: 'JetBrains Mono', size: 12 } } },
        y: { grid: { color: gridClr }, ticks: { color: txtClr, font: { family: 'Inter', size: 12 }, stepSize: 1 }, beginAtZero: true }
      }
    }
  });
}

// ── QR Modal ──────────────────────────────────────────────────
function openQrModal(shortCode, shortUrl) {
  document.getElementById('qrShortUrl').textContent = shortUrl || `http://localhost:8000/${shortCode}`;
  const src = `${API}/qr/${shortCode}?t=${Date.now()}`; // cache-bust
  document.getElementById('qrImage').src = src;
  document.getElementById('qrDownload').href     = `${API}/qr/${shortCode}`;
  document.getElementById('qrDownload').download = `qr-${shortCode}.png`;
  document.getElementById('qrModal').classList.add('open');
}

function closeQrModal() {
  document.getElementById('qrModal').classList.remove('open');
  document.getElementById('qrImage').src = ''; // clear on close
}

// Close modals on backdrop click or Escape key
document.getElementById('authModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeAuthModal(); });
document.getElementById('qrModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeQrModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAuthModal(); closeQrModal(); } });

// ── Helpers ───────────────────────────────────────────────────
function copyResult() { copyText(document.getElementById('resultUrl').textContent); }
function copyText(text) { navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!')); }

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorBox').classList.remove('hidden');
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showPricingToast(e) { e.preventDefault(); showToast('🎉 100% Free & Open Source. No pricing needed!'); }
function showInfoToast(e, msg) { e.preventDefault(); showToast(msg); }
