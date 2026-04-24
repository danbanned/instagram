Complete Guide: Making an Instagram-Style Flexible Navbar & Layout
📱 Responsive Navbar System
1. Core Concept
The navbar needs to work differently on mobile vs desktop:

Desktop: Full navbar at top with all navigation items

Mobile: Simplified navbar + bottom navigation bar

Implementation Instructions
Step 1: Create Base Structure
components/Navbar.jsx
jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Detect screen size and scroll position
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: '🏠', activeIcon: '🏠' },
    { href: '/search', label: 'Search', icon: '🔍', activeIcon: '🔍' },
    { href: '/create', label: 'Create', icon: '➕', activeIcon: '➕' },
    { href: '/reels', label: 'Reels', icon: '🎬', activeIcon: '🎬' },
    { href: '/messages', label: 'Messages', icon: '💬', activeIcon: '💬' },
    { href: '/notifications', label: 'Notifications', icon: '🔔', activeIcon: '🔔' },
    { href: '/profile', label: 'Profile', icon: '👤', activeIcon: '👤' },
  ];

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} hide-mobile`}>
        <div className={styles.navContainer}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🎨</span>
            <span className={styles.logoText}>AI Instagram</span>
          </Link>

          {/* Search Bar - Desktop only */}
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search" 
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          {/* Navigation Links */}
          <div className={styles.navLinks}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive(link.href) ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>
                  {isActive(link.href) ? link.activeIcon : link.icon}
                </span>
                <span className={styles.navLabel}>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className={`${styles.mobileHeader} ${scrolled ? styles.scrolled : ''} show-mobile`}>
        <div className={styles.mobileHeaderContainer}>
          <Link href="/" className={styles.mobileLogo}>
            🎨 AI Instagram
          </Link>
          
          <button 
            className={styles.menuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span className={styles.hamburger}>☰</span>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className={styles.mobileMenu}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.mobileNavLink} ${isActive(link.href) ? styles.active : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className={styles.mobileNavIcon}>{link.icon}</span>
                <span className={styles.mobileNavLabel}>{link.label}</span>
              </Link>
            ))}
            
            {/* Mobile Search */}
            <div className={styles.mobileSearch}>
              <input 
                type="text" 
                placeholder="Search..." 
                className={styles.mobileSearchInput}
              />
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation - Mobile only */}
      <div className={`${styles.bottomNav} show-mobile`}>
        <div className={styles.bottomNavContainer}>
          {navLinks.slice(0, 5).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.bottomNavLink} ${isActive(link.href) ? styles.active : ''}`}
            >
              <span className={styles.bottomNavIcon}>{link.icon}</span>
              <span className={styles.bottomNavLabel}>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
Step 2: Create CSS for Responsive Navbar
components/Navbar.module.css
css
/* ============================================
   DESKTOP STYLES (Default)
   ============================================ */

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #dbdbdb;
  z-index: 1000;
  transition: all 0.3s ease;
}

