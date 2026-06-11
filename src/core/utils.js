export function showToast(message, type = 'info', duration = 3500) {
  const event = new CustomEvent('show-toast', { detail: { message, type, duration } });
  window.dispatchEvent(event);
}
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
