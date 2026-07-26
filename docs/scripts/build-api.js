import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import jsdoc2md from 'jsdoc-to-markdown';

(async () => {
    try {
        const srcDir = path.join(__dirname, '../../src');
        const outputFile = path.join(__dirname, '../reference/api.md');
        const referenceDir = path.dirname(outputFile);

        if (!fs.existsSync(referenceDir)) {
          fs.mkdirSync(referenceDir, { recursive: true });
        }

        console.log(`Generating API docs...`);
        const apiDocs = await jsdoc2md.render({
          files: `${srcDir}/**/*.js`,
        });

        const markdownContent = `---
title: "API Reference"
---

# API Reference

This documentation is automatically generated from source code JSDoc comments.

<div class="note">

### Source Code
The primary simulation logic resides in \`src/engine.js\`.

</div>

${apiDocs}
`;

        fs.writeFileSync(outputFile, markdownContent);
        console.log('✅ API generated.');
    } catch (e) {
        console.error('⚠️ Error generating API docs: ' + e.message);
    }
})();
