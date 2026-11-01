import type { TreeNode } from "../tree";
export function difficultyCounts(nodes: TreeNode[]) {
  const result = { easy: 0, medium: 0, hard: 0, unspecified: 0 };
  const visit = (n: TreeNode) => {
    if (n.children.length) n.children.forEach(visit);
    else result[n.difficulty ?? "unspecified"]++;
  };
  nodes.forEach(visit);
  return result;
}
