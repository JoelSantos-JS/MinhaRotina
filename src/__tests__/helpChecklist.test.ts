import {
  createInitialCollapsedCategories,
  toggleCategoryCollapsed,
} from '../utils/helpChecklist';

describe('helpChecklist', () => {
  it('creates all categories as collapsed by default', () => {
    const collapsed = createInitialCollapsedCategories(['a', 'b', 'c']);
    expect(collapsed).toEqual({ a: true, b: true, c: true });
  });

  it('toggles one category without affecting the others', () => {
    const initial = { a: true, b: true, c: true };
    const next = toggleCategoryCollapsed(initial, 'b');

    expect(next).toEqual({ a: true, b: false, c: true });
    expect(initial).toEqual({ a: true, b: true, c: true });
  });

  it('toggles back when called twice for the same category', () => {
    const initial = { x: true };
    const opened = toggleCategoryCollapsed(initial, 'x');
    const closed = toggleCategoryCollapsed(opened, 'x');

    expect(opened.x).toBe(false);
    expect(closed.x).toBe(true);
  });
});
