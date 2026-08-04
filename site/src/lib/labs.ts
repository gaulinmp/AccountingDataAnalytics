// Typed access to the `labs` collection — instruction sheets that live outside
// the site in the repo-level `labs_hw/` tree. Ids keep the raw file path
// (see generateId in content.config.ts), e.g.:
//   week5_RDB/Lab-5_Instructions            (undergrad / ACCTG 5150)
//   week2_connecting-to-data/Homework-2_MAcc_Instructions   (MAcc / 6155)
import type { CollectionEntry } from 'astro:content';

export type DocType = 'Lab' | 'Homework';

export interface WeekDocs {
  ug?: CollectionEntry<'labs'>;
  macc?: CollectionEntry<'labs'>;
}

const ID_RE = /^week(\d+)[^/]*\/(Lab|Homework)-\d+(_MAcc)?_Instructions$/;

export function docsForWeek(
  all: CollectionEntry<'labs'>[],
  weekNumber: number,
  type: DocType
): WeekDocs {
  const docs: WeekDocs = {};
  for (const entry of all) {
    const m = entry.id.match(ID_RE);
    if (!m || Number(m[1]) !== weekNumber || m[2] !== type) continue;
    docs[m[3] ? 'macc' : 'ug'] = entry;
  }
  return docs;
}