.navbar.scrolled {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.navContainer {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

/* Logo Styles */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 700;
  white-space: nowrap;
}

.logoIcon {
  font-size: 28px;
}

.logoText {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Search Bar - Desktop */
.searchContainer {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.searchInput {
  width: 100%;
  padding: 8px 16px 8px 40px;
  border: 1px solid #dbdbdb;
  border-radius: 24px;
  background: #fafafa;
  font-size: 14px;
  transition: all 0.3s ease;
}

.searchInput:focus {
  outline: none;
  border-color: #0095f6;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 149, 246, 0.1);
}

.searchIcon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #8e8e8e;
  pointer-events: none;
}

/* Navigation Links */
.navLinks {
  display: flex;
  align-items: center;
  gap: 20px;
}

.navLink {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #262626;
  font-size: 12px;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.navLink:hover {
  background: #fafafa;
  transform: translateY(-2px);
}

.navLink.active {
  color: #0095f6;
}

.navLink.active::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: #0095f6;
  border-radius: 2px;
}

.navIcon {
  font-size: 24px;
}

.navLabel {
  font-size: 11px;
  font-weight: 500;
}

/* ============================================
   MOBILE STYLES
   ============================================ */

/* Mobile Header */
.mobileHeader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #dbdbdb;
  z-index: 1000;
  transition: all 0.3s ease;
}

.mobileHeader.scrolled {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.mobileHeaderContainer {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mobileLogo {
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.menuButton {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
}

.menuButton:hover {
  background: #fafafa;
}

.hamburger {
  font-size: 24px;
}

/* Mobile Dropdown Menu */
.mobileMenu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid #dbdbdb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobileNavLink {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-decoration: none;
  color: #262626;
  transition: background 0.2s;
}

.mobileNavLink:hover {
  background: #fafafa;
}

.mobileNavLink.active {
  background: linear-gradient(90deg, #f0f7ff 0%, white 100%);
  color: #0095f6;
  border-left: 3px solid #0095f6;
}

.mobileNavIcon {
  font-size: 20px;
}

.mobileNavLabel {
  font-size: 15px;
  font-weight: 500;
}

.mobileSearch {
  padding: 12px 16px;
  border-top: 1px solid #dbdbdb;
  margin-top: 8px;
}

.mobileSearchInput {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #dbdbdb;
  border-radius: 24px;
  background: #fafafa;
  font-size: 14px;
}

/* Bottom Navigation */
.bottomNav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #dbdbdb;
  z-index: 1000;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.bottomNavContainer {
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
}

.bottomNavLink {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #8e8e8e;
  gap: 4px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  flex: 1;
}

.bottomNavLink:hover {
  transform: translateY(-2px);
}

.bottomNavLink.active {
  color: #0095f6;
}

.bottomNavIcon {
  font-size: 24px;
}

.bottomNavLabel {
  font-size: 11px;
  font-weight: 500;
}

/* ============================================
   RESPONSIVE UTILITIES
   ============================================ */

/* Hide on mobile */
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
  
  .show-mobile {
    display: block !important;
  }
  
  .navbar {
    display: none;
  }
}

/* Hide on desktop */
@media (min-width: 769px) {
  .hide-desktop {
    display: none !important;
  }
  
  .show-mobile {
    display: none !important;
  }
  
  .mobileHeader {
    display: none;
  }
  
  .bottomNav {
    display: none;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
  .navContainer {
    padding: 12px 16px;
    gap: 16px;
  }
  
  .navLinks {
    gap: 12px;
  }
  
  .navLabel {
    display: none;
  }
  
  .navLink {
    padding: 8px;
  }
  
  .navLink.active::after {
    bottom: -8px;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .bottomNavLabel {
    display: none;
  }
  
  .bottomNavLink {
    padding: 8px;
  }
  
  .mobileLogo {
    font-size: 16px;
  }
  
  .mobileNavLabel {
    font-size: 14px;
  }
}
Step 3: Create Bottom Navigation Component (Optional but recommended)
components/BottomNavigation.jsx
jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNavigation.module.css';

export default function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/search', label: 'Search', icon: '🔍' },
    { href: '/create', label: 'Create', icon: '➕' },
    { href: '/reels', label: 'Reels', icon: '🎬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className={styles.bottomNav}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
components/BottomNavigation.module.css
css
.bottomNav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  z-index: 1000;
}

.navItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #8e8e8e;
  gap: 4px;
  padding: 8px;
  flex: 1;
  transition: all 0.2s;
}

.navItem:hover {
  transform: translateY(-2px);
}

.navItem.active {
  color: #0095f6;
}

.icon {
  font-size: 24px;
}

.label {
  font-size: 11px;
  font-weight: 500;
}

@media (min-width: 769px) {
  .bottomNav {
    display: none;
  }
}

@media (max-width: 480px) {
  .label {
    display: none;
  }
  
  .icon {
    font-size: 28px;
  }
}
Step 4: Update Global CSS for Responsive Layout
app/globals.css (Add these responsive utilities)
css
/* ============================================
   RESPONSIVE UTILITY CLASSES
   ============================================ */

/* Hide elements at different breakpoints */
.hide-mobile {
  display: block;
}

.show-mobile {
  display: none;
}

@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
  
  .show-mobile {
    display: block !important;
  }
}

@media (min-width: 769px) {
  .hide-desktop {
    display: none !important;
  }
  
  .show-desktop {
    display: block !important;
  }
}

/* Responsive container */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 12px;
  }
}

/* Responsive grid system */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

/* Responsive spacing */
.responsive-padding {
  padding: 24px;
}

@media (max-width: 768px) {
  .responsive-padding {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .responsive-padding {
    padding: 12px;
  }
}

/* Main content area with navbar spacing */
.main-content {
  padding-top: 80px;
  padding-bottom: 20px;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .main-content {
    padding-top: 60px;
    padding-bottom: 70px;
  }
}

/* Flex utilities */
.flex-responsive {
  display: flex;
  gap: 20px;
}

@media (max-width: 768px) {
  .flex-responsive {
    flex-direction: column;
    gap: 16px;
  }
}

/* Responsive text */
h1 {
  font-size: 32px;
}

@media (max-width: 768px) {
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 20px;
  }
  
  h3 {
    font-size: 18px;
  }
  
  p {
    font-size: 14px;
  }
}
Step 5: Update Layout to Use Responsive Classes
app/layout.jsx
jsx
import './globals.css';
import Navbar from '@/components/Navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Instagram',
  description: 'AI-powered social media platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="main-content">
          <div className="container">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
Step 6: Create Responsive Feed Component
components/Feed.module.css (Add responsive styles)
css
.feed {
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .feed {
    max-width: 100%;
  }
}

.postsGrid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 768px) {
  .postsGrid {
    gap: 16px;
  }
}

