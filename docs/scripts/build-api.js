import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

console.log('Running build-api.js');

try {
    let jsdoc2md;
    try {
        jsdoc2md = require('jsdoc-to-markdown');
    } catch (e) {
        console.warn('⚠️ jsdoc-to-markdown not found.');
    }

    const srcDir = path.join(__dirname, '../src');
    const outputFile = path.join(__dirname, '../reference/api.md');
    const referenceDir = path.dirname(outputFile);

    if (!fs.existsSync(referenceDir)) {
      fs.mkdirSync(referenceDir, { recursive: true });
    }

    if (jsdoc2md) {
        console.log(`Generating API docs...`);
        const apiDocs = jsdoc2md.renderSync({
          files: `${srcDir}/**/*.js`,
        });

        const markdownContent = `---
title: "API Reference"
---

# API Reference

This documentation is automatically generated from source code JSDoc comments.

<div class="note">

### Source Code
The primary simulation logic resides in \`docs/src/engine.js\`.

</div>

${apiDocs}
`;

        fs.writeFileSync(outputFile, markdownContent);
        console.log('✅ API generated.');
    } else {
        if (!fs.existsSync(outputFile)) {
             fs.writeFileSync(outputFile, '---\ntitle: "API Reference"\n---\n\n*API generation skipped (jsdoc-to-markdown not found).*');
        }
    }

} catch (e) {
    console.error('⚠️ Error: ' + e.message);
}
