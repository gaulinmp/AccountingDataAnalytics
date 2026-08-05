// Typed access to the `labs` collection — instruction sheets that live outside
// the site in the repo-level `labs_hw/` tree. Ids keep the raw file path
// (see generateId in content.config.ts), e.g.:
//   week5_RDB/Lab-5_Instructions
import type { CollectionEntry } from 'astro:content';

export type DocType = 'Lab' | 'Homework';

const ID_RE = /^week(\d+)[^/]*\/(Lab|Homework)-\d+_Instructions$/;

export function docForWeek(
  all: CollectionEntry<'labs'>[],
  weekNumber: number,
  type: DocType
): CollectionEntry<'labs'> | undefined {
  return all.find((entry) => {
    const m = entry.id.match(ID_RE);
    return !!m && Number(m[1]) === weekNumber && m[2] === type;
  });
}
