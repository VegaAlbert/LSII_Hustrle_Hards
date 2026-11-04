import { formatRelativeTime } from '../relativeTime';

const now = new Date('2026-10-28T12:00:00Z');
const before = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

describe('formatRelativeTime', () => {
  it.each([
    [30, 'just now'],
    [5 * 60, '5 minutes ago'],
    [3 * 60 * 60, '3 hours ago'],
    [24 * 60 * 60, 'yesterday'],
    [3 * 24 * 60 * 60, '3 days ago'],
    [2 * 7 * 24 * 60 * 60, '2 weeks ago'],
    [3 * 30 * 24 * 60 * 60, '3 months ago'],
    [365 * 24 * 60 * 60, 'last year'],
    [4 * 365 * 24 * 60 * 60, '4 years ago'],
  ])('formats %i seconds ago as "%s"', (seconds, expected) => {
    expect(formatRelativeTime(before(seconds), now)).toBe(expected);
  });

  it('formats future dates too', () => {
    expect(formatRelativeTime(new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), now)).toBe('in 2 hours');
  });
});
