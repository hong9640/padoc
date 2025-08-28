'use client';

import { useEffect, useState } from 'react';
import { useTestStore } from '@/store/testStore';
import TestPaperweight from "@/components/organisms/testPaperweight";
import MoveButton from "@/components/atoms/moveButton";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import Text from "@/components/atoms/text";

import styles from './paperweight.module.css';

export default function PaperweightPage() {
  const reset = useTestStore((state) => state.reset);
  const answers = useTestStore((state) => state.answers);
  const router = useRouter();

  useEffect(() => {
    reset();
  }, [reset]);

  const yesCount = Object.values(answers).filter(answer => answer === 'yes').length;

  const handleSubmit = () => {
    const missingQuestions: number[] = [];
    for (let i = 1; i <= 9; i++) {
      if (!answers[`q${i}`]) {
        missingQuestions.push(i);
      }
    }

    if (missingQuestions.length > 0) {
      alert(`다음 문진에 답변하지 않았습니다: ${missingQuestions.join(', ')}번`);
    } else {
      // 모든 질문에 답변했을 경우 다음 페이지로 이동
      router.push('/test/ahTest');
    }
  };

  return (
    <main className={styles.page}>
      {/* 헤더 */}
      <header className={styles.headerBar}>
        <h1 className={styles.title}>파킨슨 자가 문진</h1>
        <p className={styles.subtitle}>아래 항목에 모두 응답하신 뒤 제출해 주세요.</p>
      </header>

      {/* 문진 카드 */}
      <section className={styles.contentCard} aria-labelledby="paperweight-title">
        <div className={styles.title}>
          <Text textAlign="center" fontSize='1.7rem'>
            자가 문진
          </Text>
        </div>
        <TestPaperweight />
        {/* 하단 액션 */}
        <div className={styles.countPill}>
          "예" 응답: <strong>{yesCount}</strong>문항
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={handleSubmit} className={styles.submitBtn}>
            제출하기
          </button>
        </div>
      </section>

      <Link href="/">
        <MoveButton
          value="홈으로 돌아가기"
          width="15rem"
          height="4rem"
          fontSize="1.5rem"
          backgroundColor="var(--ink-strong)"
                      color="var(--text-on-primary)"
          borderRadius="0.75rem"
          margin="0"
        />
      </Link>
    </main>
  );
}