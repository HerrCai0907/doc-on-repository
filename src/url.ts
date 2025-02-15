import { assert } from "node:console";

const indexUrlSet = ["/index.html", "/index.md", "/index.reveal.md", "/index.reveal.html"];

export class Url {
  constructor(public path: string) {
    assert(path.startsWith("/"));
  }

  isIndexUrl(): boolean {
    return indexUrlSet.includes(this.path);
  }

  isPage(): boolean {
    return this.path.endsWith(".html") || this.path.endsWith(".md");
  }

  toString(): string {
    return this.path;
  }

  get displayName(): string {
    let name = this.path.slice(1);
    if (name.endsWith(".md")) {
      name = name.slice(0, -3);
    } else if (name.endsWith(".html")) {
      name = name.slice(0, -5);
    }
    if (name.endsWith(".reveal")) {
      name = name.slice(0, -7);
    }
    return name;
  }
}

export class UrlMap<T> {
  private map = new Map<string, T>();

  set(key: Url, value: T): void {
    this.map.set(key.path, value);
  }

  get(key: Url): T | undefined {
    return this.map.get(key.path);
  }

  getIndex(): T | undefined {
    for (const key of indexUrlSet) {
      const value = this.map.get(key);
      if (value) {
        return value;
      }
    }
  }

  has(key: Url): boolean {
    return this.map.has(key.path);
  }

  forEach(fn: (value: T, key: Url) => void): void {
    this.map.forEach((value, key) => {
      fn(value, new Url(key));
    });
  }
  clear() {
    this.map.clear();
  }
}
