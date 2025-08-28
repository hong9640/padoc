'use client';

import { useState, useEffect } from 'react';
import Logo from "./logo";
import LogoutButton from "./logout";
import ThemeSelector from "./themeSelector";
import useAuthStore from "@/store/authStore";

export default function Header() {
  const { isAuthenticated } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 모바일 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  return (
    <header style={{
      backgroundColor: "var(--card)",
      height: "clamp(60px, 10vh, 100px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 clamp(10px, 2vw, 30px)",
      borderBottom: "solid rgba(202, 202, 202, 0.51) 1px",
      position: "relative",
      zIndex: 1000,
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
      }}>
        <Logo />
        <h1 style={{
          fontSize: '2rem',
          color: 'var(--ink)',
          fontWeight: 700,
        }}>PaDoc</h1>
      </div>
      
      {/* 데스크톱 메뉴 */}
      {!isMobile && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <ThemeSelector />
          {isAuthenticated && <LogoutButton />}
        </div>
      )}

      {/* 모바일 햄버거 버튼 */}
      {isMobile && (
        <button
          className="hamburger-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            gap: '4px',
          }}
        >
          <div style={{
            width: '24px',
            height: '2px',
            backgroundColor: 'var(--text)',
            transition: 'all 0.3s ease',
            transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
          }} />
          <div style={{
            width: '24px',
            height: '2px',
            backgroundColor: 'var(--text)',
            transition: 'all 0.3s ease',
            opacity: isMobileMenuOpen ? 0 : 1,
          }} />
          <div style={{
            width: '24px',
            height: '2px',
            backgroundColor: 'var(--text)',
            transition: 'all 0.3s ease',
            transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
          }} />
        </button>
      )}

      {/* 모바일 메뉴 */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="mobile-menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            left: 0,
            backgroundColor: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 999,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              테마 설정
            </span>
            <ThemeSelector compact={true} />
          </div>
          
          {isAuthenticated && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 0',
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text)',
              }}>
                계정
              </span>
              <LogoutButton compact={true} />
            </div>
          )}
        </div>
      )}

      <style jsx>{`
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
      `}</style>
    </header>
  );
}
