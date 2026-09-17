const PLATFORM_COLORS = {
  google: "#4285F4",
  github: "#181717",
  gmail: "#EA4335",
  custom: "#6366F1",
};

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["vaultUrl", "apiToken"], resolve);
  });
}

async function saveConfig(vaultUrl, apiToken) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ vaultUrl, apiToken }, resolve);
  });
}

function getAccountLabel(cred) {
  if (cred.credential_type === "email_password") return cred.email || "—";
  return cred.username || cred.email || cred.description || "—";
}

function renderCredentials(credentials, filter = "") {
  const list = document.getElementById("credentialList");
  const term = filter.toLowerCase();

  const filtered = credentials.filter((c) => {
    if (!term) return true;
    const haystack = [
      c.platform,
      c.username,
      c.email,
      c.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty">No credentials found</div>';
    return;
  }

  list.innerHTML = filtered
    .map((cred) => {
      const color = PLATFORM_COLORS[cred.platform] || PLATFORM_COLORS.custom;
      const initial = (cred.platform || "C")[0].toUpperCase();
      return `
        <div class="cred-item" data-id="${cred.id}">
          <div class="cred-icon" style="background:${color}22;color:${color}">${initial}</div>
          <div class="cred-info">
            <div class="name">${cred.platform}</div>
            <div class="account">${getAccountLabel(cred)}</div>
          </div>
          <button class="copy-btn" data-password="${encodeURIComponent(cred.password)}">Copy</button>
        </div>
      `;
    })
    .join("");

  list.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const password = decodeURIComponent(btn.dataset.password);
      navigator.clipboard.writeText(password);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
  });
}

async function fetchCredentials(vaultUrl, apiToken) {
  const res = await fetch(`${vaultUrl}/api/credentials`, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.credentials;
}

async function init() {
  const status = document.getElementById("status");
  const setup = document.getElementById("setup");
  const searchBar = document.getElementById("searchBar");
  const refreshBtn = document.getElementById("refreshBtn");
  const config = await getConfig();

  document.getElementById("openVault").addEventListener("click", () => {
    const url = config.vaultUrl || "http://localhost:3000";
    chrome.tabs.create({ url });
  });

  if (!config.vaultUrl || !config.apiToken) {
    status.textContent = "Not connected";
    setup.classList.remove("hidden");

    document.getElementById("saveConfig").addEventListener("click", async () => {
      const vaultUrl = document.getElementById("vaultUrl").value.replace(/\/$/, "");
      const apiToken = document.getElementById("apiToken").value.trim();
      if (!vaultUrl || !apiToken) return;
      await saveConfig(vaultUrl, apiToken);
      location.reload();
    });
    return;
  }

  setup.classList.add("hidden");
  searchBar.classList.remove("hidden");
  refreshBtn.classList.remove("hidden");
  status.textContent = "Connected";

  let credentials = [];

  async function load() {
    status.textContent = "Loading...";
    try {
      credentials = await fetchCredentials(config.vaultUrl, config.apiToken);
      renderCredentials(credentials);
      status.textContent = `${credentials.length} credentials`;
    } catch {
      status.textContent = "Connection failed";
      document.getElementById("credentialList").innerHTML =
        '<div class="empty">Could not connect. Check settings.</div>';
    }
  }

  document.getElementById("searchInput").addEventListener("input", (e) => {
    renderCredentials(credentials, e.target.value);
  });

  refreshBtn.addEventListener("click", load);
  await load();
}

init();
