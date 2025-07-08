// --- IP Tracer Pro JavaScript (extracted from iptracer.html) ---

// Global state
let currentTheme = 'dark';
let pingInterval = null;
let tracerouteInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  // handleURLRouting(); // Remove this line, function not defined
});

function initializeApp() {
  fetchCurrentIP();
  // Delay setupEventListeners to ensure DOM is fully ready
  setTimeout(() => {
    setupEventListeners();
  }, 100);
}

// Theme management
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  const icon = document.querySelector('.theme-toggle i');
  icon.className = currentTheme === 'dark' ? 'bi bi-moon-stars' : 'bi bi-sun';
}

// Tool panel management
function toggleTool(toolName) {
  const content = document.getElementById(`${toolName}-content`);
  const icon = document.getElementById(`${toolName}-icon`);
  if (content.classList.contains('active')) {
    content.classList.remove('active');
    icon.className = 'bi bi-chevron-down';
    content.style.maxHeight = '0';
    content.style.padding = '0 1rem';
  } else {
    content.classList.add('active');
    icon.className = 'bi bi-chevron-up';
    content.style.maxHeight = '300px';
    content.style.padding = '1rem';
  }
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
    showToast('IP Lookup Error: ' + error.message, 'error');
  }
}

// DNS Lookup functionality
async function performDNSLookup() {
  const input = document.getElementById('dns-input').value.trim();
  const output = document.getElementById('dns-output');
  if (!input) {
    showToast('Please enter a domain name', 'error');
    return;
  }
  output.innerHTML = '<div class="loading"><i class="bi bi-arrow-clockwise spinner"></i> Looking up DNS...</div>';
  try {
    // Query A, AAAA, and CNAME records
    const types = ['A', 'AAAA', 'CNAME'];
    let results = '';
    for (const type of types) {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(input)}&type=${type}`);
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) {
        results += `<div style="margin-bottom:0.5rem;"><b>${type} Records:</b><ul style="margin:0; padding-left:1.2em;">`;
        for (const ans of data.Answer) {
          results += `<li>${ans.data}</li>`;
        }
        results += '</ul></div>';
      }
    }
    if (!results) {
      results = '<div class="status error">No DNS records found for this domain.</div>';
    }
    output.innerHTML = results;
  } catch (error) {
    output.innerHTML = '<div class="status error">Error fetching DNS records. Please try again later.</div>';
  }
}

// Hash Generator
function performHashGeneration() {
  const input = document.getElementById('hash-input').value;
  const output = document.getElementById('hash-output');
  if (!input) {
    output.innerHTML = '<div class="status error">Please enter text to hash.</div>';
    return;
  }
  // SHA-256
  window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(buf => {
    const hashArray = Array.from(new Uint8Array(buf));
    const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    output.innerHTML = `<b>SHA-256:</b> <span style='word-break:break-all;'>${sha256}</span>`;
  });
}

// Base64 Encode/Decode
function performBase64Encode() {
  const input = document.getElementById('base64-input').value;
  const output = document.getElementById('base64-output');
  try {
    output.innerHTML = `<b>Encoded:</b> <span style='word-break:break-all;'>${btoa(input)}</span>`;
  } catch (e) {
    output.innerHTML = '<div class="status error">Invalid input for Base64 encoding.</div>';
  }
}
function performBase64Decode() {
  const input = document.getElementById('base64-input').value;
  const output = document.getElementById('base64-output');
  try {
    output.innerHTML = `<b>Decoded:</b> <span style='word-break:break-all;'>${atob(input)}</span>`;
  } catch (e) {
    output.innerHTML = '<div class="status error">Invalid Base64 string.</div>';
  }
}

// URL Parser
function performURLParsing() {
  const input = document.getElementById('urlparser-input').value;
  const output = document.getElementById('urlparser-output');
  try {
    const url = new URL(input);
    output.innerHTML = `<b>Protocol:</b> ${url.protocol}<br><b>Host:</b> ${url.host}<br><b>Path:</b> ${url.pathname}<br><b>Query:</b> ${url.search}<br><b>Fragment:</b> ${url.hash}`;
  } catch (e) {
    output.innerHTML = '<div class="status error">Invalid URL.</div>';
  }
}

// MAC Lookup (using macaddress.io public API)
async function performMACLookup() {
  const input = document.getElementById('mac-input').value.trim();
  const output = document.getElementById('mac-output');
  if (!input) {
    output.innerHTML = '<div class="status error">Please enter a MAC address.</div>';
    return;
  }
  output.innerHTML = '<div class="loading"><i class="bi bi-arrow-clockwise spinner"></i> Looking up MAC...</div>';
  try {
    // Use macaddress.io public API (demo, limited)
    const res = await fetch(`https://api.macaddress.io/v1?output=json&search=${encodeURIComponent(input)}`);
    const data = await res.json();
    if (data.vendorDetails && data.vendorDetails.companyName) {
      output.innerHTML = `<b>Vendor:</b> ${data.vendorDetails.companyName}`;
    } else {
      output.innerHTML = '<div class="status error">No vendor found for this MAC address.</div>';
    }
  } catch (e) {
    output.innerHTML = '<div class="status error">Error fetching MAC vendor info.</div>';
  }
}

