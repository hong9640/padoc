// 서버 컴포넌트 (기본)
import styles from './patientLayout.module.css';


export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    // 로고/전역 헤더 바로 아래 공간 전체를 패딩 주고
    // 그 안에 큰 흰 테두리 프레임으로 children을 감쌉니다.
    <div className={styles.pageWrap}>
      <div className={styles.surface}>
        {children}
      </div>
    </div>
  );
}
