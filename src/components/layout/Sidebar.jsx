// Sidebar Component - MANDATORY PATTERN
import React, { useState, useRef } from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import NavSidebar from './NavSidebar';

const Sidebar = ({ show, onSetShow, position = "left" }) => {
  const { isMobile } = useScreenSize();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sidebarRef = useRef(null);

  // Touch gesture handling for mobile
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && show) {
      onSetShow?.(false);
    } else if (isRightSwipe && !show) {
      onSetShow?.(true);
    }
  };

  // Touch handle for mobile when sidebar is closed
  const handleTouchHandleStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchHandleMove = (e) => {
    const currentTouch = e.targetTouches[0].clientX;
    const distance = currentTouch - touchStart;
    
    if (distance > 30) {
      onSetShow?.(true);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && (
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ease-in-out bg-black/50 ${
            show ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          style={{
            pointerEvents: show ? 'auto' : 'none'
          }}
          onClick={() => onSetShow?.(false)}
        />
      )}

      {/* Touch Handle - Mobile Only */}
      {isMobile && !show && (
        <div 
          className="fixed top-0 bottom-0 z-30 touch-manipulation left-0" 
          style={{ width: 40 }} 
          onTouchStart={handleTouchHandleStart}
          onTouchMove={handleTouchHandleMove}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed top-0 h-full transition-transform duration-300 ease-in-out
          ${position === 'left' ? 'left-0' : 'right-0'}
          ${isMobile ? 'w-80 max-w-[80vw] z-50' : 'lg:w-[270px] z-30'}
          ${show ? 'translate-x-0' : 'translate-x-full'}
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <NavSidebar />
      </div>
    </>
  );
};

export default Sidebar;