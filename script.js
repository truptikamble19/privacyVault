
"use strict";

/* =====================================================
   PRIVACYVAULT — FRONTEND DEMO APPLICATION
   ===================================================== */

const PLATFORMS = [
  {
    name: "ChatGPT", domain: "chatgpt.com", risk: 72, color: "#36c99a",
    data: ["Conversations", "Uploaded files", "Account information", "Usage data"],
    policy: "Chat history, uploaded content and account information may be processed according to your plan, settings and applicable policies."
  },
  {
    name: "Claude", domain: "claude.ai", risk: 48, color: "#d99a78",
    data: ["Conversations", "Uploaded files", "Account information"],
    policy: "Data handling and retention depend on the service, account type and privacy settings. Review the official privacy controls."
  },
  {
    name: "Gemini", domain: "gemini.google.com", risk: 68, color: "#6797ff",
    data: ["Conversations", "Account information", "Activity data"],
    policy: "Google account activity controls and retention settings influence how Gemini activity is stored and managed."
  },
  {
    name: "Copilot", domain: "copilot.microsoft.com", risk: 61, color: "#8c80ff",
    data: ["Conversations", "Account information", "Usage data"],
    policy: "Data handling can vary between personal and organizational accounts. Check the privacy settings applicable to your account."
  },
  {
    name: "Perplexity", domain: "perplexity.ai", risk: 44, color: "#4bd1d4",
    data: ["Search history", "Conversations", "Account information"],
    policy: "Search and conversation handling depends on account settings and the service's current privacy policy."
  },
  {
    name: "Meta AI", domain: "meta.ai", risk: 79, color: "#6599ff",
    data: ["Interactions", "Profile information", "Usage data"],
    policy: "Data processing may be connected to Meta services and account settings. Consult the official privacy controls for applicable choices."
  },
  {
    name: "Grok", domain: "grok.com", risk: 66, color: "#c4c9da",
    data: ["Prompts", "Conversations", "Account information"],
    policy: "Review the service's current privacy policy and account controls to understand collection, retention and available requests."
  },
  {
    name: "Mistral", domain: "mistral.ai", risk: 38, color: "#ffab65",
    data: ["Conversations", "Account information"],
    policy: "Data retention and processing may differ between consumer products, APIs and organizational offerings."
  }
];

const BREAKDOWN = [
  { label: "Conversations", value: 38, color: "#9b83ff" },
  { label: "Uploaded files", value: 22, color: "#55baff" },
  { label: "Account information", value: 18, color: "#54dfc0" },
  { label: "Usage data", value: 14, color: "#e48bfa" },
  { label: "Other categories", value: 8, color: "#f7bb75" }
];

const STORAGE = {
  requests: "pv_demo_requests_v1",
  checklist: "pv_demo_checklist_v1",
  user: "pv_demo_user_v1"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let requests = [];
let currentUser = null;
let selectedPlatform = null;
let searchQuery = "";
let toastTimer = null;

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    toast("Browser storage is unavailable. Changes may not persist.");
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function riskColor(value) {
  if (value >= 70) return "#ff8b9e";
  if (value >= 45) return "#ffcb81";
  return "#54dfc0";
}

function riskLevel(value) {
  if (value >= 70) return "High";
  if (value >= 45) return "Medium";
  return "Low";
}

function toast(message) {
  const region = $("#toastRegion");
  const item = document.createElement("div");
  item.className = "toast";
  item.textContent = message;
  region.appendChild(item);

  setTimeout(() => item.remove(), 3400);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";

  const focusTarget = $("input, select, textarea, button", modal);
  if (focusTarget) setTimeout(() => focusTarget.focus(), 50);
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;

  if ($$(".modal-backdrop:not([hidden])").length === 0) {
    document.body.style.overflow = "";
  }
}

function platformByName(name) {
  return PLATFORMS.find(p => p.name === name);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86400000)
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatDate(dateString);
}

