import { CloudflareEnv } from "../types";
import { getCorsHeaders } from "../utils/cors";

export async function generateAccessDeniedPage(_request: Request, _env: CloudflareEnv): Promise<Response> {
  try {
    const cssContent = `:root {
  /* Design Tokens - Colors */
  --color-primary: #3b82f6;
  --color-primary-rgb: 59, 130, 246;
  --color-primary-hover: #2563eb;
  --color-primary-active: #1d4ed8;
  --color-primary-focus: #3b82f6;

  /* Neutral Colors */
  --color-neutral-50: #f8fafc;
  --color-neutral-100: #f1f5f9;
  --color-neutral-200: #e2e8f0;
  --color-neutral-300: #cbd5e1;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #64748b;
  --color-neutral-600: #475569;
  --color-neutral-700: #334155;
  --color-neutral-800: #1e293b;
  --color-neutral-900: #0f172a;

  /* Dark Mode Colors */
  --color-dark-bg: #0f172a;
  --color-dark-surface: #1e293b;
  --color-dark-border: #334155;
  --color-dark-text: #f1f5f9;
  --color-dark-text-muted: #94a3b8;

  /* Semantic Colors */
  --color-success: #059669;
  --color-success-bg: #d1fae5;
  --color-success-hover: #047857;
  --color-error: #dc2626;
  --color-error-bg: #fee2e2;
  --color-error-hover: #b91c1c;
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;
  --color-warning-hover: #b45309;
  --color-info: #0284c7;
  --color-info-bg: #dbeafe;
  --color-info-hover: #0369a1;

  /* Component State Colors */
  --color-interactive-default: var(--color-neutral-100);
  --color-interactive-hover: var(--color-neutral-200);
  --color-interactive-active: var(--color-neutral-300);
  --color-interactive-disabled: var(--color-neutral-50);
  --color-focus-ring: rgba(59, 130, 246, 0.3);

  /* Typography Scale */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;

  /* Font Weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Spacing System (8px base) */
  --space-1: 4px;   /* 0.5 * base */
  --space-2: 8px;   /* 1 * base */
  --space-3: 12px;  /* 1.5 * base */
  --space-4: 16px;  /* 2 * base */
  --space-5: 20px;  /* 2.5 * base */
  --space-6: 24px;  /* 3 * base */
  --space-8: 32px;  /* 4 * base */
  --space-10: 40px; /* 5 * base */
  --space-12: 48px; /* 6 * base */

  /* Border Radii */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 50%;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;

  /* Focus States */
  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
}

/* Dark Mode Support */
[data-theme="dark"] {
  --color-neutral-50: #1e293b;
  --color-neutral-100: #334155;
  --color-neutral-200: #475569;
  --color-neutral-300: #64748b;
  --color-neutral-400: #94a3b8;
  --color-neutral-500: #cbd5e1;
  --color-neutral-600: #e2e8f0;
  --color-neutral-700: #f1f5f9;
  --color-neutral-800: #f8fafc;
  --color-neutral-900: #ffffff;

  --color-interactive-default: var(--color-dark-surface);
  --color-interactive-hover: var(--color-dark-border);
  --color-interactive-active: var(--color-neutral-600);
  --color-interactive-disabled: var(--color-neutral-800);
}

/* Dark Mode Card Overrides */
[data-theme="dark"] .card {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-200);
}

[data-theme="dark"] .card h3 {
  color: var(--color-neutral-900);
}

[data-theme="dark"] .card .field span.label {
  color: var(--color-neutral-400);
}

[data-theme="dark"] .card .field span.value {
  color: var(--color-neutral-300);
}

[data-theme="dark"] .card .field > div {
  border-bottom-color: var(--color-neutral-200);
}

[data-theme="dark"] .card:hover {
  border-color: var(--color-neutral-300);
}

/* Dark Mode Body and Global Overrides */
[data-theme="dark"] body {
  background: linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-neutral-100) 100%);
}

[data-theme="dark"] .header h1 {
  color: var(--color-neutral-900);
}

[data-theme="dark"] .header p {
  color: var(--color-neutral-400);
}

[data-theme="dark"] .loading p {
  color: var(--color-neutral-400);
}

/* Dark Mode Modal Overrides */
[data-theme="dark"] .modal-content {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-200);
}

[data-theme="dark"] .modal h3 {
  color: var(--color-neutral-900);
}

[data-theme="dark"] .modal .field span.label {
  color: var(--color-neutral-400);
}

[data-theme="dark"] .modal .field span.value {
  color: var(--color-neutral-300);
}

[data-theme="dark"] .modal .field > div {
  border-bottom-color: var(--color-neutral-200);
}

[data-theme="dark"] .modal .close-btn {
  color: var(--color-neutral-400);
}

[data-theme="dark"] .modal .close-btn:hover {
  color: var(--color-neutral-900);
  background: var(--color-neutral-200);
}

/* Dark Mode Status and Button Overrides */
[data-theme="dark"] .card .expand-btn {
  background: var(--color-neutral-100);
  color: var(--color-neutral-400);
  border-color: var(--color-neutral-200);
}

[data-theme="dark"] .card .expand-btn:hover {
  background: var(--color-neutral-200);
  color: var(--color-neutral-300);
  border-color: var(--color-neutral-300);
}

[data-theme="dark"] .card .status {
  background: var(--color-success-bg);
  color: var(--color-success);
}

[data-theme="dark"] .card .status.disconnected {
  background: var(--color-neutral-200);
  color: var(--color-neutral-400);
}

[data-theme="dark"] .card .status.non-compliant {
  background: var(--color-error-bg);
  color: var(--color-error);
}

[data-theme="dark"] .card .status.failed {
  background: var(--color-error-bg);
  color: var(--color-error);
}

[data-theme="dark"] .modal .status {
  background: var(--color-success-bg);
  color: var(--color-success);
}

[data-theme="dark"] .modal .status.disconnected {
  background: var(--color-neutral-200);
  color: var(--color-neutral-400);
}

[data-theme="dark"] .modal .status.non-compliant {
  background: var(--color-error-bg);
  color: var(--color-error);
}

/* Dark Mode History Section Overrides */
[data-theme="dark"] .history-card {
  background: var(--color-neutral-50);
  border-color: var(--color-neutral-200);
}

[data-theme="dark"] .history-card h3 {
  color: var(--color-neutral-900);
}

[data-theme="dark"] .history-item {
  border-bottom-color: var(--color-neutral-200);
}

[data-theme="dark"] .history-item .title {
  color: var(--color-neutral-900);
}

[data-theme="dark"] .history-item .details {
  color: var(--color-neutral-500);
}

/* Component State Mixins */
.focus-visible:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
}

*,:after,:before{box-sizing:border-box}

.container{width:100%}
@media (min-width:640px){.container{max-width:640px}}
@media (min-width:768px){.container{max-width:768px}}
@media (min-width:1024px){.container{max-width:1024px}}
@media (min-width:1280px){.container{max-width:1280px}}
@media (min-width:1536px){.container{max-width:1536px}}

body{
  margin:0;
  padding:0;
  font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
  line-height:var(--line-height-relaxed);
  background:linear-gradient(135deg,var(--color-neutral-50) 0%,var(--color-neutral-200) 100%);
  min-height:100vh;
}

.container{
  max-width:1200px;
  margin:0 auto;
  padding:var(--space-8) var(--space-6);
}

.header{
  text-align:center;
  margin-bottom:var(--space-12);
}

.header h1{
  font-size:var(--font-size-3xl);
  line-height:var(--line-height-tight);
  color:var(--color-neutral-900);
  margin-bottom:var(--space-4);
  font-weight:var(--font-weight-bold);
  letter-spacing:-0.025em;
}

.header p{
  font-size:var(--font-size-base);
  line-height:var(--line-height-relaxed);
  color:var(--color-neutral-500);
  max-width:560px;
  margin:0 auto;
}

.loading{
  text-align:center;
  padding:var(--space-12) var(--space-6);
}

.loading .spinner{
  display:inline-block;
  width:var(--space-10);
  height:var(--space-10);
  border:3px solid var(--color-neutral-200);
  border-radius:var(--radius-full);
  border-top-color:var(--color-primary);
  animation:spin 800ms ease-in-out infinite;
}

.loading p{
  margin-top:var(--space-6);
  color:var(--color-neutral-500);
  font-size:var(--font-size-sm);
  line-height:var(--line-height-normal);
}

.content{display:none}

.grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:var(--space-6);
  margin-bottom:var(--space-8);
}

.card{
  background:white;
  border-radius:var(--radius-lg);
  padding:var(--space-6);
  box-shadow:var(--shadow-md);
  border:1px solid var(--color-neutral-200);
  cursor:pointer;
  transition:all var(--transition-normal),border var(--transition-slow),box-shadow var(--transition-slow);
  outline:none;
  position:relative;
}

.card:hover{
  box-shadow:var(--shadow-lg);
  transform:translateY(-1px);
  border-color:var(--color-neutral-300);
}

.card:active{
  transform:translateY(0);
  box-shadow:var(--shadow-md);
}

.card:focus-visible{
  outline:var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset:var(--focus-ring-offset);
  border-color:var(--color-primary);
}

.card h3{
  color:var(--color-neutral-900);
  margin-bottom:var(--space-4);
  font-size:var(--font-size-lg);
  font-weight:var(--font-weight-semibold);
  line-height:var(--line-height-snug);
}

.card .field{
  display:flex;
  flex-direction:column;
  gap:var(--space-3);
}

.card .field > div{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:var(--space-2) 0;
  border-bottom:1px solid var(--color-neutral-100);
}

.card .field > div:last-child{border-bottom:none}

.card .field span.label{
  font-weight:var(--font-weight-medium);
  color:var(--color-neutral-700);
}

.card .field span.value{color:var(--color-neutral-600)}

.card .status{
  background:var(--color-success-bg);
  color:var(--color-success);
  padding:var(--space-1) var(--space-2);
  border-radius:var(--radius-sm);
  font-size:var(--font-size-xs);
  font-weight:var(--font-weight-semibold);
}

.card .status.disconnected{
  background:var(--color-neutral-100);
  color:var(--color-neutral-600);
}

.card .status.non-compliant{
  background:var(--color-error-bg);
  color:var(--color-error);
}

.card .status.failed{
  background:var(--color-error-bg);
  color:var(--color-error);
  padding:var(--space-1) var(--space-3);
  border-radius:var(--radius-md);
}

.card .expand-btn{
  background:var(--color-interactive-default);
  color:var(--color-neutral-600);
  padding:var(--space-1) var(--space-2);
  border-radius:var(--radius-sm);
  font-size:var(--font-size-xs);
  font-weight:var(--font-weight-semibold);
  cursor:pointer;
  border:none;
  outline:none;
  transition:all var(--transition-fast);
  position:relative;
}

.card .expand-btn:hover{
  background:var(--color-interactive-hover);
  transform:scale(1.05);
}

.card .expand-btn:active{
  background:var(--color-interactive-active);
  transform:scale(0.95);
}

.card .expand-btn:focus-visible{
  outline:var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset:var(--focus-ring-offset);
}

.card .expand-btn:disabled{
  background:var(--color-interactive-disabled);
  color:var(--color-neutral-400);
  cursor:not-allowed;
  opacity:0.6;
}

.history-card{
  background:white;
  border-radius:var(--radius-lg);
  padding:var(--space-6);
  box-shadow:var(--shadow-md);
  border:1px solid var(--color-neutral-200);
}

.history-item{
  padding:var(--space-4) 0;
  border-bottom:1px solid var(--color-neutral-200);
}

.history-item:last-child{border-bottom:none}

.history-item .header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:var(--space-4);
  margin-bottom:0;
}

.history-item .title{
  font-weight:var(--font-weight-semibold);
  color:var(--color-neutral-900);
  margin-bottom:var(--space-2);
}

.history-item .details{
  color:var(--color-neutral-600);
  font-size:var(--font-size-sm);
  line-height:var(--line-height-snug);
}

.modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.5);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:50;
  padding:var(--space-5);
}

.modal-content{
  background:white;
  border-radius:var(--radius-lg);
  padding:var(--space-6);
  max-width:500px;
  width:100%;
  max-height:80vh;
  overflow-y:auto;
  box-shadow:var(--shadow-xl);
  border:1px solid var(--color-neutral-200);
}

.modal h3{
  margin-bottom:var(--space-4);
  color:var(--color-neutral-900);
  font-size:var(--font-size-lg);
  font-weight:var(--font-weight-semibold);
}

.modal .close-btn{
  float:right;
  background:none;
  border:none;
  font-size:var(--font-size-2xl);
  color:var(--color-neutral-600);
  cursor:pointer;
  padding:var(--space-1);
  margin:0;
  line-height:1;
  border-radius:var(--radius-sm);
  transition:all var(--transition-fast);
  outline:none;
}

.modal .close-btn:hover{
  color:var(--color-neutral-700);
  background:var(--color-interactive-default);
  transform:scale(1.1);
}

.modal .close-btn:active{
  color:var(--color-neutral-800);
  background:var(--color-interactive-active);
  transform:scale(0.95);
}

.modal .close-btn:focus-visible{
  outline:var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset:var(--focus-ring-offset);
}

.modal .field{
  display:flex;
  flex-direction:column;
  gap:var(--space-3);
}

.modal .field > div{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:var(--space-2) 0;
  border-bottom:1px solid var(--color-neutral-100);
}

.modal .field > div:last-child{border-bottom:none}

.modal .field span.label{
  font-weight:var(--font-weight-medium);
  color:var(--color-neutral-700);
}

.modal .field span.value{color:var(--color-neutral-600)}

.modal .status{
  background:var(--color-success-bg);
  color:var(--color-success);
  padding:var(--space-1) var(--space-2);
  border-radius:var(--radius-sm);
  font-size:var(--font-size-xs);
  font-weight:var(--font-weight-semibold);
}

.modal .status.disconnected{
  background:var(--color-neutral-100);
  color:var(--color-neutral-600);
}

.modal .status.non-compliant{
  background:var(--color-error-bg);
  color:var(--color-error);
}

@keyframes spin{
  0%{transform:rotate(0deg)}
  100%{transform:rotate(360deg)}
}`;

    const jsContent = [
      "window.allComplianceChecks = [];",
      "window.allGroups = [];",
      "window.targetGroup = null;",
      "window.idpDetails = {};",
      "",
      "// Dark mode functionality",
      "function initializeTheme() {",
      "  const savedTheme = localStorage.getItem('theme') || 'light';",
      "  document.documentElement.setAttribute('data-theme', savedTheme);",
      "}",
      "",
      "function toggleTheme() {",
      "  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';",
      "  const newTheme = currentTheme === 'light' ? 'dark' : 'light';",
      "  document.documentElement.setAttribute('data-theme', newTheme);",
      "  localStorage.setItem('theme', newTheme);",
      "  updateThemeButton();",
      "}",
      "",
      "function updateThemeButton() {",
      "  const themeButton = document.getElementById('theme-toggle');",
      "  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';",
      "  if (themeButton) {",
      "    themeButton.textContent = currentTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';",
      "  }",
      "}",
      "",
      "function createAccessDeniedPage() {",
      "  const body = document.body;",
      "  const htmlContent = [",
      "    '<div class=\"container\">',",
      "    '<div class=\"header\">',",
      "    '<div style=\"display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4);\">',",
      "      '<div></div>',",
      "      '<button id=\"theme-toggle\" onclick=\"toggleTheme()\" style=\"background: var(--color-interactive-default); border: 1px solid var(--color-neutral-200); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); cursor: pointer; font-size: var(--font-size-sm); transition: all var(--transition-fast); outline: none;\" onmouseover=\"this.style.background=\\\"var(--color-interactive-hover)\\\"; this.style.transform=\\\"scale(1.05)\\\"\" onmouseout=\"this.style.background=\\\"var(--color-interactive-default)\\\"; this.style.transform=\\\"scale(1)\\\"\" onfocus=\"this.style.outline=\\\"var(--focus-ring-width) solid var(--color-focus-ring)\\\"; this.style.outlineOffset=\\\"var(--focus-ring-offset)\\\"\">🌙 Dark Mode</button>',",
      "    '</div>',",
      "    '<h1>Access Denied</h1>',",
      "    '<p>You do not have permission to access this resource. Here is information about your current session and device status.</p>',",
      "    '</div>',",
      "    '<div id=\"loading\" class=\"loading\">',",
      "    '<div class=\"spinner\"></div>',",
      "    '<p>Loading your identity and device information...</p>',",
      "    '</div>',",
      "    '<div id=\"content\" class=\"content\">',",
      "    '<div class=\"grid\">',",
      "    '<div id=\"user-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '<div id=\"device-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '<div id=\"warp-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '<div id=\"network-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '<div id=\"posture-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '<div id=\"group-info\" class=\"card\" onclick=\"copyTileContent(this)\"></div>',",
      "    '</div>',",
      "    '<div class=\"history-card\">',",
      "    '<h3>Recent Access Attempts</h3>',",
      "    '<div id=\"history-info\"></div>',",
      "    '</div>',",
      "    '</div>',",
      "    '</div>',",
      "    '<div id=\"compliance-modal\" class=\"modal\" style=\"display:none;\" onclick=\"closeModal(event, this)\">',",
      "    '<div class=\"modal-content\" onclick=\"event.stopPropagation()\">',",
      "    '<button class=\"close-btn\" onclick=\"closeModal(event, document.getElementById(\\'compliance-modal\\'))\">×</button>',",
      "    '<h3>⚖️ All Device Compliance Checks</h3>',",
      "    '<div id=\"compliance-modal-content\"></div>',",
      "    '</div>',",
      "    '</div>',",
      "    '<div id=\"group-modal\" class=\"modal\" style=\"display:none;\" onclick=\"closeModal(event, this)\">',",
      "    '<div class=\"modal-content\" onclick=\"event.stopPropagation()\">',",
      "    '<button class=\"close-btn\" onclick=\"closeModal(event, document.getElementById(\\'group-modal\\'))\">×</button>',",
      "    '<h3>👥 All Group Memberships</h3>',",
      "    '<div id=\"group-modal-content\"></div>',",
      "    '</div>',",
      "    '</div>'",
      "  ];",
      "  body.innerHTML = htmlContent.join('');",
      "}",
      "",
      "async function loadUserData() {",
      "  try {",
      "    const [userResponse, historyResponse, envResponse, networkResponse] = await Promise.all([",
      "      fetch('/api/userdetails').catch(() => null),",
      "      fetch('/api/history').catch(() => null),",
      "      fetch('/api/env').catch(() => null),",
      "      fetch('/api/networkinfo').catch(() => null)",
      "    ]);",
      "",
      "    const userData = userResponse ? await userResponse.json() : null;",
      "    const historyData = historyResponse ? await historyResponse.json() : null;",
      "    const envData = envResponse ? await envResponse.json() : null;",
      "    const networkData = networkResponse ? await networkResponse.json() : null;",
      "",
      "    // Load IDP details if available",
      "    if (userData?.identity?.idp?.id) {",
      "      try {",
      "        const idpResponse = await fetch(`/api/idpdetails?id=${userData.identity.idp.id}`);",
      "        if (idpResponse.ok) {",
      "          window.idpDetails = await idpResponse.json();",
      "        }",
      "      } catch (e) {",
      "        console.warn('Failed to load IDP details:', e);",
      "      }",
      "    }",
      "",
      "    displayUserInfo(userData, envData);",
      "    displayDeviceInfo(userData);",
      "    displayWarpInfo(userData, envData);",
      "    displayNetworkInfo(networkData);",
      "    displayPostureInfo(userData);",
      "    displayGroupInfo(userData, envData);",
      "    displayHistory(historyData);",
      "",
      "    document.getElementById('loading').style.display = 'none';",
      "    document.getElementById('content').style.display = 'block';",
      "  } catch (error) {",
      "    document.getElementById('loading').innerHTML = '<div style=\"color: #dc2626; text-align: center; padding: 24px;\"><h3 style=\"font-size: 18px; font-weight: 600; margin-bottom: 8px;\">Loading Error</h3><p style=\"color: #6b7280; font-size: 14px;\">Failed to load information.</p></div>';",
      "  }",
      "}",
      "",
      "function displayUserInfo(userData, envData) {",
      "  const userInfoEl = document.getElementById('user-info');",
      "  const identity = userData?.identity;",
      "  ",
      "  let username = identity?.custom?.username;",
      "  if (!username && identity?.saml_attributes) {",
      "    const samlAttrs = identity.saml_attributes;",
      "    username = username || (Array.isArray(samlAttrs.username) ? samlAttrs.username[0] : samlAttrs.username);",
      "    username = username || (Array.isArray(samlAttrs.Username) ? samlAttrs.Username[0] : samlAttrs.Username);",
      "    username = username || (Array.isArray(samlAttrs.uid) ? samlAttrs.uid[0] : samlAttrs.uid);",
      "    username = username || (Array.isArray(samlAttrs.sAMAccountName) ? samlAttrs.sAMAccountName[0] : samlAttrs.sAMAccountName);",
      "  }",
      "  username = username || identity?.preferred_username || identity?.username || identity?.sub;",
      "  if (!username && identity?.email) {",
      "    username = identity.email;",
      "  }",
      "",
      "  // Format IDP display",
      "  let idpDisplay = identity?.idp?.type || 'Unknown';",
      "  if (window.idpDetails && window.idpDetails.name && window.idpDetails.type) {",
      "    idpDisplay = `${window.idpDetails.name} - ${window.idpDetails.type}`;",
      "  }",
      "",
      "  let userHtml = '<h3>👤 User Information</h3>';",
      "  userHtml += '<div class=\"field\">';",
      "  userHtml += `<div><span class=\"label\">Name:</span> <span class=\"value\">${identity?.name || 'Not available'}</span></div>`;",
      "  userHtml += `<div><span class=\"label\">Email:</span> <span class=\"value\">${identity?.email || 'Not available'}</span></div>`;",
      "  userHtml += `<div><span class=\"label\">Username:</span> <span class=\"value\">${username || 'Not available'}</span></div>`;",
      "  userHtml += `<div><span class=\"label\">IDP Used:</span> <span class=\"value\">${idpDisplay}</span></div>`;",
      "  userHtml += `<div><span class=\"label\">Organization:</span> <span class=\"value\">${envData?.ORGANIZATION_NAME || 'Not available'}</span></div>`;",
      "  userHtml += '</div>';",
      "  ",
      "  userInfoEl.innerHTML = userHtml;",
      "}",
      "",
      "function displayDeviceInfo(userData) {",
      "  const deviceInfoEl = document.getElementById('device-info');",
      "  const device = userData?.device?.result;",
      "  const osDisplayName = detectCurrentOS(userData);",
      "  ",
      "  let deviceHtml = '<h3>💻 Device Information</h3>';",
      "  deviceHtml += '<div class=\"field\">';",
      "  deviceHtml += `<div><span class=\"label\">Model:</span> <span class=\"value\">${device?.model || 'Not available'}</span></div>`;",
      "  deviceHtml += `<div><span class=\"label\">Name:</span> <span class=\"value\">${device?.name || 'Not available'}</span></div>`;",
      "  deviceHtml += `<div><span class=\"label\">OS:</span> <span class=\"value\">${osDisplayName}</span></div>`;",
      "  deviceHtml += `<div><span class=\"label\">Version:</span> <span class=\"value\">${device?.os_version || 'Not available'}</span></div>`;",
      "  deviceHtml += '</div>';",
      "  ",
      "  deviceInfoEl.innerHTML = deviceHtml;",
      "}",
      "",
      "function displayWarpInfo(userData, envData) {",
      "  const warpInfoEl = document.getElementById('warp-info');",
      "  const identity = userData?.identity;",
      "  const warpStatus = identity?.is_warp ? 'Connected' : 'Disconnected';",
      "  const gatewayStatus = identity?.is_gateway ? 'Enabled' : 'Disabled';",
      "  ",
      "  let warpHtml = '<h3>🌐 WARP Status</h3>';",
      "  warpHtml += '<div class=\"field\">';",
      "  warpHtml += `<div><span class=\"label\">WARP:</span> <span class=\"status ${identity?.is_warp ? '' : 'disconnected'}\">${warpStatus}</span></div>`;",
      "  warpHtml += `<div><span class=\"label\">Gateway:</span> <span class=\"status ${identity?.is_gateway ? '' : 'disconnected'}\">${gatewayStatus}</span></div>`;",
      "  warpHtml += '</div>';",
      "  ",
      "  warpInfoEl.innerHTML = warpHtml;",
      "}",
      "",
      "function displayNetworkInfo(networkData) {",
      "  const networkInfoEl = document.getElementById('network-info');",
      "  ",
      "  if (!networkData) {",
      "    networkInfoEl.innerHTML = '<h3>🌐 Network Information</h3><div style=\"color: #6b7280; font-style: italic;\">Unable to load network information</div>';",
      "    return;",
      "  }",
      "  ",
      "  let networkHtml = '<h3>🌐 Network Information</h3>';",
      "  networkHtml += '<div class=\"field\">';",
      "  networkHtml += `<div><span class=\"label\">Public IP:</span> <span class=\"value\" style=\"font-family: monospace;\">${networkData.ip || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">Location:</span> <span class=\"value\">${networkData.city || 'Unknown'}, ${networkData.country || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">Region:</span> <span class=\"value\">${networkData.region || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">ISP:</span> <span class=\"value\">${networkData.isp || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">Browser:</span> <span class=\"value\">${networkData.browser || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">Connection:</span> <span class=\"value\">${networkData.connectionType || 'Unknown'}</span></div>`;",
      "  networkHtml += `<div><span class=\"label\">Edge Location:</span> <span class=\"value\">${networkData.edgeLocation || 'Unknown'}</span></div>`;",
      "  networkHtml += '</div>';",
      "  ",
      "  networkInfoEl.innerHTML = networkHtml;",
      "}",
      "",
      "function displayPostureInfo(userData) {",
      "  const postureInfoEl = document.getElementById('posture-info');",
      "  let posture = userData?.posture?.result || userData?.posture;",
      "  let postureArray = Array.isArray(posture) ? posture : (posture ? Object.values(posture).filter(check => check && typeof check === 'object') : []);",
      "  ",
      "  const currentOS = detectCurrentOS(userData);",
      "  const filteredPosture = filterRelevantPostureChecks(postureArray, currentOS);",
      "  window.allComplianceChecks = filteredPosture;",
      "  ",
      "  if (filteredPosture.length > 0) {",
      "    const passCount = filteredPosture.filter(rule => rule.success).length;",
      "    const totalCount = filteredPosture.length;",
      "    const overallStatus = passCount === totalCount ? 'Compliant' : 'Non-compliant';",
      "    ",
      "    let statusHtml = '<h3>⚖️ Device Compliance</h3>';",
      "    statusHtml += '<div class=\"field\">';",
      "    statusHtml += `<div><span class=\"label\">Overall Status:</span> <span class=\"status ${overallStatus === 'Compliant' ? '' : 'non-compliant'}\">${overallStatus}</span></div>`;",
      "    statusHtml += `<div style=\"color: #6b7280; font-size: 14px; margin: 16px 0;\">${passCount} of ${totalCount} security checks passed</div>`;",
      "    ",
      "    // Show first 6 checks",
      "    const visibleChecks = filteredPosture.slice(0, 6);",
      "    visibleChecks.forEach(rule => {",
      "      const status = rule.success ? 'Compliant' : 'Non-compliant';",
      "      let displayName = rule.rule_name || rule.type || 'Security Check';",
      "      let requirement = '';",
      "      ",
      "      if (rule.input?.version && rule.input?.operator) {",
      "        requirement = ` (${rule.input.operator} ${rule.input.version})`;",
      "      } else if (rule.input?.version) {",
      "        requirement = ` (${rule.input.version})`;",
      "      }",
      "      ",
      "      const fullDisplayName = displayName + requirement;",
      "      statusHtml += `<div><span class=\"label\">${fullDisplayName}:</span> <span class=\"status ${rule.success ? '' : 'non-compliant'}\">${status}</span></div>`;",
      "    });",
      "    ",
      "    if (filteredPosture.length > 6) {",
      "      statusHtml += `<div><span class=\"label\">+${filteredPosture.length - 6} more checks</span> <button class=\"expand-btn\" onclick=\"showComplianceModal(); event.stopPropagation();\">...</button></div>`;",
      "    }",
      "    ",
      "    statusHtml += '</div>';",
      "    postureInfoEl.innerHTML = statusHtml;",
      "  } else {",
      "    postureInfoEl.innerHTML = '<h3>⚖️ Device Compliance</h3><div style=\"color: #6b7280; text-align: center; padding: 24px;\">No compliance information available</div>';",
      "  }",
      "}",
      "",
      "function displayGroupInfo(userData, envData) {",
      "  const groupInfoEl = document.getElementById('group-info');",
      "  const groups = userData?.identity?.groups || [];",
      "  const targetGroup = envData?.TARGET_GROUP;",
      "  window.allGroups = groups;",
      "  window.targetGroup = targetGroup;",
      "  ",
      "  if (groups.length > 0) {",
      "    let groupHtml = '<h3>👥 Group Membership</h3>';",
      "    groupHtml += '<div class=\"field\">';",
      "    ",
      "    // Show first 6 groups",
      "    const visibleGroups = groups.slice(0, 6);",
      "    visibleGroups.forEach(group => {",
      "      const isTargetGroup = group === targetGroup;",
      "      const statusText = isTargetGroup ? 'Primary Group' : 'Member';",
      "      const statusClass = isTargetGroup ? '' : 'disconnected';",
      "      groupHtml += `<div><span class=\"label\">${group}:</span> <span class=\"status ${statusClass}\">${statusText}</span></div>`;",
      "    });",
      "    ",
      "    if (groups.length > 6) {",
      "      groupHtml += `<div><span class=\"label\">+${groups.length - 6} more groups</span> <button class=\"expand-btn\" onclick=\"showGroupModal(); event.stopPropagation();\">...</button></div>`;",
      "    }",
      "    ",
      "    groupHtml += '</div>';",
      "    groupInfoEl.innerHTML = groupHtml;",
      "  } else {",
      "    groupInfoEl.innerHTML = '<h3>👥 Group Membership</h3><p style=\"color: #6b7280; font-style: italic;\">No group information available</p>';",
      "  }",
      "}",
      "",
      "function displayHistory(historyData) {",
      "  const historyInfoEl = document.getElementById('history-info');",
      "  const loginHistory = historyData?.loginHistory;",
      "  ",
      "  if (!loginHistory || loginHistory.length === 0) {",
      "    historyInfoEl.innerHTML = '<p style=\"color: #6b7280; font-style: italic; text-align: center; padding: 24px 0;\">No recent failed access attempts found.</p>';",
      "    return;",
      "  }",
      "  ",
      "  let historyHtml = '';",
      "  loginHistory.forEach((event, index) => {",
      "    const timestamp = new Date(event.dimensions.datetime).toLocaleString();",
      "    const isLast = index === loginHistory.length - 1;",
      "    ",
      "    historyHtml += '<div class=\"history-item\">';",
      "    historyHtml += '<div style=\"display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;\">';",
      "    historyHtml += '<div style=\"flex: 1;\">';",
      "    historyHtml += `<div class=\"title\">${event.applicationName || 'Unknown Application'}</div>`;",
      "    historyHtml += `<div class=\"details\">${timestamp}</div>`;",
      "    historyHtml += `<div class=\"details\" style=\"margin-top: 4px;\">IP: ${event.dimensions.ipAddress || 'Unknown'} • ${event.dimensions.country || 'Unknown'}</div>`;",
      "    historyHtml += '</div>';",
      "    historyHtml += '<span style=\"background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; flex-shrink: 0;\">FAILED</span>';",
      "    historyHtml += '</div>';",
      "    historyHtml += '</div>';",
      "  });",
      "  ",
      "  historyInfoEl.innerHTML = historyHtml;",
      "}",
      "",
      "function detectCurrentOS(userData) {",
      "  const device = userData?.device?.result;",
      "  if (!device) return 'Unknown';",
      "  ",
      "  const model = device.model || '';",
      "  const version = device.os_version || '';",
      "  const osField = device.os || '';",
      "  ",
      "  if (version.includes('10.0.') || version.includes('11.0.')) {",
      "    return 'Windows';",
      "  } else if (version.includes('15.') || version.includes('14.') || version.includes('13.')) {",
      "    return 'macOS';",
      "  } else if (version.includes('18.') || version.includes('17.') || version.includes('16.')) {",
      "    return 'iOS';",
      "  } else if (version.includes('6.') || version.includes('5.') || version.includes('4.')) {",
      "    return 'Linux';",
      "  }",
      "  ",
      "  if (osField && !osField.toLowerCase().includes('vmware') && !osField.toLowerCase().includes('virtualbox')) {",
      "    return osField;",
      "  }",
      "  ",
      "  if (model.toLowerCase().includes('windows') || version.toLowerCase().includes('windows')) {",
      "    return 'Windows';",
      "  } else if (model.toLowerCase().includes('mac') || model.startsWith('Mac')) {",
      "    return 'macOS';",
      "  } else if (model.toLowerCase().includes('linux') || version.toLowerCase().includes('linux')) {",
      "    return 'Linux';",
      "  }",
      "  ",
      "  return osField || model || 'Unknown';",
      "}",
      "",
      "function filterRelevantPostureChecks(postureArray, currentOS) {",
      "  if (!Array.isArray(postureArray)) return [];",
      "  ",
      "  const osLower = currentOS.toLowerCase();",
      "  const isWindows = osLower.includes('windows');",
      "  const isMac = osLower.includes('mac') || osLower.includes('darwin');",
      "  const isLinux = osLower.includes('linux');",
      "  const isIOS = osLower.includes('ios');",
      "  const isAndroid = osLower.includes('android');",
      "  ",
      "  return postureArray.filter(check => {",
      "    if (!check || !check.type) return false;",
      "    ",
      "    const ruleName = (check.type || '').toLowerCase();",
      "    const ruleDesc = (check.description || '').toLowerCase();",
      "    const ruleNameFull = (check.rule_name || '').toLowerCase();",
      "    const ruleContent = ruleName + ' ' + ruleDesc + ' ' + ruleNameFull;",
      "    ",
      "    const version = check.input?.version || '';",
      "    const isIOSVersion = version.includes('18.4') || version.includes('17.') || version.includes('16.');",
      "    const isMacOSVersion = version.includes('15.6') || version.includes('14.') || version.includes('13.');",
      "    const isWindowsVersion = version.includes('10.0.') || version.includes('11.0.');",
      "    const isLinuxVersion = version.includes('6.8') || version.includes('5.') || version.includes('4.');",
      "    ",
      "    if (isWindows) {",
      "      return ruleContent.includes('windows') || isWindowsVersion;",
      "    }",
      "    ",
      "    if (isMac) {",
      "      return ruleContent.includes('macos') || ruleContent.includes('timemachine') || ",
      "             ruleContent.includes('firewall') || isMacOSVersion ||",
      "             (check.type === 'disk_encryption' && !isIOSVersion && !isWindowsVersion && !isLinuxVersion);",
      "    }",
      "    ",
      "    if (isLinux) {",
      "      return ruleContent.includes('linux') || ruleContent.includes('kernel') || isLinuxVersion;",
      "    }",
      "    ",
      "    if (isIOS) {",
      "      return ruleContent.includes('ios') || isIOSVersion;",
      "    }",
      "    ",
      "    if (isAndroid) {",
      "      return ruleContent.includes('android');",
      "    }",
      "    ",
      "    return !isIOSVersion && !isMacOSVersion && !isWindowsVersion && !isLinuxVersion &&",
      "           !ruleContent.includes('windows') && !ruleContent.includes('macos') && ",
      "           !ruleContent.includes('linux') && !ruleContent.includes('ios') && !ruleContent.includes('android');",
      "  });",
      "}",
      "",
      "function copyTileContent(tile) {",
      "  let content = '';",
      "  const title = tile.querySelector('h3')?.textContent || '';",
      "  content += title + '\\n';",
      "  content += '='.repeat(title.length) + '\\n\\n';",
      "  ",
      "  const fields = tile.querySelectorAll('.field > div, .field div:not(.field)');",
      "  fields.forEach(field => {",
      "    const spans = field.querySelectorAll('span');",
      "    if (spans.length >= 2) {",
      "      const label = spans[0]?.textContent?.replace(':', '') || '';",
      "      const value = spans[1]?.textContent || '';",
      "      if (label && value && !spans[1].classList.contains('expand-btn')) {",
      "        content += `${label}: ${value}\\n`;",
      "      }",
      "    }",
      "  });",
      "  ",
      "  // Add hidden content for expandable tiles",
      "  if (tile.id === 'posture-info' && window.allComplianceChecks?.length > 6) {",
      "    content += '\\nAll Compliance Checks:\\n';",
      "    window.allComplianceChecks.forEach(check => {",
      "      const status = check.success ? 'Compliant' : 'Non-compliant';",
      "      let displayName = check.rule_name || check.type || 'Security Check';",
      "      let requirement = '';",
      "      if (check.input?.version && check.input?.operator) {",
      "        requirement = ` (${check.input.operator} ${check.input.version})`;",
      "      } else if (check.input?.version) {",
      "        requirement = ` (${check.input.version})`;",
      "      }",
      "      content += `${displayName}${requirement}: ${status}\\n`;",
      "    });",
      "  }",
      "  ",
      "  if (tile.id === 'group-info' && window.allGroups?.length > 6) {",
      "    content += '\\nAll Groups:\\n';",
      "    window.allGroups.forEach(group => {",
      "      const isTargetGroup = group === window.targetGroup;",
      "      const statusText = isTargetGroup ? 'Primary Group' : 'Member';",
      "      content += `${group}: ${statusText}\\n`;",
      "    });",
      "  }",
      "  ",
      "  navigator.clipboard.writeText(content).then(() => {",
      "    const originalBorder = tile.style.border;",
      "    const originalBoxShadow = tile.style.boxShadow;",
      "    const originalTransform = tile.style.transform;",
      "    ",
      "    // Apply blue highlight effect",
      "    tile.style.border = '2px solid #3b82f6';",
      "    tile.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';",
      "    tile.style.transform = 'scale(0.98)';",
      "    ",
      "    // Create and show 'Copied!' notification",
      "    const notification = document.createElement('div');",
      "    notification.textContent = 'Copied!';",
      "    notification.style.cssText = `",
      "      position: absolute;",
      "      top: -10px;",
      "      left: 50%;",
      "      transform: translateX(-50%);",
      "      background: #3b82f6;",
      "      color: white;",
      "      padding: 6px 12px;",
      "      border-radius: 6px;",
      "      font-size: 12px;",
      "      font-weight: 600;",
      "      z-index: 1000;",
      "      box-shadow: 0 2px 8px rgba(0,0,0,0.15);",
      "      opacity: 0;",
      "      transition: opacity 0.2s ease;",
      "      pointer-events: none;",
      "    `;",
      "    ",
      "    // Ensure tile has relative positioning",
      "    const originalPosition = tile.style.position;",
      "    if (!tile.style.position || tile.style.position === 'static') {",
      "      tile.style.position = 'relative';",
      "    }",
      "    ",
      "    tile.appendChild(notification);",
      "    ",
      "    // Fade in notification",
      "    setTimeout(() => notification.style.opacity = '1', 10);",
      "    ",
      "    setTimeout(() => {",
      "      // Restore original styles",
      "      tile.style.border = originalBorder;",
      "      tile.style.boxShadow = originalBoxShadow;",
      "      tile.style.transform = originalTransform;",
      "      ",
      "      // Fade out and remove notification",
      "      notification.style.opacity = '0';",
      "      setTimeout(() => {",
      "        if (notification.parentNode) {",
      "          notification.parentNode.removeChild(notification);",
      "        }",
      "        // Restore original position if we changed it",
      "        if (!originalPosition || originalPosition === 'static') {",
      "          tile.style.position = originalPosition || '';",
      "        }",
      "      }, 200);",
      "    }, 1000);",
      "  }).catch(err => {",
      "    console.warn('Failed to copy to clipboard:', err);",
      "  });",
      "}",
      "",
      "function showComplianceModal() {",
      "  const modal = document.getElementById('compliance-modal');",
      "  const content = document.getElementById('compliance-modal-content');",
      "  ",
      "  let modalHtml = '<div class=\"field\">';",
      "  window.allComplianceChecks.forEach(check => {",
      "    const status = check.success ? 'Compliant' : 'Non-compliant';",
      "    let displayName = check.rule_name || check.type || 'Security Check';",
      "    let requirement = '';",
      "    if (check.input?.version && check.input?.operator) {",
      "      requirement = ` (${check.input.operator} ${check.input.version})`;",
      "    } else if (check.input?.version) {",
      "      requirement = ` (${check.input.version})`;",
      "    }",
      "    const fullDisplayName = displayName + requirement;",
      "    modalHtml += `<div><span class=\"label\">${fullDisplayName}:</span> <span class=\"status ${check.success ? '' : 'non-compliant'}\">${status}</span></div>`;",
      "  });",
      "  modalHtml += '</div>';",
      "  ",
      "  content.innerHTML = modalHtml;",
      "  modal.style.display = 'flex';",
      "}",
      "",
      "function showGroupModal() {",
      "  const modal = document.getElementById('group-modal');",
      "  const content = document.getElementById('group-modal-content');",
      "  ",
      "  let modalHtml = '<div class=\"field\">';",
      "  window.allGroups.forEach(group => {",
      "    const isTargetGroup = group === window.targetGroup;",
      "    const statusText = isTargetGroup ? 'Primary Group' : 'Member';",
      "    const statusClass = isTargetGroup ? '' : 'disconnected';",
      "    modalHtml += `<div><span class=\"label\">${group}:</span> <span class=\"status ${statusClass}\">${statusText}</span></div>`;",
      "  });",
      "  modalHtml += '</div>';",
      "  ",
      "  content.innerHTML = modalHtml;",
      "  modal.style.display = 'flex';",
      "}",
      "",
      "function closeModal(event, modal) {",
      "  if (event.target === modal || event.target.classList.contains('close-btn')) {",
      "    modal.style.display = 'none';",
      "  }",
      "}",
      "",
      "document.addEventListener('keydown', function(event) {",
      "  if (event.key === 'Escape') {",
      "    const modals = document.querySelectorAll('.modal');",
      "    modals.forEach(modal => modal.style.display = 'none');",
      "  }",
      "});",
      "",
      "if (document.readyState === 'loading') {",
      "  document.addEventListener('DOMContentLoaded', () => {",
      "    initializeTheme();",
      "    createAccessDeniedPage();",
      "    loadUserData();",
      "    setTimeout(updateThemeButton, 100);",
      "  });",
      "} else {",
      "  initializeTheme();",
      "  createAccessDeniedPage();",
      "  loadUserData();",
      "  setTimeout(updateThemeButton, 100);",
      "}"
    ].join("\n");

    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Cloudflare Access Denied - Identity Information"/><title>Access Denied - Identity Information</title><style>${cssContent}</style></head><body><script>${jsContent}</script></body></html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
    });
  } catch (error) {
    return new Response(`Error creating inline HTML: ${(error as Error).message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

export async function handleJavaScript(request: Request, env: CloudflareEnv): Promise<Response> {
  const corsHeaders = getCorsHeaders(request, env);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jsContent = "// Backwards compatibility endpoint - redirecting to main page";

    return new Response(jsContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error) {
    return new Response("// Error loading JavaScript: " + (error as Error).message, {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
      },
    });
  }
}