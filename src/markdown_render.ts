import { readFileSync } from "fs";
import { Renderer } from "./render.js";
import markdownit from "markdown-it";

const md = markdownit();

export class MarkdownRenderer implements Renderer {
  match(filePath: string): boolean {
    return filePath.endsWith(".md");
  }
  async render(filePath: string): Promise<string> {
    const markdownContent = readFileSync(filePath, "utf-8");
    return md.render(markdownContent);
  }
}