function makeId() {
  return "PV-" + Date.now().toString(36).toUpperCase()
    + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}


/* ---------------- BACKEND AUTHENTICATION ---------------- */

function showLoginForm() {
  $("#loginForm").hidden = false;
  $("#registerForm").hidden = true;
  $("#loginError").textContent = "";
  $("#registerError").textContent = "";
  $("#loginError").classList.remove("success-message");
  $("#loginError").classList.add("error");
}

function showRegisterForm() {
  $("#loginForm").hidden = true;
  $("#registerForm").hidden = false;
  $("#loginError").textContent = "";
  $("#registerError").textContent = "";
}

$("#showRegister").addEventListener("click", showRegisterForm);
$("#showLogin").addEventListener("click", showLoginForm);

// Register a new account
$("#registerForm").addEventListener("submit", async event => {
  event.preventDefault();

  const name = $("#registerName").value.trim();
  const email = $("#registerEmail").value.trim();
  const password = $("#registerPassword").value;
  const error = $("#registerError");
  const button = $("#registerForm button[type='submit']");

  error.textContent = "";

  if (!name) {
    error.textContent = "Enter your full name.";
    return;
  }

  if (password.length < 8) {
    error.textContent = "Password must contain at least 8 characters.";
    return;
  }

  button.disabled = true;
  button.textContent = "Creating account...";

  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Registration failed.");
    }

    $("#email").value = email;
    $("#password").value = "";

    showLoginForm();

    $("#loginError").textContent =
      "Account created successfully. Please sign in.";

    $("#loginError").classList.remove("error");
    $("#loginError").classList.add("success-message");

  } catch (err) {
    error.textContent =
      err.message ||
      "Unable to connect. Check that the backend is running.";
  } finally {
    button.disabled = false;
    button.innerHTML = 'Create account <span>↗</span>';
  }
});

// Sign in to an existing account
$("#loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("#email").value.trim();
  const password = $("#password").value;
  const error = $("#loginError");
  const button = $("#loginForm button[type='submit']");

  error.textContent = "";
  error.classList.remove("success-message");
  error.classList.add("error");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.textContent = "Enter a valid email address.";
    return;
  }

  if (password.length < 8) {
    error.textContent = "Password must contain at least 8 characters.";
    return;
  }

  button.disabled = true;
  button.textContent = "Signing in...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.success || !data.token || !data.user) {
      throw new Error(
        data.message || "Sign-in failed. Check your email and password."
      );
    }

    sessionStorage.setItem("pv_auth_token", data.token);
    sessionStorage.setItem(
      "pv_auth_user",
      JSON.stringify(data.user)
    );

    currentUser = data.user;
    showApplication();

  } catch (err) {
    error.textContent =
      err.message ||
      "Unable to connect. Check that the backend is running.";
  } finally {
    button.disabled = false;
    button.innerHTML = 'Sign in <span>↗</span>';
  }
});

