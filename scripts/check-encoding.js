const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(ROOT, 'src');
const EXTRA_FILES = [path.join(ROOT, 'App.tsx'), path.join(ROOT, 'index.js')];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const MOJIBAKE_PATTERNS = [
  { name: 'A-tilde mojibake', regex: /[\u00C3][\u0080-\u00FF]/u },
  { name: 'A-circumflex mojibake', regex: /[\u00C2][\u0080-\u00FF]/u },
  { name: 'euro-chain mojibake', regex: /[\u00C3][\u00A2][\u201A][\u00AC]/u },
  { name: 'latin-1 chain mojibake', regex: /[\u00E2][\u0080-\u00FF]/u },
  { name: 'cp1252 punctuation mojibake', regex: /[\u00E2][\u2018-\u203A\u20AC\u2122]/u },
  { name: 'emoji mojibake', regex: /[\u00F0][\u0178]/u },
  { name: 'replacement char', regex: /\uFFFD/u },
  { name: 'A-ring mojibake', regex: /[\u00C5][\u0080-\u00FF]/u },
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (EXTENSIONS.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }

  return files;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of MOJIBAKE_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          filePath,
          line: i + 1,
          rule: pattern.name,
          excerpt: line.trim().slice(0, 140),
        });
      }
    }
  }

  return findings;
}

function main() {
  const files = [
    ...walk(SRC_ROOT),
    ...EXTRA_FILES.filter((filePath) => fs.existsSync(filePath)),
  ];

  const findings = files.flatMap(scanFile);

  if (findings.length > 0) {
    console.error('Encoding check failed. Possible mojibake found:');
    for (const f of findings) {
      console.error(`- ${path.relative(ROOT, f.filePath)}:${f.line} [${f.rule}] ${f.excerpt}`);
    }
    process.exit(1);
  }

  console.log(`Encoding check passed (${files.length} files).`);
}

main();
