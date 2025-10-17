// Sidebar Component - MANDATORY PATTERN
import React, { useState, useRef, useEffect } from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import NavSidebar from './NavSidebar';

const Sidebar = ({ show, onSetShow, position = "left" }) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchCurrentX, setTouchCurrentX] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [touchSupported, setTouchSupported] = useState(false);
  const sidebarRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    setTouchSupported(typeof window === "object" && "ontouchstart" in window);
  }, []);

  useEffect(() => {
    if (sidebarRef.current) setSidebarWidth(sidebarRef.current.offsetWidth);
  }, []);

  const getMovePercent = () => {
    if (!touchStartX || !touchCurrentX || !sidebarWidth) return 0;
    if (position === "right") {
      return show ? Math.max(0, Math.min(100, ((touchStartX - touchCurrentX + sidebarWidth) / sidebarWidth) * 100)) : Math.max(0, Math.min(100, ((window.innerWidth - touchCurrentX) / sidebarWidth) * 100));
    }
    return show ? Math.max(0, Math.min(100, ((touchCurrentX - touchStartX + sidebarWidth) / sidebarWidth) * 100)) : Math.max(0, Math.min(100, (touchCurrentX / sidebarWidth) * 100));
  };

  const percentage = getMovePercent();

  useEffect(() => {
    if (!touchSupported) return;

    const handleTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(() => setTouchCurrentX(e.touches[0].clientX));
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        const dragToggleDistance = 30;
        if ((show && percentage < 100 - dragToggleDistance) || (!show && percentage > dragToggleDistance)) {
          onSetShow(!show);
        }
        setIsDragging(false);
        setTouchStartX(null);
        setTouchCurrentX(null);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [touchSupported, isDragging, show, onSetShow, percentage]);

  const handleTouchStart = (e) => {
    if (!touchSupported || isDragging) return;
    const touch = e.touches[0];
    if (show && sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      const isNearEdge = position === "left" ? touch.clientX >= rect.right - 40 : touch.clientX <= rect.left + 40;
      if (!isNearEdge) return;
    }
    setIsDragging(true);
    setTouchStartX(touch.clientX);
    setTouchCurrentX(touch.clientX);
  };

  const getTransform = () => {
    if (isDragging) return position === "right" ? `translateX(${100 - percentage}%)` : `translateX(-${100 - percentage}%)`;
    return position === "right" ? (show ? "translateX(0%)" : "translateX(100%)") : show ? "translateX(0%)" : "translateX(-100%)";
  };

  const shouldShowDragHandle = touchSupported && !show && (isMobile || isTablet);
  const isRight = position === "right";

  return (
    <>
      {shouldShowDragHandle && (
        <div 
          className={`fixed top-0 bottom-0 z-30 touch-manipulation ${isRight ? "right-0" : "left-0"}`} 
          style={{ width: 40 }} 
          onTouchStart={handleTouchStart} 
        />
      )}
      
      {/* Mobile Backdrop - MANDATORY (Mobile/Tablet Only) */}
      {(isMobile || isTablet) && (
        <div
          className={`fixed inset-0 z-[90] transition-all duration-300 ease-in-out bg-black/50 ${
            show ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          style={{
            pointerEvents: show ? 'auto' : 'none'
          }}
          onClick={() => onSetShow?.(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 h-full shadow-lg overflow-y-auto scrollbar-hide
          ${position === 'left' ? 'left-0' : 'right-0'}
          ${(isMobile || isTablet) ? 'w-80 max-w-[80vw] z-[100]' : 'lg:w-[270px] z-30'}
        `}
        style={{
          transform: getTransform(),
          WebkitTransform: getTransform(),
          transition: isDragging ? "transform 0s ease-in-out" : "transform 300ms ease-in-out",
        }}
        onTouchStart={shouldShowDragHandle ? undefined : handleTouchStart}
      >
        <NavSidebar />
      </div>
    </>
  );
};

export default Sidebar;