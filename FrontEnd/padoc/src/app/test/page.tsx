import Link from "next/link";
import TestGuideContainer from "@/components/organisms/testGuideContainer";
import MoveButton from "@/components/atoms/moveButton";

import styles from './testGuide.module.css';

export default function TestGuidePage() {
  return (
    <main className={styles.page}>
      <header className={styles.headerBar}>
        <h1 className={styles.title}>파킨슨 테스트 안내</h1>
        <p className={styles.subtitle}>
          음성 기반 자가 점검을 시작하기 전에 준비 사항과 진행 방법을 확인하세요.
        </p>
      </header>

      {/* 안내 카드 */}
      <section>
        <TestGuideContainer />
      </section>

      {/* 하단 액션: 홈으로 */}
      <div className={styles.actions}>
        <Link href="/">
          <MoveButton
            value="홈 화면으로 이동"
            width="15rem"
            height="4rem"
            fontSize="1.5rem"
            backgroundColor="var(--ink-strong)"
            color="var(--background)"
            borderRadius="0.75rem"
            margin="0"
          />
        </Link>
      </div>
    </main>
  );
}