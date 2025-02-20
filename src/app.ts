import express from "express";
import { SourceTree } from "./source_tree.js";
import { Url } from "./url.js";
import path from "path";
import { projectRoot } from "./root_path.js";
import { sse, SseEvent } from "./plugin/sse.js";

export function start(port: number, sourceTree: SourceTree) {
  const app: express.Express = express();
  app.get("/", async (_, res) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(await sourceTree.getIndexPage());
  });

  // sse
  app.get("/updates", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const handle = sse.registerListener((event: SseEvent) => {
      res.write(`data:${JSON.stringify(event)}\n\n`);
    });
    req.on("close", () => {
      sse.cancelListener(handle);
      res.end();
    });
  });

  // inject code
  app.get("/doc-on-repository/*", (req, res) => {
    const reqPath = decodeURIComponent(req.path).slice("/doc-on-repository".length);
    const file = path.normalize(`${projectRoot}/dist/web${reqPath}`);
    console.log(`get path: ${reqPath} from ${file}`);
    res.sendFile(file);
  });
  // reveal.js
  app.get("/reveal.js/*", (req, res) => {
    const reqPath = decodeURIComponent(req.path);
    const file = path.normalize(`${projectRoot}/node_modules${reqPath}`);
    console.log(`get path: ${reqPath} from ${file}`);
    res.sendFile(file);
  });

  app.get("/*", async (req, res) => {
    const path = decodeURIComponent(req.path);
    console.log(`get path: ${path}`);
    const url = new Url(path);
    try {
      const resourcePath = sourceTree.getResourcePath(url);
      if (resourcePath) {
        res.sendFile(resourcePath);
      } else {
        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(await sourceTree.getPage(url));
      }
    } catch (error) {
      res.status(404).send("File not found");
    }
  });

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}
