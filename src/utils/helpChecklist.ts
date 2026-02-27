export type CollapsedCategoryMap = Record<string, boolean>;

export function createInitialCollapsedCategories(
  categoryIds: string[]
): CollapsedCategoryMap {
  return categoryIds.reduce<CollapsedCategoryMap>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

export function toggleCategoryCollapsed(
  collapsedByCategory: CollapsedCategoryMap,
  categoryId: string
): CollapsedCategoryMap {
  return {
    ...collapsedByCategory,
    [categoryId]: !collapsedByCategory[categoryId],
  };
}
