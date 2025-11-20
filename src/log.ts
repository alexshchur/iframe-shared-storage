import { MessagingOptions } from "./types";

// Minimal conditional logger; keeps bundle tiny.
export function logIfEnabled(
  options: MessagingOptions | undefined,
  context: string,
  ...info: any[]
): void {
  if (!options?.enableLog) return;
  // Single place to adjust formatting later.
  console.log(`[iframe-storage:${context}]`, ...info);
}
