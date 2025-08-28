'use client';

import { useRouter, usePathname } from 'next/navigation';
import NavButton from "@/components/atoms/navButton";

// 각 탭에 대한 정보를 담는 인터페이스 정의
interface NavTab {
  label: string; // 버튼에 표시될 텍스트
  path: string;  // 이동할 경로
}

// NavBar가 받을 props 정의
interface Props {
  tabs: NavTab[];
}

const NavBar = ({ tabs }: Props) => {
  const router = useRouter();
  const pathname = usePathname(); // 현재 URL 경로를 가져옵니다.

  // 클릭 시 해당 경로로 페이지를 이동시키는 함수
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      {tabs.map((tab) => (
        <NavButton
          key={tab.path}
          label={tab.label}
          // 현재 URL 경로가 탭의 경로와 일치하는지 확인하여 활성화 상태를 결정합니다.
          isActive={pathname === tab.path}
          onClick={() => handleNavigate(tab.path)}
        />
      ))}
    </div>
  );
};

export default NavBar;