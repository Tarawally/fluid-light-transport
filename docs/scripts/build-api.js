const fs = require('fs');
const path = require('path');

console.log('Running build-api.js');

try {
    let jsdoc2md;
    try {
        jsdoc2md = require('jsdoc-to-markdown');
    } catch (e) {
        console.warn('⚠️ jsdoc-to-markdown not found.');
    }

    const srcDir = path.join(__dirname, '../../src');
    const outputFile = path.join(__dirname, '../reference/api.qmd');
    const referenceDir = path.dirname(outputFile);

    if (!fs.existsSync(referenceDir)) {
      fs.mkdirSync(referenceDir, { recursive: true });
    }

    if (jsdoc2md) {
        console.log(`Generating API docs...`);
        const apiDocs = jsdoc2md.renderSync({
          files: `${srcDir}/**/*.js`,
        });

        const quarto = `---
title: "API Reference"
format: html
---

# API Reference

This documentation is automatically generated from source code JSDoc comments.

::: {.callout-note}
## Source Code
The primary simulation logic resides in [\`src/engine.js\`](https://github.com/Tarawally/fluid-light-transport/blob/main/src/engine.js).
:::

${apiDocs}
`;

        fs.writeFileSync(outputFile, quarto);
        console.log('✅ API generated.');
    } else {
        if (!fs.existsSync(outputFile)) {
             fs.writeFileSync(outputFile, '---\ntitle: "API Reference"\n---\n\n*API generation skipped (jsdoc-to-markdown not found).*');
        }
    }

} catch (e) {
    console.error('⚠️ Error: ' + e.message);
}
