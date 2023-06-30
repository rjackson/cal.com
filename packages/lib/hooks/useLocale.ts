import { useTranslation } from "next-i18next";

export const useLocale = (namespace: Parameters<typeof useTranslation>[0] = "common") => {
  const { i18n, t, ready } = useTranslation(namespace);
  const isLocaleReady = !ready || Object.keys(i18n).length > 0;

  // Don't render text if the translations aren't ready. We'll prefer a flash of emptiness over a flash of untranslated tokens
  const wrappedT = (...args: Parameters<typeof t>): ReturnType<typeof t> => {
    console.log(ready);
    if (!ready) {
      return null;
    }

    return t(...args);
  };

  return {
    i18n,
    t: wrappedT,
    isLocaleReady,
  };
};