// IP Calculator (CIDR to range)
function performIPCalculation() {
  const input = document.getElementById('ipcalc-input').value.trim();
  const output = document.getElementById('ipcalc-output');
  if (!input) {
    output.innerHTML = '<div class="status error">Please enter a CIDR (e.g., 192.168.1.0/24).</div>';
    return;
  }
  try {
    const [ip, mask] = input.split('/');
    if (!ip || !mask) throw new Error('Invalid CIDR');
    const ipParts = ip.split('.').map(Number);
    if (ipParts.length !== 4) throw new Error('Invalid IP');
    const ipNum = ipParts.reduce((acc, part) => (acc << 8) + part, 0);
    const maskNum = parseInt(mask);
    const hostBits = 32 - maskNum;
    const start = ipNum & (~0 << hostBits);
    const end = start | ((1 << hostBits) - 1);
    const ipFrom = [start >>> 24, (start >> 16) & 255, (start >> 8) & 255, start & 255].join('.');
    const ipTo = [end >>> 24, (end >> 16) & 255, (end >> 8) & 255, end & 255].join('.');
    output.innerHTML = `<b>Range:</b> ${ipFrom} - ${ipTo}<br><b>Total Hosts:</b> ${Math.max(0, (1 << hostBits) - 2)}`;
  } catch (e) {
    output.innerHTML = '<div class="status error">Invalid CIDR notation.</div>';
  }
}

// Time Zone Converter
function performTimeZoneConversion() {
  const from = document.getElementById('timezone-from').value;
  const to = document.getElementById('timezone-to').value;
  const output = document.getElementById('timezone-output');
  const now = new Date();
  try {
    const fromTime = now.toLocaleString('en-US', { timeZone: from });
    const toTime = now.toLocaleString('en-US', { timeZone: to });
    output.innerHTML = `<b>${from}:</b> ${fromTime}<br><b>${to}:</b> ${toTime}`;
  } catch (e) {
    output.innerHTML = '<div class="status error">Invalid time zone selection.</div>';
  }
}

// Utility functions
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast('Copied to clipboard!', 'success');
  });
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

// Add this function to set up event listeners for the form
function setupEventListeners() {
  // IP search form
  const ipSearchForm = document.getElementById('ip-search-form');
  if (ipSearchForm) {
    ipSearchForm.addEventListener('submit', async (e) => {
      try {
        e.preventDefault();
        const ip = document.getElementById('ip-input').value.trim();
        if (!ip) {
          showToast('Please enter an IP address', 'error');
          return;
        }
        const resultsDiv = document.getElementById('search-results');
        resultsDiv.innerHTML = '<div class="loading"><i class="bi bi-arrow-clockwise spinner"></i> Searching...</div>';
        await fetchIPDetails(ip, 'search-results');
      } catch (err) {
        console.error('IP Search Form Error:', err);
        showToast('IP Search Form Error: ' + err.message, 'error');
      }
    });
  }
}
// ... (rest of the code from iptracer.html's <script> tag goes here, unchanged except for transition improvements) ... 