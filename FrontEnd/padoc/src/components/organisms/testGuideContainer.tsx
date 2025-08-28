'use client';

import Link from "next/link";
import Container from "../atoms/container";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import MoveButton from "../atoms/moveButton";
import Text from "../atoms/text";

export default function TestGuideList() {
  const width = useWindowWidth();

  return (
    <div style={{
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
      border: "2px solid var(--border)",
      maxWidth: "1080px",
      width: "100%",
      margin: "0 auto",
      borderRadius: "1.5rem",
      backgroundColor: "var(--card)",
      padding: "clamp(1rem, 2.2vw, 2rem)",
      boxSizing: "border-box",
      overflow: "hidden"
    }}>
      {/* 제목 섹션 */}
      <div style={{
        textAlign: "center",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "3px solid var(--primary)"
      }}>
        <h1 style={{
          fontWeight: "700",
          fontSize: "clamp(1.5rem, 2.2vw, 2rem)",
          color: "var(--ink-strong)",
          margin: "0 0 0.5rem 0",
          wordWrap: "break-word",
          overflowWrap: "break-word"
        }}>
          테스트 전 안내사항
        </h1>
        <p style={{
          fontSize: "clamp(0.9rem, 1.1vw, 1rem)",
          color: "var(--text-weak)",
          margin: "0",
          wordWrap: "break-word",
          overflowWrap: "break-word"
        }}>
          테스트 진행 전 반드시 확인해주세요
        </p>
      </div>

      {/* 안내사항 내용 */}
      <div style={{
        fontSize: "clamp(1rem, 1.2vw, 1.1rem)",
        lineHeight: "1.8",
        color: "var(--text)",
        marginBottom: "2rem",
        wordWrap: "break-word",
        overflowWrap: "break-word"
      }}>
        <ol style={{
          listStyleType: "decimal",
          paddingLeft: "clamp(1rem, 1.5vw, 1.5rem)",
          margin: "0"
        }}>
          <li style={{
            fontSize: "clamp(1.1rem, 1.3vw, 1.2rem)",
            marginBottom: "1.5rem",
            fontWeight: "600",
            wordWrap: "break-word",
            overflowWrap: "break-word"
          }}>
            <div style={{ marginBottom: "1rem" }}>
              테스트는 다음과 같은 과정으로 진행됩니다.
            </div>

            {/* 테스트 과정 시각화 */}
            <div style={{
              display: "flex",
              flexDirection: (width || 0) < 768 ? "column" : "row",
              gap: "1rem",
              marginTop: "1rem"
            }}>
              <div style={{
                backgroundColor: "var(--primary-light)",
                width: "100%",
                borderRadius: "1rem",
                padding: "clamp(1rem, 1.5vw, 1.5rem)",
                border: "2px solid var(--primary)",
                textAlign: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "bold"
                }}>
                  1
                </div>
                <Text
                  textAlign="center"
                  fontSize="clamp(1rem, 1.2vw, 1.1rem)"
                  color="var(--ink-strong)"
                >
                  자가 문진
                </Text>
                <p style={{
                  fontSize: "clamp(0.8rem, 1vw, 0.9rem)",
                  color: "var(--text-weak)",
                  margin: "0.5rem 0 0 0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  기본적인 건강 상태 확인
                </p>
              </div>

              <div style={{
                backgroundColor: "var(--primary-light)",
                width: "100%",
                borderRadius: "1rem",
                padding: "clamp(1rem, 1.5vw, 1.5rem)",
                border: "2px solid var(--primary)",
                textAlign: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "bold"
                }}>
                  2
                </div>
                <Text
                  textAlign="center"
                  fontSize="clamp(1rem, 1.2vw, 1.1rem)"
                  color="var(--ink-strong)"
                >
                  모음 5초간 발성
                </Text>
                <p style={{
                  fontSize: "clamp(0.8rem, 1vw, 0.9rem)",
                  color: "var(--text-weak)",
                  margin: "0.5rem 0 0 0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  "아" 소리로 5초간 발성
                </p>
              </div>

              <div style={{
                backgroundColor: "var(--primary-light)",
                width: "100%",
                borderRadius: "1rem",
                padding: "clamp(1rem, 1.5vw, 1.5rem)",
                border: "2px solid var(--primary)",
                textAlign: "center",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "var(--primary)",
                  color: "var(--text-on-primary)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "bold"
                }}>
                  3
                </div>
                <Text
                  textAlign="center"
                  fontSize="clamp(1rem, 1.2vw, 1.1rem)"
                  color="var(--ink-strong)"
                >
                  정해진 문장 발성
                </Text>
                <p style={{
                  fontSize: "clamp(0.8rem, 1vw, 0.9rem)",
                  color: "var(--text-weak)",
                  margin: "0.5rem 0 0 0",
                  wordWrap: "break-word",
                  overflowWrap: "break-word"
                }}>
                  화면에 표시되는 문장 읽기
                </p>
              </div>
            </div>
          </li>

          {/* 중요 안내사항 */}
          <li style={{
            marginTop: "1.5rem",
            fontSize: "clamp(1.1rem, 1.3vw, 1.2rem)",
            fontWeight: "600",
            wordWrap: "break-word",
            overflowWrap: "break-word"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem"
            }}>
              <span style={{
                fontSize: "clamp(1.3rem, 1.6vw, 1.5rem)"
              }}>
                ⚠️
              </span>
              <Text
                fontSize="clamp(1rem, 1.2vw, 1.1rem)"
                color="var(--warning-dark)"
              >
                중요 안내사항
              </Text>
            </div>
            <div style={{
              backgroundColor: "var(--warning-light)",
              width: "100%",
              borderRadius: "1rem",
              padding: "clamp(1rem, 1.5vw, 1.5rem)",
              border: "2px solid var(--warning)",
              marginTop: "1rem",
              overflow: "hidden"
            }}>

              <p style={{
                fontSize: "clamp(0.9rem, 1.1vw, 1rem)",
                color: "var(--text)",
                margin: "0",
                lineHeight: "1.6",
                wordWrap: "break-word",
                overflowWrap: "break-word"
              }}>
                본 테스트는 전문 의료 행위가 아닙니다. <br />
                자세한 상담은 전문적인 의사와 진행하시기 바랍니다.
              </p>
            </div>
          </li>
        </ol>
      </div>

      {/* 테스트 시작 버튼 */}
      <div style={{
        textAlign: "center",
        marginTop: "2rem",
        paddingTop: "1.5rem",
        borderTop: "2px solid var(--border)"
      }}>
        <Link
          href="/test/paperweight"
          style={{
            display: 'inline-block',
            textDecoration: 'none'
          }}
        >
          <MoveButton
            value="테스트 진행하기"
            width="clamp(14rem, 18vw, 18rem)"
            height="clamp(3.5rem, 4.5vw, 4.5rem)"
            fontSize="clamp(1.1rem, 1.3vw, 1.3rem)"
            backgroundColor="var(--primary)"
            color="var(--text-on-primary)"
            borderRadius="1rem"
            margin="0"
          />
        </Link>
        <p style={{
          fontSize: "clamp(0.8rem, 1vw, 0.9rem)",
          color: "var(--text-weak)",
          margin: "1rem 0 0 0",
          wordWrap: "break-word",
          overflowWrap: "break-word"
        }}>
          버튼을 클릭하면 테스트가 시작됩니다
        </p>
      </div>
    </div>
  );
}
