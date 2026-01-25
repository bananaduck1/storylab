export function truncateForLogs(text: string, max = 2000): string {
  if (text.length <= max) {
    return text;
  }
  return text.slice(0, max) + `... (truncated, ${text.length} total chars)`;
}
