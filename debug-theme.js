// Simple debug script to check theme state
console.log('=== THEME DEBUG ===');
console.log('localStorage theme:', localStorage.getItem('theme'));
console.log('HTML classes:', document.documentElement.className);
console.log('System dark mode:', window.matchMedia('(prefers-color-scheme: dark)').matches);

// Clear localStorage theme
localStorage.removeItem('theme');
console.log('Cleared localStorage theme');

// Reload page
window.location.reload();