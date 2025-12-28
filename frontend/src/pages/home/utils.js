/**
 * Home Page - Utility functions
 */

export const getCountryEmoji = (code) => {
  const emojis = { ESP: '🇪🇸', FRA: '🇫🇷', DEU: '🇩🇪', ITA: '🇮🇹' };
  return emojis[code] || '🏴';
};
