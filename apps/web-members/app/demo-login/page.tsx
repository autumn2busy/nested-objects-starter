
"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Outseta?: any;
  }
}

export default function DemoLogin() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const u = await window.Outseta?.getUser?.();
        setUser(u || null);
      } catch(e) {
        console.warn("Outseta not initialized yet");
      }
    };
    check();
  }, []);

  return (
    <main style={{padding: 24}}>
      <h1>Outseta Login Demo</h1>
      <p>Use the Outseta widget to sign in/sign up.</p>
      <div style={{marginTop: 12}}>
        <button onClick={() => window.Outseta?.openLogin?.()}>Open Login</button>
        <button onClick={() => window.Outseta?.openProfile?.()} style={{marginLeft: 8}}>Open Profile</button>
      </div>
      <pre style={{marginTop: 16, background: "#f4f4f5", padding: 12, borderRadius: 8}}>
        {JSON.stringify(user, null, 2)}
      </pre>
    </main>
  );
}
