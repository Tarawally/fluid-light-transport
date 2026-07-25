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

  function reportHeight() {
    const height = document.body.scrollHeight;
    window.parent.postMessage({ type: 'resize', height: height }, '*');
  }

  window.addEventListener('message', function(event) {
    if (event.data && (event.data.type === 'themechange' || event.data.type === 'set-theme')) {
      applyTheme(event.data.theme);
    }
  });

  // Initial check for theme and embedded mode
  const params = new URLSearchParams(window.location.search);
  const initialTheme = params.get('theme');
  if (initialTheme) applyTheme(initialTheme);
  
  if (params.get('embedded') === 'true' || window.parent !== window) {
    document.body.classList.add('embedded');
  }

  // Report height on load and resize
  window.addEventListener('load', reportHeight);
  const observer = new ResizeObserver(reportHeight);
  observer.observe(document.body);
})();
