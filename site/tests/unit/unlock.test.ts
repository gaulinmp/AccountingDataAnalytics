import { afterEach, describe, expect, it, vi } from 'vitest';
import { gateDate, isLocked, lockTitle, parsePreview, unlockLabel } from '../../src/lib/unlock';

const WEEK_5 = '2026-09-21T00:00:00.000Z';

afterEach(() => vi.useRealTimers());

describe('preview clock parsing', () => {
  it('treats the off-switches and junk as no override', () => {
    for (const raw of [null, undefined, '', '   ', 'off', 'OFF', 'none', 'reset', 'clear', 'banana']) {
      expect(parsePreview(raw)).toBeNull();
    }
  });

  it('unlocks everything for the all-aliases', () => {
    for (const raw of ['all', 'ALL', ' unlock ', 'unlocked', 'open']) {
      expect(parsePreview(raw)).toEqual({ mode: 'all' });
    }
  });

  it('reads a bare YYYY-MM-DD as noon UTC, so the day is timezone-proof', () => {
    expect(parsePreview('2026-09-21')).toEqual({ mode: 'date', at: Date.parse('2026-09-21T12:00:00Z') });
  });

  it('accepts a full timestamp as given', () => {
    expect(parsePreview('2026-09-21T03:30:00Z')).toEqual({
      mode: 'date',
      at: Date.parse('2026-09-21T03:30:00Z'),
    });
  });
});

describe('lock evaluation', () => {
  it('locks a future week and unlocks a past one against the real clock', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00Z'));
    expect(isLocked(WEEK_5, null)).toBe(true);
    vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
    expect(isLocked(WEEK_5, null)).toBe(false);
  });

  it('preview=all opens a week that is still in the future', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00Z'));
    expect(isLocked(WEEK_5, { mode: 'all' })).toBe(false);
  });

  it('a preview date gates exactly as that date would', () => {
    vi.useFakeTimers().setSystemTime(new Date('2026-08-04T12:00:00Z'));
    expect(isLocked(WEEK_5, parsePreview('2026-09-20'))).toBe(true);
    expect(isLocked(WEEK_5, parsePreview('2026-09-21'))).toBe(false);
  });

  it('never locks an element without a parsable unlock date', () => {
    expect(isLocked(undefined, null)).toBe(false);
    expect(isLocked('not-a-date', null)).toBe(false);
  });
});

describe('gateDate', () => {
  const date = new Date(WEEK_5);

  it('never gates the first week of the term', () => {
    expect(gateDate(date, 0)).toBeUndefined();
  });

  it('gates every later week on its own date', () => {
    expect(gateDate(date, 1)).toBe(date);
    expect(gateDate(date, 12)).toBe(date);
  });

  it('leaves a dateless week ungated wherever it sits', () => {
    expect(gateDate(undefined, 0)).toBeUndefined();
    expect(gateDate(undefined, 4)).toBeUndefined();
  });
});

describe('lockTitle', () => {
  const label = 'Monday, September 21';

  it('appends the unlock date only while the entry is locked', () => {
    expect(lockTitle('Week 5: Databases', label, true)).toBe(
      'Week 5: Databases · Unlocks Monday, September 21',
    );
    expect(lockTitle('Week 5: Databases', label, false)).toBe('Week 5: Databases');
  });

  it('stands alone when the element has no title of its own', () => {
    expect(lockTitle('', label, true)).toBe('Unlocks Monday, September 21');
  });

  it('leaves the title alone when there is no date to report', () => {
    expect(lockTitle('Week 5: Databases', undefined, true)).toBe('Week 5: Databases');
  });
});

describe('unlockLabel', () => {
  it('formats in UTC so a bare date does not drift a day', () => {
    expect(unlockLabel(new Date('2026-09-21T00:00:00Z'))).toBe('Monday, September 21');
  });
});
