---
title: Visualisation
---

<iframe 
  id="sim-frame"
  src="src/index.html"
  style="width: 100%; height: calc(100vh - 60px); border: none; display: block; margin: 0; padding: 0; border-radius: 8px;"
  title="Fluid Light Transport Scene">
</iframe>

```js
// Sync theme to the embedded simulation iframe reactively when the page theme changes
const iframe = document.getElementById("sim-frame");
if (iframe) {
  const postTheme = () => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'themechange',
        theme: dark ? 'dark' : 'light'
      }, '*');
    }
  };
  postTheme();
  iframe.addEventListener('load', postTheme);
}
```
