import fs from 'fs';

let css = fs.readFileSync('src/app/globals.css', 'utf-8');

// 1. Shadows
css = css.replace('--shadow-soft: 0 8px 20px rgba(15, 23, 42, 0.035);', '--shadow-soft: 0 2px 8px rgba(15, 23, 42, 0.04);');
css = css.replace('--shadow-medium: 0 14px 32px rgba(15, 23, 42, 0.05);', '--shadow-medium: 0 4px 12px rgba(15, 23, 42, 0.06);');
css = css.replace('--shadow-paper: 0 20px 46px rgba(15, 23, 42, 0.08);', '--shadow-paper: 0 8px 24px rgba(15, 23, 42, 0.08);');

// 2. Body background
css = css.replace(/body \{[\s\S]*?text-rendering: optimizeLegibility;\s*background:[\s\S]*?100%\);\s*\}/, 
`body {
  margin: 0;
  min-height: 100vh;
  color: var(--ink-strong);
  font-family:
    var(--font-body),
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;
  text-rendering: optimizeLegibility;
  background: #fdfcfb;
}`);

// 3. App grids
css = css.replace(/.app-backdrop \{[\s\S]*?\}/, '.app-backdrop {\n  display: none;\n}');
css = css.replace(/.app-grid \{[\s\S]*?\}/, '.app-grid {\n  display: none;\n}');

// 4. Border radius replacements
css = css.replace(/border-radius: 1.8rem;/g, 'border-radius: 0.75rem;');
css = css.replace(/border-radius: 1.35rem;/g, 'border-radius: 0.75rem;');
css = css.replace(/border-radius: 1.25rem;/g, 'border-radius: 0.75rem;');
css = css.replace(/border-radius: 1.1rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 1.05rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 1rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 0.82rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 0.8rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 0.78rem;/g, 'border-radius: 0.5rem;');
css = css.replace(/border-radius: 0.72rem;/g, 'border-radius: 0.42rem;');

// 5. Button paddings
css = css.replace(/padding: 0.6rem 0.9rem;/g, 'padding: 0.45rem 0.8rem;');
css = css.replace(/padding: 0.8rem 0.9rem;/g, 'padding: 0.6rem 0.8rem;');
css = css.replace(/padding: 0.88rem 0.95rem;/g, 'padding: 0.6rem 0.8rem;');
css = css.replace(/padding: 0.95rem;/g, 'padding: 0.8rem;');

// 6. Specific button shadows
css = css.replace(/box-shadow: 0 6px 16px rgba\(48, 76, 148, 0\.1\);/g, 'box-shadow: 0 2px 8px rgba(48, 76, 148, 0.1);');
css = css.replace(/box-shadow: 0 8px 18px rgba\(48, 76, 148, 0\.12\);/g, 'box-shadow: 0 4px 12px rgba(48, 76, 148, 0.15);');
css = css.replace(/box-shadow: 0 8px 16px rgba\(45, 73, 144, 0\.1\);/, 'box-shadow: 0 2px 8px rgba(45, 73, 144, 0.15);');

fs.writeFileSync('src/app/globals.css', css);
console.log('CSS updated successfully');
