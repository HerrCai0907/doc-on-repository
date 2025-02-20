export function injectSseScript(): string {
  return `<script src="/doc-on-repository/sse.js"></script>`;
}

export type SseEvent =
  | {
      kind: "rebuild";
    }
  | { kind: "update"; path: string };

class SseManager {
  cnt = 0;
  listeners = new Map<number, (event: SseEvent) => void>();

  notify(event: SseEvent) {
    this.listeners.forEach((fn) => fn(event));
  }

  registerListener(fn: (event: SseEvent) => void): number {
    this.cnt++;
    const handle = this.cnt;
    this.listeners.set(handle, fn);
    return handle;
  }
  cancelListener(handle: number) {
    this.listeners.delete(handle);
  }
}

export let sse = new SseManager();
