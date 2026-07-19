/**
 * Dashboard Frontend JavaScript
 * Adds: Search, Filters, Sync Now button functionality
 */

// Global state
let filterState = { search: '', status: '', type: '', suburb: '', minPrice: '', maxPrice: '' };

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initFilters();
  initSyncButton();
  loadFiltersFromURL();
  console.log('✓ Dashboard features initialized');
});

// Search bar (300ms debounce)
function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  let timeout;
  input.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      filterState.search = e.target.value.toLowerCase();
      applyFilters();
      updateURL();
    }, 300);
  });
}

// Filters
function initFilters() {
  ['status-filter', 'type-filter', 'suburb-filter', 'min-price', 'max-price'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        filterState[id.replace(/-filter|-price/, '')] = el.value;
        applyFilters();
        updateURL();
      });
    }
  });
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('search-input').value = '';
      ['status-filter', 'type-filter', 'suburb-filter', 'min-price', 'max-price'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      filterState = { search: '', status: '', type: '', suburb: '', minPrice: '', maxPrice: '' };
      applyFilters();
      updateURL();
    });
  }
}

// Apply filters
function applyFilters() {
  const container = document.getElementById('properties-grid') || document.getElementById('property-list');
  if (!container) return;
  const cards = container.querySelectorAll('.property-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const address = (card.querySelector('[data-address]') || card).textContent.toLowerCase();
    const suburb = (card.querySelector('[data-suburb]') || card).textContent.toLowerCase();
    const status = card.dataset.status || '';
    const type = card.dataset.type || '';
    const price = parseFloat(card.dataset.price) || 0;
    
    const matchSearch = !filterState.search || address.includes(filterState.search) || suburb.includes(filterState.search);
    const matchStatus = !filterState.status || status === filterState.status;
    const matchType = !filterState.type || type === filterState.type;
    const matchSuburb = !filterState.suburb || suburb.includes(filterState.suburb.toLowerCase());
    const matchMin = !filterState.minPrice || price >= parseFloat(filterState.minPrice);
    const matchMax = !filterState.maxPrice || price <= parseFloat(filterState.maxPrice);
    
    const show = matchSearch && matchStatus && matchType && matchSuburb && matchMin && matchMax;
    card.style.display = show ? 'block' : 'none';
    if (show) visibleCount++;
  });
  updateResultCount(visibleCount, cards.length);
}

// Update result count
function updateResultCount(showing, total) {
  const el = document.getElementById('result-count');
  if (el) el.textContent = showing === total ? `Showing ${total} properties` : `Showing ${showing} of ${total} properties`;
}

// Update URL with filters
function updateURL() {
  const params = new URLSearchParams(filterState);
  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', newURL);
}

// Load filters from URL
function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('search')) {
    const el = document.getElementById('search-input');
    if (el) el.value = params.get('search');
    filterState.search = params.get('search').toLowerCase();
  }
  ['status', 'type', 'suburb', 'minPrice', 'maxPrice'].forEach(key => {
    if (params.has(key)) {
      const el = document.getElementById(key === 'minPrice' ? 'min-price' : key === 'maxPrice' ? 'max-price' : `${key}-filter`);
      if (el) el.value = params.get(key);
      filterState[key] = params.get(key);
    }
  });
  if (Object.values(filterState).some(v => v)) applyFilters();
}

// Sync Now button
function initSyncButton() {
  const btn = document.getElementById('sync-now-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const spinner = btn.querySelector('.spinner');
    const text = btn.querySelector('.status-text') || btn;
    btn.disabled = true;
    if (spinner) spinner.style.display = 'inline';
    if (text) text.textContent = 'Syncing...';
    try {
      await Promise.all([
        fetch('/api/sync/manual', { method: 'POST', credentials: 'include' }),
        fetch('/api/settlements/sync', { method: 'POST', credentials: 'include' })
      ]);
      showToast('Sync completed!', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      if (spinner) spinner.style.display = 'none';
      if (text) text.textContent = 'Sync Now';
    }
  });
}

// Toast notification
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">×</button>`;
  Object.assign(toast.style, { position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', borderRadius: '8px', color: 'white', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: '9999', display: 'flex', gap: '12px', alignItems: 'center' });
  toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
}