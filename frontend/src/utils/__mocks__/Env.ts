export const getEnv = jest.fn(() => {
  return {
    API_BASE_URL: `/api`,
    MEDIA_BASE_URL: `/media`,
    GOOGLE_CLIENT_ID: '',
  };
});
