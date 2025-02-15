import { Command } from "commander";
import { statSync } from "node:fs";
import { exit } from "node:process";
import chalk from "chalk";
import { start } from "./app.js";
import { SourceTree } from "./source_tree.js";
import { MarkdownRenderer } from "./markdown_render.js";
import { RevealRenderer } from "./reveal_render.js";

const program = new Command();
program.option("-p, --port <number>", "port number", "3000");
program.option("--root <folder>", "document folder", "doc");

const options = program.parse(process.argv).opts();
const port = parseInt(options.port, 10);
const root = options.root;

if (!statSync(root).isDirectory()) {
  console.log(chalk.red(`Error: ${root} is not a directory`));
  exit(-1);
}

start(port, new SourceTree(root, [new RevealRenderer(), new MarkdownRenderer()]));
