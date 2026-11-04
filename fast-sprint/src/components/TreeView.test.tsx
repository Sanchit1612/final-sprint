import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { TreeNode } from "@/lib/tree";
import { TreeView } from "./TreeView";

vi.mock("./ItemRow", () => ({
  ItemRow: ({ url }: { url: string | null }) => url && <a href={url}>Topic reading</a>,
}));

it("keeps useful reading while hiding GitHub links in nested library checklists", () => {
  const topic: TreeNode = {
    id: "topic", type: "topic", title: "Transactions", url: "https://www.geeksforgeeks.org/sql/sql-transactions/",
    platform: null, description: null, difficulty: null, tags: [], position: 0, children: [], resources: [],
    checkable: true, done: false, revise: false, bookmarked: false, note: "", total: 1, completed: 0,
  };
  const group: TreeNode = {
    ...topic, id: "group", url: null, checkable: false,
    children: [topic, { ...topic, id: "github-topic", url: "https://gist.github.com/example" }],
    resources: [
      { id: "docs", title: "PostgreSQL", url: "https://www.postgresql.org/docs/current/tutorial.html", platform: null },
      { id: "repo", title: "Repository", url: "https://github.com/example/repo", platform: null },
    ],
  };
  const html = renderToStaticMarkup(<TreeView nodes={[group]} forceOpen hideGitHubLinks />);
  expect(html).toContain(topic.url);
  expect(html).toContain("www.postgresql.org");
  expect(html).not.toContain("github.com");
  expect(renderToStaticMarkup(<TreeView nodes={[group]} forceOpen />)).toContain("github.com/example/repo");
});
