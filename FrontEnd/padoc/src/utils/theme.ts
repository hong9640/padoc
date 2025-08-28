/**
 * CSS 변수를 읽어오는 유틸리티 함수들
 */

// CSS 변수 값을 가져오는 함수
export const getCSSVariable = (variableName: string): string => {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 기본값 반환
    return getDefaultColor(variableName);
  }
  
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
  
  return value || getDefaultColor(variableName);
};

// CSS 변수의 기본 색상 값들
const getDefaultColor = (variableName: string): string => {
  const defaultColors: Record<string, string> = {
    '--primary': '#1E3A8A',
    '--accent': '#1976D2',
    '--success': '#8CC93E',
    '--warning': '#E02A29',
    '--gray-bg': '#F0F0F0',
    '--border': '#E5E7EB',
    '--gray-light': '#E5E7EB',
  };
  
  return defaultColors[variableName] || 'var(--text)';
};

// 테마 색상들을 객체로 반환하는 함수
export const getThemeColors = () => ({
  primary: getCSSVariable('--primary'),
  accent: getCSSVariable('--accent'),
  success: getCSSVariable('--success'),
  warning: getCSSVariable('--warning'),
  grayBg: getCSSVariable('--gray-bg'),
  border: getCSSVariable('--border'),
  grayLight: getCSSVariable('--gray-light'),
});

// 차트 색상들을 객체로 반환하는 함수
export const getChartColors = () => ({
  primary: getCSSVariable('--chart-primary'),
  secondary: getCSSVariable('--chart-secondary'),
  accent: getCSSVariable('--chart-accent'),
  danger: getCSSVariable('--chart-danger'),
  success: getCSSVariable('--chart-success'),
  warning: getCSSVariable('--chart-warning'),
  info: getCSSVariable('--chart-info'),
  purple: getCSSVariable('--chart-purple'),
  pink: getCSSVariable('--chart-pink'),
  gray: getCSSVariable('--chart-gray'),
  bg: getCSSVariable('--chart-bg'),
  grid: getCSSVariable('--chart-grid'),
  text: getCSSVariable('--chart-text'),
  border: getCSSVariable('--chart-border'),
});

// Doctor 페이지 색상들을 객체로 반환하는 함수
export const getDoctorColors = () => ({
  primary: getCSSVariable('--doctor-primary'),
  secondary: getCSSVariable('--doctor-secondary'),
  accent: getCSSVariable('--doctor-accent'),
  bg: getCSSVariable('--doctor-bg'),
  card: getCSSVariable('--doctor-card'),
  border: getCSSVariable('--doctor-border'),
  text: getCSSVariable('--doctor-text'),
  textLight: getCSSVariable('--doctor-text-light'),
  success: getCSSVariable('--doctor-success'),
  warning: getCSSVariable('--doctor-warning'),
  danger: getCSSVariable('--doctor-danger'),
  info: getCSSVariable('--doctor-info'),
});
