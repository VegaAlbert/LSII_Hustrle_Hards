export const getEnv = () => {
  const { VITE_API_DOMAIN, VITE_MEDIA_DOMAIN, VITE_GOOGLE_CLIENT_ID, ...otherViteConfig } = import.meta.env;

  return {
    API_BASE_URL: `${VITE_API_DOMAIN}/api`,
    MEDIA_BASE_URL: `${VITE_MEDIA_DOMAIN}/media`,
    // OAuth client id of "Sign in with Google"; empty hides the Google button
    GOOGLE_CLIENT_ID: (VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '',
    __vite__: otherViteConfig,
  };
};
