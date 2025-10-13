// MainLayout Component - MANDATORY PATTERN
import React, { createContext, useState, useEffect } from 'react';
import useScreenSize from '../../hooks/useScreenSize';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayoutContext = createContext();

const MainLayout = ({ children }) => {
  const { isMobile, isDesktop } = useScreenSize();
  const [show, setShow] = useState(!isMobile);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    if (isMobile) {
      setShow(false); // Mobile: start closed
    } else {
      setShow(true); // Desktop: start open
    }
  }, [isMobile]);

  // Add/remove body class to control scrolling behavior
  useEffect(() => {
    document.body.classList.add('main-layout-active');
    return () => {
      document.body.classList.remove('main-layout-active');
    };
  }, []);

  return (
    <MainLayoutContext.Provider value={{ show, setShow, isMobile, isDesktop }}>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar - Fixed positioned, doesn't affect layout flow */}
        <Sidebar 
          show={show}
          onSetShow={setShow}
          position="left"
        />

        {/* Content Area - Properly positioned relative to sidebar */}
        <div 
          className="flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            marginLeft: isDesktop && show ? '270px' : '0px',
            width: isDesktop && show ? 'calc(100vw - 270px)' : '100vw',
            height: '100vh',
            position: 'relative' // Ensure proper positioning context
          }}
        >
          {/* Header - Sticky positioned within content area */}
          <Header />

          {/* Main Content - Scrollable area */}
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="w-full max-w-full overflow-x-hidden p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MainLayoutContext.Provider>
  );
};

MainLayout.Context = MainLayoutContext;
export default MainLayout;