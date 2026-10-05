const defaultCategoryColor = '#9e9e9e';

export const functoidCategoryColors: Readonly<Record<string, string>> = {
  String: '#4caf50',
  Math: '#9c27b0',
  Logical: '#ff9800',
  DateTime: '#2196f3',
  Conversion: '#8bc34a',
  Scientific: '#e91e63',
  Cumulative: '#009688',
  DatabaseLookup: '#3f51b5',
  Advanced: '#607d8b',
  Custom: '#795548',
};

export function getFunctoidCategoryColor(category?: string): string {
  return (category && functoidCategoryColors[category]) || defaultCategoryColor;
}

export function getContrastingTextColor(backgroundColor: string): '#000000' | '#ffffff' {
  const red = Number.parseInt(backgroundColor.slice(1, 3), 16);
  const green = Number.parseInt(backgroundColor.slice(3, 5), 16);
  const blue = Number.parseInt(backgroundColor.slice(5, 7), 16);
  const luminance = 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;
  return blackContrast >= whiteContrast ? '#000000' : '#ffffff';
}

function linearize(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}
