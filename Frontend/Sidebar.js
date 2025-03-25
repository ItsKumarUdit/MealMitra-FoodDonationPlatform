const toggleSwitch = document.getElementById('darkModeToggle');
const body = document.body;

// Check saved theme preference
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
  toggleSwitch.checked = true;
}

toggleSwitch.addEventListener('change', () => {
  body.classList.toggle('dark-mode');
  
  // Save user preference
  if (body.classList.contains('dark-mode')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
});
