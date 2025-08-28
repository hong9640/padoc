'use client'

import { useEffect, useState } from "react"
import Label from "@/components/atoms/label"
import PasswordInputForm from "@/components/atoms/passwordInputForm"
import SubmitButton from "@/components/atoms/submitButton"
import MoveButton from "@/components/atoms/moveButton"
import Link from "next/link"
import { useRouter } from "next/navigation"

import styles from './patientCheckPassword.module.css';

export default function Page() {
  const router = useRouter()
  const [pwd, setPwd] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;

  let nextRoute = '/'
  let beforeRoute = '/'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const t = window.localStorage.getItem('access_token');
        const r = window.localStorage.getItem('role');
        setAccessToken(t);
        setRole(r);
      } finally {
        setReady(true);
      }
    }
  }, []);

  if (role === 'patient') {
    nextRoute = '/patient/profile/modify'
    beforeRoute = '/patient/profile'
  } else if (role === 'doctor') {
    nextRoute = '/doctor/profile/modify'
    beforeRoute = '/doctor/profile'
  } else {
    nextRoute = '/'
  }

  const handleSuccess = () => {
    alert('비밀번호 확인이 완료되었습니다.');
    router.push(nextRoute);
  };

  const handleError = () => {
    alert('비밀번호가 일치하지 않습니다.');
  };

  const handleSubmit = async () => {
    const payload: Record<string, any> = {
      "password": pwd,
    };
    try {
      const response = await fetch(beApiUrl + '/auth/verify-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || '비밀번호 확인에 실패하였습니다.');
      }

      const data = await response.json();

      if (data.result === true) {
        handleSuccess();
      } else {
        handleError();
      }

    } catch (err) {
      handleError();
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.surface}>
        {/* 타이틀 */}
        <header className={styles.headerBar}>
          <h1 className={styles.title}>비밀번호 확인</h1>
          <p className={styles.subtitle}>
            개인정보 수정을 위해 비밀번호를 한 번 더 확인합니다.
          </p>
        </header>

        {/* 본문 카드 */}
        <section className={styles.card}>
          <div className={styles.panel}>
            <div className={styles.field}>
              <Label color="var(--doctor-primary)" fontSize="1.5rem" htmlFor="passwordcheck">비밀번호</Label>
                             <PasswordInputForm
                 placeholder="비밀번호를 입력하세요"
                 onChange={(e) => setPwd(e.target.value)}
                 height="3.25rem"
                 fontSize="1.25rem"
                 id="passwordcheck"
               />
            </div>

            <div className={styles.actions}>
                           <SubmitButton
               value="비밀번호 확인"
               width="180px"
               height="48px"
               fontSize="1.25rem"
               onClick={handleSubmit}
             />
              <Link href={beforeRoute} style={{ textDecoration: 'none' }}>
                <MoveButton
                  value="이전 페이지로 이동"
                  width="auto"
                  height="48px"
                  fontSize="1.1rem"
                />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}