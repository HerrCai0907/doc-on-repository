import { readdirSync, readFileSync } from "node:fs";
import { watch } from "node:fs/promises";
import { relative } from "node:path";
import assert from "node:assert";
import { Url, UrlMap } from "./url.js";
import { Renderer } from "./render.js";
import chalk from "chalk";
import { injectSseScript, sse } from "./plugin/sse.js";

class MultipleLevelListNode {
  public attr: Attr | null = null;
  public indexAttr: Attr | null = null;
  public children: MultipleLevelListKeyValuePair = {};
}

type MultipleLevelListKeyValuePair = Record<string, MultipleLevelListNode>;

class MultipleLevelList {
  private tree: MultipleLevelListKeyValuePair = {};

  add(attr: Attr) {
    const impl = (path: string[], node: MultipleLevelListKeyValuePair, parent?: MultipleLevelListNode) => {
      assert(path.length > 0);
      const firstPath = path[0];
      const restPath = path.slice(1);
      if (restPath.length == 0 && firstPath.startsWith("index") && parent != undefined) {
        parent.indexAttr = attr;
        return;
      }
      node[firstPath] = node[firstPath] || new MultipleLevelListNode();
      const currentNode: MultipleLevelListNode = node[firstPath];
      if (restPath.length == 0) {
        currentNode.attr = attr;
      } else {
        impl(restPath, currentNode.children, currentNode);
      }
    };
    impl(attr.url.path.slice(1).split("/"), this.tree);
  }

  toHtml(): string {
    const snippets = new Array<string>();
    const renderNode = (key: string, node: MultipleLevelListNode) => {
      const attr = node.attr;
      if (attr) {
        snippets.push(`<li>${attr.url.displayName} <a href="${attr.url}">[link]</a></li>`);
        return;
      }
      const indexAttr = node.indexAttr;
      if (indexAttr) {
        snippets.push(`<li>${key} <a href="${indexAttr.url}">[link]</a></li>`);
      } else {
        snippets.push(`<li>${key}`);
      }
      buildList(node.children);
      snippets.push(`</li>`);
    };
    const buildList = (tree: MultipleLevelListKeyValuePair) => {
      snippets.push("<ul>");
      for (const key in tree) {
        renderNode(key, tree[key]);
      }
      snippets.push("</ul>");
    };
    buildList(this.tree);
    return snippets.join("\n");
  }
}

class Cacheable<T> {
  private cache: T | null = null;

  async get(fn: () => T | Promise<T>): Promise<T> {
    if (this.cache === null) {
      this.cache = await fn();
    }
    return this.cache;
  }

  getSync(fn: () => T): T {
    if (this.cache === null) {
      this.cache = fn();
    }
    return this.cache;
  }

  clean() {
    this.cache = null;
  }
}

class Attr {
  public html = new Cacheable<string>();
  constructor(
    public url: Url,
    public filePath: string
  ) {}
}

export class SourceTree {
  private resources = new UrlMap<Attr>();
  private pages = new UrlMap<Attr>();
  private indexPage = new Cacheable<string>();

  constructor(
    private root: string,
    private renderers: Array<Renderer>
  ) {
    (async () => {
      this.buildTree();
      const watcher = watch(root, { recursive: true });
      for await (const { eventType, filename } of watcher) {
        if (eventType == "rename") {
          console.log(chalk.yellow(`File ${filename} has been rename / add / remove. rebuild tree.`));
          this.buildTree();
          sse.notify({ kind: "rebuild" });
        } else if (eventType == "change" && filename != null) {
          console.log(chalk.yellow(`File ${filename} has been changed. clean cache.`));
          const url = new Url("/" + filename);
          this.pages.get(url)?.html.clean();
          if (url.isIndexUrl()) {
            sse.notify({ kind: "update", path: "/" });
          }
          sse.notify({ kind: "update", path: url.path });
        }
      }
    })();
  }

  async getIndexPage(): Promise<string> {
    let indexAttr = this.pages.getIndex();
    if (indexAttr) {
      return (await this.getPage(indexAttr.url)) + this.createIndexPage();
    } else {
      return this.createIndexPage();
    }
  }

  getResourcePath(url: Url): string | undefined {
    return this.resources.get(url)?.filePath;
  }

  async getPage(url: Url): Promise<string> {
    const file = this.pages.get(url);
    if (!file) {
      throw Error(`file not found: ${url}`);
    }
    return file.html.get(async () => {
      for (let renderer of this.renderers) {
        if (renderer.match(file.filePath)) {
          return await renderer.render(file.filePath);
        }
      }
      return readFileSync(file.filePath, "utf-8");
    });
  }

  createIndexPage(): string {
    return this.indexPage.getSync((): string => {
      const list = new MultipleLevelList();
      this.pages.forEach((attr, url) => {
        if (!url.isIndexUrl() && url.isPage()) {
          list.add(attr);
        }
      });
      return `<hr><h1>Contents</h1>` + injectSseScript() + list.toHtml();
    });
  }

  private buildTree() {
    this.resources.clear();
    this.pages.clear();
    const visitDirectory = (directory: string) => {
      const entries = readdirSync(directory, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = `${directory}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name == ".git") continue;
          visitDirectory(fullPath);
        } else {
          const attr = new Attr(new Url("/" + relative(this.root, fullPath)), fullPath);
          if (this.pages.has(attr.url) || this.resources.has(attr.url)) {
            throw new Error(`duplicated file: ${this.pages.get(attr.url)!.filePath} and ${fullPath}`);
          }
          if (attr.url.isPage()) {
            console.log(`register page ${fullPath} as ${attr.url}`);
            this.pages.set(attr.url, attr);
          } else {
            console.log(`register resource ${fullPath} as ${attr.url}`);
            this.resources.set(attr.url, attr);
          }
        }
      }
    };
    visitDirectory(this.root);
  }
}
