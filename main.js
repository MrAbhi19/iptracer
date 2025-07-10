// Theme toggling
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('iptracer-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}
(function() {
  const saved = localStorage.getItem('iptracer-theme');
  if (saved === 'dark') document.body.classList.add('dark-mode');
})();

// Copy to clipboard
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  // Try to get the IP text node (not the button)
  let text = '';
  if (el.querySelector('span')) {
    text = el.querySelector('span').innerText;
  } else {
    text = el.innerText;
  }
  navigator.clipboard.writeText(text.trim()).then(() => {
    // Feedback (flash icon)
    const btn = el.querySelector('.copy-btn i');
    if (btn) {
      btn.classList.remove('bi-clipboard');
      btn.classList.add('bi-clipboard-check');
      setTimeout(() => {
        btn.classList.remove('bi-clipboard-check');
        btn.classList.add('bi-clipboard');
      }, 1300);
    }
  });
}

// Fetch current IP and show details
async function fetchCurrentIP() {
  const ipSpan = document.querySelector("#current-ip span");
  const detailsDiv = document.getElementById("current-ip-details");
  try {
    ipSpan.textContent = "Loading...";
    detailsDiv.textContent = "";
    // Use a public IP API
    const resp = await fetch('https://ipinfo.io/json?token=demo'); // replace token with production token if available
    if (!resp.ok) throw new Error('Failed to fetch IP');
    const data = await resp.json();
    ipSpan.textContent = data.ip || "Unknown";
    let html = '';
    if (data.city || data.region || data.country) {
      html += `<div>Location: ${[data.city, data.region, data.country].filter(Boolean).join(', ')}</div>`;
    }
    if (data.org) html += `<div>Org: ${data.org}</div>`;
    if (data.loc) html += `<div>Coordinates: ${data.loc}</div>`;
    detailsDiv.innerHTML = html;
  } catch (e) {
    ipSpan.textContent = "Error loading IP";
    detailsDiv.textContent = "";
  }
}

// IP lookup form
document.getElementById("ip-search-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const input = document.getElementById("ip-input");
  const ip = input.value.trim();
  const resultDiv = document.getElementById("search-results");
  if (!ip) {
    resultDiv.textContent = "Please enter an IP address.";
    return;
  }
  resultDiv.textContent = "Looking up...";
  try {
    // Use a public IP geolocation API (fallback: ip-api.com)
    const resp = await fetch(`https://ip-api.io/json/${encodeURIComponent(ip)}`);
    if (!resp.ok) throw new Error('Not found');
    const data = await resp.json();
    if (!data.ip && !data.country_name && !data.city) {
      resultDiv.textContent = "No data found for this IP.";
      return;
    }
    resultDiv.innerHTML = `
      <div><strong>IP:</strong> ${data.ip || ip}</div>
      ${data.country_name ? `<div><strong>Country:</strong> ${data.country_name}</div>` : ""}
      ${data.region_name ? `<div><strong>Region:</strong> ${data.region_name}</div>` : ""}
      ${data.city ? `<div><strong>City:</strong> ${data.city}</div>` : ""}
      ${data.org ? `<div><strong>Org:</strong> ${data.org}</div>` : ""}
      ${data.latitude && data.longitude ? `<div><strong>Coordinates:</strong> ${data.latitude}, ${data.longitude}</div>` : ""}
    `;
  } catch (error) {
    resultDiv.textContent = "Could not fetch data for this IP.";
  }
});

// On load
window.addEventListener("DOMContentLoaded", () => {
  fetchCurrentIP();
});