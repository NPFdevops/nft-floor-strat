// Reset theme to light mode - run this in browser console
console.log('🌞 Resetting to light mode...');

// Clear localStorage
localStorage.removeItem('theme');
localStorage.setItem('theme', 'light');

// Remove dark class from HTML
document.documentElement.classList.remove('dark');

// Log current state
console.log('✅ Reset complete!');
console.log('Theme in localStorage:', localStorage.getItem('theme'));
console.log('HTML classes:', document.documentElement.className);

// Reload to apply changes
setTimeout(() => {
  window.location.reload();
}, 1000);