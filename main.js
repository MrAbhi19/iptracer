// --- IP Tracer Pro JavaScript (cleaned) ---

// Global state
let currentTheme = 'dark';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  fetchCurrentIP();
  // Add event listener for IP search form
  const ipSearchForm = document.getElementById('ip-search-form');
  if (ipSearchForm) {
    ipSearchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ip = document.getElementById('ip-input').value.trim();
      if (!ip) {
        document.getElementById('search-results').innerHTML = '<div class="status error">Please enter an IP address.</div>';
        return;
      }
      const resultsDiv = document.getElementById('search-results');
      resultsDiv.innerHTML = '<div class="loading"><i class="bi bi-arrow-clockwise spinner"></i> Searching...</div>';
      await fetchIPDetails(ip, 'search-results');
    });
  }
});

// Theme management
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  const icon = document.querySelector('.theme-toggle i');
  icon.className = currentTheme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun';
}

// Current IP functionality
async function fetchCurrentIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const ipElement = document.getElementById('current-ip');
    ipElement.innerHTML = `
      <span>${data.ip}</span>
      <button class="copy-btn" onclick="copyToClipboard('${data.ip}')" title="Copy IP">
        <i class="bi bi-clipboard"></i>
      </button>
    `;
    await fetchIPDetails(data.ip, 'current-ip-details');
  } catch (error) {
    document.getElementById('current-ip').innerHTML = `
      <span>Unable to fetch IP</span>
      <span class="status error">Error</span>
    `;
  }
}

// IP lookup functionality
async function fetchIPDetails(ip, targetId) {
  const target = document.getElementById(targetId);
  target.innerHTML = '<div class="loading"><i class="bi bi-arrow-clockwise spinner"></i> Loading details...</div>';
  try {
    // Use ipwho.is API (HTTPS, no key required)
    const response = await fetch(`https://ipwho.is/${ip}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Lookup failed');
    }
    // Defensive: some fields may be missing
    const city = data.city || 'Unknown';
    const region = data.region || 'Unknown';
    const country = data.country || 'Unknown';
    const isp = data.connection && data.connection.org ? data.connection.org : 'Unknown';
    const timezone = data.timezone && data.timezone.id ? data.timezone.id : 'Unknown';
    const lat = data.latitude !== undefined ? data.latitude : 'Unknown';
    const lon = data.longitude !== undefined ? data.longitude : 'Unknown';
    const details = `
      <div class="results-grid">
        <div class="info-item">
          <div class="info-icon"><i class="bi bi-geo-alt"></i></div>
          <div class="info-label">Location</div>
          <div class="info-value">${city}, ${region}</div>
        </div>
        <div class="info-item">
          <div class="info-icon"><i class="bi bi-globe"></i></div>
          <div class="info-label">Country</div>
          <div class="info-value">${country}</div>
        </div>
        <div class="info-item">
          <div class="info-icon"><i class="bi bi-building"></i></div>
          <div class="info-label">ISP</div>
          <div class="info-value">${isp}</div>
        </div>
        <div class="info-item">
          <div class="info-icon"><i class="bi bi-clock"></i></div>
          <div class="info-label">Timezone</div>
          <div class="info-value">${timezone}</div>
        </div>
        <div class="info-item">
          <div class="info-icon"><i class="bi bi-globe2"></i></div>
          <div class="info-label">Latitude/Longitude</div>
          <div class="info-value">${lat}, ${lon}</div>
        </div>
      </div>
      <div style="margin-top:1rem; text-align:center;">
        <div style="font-size:1rem; color:var(--text-secondary); margin-bottom:0.5rem;">Geolocation Preview</div>
        ${(lat !== 'Unknown' && lon !== 'Unknown') ? `<iframe width="100%" height="220" frameborder="0" style="border-radius:12px; border:1px solid var(--border-light);" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05},${lat-0.05},${lon+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lon}"></iframe>` : '<div style="color:var(--error);">No map preview available</div>'}
      </div>
    `;
    target.innerHTML = details;
  } catch (error) {
    console.error('IP Lookup Error:', error);
    target.innerHTML = '<div class="status error">Error fetching IP details. This may be due to API limits or network issues.</div>';
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
} 