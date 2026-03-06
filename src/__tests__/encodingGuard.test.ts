import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..', '..');
const SRC_ROOT = path.resolve(__dirname, '..');
const AJUDA_SCREEN = path.resolve(SRC_ROOT, 'screens', 'parent', 'AjudaScreen.tsx');
const EXTRA_FILES = [path.resolve(ROOT, 'App.tsx'), path.resolve(ROOT, 'index.js')];

const MOJIBAKE_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'A-tilde mojibake', regex: /[\u00C3][\u0080-\u00FF]/u },
  { name: 'A-circumflex mojibake', regex: /[\u00C2][\u0080-\u00FF]/u },
  { name: 'euro-chain mojibake', regex: /[\u00C3][\u00A2][\u201A][\u00AC]/u },
  { name: 'latin-1 chain mojibake', regex: /[\u00E2][\u0080-\u00FF]/u },
  { name: 'cp1252 punctuation mojibake', regex: /[\u00E2][\u2018-\u203A\u20AC\u2122]/u },
  { name: 'emoji mojibake', regex: /[\u00F0][\u0178]/u },
  { name: 'replacement char', regex: /\uFFFD/u },
  { name: 'A-ring mojibake', regex: /[\u00C5][\u0080-\u00FF]/u },
];

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (
      fullPath.endsWith('.ts') ||
      fullPath.endsWith('.tsx') ||
      fullPath.endsWith('.js') ||
      fullPath.endsWith('.jsx')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('encoding guard', () => {
  it('does not contain mojibake sequences in source files', () => {
    const files = [
      ...listSourceFiles(SRC_ROOT),
      ...EXTRA_FILES.filter((filePath) => fs.existsSync(filePath)),
    ];
    const problems: string[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const { name, regex } of MOJIBAKE_PATTERNS) {
        if (regex.test(content)) {
          problems.push(`${path.relative(ROOT, filePath)} matches ${name}`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('keeps AjudaScreen ASCII-only for UI safety', () => {
    const content = fs.readFileSync(AJUDA_SCREEN, 'utf8');
    const nonAscii = /[^\x00-\x7F]/g.test(content);
    expect(nonAscii).toBe(false);
  });
});
