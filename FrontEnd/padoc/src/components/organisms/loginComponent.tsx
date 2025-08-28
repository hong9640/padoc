'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import useUserStore from "@/store/userStore"; // 1. Zustand 스토어 import
import useAuthStore from '@/store/authStore';
import Label from "@/components/atoms/label";
import TextInputForm from "@/components/atoms/textInputForm";
import PasswordInputForm from "@/components/atoms/passwordInputForm";
import SubmitButton from "@/components/atoms/submitButton";
import MoveButton from "@/components/atoms/moveButton";

import styles from './loginComponent.module.css';

export default function LoginComponent() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setUser = useUserStore(s => s.setUser);
  const { setAuth } = useAuthStore();
  const beApiUrl = process.env.NEXT_PUBLIC_BE_API_URL;

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await fetch(`${beApiUrl}/auth/sessions`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ login_id: id, password }),
      });
      if (!res.ok) throw new Error('아이디 또는 비밀번호가 틀렸습니다.');

      const { access_token, role, account_id } = await res.json();
      
      // 중앙화된 인증 스토어에 저장
      setAuth(access_token, role, String(account_id));

      // 사용자 정보 가져오기
      const userRes = await fetch(`${beApiUrl}/users/profile`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!userRes.ok) throw new Error('사용자 정보를 가져오는데 실패했습니다.');

      const userData = await userRes.json();
      setUser(userData);
      
      alert('로그인 성공!');

      // 잠시 대기 후 리다이렉션 (토큰 저장 완료 보장)
      setTimeout(() => {
        if (role === 'patient') {
          router.push('/patient/dashboard');
        } else if (role === 'doctor') {
          router.push('/doctor/dashboard');
        } else {
          throw new Error('알 수 없는 사용자 역할입니다.');
        }
      }, 100);

      return userData;
    } catch (err: any) {
      console.error('로그인 실패:', err);
      setError(err.message);
    }
  };


  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>로그인</h2>

        <div className={styles.field}>
          <Label htmlFor="login_id" fontSize="1.5rem" color="var(--primary)">
            아이디
          </Label>
          <TextInputForm
            id="login_id"
            placeholder="아이디 입력"
            value={id}
            height="3.5rem"
            fontSize="1.5rem"
            onChange={e => setId(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="password" fontSize="1.5rem" color="var(--primary)">
            비밀번호
          </Label>
          <PasswordInputForm
            id="password"
            placeholder="비밀번호 입력"
            value={password}
            height="3.5rem"
            fontSize="1.5rem"
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <div className={styles.error}>⚠️ {error}</div>}
        
        <div className={styles.buttonGroup}>
        <SubmitButton
            value="로그인"
            onClick={handleLogin}
            height="4rem"
            width="100%"
            fontSize="1.25rem"
            backgroundColor="var(--primary)"
            color="var(--text-on-primary)"
            borderRadius="0.75rem"
          />

        <MoveButton
            url="/signup"
            value="회원가입 하러가기"
            height="4rem"
            width="100%"
            fontSize="1.25rem"
            backgroundColor="var(--secondary)"
            color="var(--text-on-primary)"
            borderRadius="0.75rem"
          />
          </div>
      </div>
    </div>
  );
}