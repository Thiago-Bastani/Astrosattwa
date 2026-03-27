// SVG path data for zodiac sign glyphs, defined in a 24x24 coordinate space.
// Each path is a recognizable astrological symbol.

export const ZODIAC_SVG_PATHS: Record<string, string> = {
  Aries:
    'M 5 20 Q 5 8 12 6 Q 19 8 19 20 M 12 6 L 12 22',
  Taurus:
    'M 5 5 Q 3 9 7 11 Q 12 13 17 11 Q 21 9 19 5 M 12 11 L 12 20 M 8 16 A 4 4 0 0 0 16 16 A 4 4 0 0 0 8 16',
  Gemini:
    'M 4 4 Q 12 7 20 4 M 4 20 Q 12 17 20 20 M 9 5 L 9 19 M 15 5 L 15 19',
  Cancer:
    'M 5 10 A 4 4 0 1 1 13 10 L 19 10 Q 22 10 22 13 Q 22 17 19 17 M 19 14 A 4 4 0 1 1 11 14 L 5 14 Q 2 14 2 11 Q 2 7 5 7',
  Leo:
    'M 5 14 A 4 4 0 1 1 5 7 Q 5 3 9 3 Q 15 3 15 9 Q 15 16 19 16 M 19 14 A 2 2 0 1 1 19 18 A 2 2 0 1 1 19 14',
  Virgo:
    'M 3 20 L 3 6 Q 3 3 6 6 L 9 20 M 6 6 Q 6 3 9 6 L 12 20 M 9 6 Q 9 3 12 6 L 15 13 Q 15 18 19 18 Q 21 18 21 15 M 15 13 Q 19 11 19 8',
  Libra:
    'M 4 19 L 20 19 M 4 15 L 20 15 M 12 15 Q 6 15 6 10 Q 6 5 12 5 Q 18 5 18 10 Q 18 15 12 15',
  Scorpio:
    'M 3 20 L 3 6 Q 3 3 6 6 L 9 20 M 6 6 Q 6 3 9 6 L 12 20 M 9 6 Q 9 3 12 6 L 15 20 L 19 16 M 17 20 L 19 16 L 21 20',
  Sagittarius:
    'M 4 20 L 20 4 M 13 4 L 20 4 L 20 11 M 8 16 L 16 8',
  Capricorn:
    'M 3 16 L 3 4 Q 5 2 8 5 Q 11 8 11 12 L 11 16 Q 11 20 15 20 Q 19 20 19 16 A 3 3 0 1 0 19 16',
  Aquarius:
    'M 3 9 L 6 6 L 9 9 L 12 6 L 15 9 L 18 6 L 21 9 M 3 15 L 6 12 L 9 15 L 12 12 L 15 15 L 18 12 L 21 15',
  Pisces:
    'M 8 4 Q 3 4 3 12 Q 3 20 8 20 M 16 4 Q 21 4 21 12 Q 21 20 16 20 M 2 12 L 22 12',
};
