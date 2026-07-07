// ponytail: in-memory dedup bounded to 1000 events — Section 10 replaces with DB log
const seen = new Set<string>();
export const isDuplicate = (id: string) => seen.has(id);
export function markSeen(id: string) {
  if (seen.size >= 1000) seen.delete(seen.values().next().value!);
  seen.add(id);
}
