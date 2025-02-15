import express from "express";
import { SourceTree } from "./source_tree.js";
import { Url } from "./url.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function start(port: number, sourceTree: SourceTree) {
  const app: express.Express = express();
  app.get("/", async (_, res) => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(await sourceTree.getIndexPage());
  });

  app.get("/reveal.js/*", (req, res) => {
    const reqPath = decodeURIComponent(req.path);
    const file = path.normalize(`${__dirname}/../node_modules${reqPath}`);
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
