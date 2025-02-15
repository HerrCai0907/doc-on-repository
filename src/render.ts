export interface Renderer {
  match(filePath: string): boolean;
  render(filePath: string): Promise<string>;
}
