import { extractHashtags, hashtagSearchUrl, splitHashtags } from '../hashtags';

describe('hashtags', () => {
  it('extracts the hashtags of a text in order and without repeats', () => {
    expect(extractHashtags('Trip #Girona #travel, more #girona and #ñandú_2')).toEqual(['Girona', 'travel', 'ñandú_2']);
    expect(extractHashtags('No tags # here')).toEqual([]);
  });

  it('splits a text into plain parts and hashtags', () => {
    expect(splitHashtags('#a is #b!')).toEqual([
      { kind: 'hashtag', value: 'a' },
      { kind: 'text', value: ' is ' },
      { kind: 'hashtag', value: 'b' },
      { kind: 'text', value: '!' },
    ]);
  });

  it('builds the search link of a hashtag', () => {
    expect(hashtagSearchUrl('travel')).toBe('/?q=%23travel');
  });
});
