/**
 * Task 3 — Templates de Rotinas
 * 16 tests covering ROUTINE_TEMPLATES data, getTemplatesByType, and getTemplateById
 */

import {
  ROUTINE_TEMPLATES,
  getTemplatesByType,
  getTemplateById,
  type RoutineTemplate,
} from '../utils/routineTemplates';

// ── T3-01 ─────────────────────────────────────────────────────────────────────
test('T3-01: ROUTINE_TEMPLATES is a non-empty array', () => {
  expect(Array.isArray(ROUTINE_TEMPLATES)).toBe(true);
  expect(ROUTINE_TEMPLATES.length).toBeGreaterThan(0);
});

// ── T3-02 ─────────────────────────────────────────────────────────────────────
test('T3-02: has exactly 12 templates', () => {
  expect(ROUTINE_TEMPLATES.length).toBe(12);
});

// ── T3-03 ─────────────────────────────────────────────────────────────────────
test('T3-03: all template ids are unique', () => {
  const ids = ROUTINE_TEMPLATES.map((t) => t.id);
  const unique = new Set(ids);
  expect(unique.size).toBe(ids.length);
});

// ── T3-04 ─────────────────────────────────────────────────────────────────────
test('T3-04: every template has required string fields', () => {
  for (const t of ROUTINE_TEMPLATES) {
    expect(typeof t.id).toBe('string');
    expect(t.id.length).toBeGreaterThan(0);
    expect(typeof t.name).toBe('string');
    expect(t.name.length).toBeGreaterThan(0);
    expect(typeof t.emoji).toBe('string');
    expect(t.emoji.length).toBeGreaterThan(0);
    expect(typeof t.description).toBe('string');
    expect(t.description.length).toBeGreaterThan(0);
  }
});

// ── T3-05 ─────────────────────────────────────────────────────────────────────
test('T3-05: every template type is morning | afternoon | night | custom', () => {
  const validTypes = new Set(['morning', 'afternoon', 'night', 'custom']);
  for (const t of ROUTINE_TEMPLATES) {
    expect(validTypes.has(t.type)).toBe(true);
  }
});

// ── T3-06 ─────────────────────────────────────────────────────────────────────
test('T3-06: every template ageGroup is valid', () => {
  const validGroups = new Set(['2-4', '5-7', '8-10', 'all']);
  for (const t of ROUTINE_TEMPLATES) {
    expect(validGroups.has(t.ageGroup)).toBe(true);
  }
});

// ── T3-07 ─────────────────────────────────────────────────────────────────────
test('T3-07: every template has at least 1 task', () => {
  for (const t of ROUTINE_TEMPLATES) {
    expect(t.tasks.length).toBeGreaterThan(0);
  }
});

// ── T3-08 ─────────────────────────────────────────────────────────────────────
test('T3-08: every task has name, icon_emoji, and estimated_minutes > 0', () => {
  for (const t of ROUTINE_TEMPLATES) {
    for (const task of t.tasks) {
      expect(typeof task.name).toBe('string');
      expect(task.name.length).toBeGreaterThan(0);
      expect(typeof task.icon_emoji).toBe('string');
      expect(task.icon_emoji.length).toBeGreaterThan(0);
      expect(typeof task.estimated_minutes).toBe('number');
      expect(task.estimated_minutes).toBeGreaterThan(0);
    }
  }
});

// ── T3-09 ─────────────────────────────────────────────────────────────────────
test('T3-09: every task steps array is defined (never undefined)', () => {
  for (const t of ROUTINE_TEMPLATES) {
    for (const task of t.tasks) {
      expect(Array.isArray(task.steps)).toBe(true);
    }
  }
});

// ── T3-10 ─────────────────────────────────────────────────────────────────────
test('T3-10: getTemplatesByType("morning") returns only morning templates', () => {
  const result = getTemplatesByType('morning');
  expect(result.length).toBeGreaterThan(0);
  for (const t of result) {
    expect(t.type).toBe('morning');
  }
});

// ── T3-11 ─────────────────────────────────────────────────────────────────────
test('T3-11: getTemplatesByType("afternoon") returns only afternoon templates', () => {
  const result = getTemplatesByType('afternoon');
  expect(result.length).toBeGreaterThan(0);
  for (const t of result) {
    expect(t.type).toBe('afternoon');
  }
});

// ── T3-12 ─────────────────────────────────────────────────────────────────────
test('T3-12: getTemplatesByType("night") returns only night templates', () => {
  const result = getTemplatesByType('night');
  expect(result.length).toBeGreaterThan(0);
  for (const t of result) {
    expect(t.type).toBe('night');
  }
});

// ── T3-13 ─────────────────────────────────────────────────────────────────────
test('T3-13: morning + afternoon + night count equals total', () => {
  const morning = getTemplatesByType('morning').length;
  const afternoon = getTemplatesByType('afternoon').length;
  const night = getTemplatesByType('night').length;
  expect(morning + afternoon + night).toBe(ROUTINE_TEMPLATES.length);
});

// ── T3-14 ─────────────────────────────────────────────────────────────────────
test('T3-14: getTemplateById returns the correct template', () => {
  const first = ROUTINE_TEMPLATES[0];
  const result = getTemplateById(first.id);
  expect(result).toBeDefined();
  expect(result?.id).toBe(first.id);
  expect(result?.name).toBe(first.name);
});

// ── T3-15 ─────────────────────────────────────────────────────────────────────
test('T3-15: getTemplateById returns undefined for unknown id', () => {
  const result = getTemplateById('non-existent-id-xyz');
  expect(result).toBeUndefined();
});

// ── T3-16 ─────────────────────────────────────────────────────────────────────
test('T3-16: getTemplateById works for every id in ROUTINE_TEMPLATES', () => {
  for (const t of ROUTINE_TEMPLATES) {
    const found = getTemplateById(t.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(t.id);
  }
});
