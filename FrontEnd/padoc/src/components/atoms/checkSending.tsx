interface CheckSendingProps{
  sendingStatus:string;
}

export default function CheckSending({
  sendingStatus
}:CheckSendingProps) {
  let message:string = "UNKNOWN"
  let color:string = "var(--text)"
  if (sendingStatus === "sending") {
    message = "sending something..."
    color = "var(--accent)"
  } else if (sendingStatus === "done") {
    message = "sended something!"
    color = "var(--success)"
  }
  return (
    <div style={{ color }}>
      {message}
    </div>
  )
}