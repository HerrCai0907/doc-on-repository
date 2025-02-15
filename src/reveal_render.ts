import { readFileSync } from "fs";
import { Renderer } from "./render.js";
import assert from "assert";

const head = `
<head>
  <meta charset="utf-8" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="/reveal.js/dist/reset.css" />
  <link rel="stylesheet" href="/reveal.js/dist/reveal.css" />
  <link rel="stylesheet" href="/reveal.js/dist/theme/black.css" id="theme" />
  <link rel="stylesheet" href="/reveal.js/plugin/highlight/monokai.css" />
</head>
`;

const script = `
<script src="/reveal.js/dist/reveal.js"></script>
<script src="/reveal.js/plugin/zoom/zoom.js"></script>
<script src="/reveal.js/plugin/notes/notes.js"></script>
<script src="/reveal.js/plugin/search/search.js"></script>
<script src="/reveal.js/plugin/markdown/markdown.js"></script>
<script src="/reveal.js/plugin/highlight/highlight.js"></script>
<script>
  Reveal.initialize({
    controls: true,
    progress: true,
    center: true,
    hash: true,
    plugins: [RevealZoom, RevealNotes, RevealSearch, RevealMarkdown, RevealHighlight],
  });
</script>
`;

export class RevealRenderer implements Renderer {
  match(filePath: string): boolean {
    return filePath.endsWith(".reveal.html") || filePath.endsWith(".reveal.md");
  }

  async render(filePath: string): Promise<string> {
    if (filePath.endsWith(".reveal.html")) return this.renderHtml(filePath);
    if (filePath.endsWith(".reveal.md")) return this.renderMarkdown(filePath);
    assert(false);
  }

  renderHtml(filePath: string): string {
    return `
      <html>
        ${head}
        <body>
          <div class="reveal">
            <div class="slides">
              ${readFileSync(filePath, "utf-8")}
            </div>
          </div>
          ${script}
        </body>
      </html>`;
  }

  renderMarkdown(filePath: string): string {
    return `
      <html>
        ${head}
        <body>
          <div class="reveal">
            <div class="slides">
              <section data-markdown>
                <textarea data-template>
${readFileSync(filePath, "utf-8")}
                </textarea>
              </section>
            </div>
          </div>
          ${script}
        </body>
      </html>`;
  }
}
