/**
 * Script to extract all <style jsx> blocks from .tsx files
 * and move them to separate .css files with proper imports.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, basename, join } from 'path';

const files = [
  'app/zangochap-manager/orders/to-process/ToProcessClient.tsx',
  'app/zangochap-manager/orders/non-packed/NonPackedClient.tsx',
  'app/zangochap-manager/media/MediaClient.tsx',
  'app/zangochap-manager/marketing/import/page.tsx',
  'app/zangochap-manager/logistics/verification/page.tsx',
  'app/zangochap-manager/LoginClient.tsx',
  'app/zangochap-manager/inventory/history/StockHistoryClient.tsx',
  'app/zangochap-manager/directory/DirectoryClient.tsx',
  'app/zangochap-manager/dashboard/DashboardRecentOrders.tsx',
  'app/zangochap-manager/admin/team/TeamClient.tsx',
  'app/zangochap-manager/admin/settings/team/TeamClient.tsx',
  'app/zangochap-manager/admin/settings/promos/PromoClient.tsx',
  'app/zangochap-manager/admin/promos/PromoClient.tsx',
  'app/zangochap-manager/admin/performance/PerformanceClient.tsx',
  'app/zangochap-manager/admin/delivery/settlement/SettlementClient.tsx',
  'app/zangochap-manager/admin/delivery/AdminDeliveryClient.tsx',
  'app/product/[id]/client.tsx',
  'app/product/[id]/product-detail-client.tsx',
  'components/Topbar.tsx',
  'components/Sidebar.tsx',
];

const ROOT = 'E:/zangochap_gest';

let totalExtracted = 0;

for (const relPath of files) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) {
    console.log(`⚠️  SKIP (not found): ${relPath}`);
    continue;
  }

  let content = readFileSync(fullPath, 'utf-8');
  
  // Find all <style jsx>{`...`}</style> blocks
  const styleRegex = /<style jsx>\{`([\s\S]*?)`\}<\/style>/g;
  const matches = [...content.matchAll(styleRegex)];
  
  if (matches.length === 0) {
    console.log(`⚠️  SKIP (no style jsx found): ${relPath}`);
    continue;
  }

  // Generate CSS filename based on the component filename
  const dir = dirname(fullPath);
  const base = basename(relPath, '.tsx');
  
  // If there are multiple style blocks, combine them into one CSS file
  let allCss = '';
  for (const match of matches) {
    let css = match[1];
    // Clean up indentation (remove leading whitespace common to all lines)
    const lines = css.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);
    if (nonEmptyLines.length > 0) {
      const minIndent = Math.min(...nonEmptyLines.map(l => l.match(/^(\s*)/)[1].length));
      css = lines.map(l => l.slice(minIndent)).join('\n').trim();
    }
    // Fix escaped quotes that were needed inside JSX template literals
    css = css.replace(/\\"/g, '"');
    allCss += css + '\n\n';
  }
  allCss = allCss.trim() + '\n';

  // Write CSS file
  const cssFileName = base.replace(/([A-Z])/g, (m, c, i) => (i > 0 ? '-' : '') + c.toLowerCase());
  const cssPath = join(dir, `${cssFileName}.css`);
  
  if (existsSync(cssPath)) {
    console.log(`⚠️  SKIP CSS (already exists): ${cssPath}`);
  } else {
    writeFileSync(cssPath, allCss, 'utf-8');
    console.log(`✅ Created: ${cssFileName}.css`);
  }

  // Remove style jsx blocks from TSX
  content = content.replace(styleRegex, '');
  
  // Clean up any leftover empty lines where the style block was
  content = content.replace(/\n{3,}/g, '\n\n');

  // Add CSS import if not already present
  const cssImport = `import "./${cssFileName}.css";`;
  if (!content.includes(cssImport)) {
    // Find the right place to insert the import (after "use client" and other imports)
    const lines = content.split('\n');
    let insertIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('"use client"') || lines[i].startsWith("'use client'")) {
        insertIdx = i + 1;
      }
    }
    lines.splice(insertIdx, 0, cssImport);
    content = lines.join('\n');
  }

  writeFileSync(fullPath, content, 'utf-8');
  totalExtracted += matches.length;
  console.log(`✅ Updated: ${relPath} (${matches.length} block(s) extracted)`);
}

console.log(`\n🎉 Done! Extracted ${totalExtracted} style blocks from ${files.length} files.`);