// Display the existing dashboard
function showApplication() {
  if (!currentUser) return;

  $("#login").hidden = true;
  $("#app").hidden = false;

  const name = currentUser.name || currentUser.email.split("@")[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  $("#sideName").textContent = displayName;
  $("#topName").textContent = displayName;
  $("#sideAvatar").textContent = displayName.charAt(0).toUpperCase();
  $("#topAvatar").textContent = displayName.charAt(0).toUpperCase();

  initDashboard();
}

// Sign out
$("#logout").addEventListener("click", () => {
  currentUser = null;
  requests = [];

  // Clear the saved login session
  localStorage.removeItem(STORAGE.token);
  localStorage.removeItem(STORAGE.user);

  // Return to the login screen
  $("#app").hidden = true;
  $("#login").hidden = false;
  $("#password").value = "";
  $("#loginError").textContent = "";

  toast("You have logged out successfully.");
});

/* ---------------- NAVIGATION ---------------- */


/* ---------------- NAVIGATION ---------------- */

function showView(viewName) {
  const view = document.getElementById("view-" + viewName);
  if (!view) return;

  $$(".view").forEach(section => {
    section.classList.toggle("active", section === view);
  });

  $$(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  const labels = {
    dashboard: "Overview",
    platforms: "Connected platforms",
    requests: "Privacy requests",
    security: "Security centre",
    guide: "Privacy guide"
  };

  $("#crumb").textContent = labels[viewName] || "Overview";

  if (viewName === "requests") renderRequests();
  if (viewName === "security") renderSecurity();
  if (viewName === "platforms") renderPlatforms();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", event => {
  const navButton = event.target.closest("[data-view]");

  if (navButton) {
    event.preventDefault();
    showView(navButton.dataset.view);
  }

  const closeButton = event.target.closest("[data-close]");

  if (closeButton) {
    closeModal(closeButton.closest(".modal-backdrop"));
  }
});

$$(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop);
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    $$(".modal-backdrop:not([hidden])").forEach(closeModal);
  }
});

$("#helpBtn").addEventListener("click", () => {
  showView("guide");
});

$("#profileBtn").addEventListener("click", () => {
  toast("You are viewing the local demo account.");
});

/* ---------------- PLATFORM ICONS ---------------- */

function platformLogo(platform) {
  const letter = escapeHTML(platform.name.charAt(0));

  return `
    <div class="platform-logo" style="color:${platform.color}">
      <img
        src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(platform.domain)}&sz=64"
        alt=""
        loading="lazy"
        onerror="this.parentElement.textContent='${letter}'"
      >
    </div>
  `;
}

function platformCard(platform) {
  const card = document.createElement("article");
  card.className = "panel platform-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${platform.name} details`);

  card.innerHTML = `
    <div class="platform-card-top">
      ${platformLogo(platform)}
      <span class="status-pill ${platform.risk >= 70 ? "warning" : platform.risk >= 45 ? "neutral" : "success"}">
        ${riskLevel(platform.risk)} risk
      </span>
    </div>
    <h3>${escapeHTML(platform.name)}</h3>
    <p>${platform.data.length} potential data categories</p>
    <div class="progress">
      <span style="width:${platform.risk}%;background:${riskColor(platform.risk)}"></span>
    </div>
    <div class="platform-card-bottom">
      <span>Illustrative risk score</span>
      <strong style="color:${riskColor(platform.risk)}">${platform.risk}/100</strong>
    </div>
  `;

  card.addEventListener("click", () => openPlatform(platform.name));

  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlatform(platform.name);
    }
  });

  return card;
}

/* ---------------- PLATFORM LIST AND DETAILS ---------------- */

