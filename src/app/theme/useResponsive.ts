import { useWindowDimensions } from 'react-native';
import { breakpoints } from './theme';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

/**
 * Reads the current window width and classifies it so screens can adapt
 * their layout (single column on mobile, multi-column / centered content
 * with a max width on tablet & desktop web) without duplicating breakpoint
 * logic per screen.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const size: ScreenSize = width >= breakpoints.desktop ? 'desktop' : width >= breakpoints.tablet ? 'tablet' : 'mobile';
  return {
    width,
    size,
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
    isMobile: size === 'mobile',
    /** Content max-width so wide screens don't stretch text/forms edge to edge. */
    contentMaxWidth: size === 'desktop' ? 960 : size === 'tablet' ? 720 : undefined,
    /** Number of columns for grid-like lists (items, templates). */
    columns: size === 'desktop' ? 3 : size === 'tablet' ? 2 : 1,
  };
}
