interface CheckPasswordProps{
  isMatched?:boolean;
}

export default function CheckPassword({
  isMatched,
}:CheckPasswordProps) {
  let color:string = "var(--text)";
  let text:string = "비밀번호를 입력해주세요.";
  if (isMatched === true) {
    color = "var(--success)"
    text = "비밀번호가 일치합니다."
  } else if (isMatched === false) {
    color = "var(--danger)"
    text = "비밀번호가 일치하지 않습니다."
  }
  return (
    <p style={{ color }}>{ text }</p>
  )
}