function renderPlatforms() {
  const container = $("#allPlatforms");
  const query = ($("#platformSearch").value || "").trim().toLowerCase();
  const filter = $("#riskFilter").value;

  container.replaceChildren();

  const matches = PLATFORMS.filter(platform => {
    const matchesSearch =
      platform.name.toLowerCase().includes(query) ||
      platform.domain.toLowerCase().includes(query) ||
      platform.data.join(" ").toLowerCase().includes(query);

    const level = riskLevel(platform.risk).toLowerCase();
    const matchesRisk = filter === "all" || level === filter;

    return matchesSearch && matchesRisk;
  });

  matches.forEach(platform => container.appendChild(platformCard(platform)));

  if (!matches.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No platforms found</strong>
        Try another name or risk filter.
      </div>
    `;
  }
}

$("#platformSearch").addEventListener("input", renderPlatforms);
$("#riskFilter").addEventListener("change", renderPlatforms);

function openPlatform(name) {
  const platform = platformByName(name);
  if (!platform) return;

  selectedPlatform = platform.name;

  $("#modalLogo").innerHTML = platformLogo(platform);
  $("#modalLogo").style.color = platform.color;
  $("#modalTitle").textContent = platform.name;
  $("#modalDomain").textContent = platform.domain;
  $("#modalRisk").textContent = `${platform.risk}/100`;
  $("#modalProgress").style.width = `${platform.risk}%`;
  $("#modalProgress").style.background = riskColor(platform.risk);
  $("#modalPolicy").textContent = platform.policy;

  $("#modalData").replaceChildren();

  platform.data.forEach(item => {
    const tag = document.createElement("span");
    tag.textContent = item;
    $("#modalData").appendChild(tag);
  });

  $("#platformLink").href = "https://" + platform.domain;
  openModal("platformModal");
}

$("#modalRequest").addEventListener("click", () => {
  closeModal($("#platformModal"));
  openRequestForm(selectedPlatform);
});

/* ---------------- REQUEST MANAGEMENT ---------------- */

function loadRequests() {
  const stored = readStorage(STORAGE.requests, null);

  if (Array.isArray(stored)) {
    requests = stored.filter(request =>
      request &&
      typeof request.id === "string" &&
      platformByName(request.platform) &&
      ["Access", "Correction", "Deletion"].includes(request.type) &&
      ["Pending", "Review", "Completed"].includes(request.status)
    );
    return;
  }

  // Initial sample records make the dashboard feel populated.
  const now = Date.now();

  requests = [
    {
      id: "PV-DEMO-01",
      platform: "ChatGPT",
      type: "Access",
      status: "Pending",
      createdAt: new Date(now - 2 * 86400000).toISOString(),
      notes: "Demo request — not submitted to the platform."
    },
    {
      id: "PV-DEMO-02",
      platform: "Gemini",
      type: "Deletion",
      status: "Review",
      createdAt: new Date(now - 86400000).toISOString(),
      notes: "Demo request — not submitted to the platform."
    }
  ];

  saveRequests();
}

function saveRequests() {
  saveStorage(STORAGE.requests, requests);
}

function openRequestForm(platformName = "") {
  const select = $("#requestPlatform");
  select.replaceChildren();

  PLATFORMS.forEach(platform => {
    const option = document.createElement("option");
    option.value = platform.name;
    option.textContent = platform.name;
    select.appendChild(option);
  });

  if (platformByName(platformName)) {
    select.value = platformName;
  }

  $("#requestType").value = "Access";
  $("#requestNotes").value = "";
  $("#requestError").textContent = "";

  openModal("requestModal");
}

$("#newRequestBtn").addEventListener("click", () => openRequestForm());

$("#requestForm").addEventListener("submit", event => {
  event.preventDefault();

  const platform = $("#requestPlatform").value;
  const type = $("#requestType").value;
  const notes = $("#requestNotes").value.trim();
  const error = $("#requestError");

  if (!platformByName(platform)) {
    error.textContent = "Select a valid platform.";
    return;
  }

  if (!["Access", "Correction", "Deletion"].includes(type)) {
    error.textContent = "Select a valid request type.";
    return;
  }

  const request = {
    id: makeId(),
    platform,
    type,
    status: "Pending",
    createdAt: new Date().toISOString(),
    notes
  };

  requests.unshift(request);
  saveRequests();
  renderAll();

  closeModal($("#requestModal"));
  showView("requests");
  toast("Demo request created successfully.");
});

function renderRequests() {
  const container = $("#requestList");
  const filter = $("#requestFilter").value;

  const filtered = requests.filter(request =>
    filter === "all" || request.status === filter
  );

  $("#statTotal").textContent = requests.length;
  $("#statActive").textContent = requests.filter(
    request => request.status !== "Completed"
  ).length;
  $("#statDone").textContent = requests.filter(
    request => request.status === "Completed"
  ).length;

  container.replaceChildren();

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No requests here yet</strong>
        Create a request to start tracking your privacy workflow.
      </div>
    `;
    return;
  }

  const header = document.createElement("div");
  header.className = "request-item header-row";
  header.innerHTML = `
    <span>Request</span>
    <span>Created</span>
    <span>Status</span>
    <span>Actions</span>
  `;
  container.appendChild(header);

  filtered.forEach(request => {
    const row = document.createElement("div");
    row.className = "request-item";

    const platform = platformByName(request.platform);

    const identity = document.createElement("div");
    identity.innerHTML = `
      <strong>${escapeHTML(request.type)} request</strong>
      <small>${escapeHTML(request.platform)} · ${escapeHTML(request.id)}</small>
    `;

    const date = document.createElement("div");
    date.innerHTML = `
      <strong>${escapeHTML(timeAgo(request.createdAt))}</strong>
      <small>${escapeHTML(formatDate(request.createdAt))}</small>
    `;

    const status = document.createElement("div");
    const statusSelect = document.createElement("select");
    statusSelect.className = "status-select";
    statusSelect.setAttribute("aria-label", `Status for ${request.id}`);

    ["Pending", "Review", "Completed"].forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === request.status;
      statusSelect.appendChild(option);
    });

    statusSelect.addEventListener("change", () => {
      const found = requests.find(item => item.id === request.id);
      if (!found) return;

      found.status = statusSelect.value;
      saveRequests();
      renderAll();
      toast("Demo request status updated.");
    });

    status.appendChild(statusSelect);

    const actions = document.createElement("div");
    actions.className = "request-actions";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Remove";
    deleteButton.setAttribute("aria-label", `Remove ${request.id}`);

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Remove demo request ${request.id} from this browser?`)) {
        return;
      }

      requests = requests.filter(item => item.id !== request.id);
      saveRequests();
      renderAll();
      toast("Demo request removed.");
    });

    actions.appendChild(deleteButton);

    row.append(identity, date, status, actions);
    container.appendChild(row);
  });
}

$("#requestFilter").addEventListener("change", renderRequests);

/* ---------------- DASHBOARD METRICS ---------------- */

function getCounts() {
  return {
    active: requests.filter(r => r.status !== "Completed").length,
    completed: requests.filter(r => r.status === "Completed").length,
    total: requests.length
  };
}

function getRiskScore() {
  // Illustrative weighted average of predefined sample risk scores.
  return Math.round(
    PLATFORMS.reduce((sum, platform) => sum + platform.risk, 0) /
    PLATFORMS.length
  );
}

function renderMetrics() {
  const counts = getCounts();
  const score = getRiskScore();

  $("#score").textContent = score;
  $("#gaugeScore").textContent = score;
  $("#securityScore").textContent = score;
  $("#riskFootValue").textContent = `${score} / 100`;
  $("#platformCount").textContent = PLATFORMS.length;
  $("#platformBadge").textContent = PLATFORMS.length;
  $("#activeCount").textContent = counts.active;
  $("#completedCount").textContent = counts.completed;
  $("#requestBadge").textContent = counts.active;

  $("#scoreRing").style.background =
    `conic-gradient(#fff ${score}%, #ffffff32 ${score}% 100%)`;

  $("#gaugeArc").style.strokeDasharray = `${score} 100`;
  $("#gaugeArc").style.stroke = riskColor(score);

  const level = riskLevel(score);
  $("#riskLabel").textContent = `${level} risk`;
  $("#riskPill").textContent = `${level} risk`;
  $("#riskPill").className = "status-pill " +
    (score >= 70 ? "warning" : score >= 45 ? "neutral" : "success");

  $("#riskHeading").textContent =
    score >= 70 ? "Review your privacy settings" :
    score >= 45 ? "Stay aware of your footprint" :
    "Maintain good privacy habits";

  $("#riskDescription").textContent =
    "This score summarizes illustrative platform risk ratings. It does not measure your real accounts or security.";

  $("#securityText").textContent =
    "Illustrative score based on the sample platform ratings in this demo.";

  $("#securityProgress").style.width = `${score}%`;
  $("#securityProgress").style.background = riskColor(score);
}

/* ---------------- ACTIVITY CHART ---------------- */

function renderActivityChart() {
  const container = $("#activityChart");
  const days = Number($("#chartRange").value) || 7;

  container.replaceChildren();

  const points = Array.from({ length: days }, (_, index) => {
    const created = requests.filter(request => {
      const age = (Date.now() - new Date(request.createdAt).getTime()) /
        86400000;
      return Math.floor(age) === days - index - 1;
    }).length;

    const completed = requests.filter(request => {
      const age = (Date.now() - new Date(request.createdAt).getTime()) /
        86400000;
      return Math.floor(age) === days - index - 1 &&
        request.status === "Completed";
    }).length;

    return { created, completed };
  });

  const maximum = Math.max(4, ...points.map(p => p.created));

  points.forEach((point, index) => {
    const column = document.createElement("div");
    column.className = "chart-column";

    const created = document.createElement("div");
    created.className = "chart-bar created";
    created.style.height = `${Math.max(3, point.created / maximum * 100)}%`;
    created.title = `${point.created} request(s) created`;

    const completed = document.createElement("div");
    completed.className = "chart-bar completed";
    completed.style.height = `${Math.max(3, point.completed / maximum * 100)}%`;
    completed.title = `${point.completed} completed request(s)`;

    column.append(created, completed);
    container.appendChild(column);
  });
}

$("#chartRange").addEventListener("change", renderActivityChart);

/* ---------------- EXPOSURE BREAKDOWN ---------------- */

function renderBreakdown() {
  const container = $("#breakdownList");
  container.replaceChildren();

  BREAKDOWN.forEach(item => {
    const row = document.createElement("div");
    row.className = "breakdown-row";

    row.innerHTML = `
      <span>${escapeHTML(item.label)}</span>
      <span>${item.value}%</span>
      <div class="bar-track">
        <span style="width:${item.value}%;background:${item.color}"></span>
      </div>
    `;

    container.appendChild(row);
  });
}

/* ---------------- HIGHEST RISK PLATFORMS ---------------- */

function renderTopPlatforms() {
  const container = $("#topPlatforms");
  container.replaceChildren();

  [...PLATFORMS]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 4)
    .forEach(platform => {
      const row = document.createElement("div");
      row.className = "top-platform-row";

      row.innerHTML = `
        ${platformLogo(platform)}
        <div class="top-platform-info">
          <strong>${escapeHTML(platform.name)}</strong>
          <small>${riskLevel(platform.risk)} illustrative risk</small>
        </div>
        <span class="top-risk" style="color:${riskColor(platform.risk)}">
          ${platform.risk}
        </span>
      `;

      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", `View ${platform.name}`);

      row.addEventListener("click", () => openPlatform(platform.name));
      row.addEventListener("keydown", event => {
        if (event.key === "Enter") openPlatform(platform.name);
      });

      container.appendChild(row);
    });
}

