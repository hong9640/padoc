'use client';

import { usePathname } from 'next/navigation';
import styles from './doctorNavigation.module.css';

const doctorTabs = [
  { label: '대시보드', path: '/doctor/dashboard' },
  { label: '최대발성지속시간(MPT)', path: '/doctor/datatable/ah' },
  { label: '문장 발성', path: '/doctor/datatable/sentence' },
  { label: '개인정보', path: '/doctor/profile' },
];

export default function DoctorNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation}>
      {doctorTabs.map((tab) => (
        <a
          key={tab.path}
          href={tab.path}
          className={`${styles.navLink} ${
            pathname === tab.path ? styles.active : ''
          }`}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
