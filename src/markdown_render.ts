import { readFileSync } from "fs";
import { Renderer } from "./render.js";
import { marked } from "marked";

export class MarkdownRenderer implements Renderer {
  match(filePath: string): boolean {
    return filePath.endsWith(".md");
  }
  async render(filePath: string): Promise<string> {
    const markdownContent = readFileSync(filePath, "utf-8");
    return await marked.parse(markdownContent);
  }
}
