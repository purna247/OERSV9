import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SideBar } from './SideBar';
import { MobileBottomNav } from './MobileBottomNav';
import { PageTransition } from './PageTransition';
import { PageContainer } from './PageContainer';

export const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-clay-bg flex">
      <SideBar isOpen={isMobileMenuOpen} closeMenu={closeMobileMenu} />
      
      <div className="flex-1 flex flex-col min-h-screen transition-all lg:pl-64 relative">
        <TopBar toggleMobileMenu={toggleMobileMenu} />
        
        {/* Main Content Area */}
        <main className="flex-1 pt-16 pb-16 lg:pb-0">
          <PageContainer>
            <PageTransition>
              <Outlet />
            </PageTransition>
          </PageContainer>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default DashboardLayout;
