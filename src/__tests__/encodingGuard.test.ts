import fs from 'fs';
import path from 'path';

const SRC_ROOT = path.resolve(__dirname, '..');
const AJUDA_SCREEN = path.resolve(SRC_ROOT, 'screens', 'parent', 'AjudaScreen.tsx');

const MOJIBAKE_PATTERNS: RegExp[] = [
  /Ã[\u0080-\u00BF]/,
  /â[\u0080-\u00BF]/,
  /ðŸ[\u0080-\u00BF]/,
  /ï¸[\u0080-\u00BF]/,
  /\uFFFD/,
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

    if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('encoding guard', () => {
  it('does not contain mojibake sequences in source files', () => {
    const files = listSourceFiles(SRC_ROOT);
    const problems: string[] = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const pattern of MOJIBAKE_PATTERNS) {
        if (pattern.test(content)) {
          problems.push(`${path.relative(SRC_ROOT, filePath)} matches ${pattern}`);
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