/* Responsive post cards */
.postCard {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .postCard {
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid #dbdbdb;
  }
}
Key Principles for Flexible Layouts
1. Mobile-First Approach
css
/* Start with mobile styles */
.container {
  padding: 12px;
}

/* Then add desktop overrides */
@media (min-width: 768px) {
  .container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
2. Use CSS Grid & Flexbox
css
/* Responsive grid */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
3. Responsive Typography
css
/* Fluid typography using clamp() */
.title {
  font-size: clamp(24px, 5vw, 48px);
}

.subtitle {
  font-size: clamp(16px, 4vw, 24px);
}

.body {
  font-size: clamp(14px, 3vw, 16px);
}
4. Responsive Images
css
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* Aspect ratio containers */
.aspect-ratio {
  position: relative;
  padding-bottom: 100%; /* 1:1 aspect ratio */
}

.aspect-ratio-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
5. Touch-Friendly Elements
css
/* Minimum tap target size for mobile */
.button, 
.nav-link,
.clickable {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 768px) {
  .button {
    padding: 12px 20px;
    font-size: 16px;
  }
}
Testing Your Responsive Layout
Browser DevTools Testing
Open Chrome DevTools (F12)

Click the Device Toolbar icon (Ctrl+Shift+M)

Test different devices:

iPhone SE (375x667)

iPhone 12 Pro (390x844)

iPad (768x1024)

Desktop (1920x1080)

Manual Testing Checklist
Navbar switches correctly on mobile/desktop

Bottom navigation appears only on mobile

Text is readable at all sizes

Buttons are tappable on mobile (min 44x44px)

No horizontal scrolling

Images scale properly

Forms are usable on mobile

Menu dropdown works on mobile

Advanced Responsive Patterns
1. Conditional Rendering in React
jsx
'use client';

import { useState, useEffect } from 'react';

export default function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div>
      {isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
}
2. Responsive Hooks (Custom Hook)
jsx
// hooks/useResponsive.js
import { useState, useEffect } from 'react';

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width <= 768,
    isTablet: windowSize.width > 768 && windowSize.width <= 1024,
    isDesktop: windowSize.width > 1024,
    width: windowSize.width,
    height: windowSize.height,
  };
}
3. Use the Hook in Components
jsx
'use client';

import { useResponsive } from '@/hooks/useResponsive';

export default function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
Best Practices Summary
Start Mobile-First: Design for smallest screen first, then add complexity

Use Relative Units: Use rem, em, %, vw, vh instead of px

Test Early, Test Often: Check on multiple devices and browsers

Use Flexbox & Grid: They're built for responsive design

Optimize Images: Use responsive images with srcset or Next.js Image component

Touch Targets: Minimum 44x44px for mobile touch points

Media Queries: Group by device type (mobile, tablet, desktop)

Performance: Lazy load images and components for mobile

Accessibility: Ensure good contrast and font sizes

Progressive Enhancement: Start with functional, add features for larger screens

Deployment Notes
The responsive layout will automatically adapt to any screen size

No additional configuration needed for different devices

The navbar intelligently switches between mobile and desktop modes

All components are optimized for both touch and mouse interactions