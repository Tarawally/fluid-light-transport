const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../docs');
const targetDir = process.argv[2];

if (!targetDir) {
  console.error('Usage: node sync-to-quartz.js <target-directory>');
  process.exit(1);
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to process file content
function processContent(content, filename) {
  let lines = content.split('\n');
  let newLines = [];
  let inCallout = false;
  let calloutType = '';
  let inOJS = false;
  let hasOJS = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // 1. Handle Callouts
    const calloutStart = line.match(/^:::\s*\{\.callout-(\w+)(.*)\}/);
    if (calloutStart) {
      inCallout = true;
      calloutType = calloutStart[1];
      const metadata = calloutStart[2];
      const isCollapsed = metadata.includes('collapse="true"');
      const foldChar = isCollapsed ? '-' : '';
      
      let title = "Note"; 
      if (lines[i+1] && lines[i+1].trim().startsWith('##')) {
          title = lines[i+1].replace(/^##\s*/, '').trim();
          i++; 
      }
      
      newLines.push(`> [!${calloutType}]${foldChar} ${title}`);
      continue;
    }

    if (inCallout && line.trim() === ':::') {
      inCallout = false;
      continue;
    }

    if (inCallout) {
      newLines.push(`> ${line}`);
      continue;
    }

    // 2. Detect OJS
    if (line.trim().startsWith('```{ojs}')) {
      inOJS = true;
      hasOJS = true;
      continue;
    }
    if (inOJS && line.trim().startsWith('```')) {
      inOJS = false;
      continue;
    }
    if (inOJS) continue;

    // 3. Misc cleanup
    line = line.replace(/\{\.unnumbered\}/g, '');
    line = line.replace(/\.qmd\)/g, '.md)');
    line = line.replace(/\.qmd#/g, '.md#');

    newLines.push(line);
  }

  const baseContent = newLines.join('\n');

  if (hasOJS) {
    const htmlFilename = filename.replace('.qmd', '.html');
    const iframeUrl = `/static/fluid-book/${htmlFilename}`;
    
    // Return a page that embeds the full Quarto notebook
    return `--- 
title: "${filename.replace(/_/g, ' ').replace('.qmd', '')}"
layout: "fluid-notebook"
---

<div class="quarto-embed-container">
  <iframe 
    id="quarto-iframe"
    src="${iframeUrl}" 
    width="100%" 
    style="border:none; min-height: 800px;" 
    onload="initQuartoIframe(this)">
  </iframe>
</div>

<script>
function initQuartoIframe(iframe) {
  // Sync theme
  const isDark = document.documentElement.getAttribute('saved-theme') === 'dark' || 
                 document.body.classList.contains('dark');
  iframe.contentWindow.postMessage({ type: 'themechange', theme: isDark ? 'dark' : 'light' }, '*');
  
  // Listen for height updates from the iframe
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'resize') {
      iframe.style.height = event.data.height + 'px';
    }
  });
}

// Watch for Quartz theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'saved-theme') {
      const isDark = document.documentElement.getAttribute('saved-theme') === 'dark';
      const iframe = document.getElementById('quarto-iframe');
      if (iframe) {
        iframe.contentWindow.postMessage({ type: 'themechange', theme: isDark ? 'dark' : 'light' }, '*');
      }
    }
  });
});
observer.observe(document.documentElement, { attributes: true });
</script>

<div style="display: none;">
${baseContent}
</div>
`;
  }

  return baseContent;
}

// Process files
fs.readdirSync(sourceDir).forEach(file => {
  const srcPath = path.join(sourceDir, file);
  const ext = path.extname(file);

  if (ext === '.qmd') {
    const destPath = path.join(targetDir, path.basename(file, '.qmd') + '.md');
    const content = fs.readFileSync(srcPath, 'utf8');
    const processed = processContent(content, file);
    fs.writeFileSync(destPath, processed);
    console.log(`Converted: ${file} -> ${path.basename(destPath)}`);
  } else if (['.svg', '.png', '.jpg', '.bib'].includes(ext)) {
    const destPath = path.join(targetDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied: ${file}`);
  }
});

console.log('Synchronisation complete.');
