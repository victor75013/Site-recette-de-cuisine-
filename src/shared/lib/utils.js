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

const FALLBACK_IMAGES = {
  'Entrées': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
  'Plats principaux': 'https://images.unsplash.com/photo-1544025162-8315147df9d9?auto=format&fit=crop&w=800&q=80',
  'Desserts': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80',
  'Soupes': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  'Salades': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  'Petits-déjeuners': 'https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?auto=format&fit=crop&w=800&q=80',
  'Boissons': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
  'Snacks': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80',
  'Sauces': 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80',
  'Marinades': 'https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'
};

export function getPlaceholderImage(category) {
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES['default'];
}
