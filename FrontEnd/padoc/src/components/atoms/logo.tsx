'use client';

import Link from "next/link"

export default function Logo() {
  return (
    <main style={{ 
      backgroundColor:"var(--card, #FFFFFF)", 
      height:"clamp(50px, 8vh, 70px)", 
      width:"clamp(100px, 16vh, 140px)", 
      borderRadius:"20px", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }}>
      <Link href={"/"} style={{ height: "100%", width: "100%" }}>
        <img 
          src="/img/padoc.png" 
          alt="logo image" 
          style={{ 
            height:"100%", 
            width:"100%",
            objectFit:"contain",
            display:"block"
          }} 
        />
      </Link>
    </main>
  )
}
