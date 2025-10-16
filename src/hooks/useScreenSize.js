import { useState, useEffect } from 'react';

function useScreenSize() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024); // Tablet range: 768px-1023px (hamburger menu)
      setIsDesktop(width >= 1024 && width < 1920); // Desktop range: 1024px-1919px (full navigation)
      setIsLargeDesktop(width >= 1920); // Large Desktop: 1920px+ (full navigation)
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isMobile, isTablet, isDesktop, isLargeDesktop };
}

export default useScreenSize;