/* ---------------- RECENT REQUESTS ---------------- */

function renderRecentRequests() {
  const container = $("#recentRequests");
  container.replaceChildren();

  requests.slice(0, 4).forEach(request => {
    const row = document.createElement("div");
    row.className = "recent-row";

    const symbol = request.type === "Deletion" ? "×" :
      request.type === "Correction" ? "✎" : "↗";

    row.innerHTML = `
      <span class="request-type-icon">${symbol}</span>
      <div class="recent-info">
        <strong>${escapeHTML(request.platform)} · ${escapeHTML(request.type)}</strong>
        <small>${escapeHTML(timeAgo(request.createdAt))}</small>
      </div>
      <span class="status-pill ${request.status === "Completed" ? "success" : request.status === "Review" ? "neutral" : "warning"}">
        ${escapeHTML(request.status)}
      </span>
    `;

    container.appendChild(row);
  });

  if (!requests.length) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No activity yet</strong>
        Your created requests will appear here.
      </div>
    `;
  }
}

/* ---------------- SECURITY CENTRE ---------------- */

function renderSecurity() {
  const container = $("#securityPlatforms");
  container.replaceChildren();

  [...PLATFORMS]
    .sort((a, b) => b.risk - a.risk)
    .forEach(platform => {
      const row = document.createElement("div");
      row.className = "security-platform-row";

      row.innerHTML = `
        <span>${escapeHTML(platform.name)}</span>
        <div class="progress">
          <span style="width:${platform.risk}%;background:${riskColor(platform.risk)}"></span>
        </div>
        <strong>${platform.risk}</strong>
      `;

      container.appendChild(row);
    });

  const saved = readStorage(STORAGE.checklist, {});

  $$("[data-check]").forEach(checkbox => {
    checkbox.checked = Boolean(saved[checkbox.dataset.check]);
  });
}

$$("[data-check]").forEach(checkbox => {
  checkbox.addEventListener("change", () => {
    const saved = readStorage(STORAGE.checklist, {});
    saved[checkbox.dataset.check] = checkbox.checked;
    saveStorage(STORAGE.checklist, saved);

    toast(checkbox.checked
      ? "Checklist item marked complete."
      : "Checklist item marked incomplete.");
  });
});

/* ---------------- GLOBAL SEARCH ---------------- */

$("#globalSearch").addEventListener("keydown", event => {
  if (event.key !== "Enter") return;

  searchQuery = event.target.value.trim();

  if (!searchQuery) {
    toast("Enter a platform or request name to search.");
    return;
  }

  const query = searchQuery.toLowerCase();

  const platformMatch = PLATFORMS.find(platform =>
    platform.name.toLowerCase().includes(query) ||
    platform.domain.toLowerCase().includes(query)
  );

  if (platformMatch) {
    showView("platforms");
    $("#platformSearch").value = searchQuery;
    renderPlatforms();
    return;
  }

  const requestMatch = requests.some(request =>
    request.platform.toLowerCase().includes(query) ||
    request.type.toLowerCase().includes(query) ||
    request.status.toLowerCase().includes(query) ||
    request.id.toLowerCase().includes(query)
  );

  if (requestMatch) {
    showView("requests");
    $("#requestFilter").value = "all";

    const container = $("#requestList");
    renderRequests();

    // Highlight matching rows for easier discovery.
    $$(".request-item:not(.header-row)", container).forEach(row => {
      if (row.textContent.toLowerCase().includes(query)) {
        row.style.background = "#9a83ff12";
        row.style.borderRadius = "8px";
      }
    });

    return;
  }

  const pageNames = {
    dashboard: ["overview", "dashboard"],
    security: ["security", "risk", "protection"],
    guide: ["guide", "help", "education"],
    requests: ["request", "access", "correction", "deletion"]
  };

  for (const [page, terms] of Object.entries(pageNames)) {
    if (terms.some(term => term.includes(query) || query.includes(term))) {
      showView(page);
      return;
    }
  }

  toast("No matching platform, request or page was found.");
});

/* ---------------- APP INITIALIZATION ---------------- */

function renderAll() {
  renderMetrics();
  renderActivityChart();
  renderBreakdown();
  renderTopPlatforms();
  renderRecentRequests();
  renderRequests();
  renderPlatforms();
  renderSecurity();
}

function initDashboard() {
  loadRequests();

  $("#platformBadge").textContent = PLATFORMS.length;

  renderAll();
}

(function start() {
  const storedUser = readStorage(STORAGE.user, null);

  if (storedUser && typeof storedUser.email === "string") {
    currentUser = storedUser;
    showApplication();
  } else {
    $("#login").hidden = false;
    $("#app").hidden = true;
  }
})();

const logoutButton = document.getElementById("logout");

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("pv_demo_user_v1");
    localStorage.removeItem("token");
    window.location.reload();
  });
}
