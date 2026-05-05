/**
 * Simulates realistic API latency between 200–800ms.
 */
export function delay(min = 200, max = 800): Promise<void> {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
