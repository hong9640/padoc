import { useWindowWidth } from './useWindowWidth';

export function useAutoSizing() {
  const windowWidth = useWindowWidth()
  let width = "1080px"
  if (windowWidth) {
    width = windowWidth > 1080 ? "1080px" : "auto";
  }

  return width;
}
