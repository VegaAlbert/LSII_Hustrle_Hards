import { shareUrl } from '../shareUrl';

describe('shareUrl', () => {
  it('adds the start time in whole seconds', () => {
    expect(shareUrl('http://localhost/videos/5', 90.7)).toBe('http://localhost/videos/5?t=90');
  });

  it('leaves the link alone when starting from the beginning', () => {
    expect(shareUrl('http://localhost/videos/5', 0)).toBe('http://localhost/videos/5');
  });
});
