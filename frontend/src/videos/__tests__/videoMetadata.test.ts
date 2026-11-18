import { MAX_DESCRIPTION, MAX_TITLE, validateMetadata, type VideoMetadataValues } from '../videoMetadata';

const values = (changes: Partial<VideoMetadataValues> = {}): VideoMetadataValues => ({
  title: 'Summer in Girona',
  description: '',
  tags: [],
  category: '',
  ageRestricted: false,
  ...changes,
});

describe('validateMetadata', () => {
  it('accepts a title and a description within the limits', () => {
    expect(validateMetadata(values())).toEqual({});
  });

  it('asks for a title and keeps title and description within the limits', () => {
    expect(validateMetadata(values({ title: '   ' }))).toEqual({ title: 'Title is required' });
    expect(
      validateMetadata(values({ title: 'a'.repeat(MAX_TITLE + 1), description: 'a'.repeat(MAX_DESCRIPTION + 1) }))
    ).toEqual({
      title: 'Title must be at most 100 characters',
      description: 'Description must be at most 5000 characters',
    });
  });

  it('explains the errors in the given language', () => {
    expect(validateMetadata(values({ title: '' }), 'es')).toEqual({ title: 'El título es obligatorio' });
    expect(validateMetadata(values({ description: 'a'.repeat(MAX_DESCRIPTION + 1) }), 'ca')).toEqual({
      description: 'La descripció pot tenir com a màxim 5000 caràcters',
    });
  });
});
