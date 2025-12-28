(function() {
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('quarto-dark');
      document.body.classList.remove('quarto-light');
    } else {
      document.body.classList.add('quarto-light');
      document.body.classList.remove('quarto-dark');
    }
  }

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'themechange') {
      applyTheme(event.data.theme);
    }
  });

  // Initial check
  const params = new URLSearchParams(window.location.search);
  const initialTheme = params.get('theme');
  if (initialTheme) applyTheme(initialTheme);
})();
