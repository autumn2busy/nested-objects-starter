
import Link from "next/link";

export default function Page() {
  return (
    <main style={{padding: 24, fontFamily: "system-ui, sans-serif"}}>
      <h1>Nested Objects Members</h1>
      <p>Welcome! This is your staging app.</p>
      <ul style={{marginTop: 16}}>
        <li><Link href="/directory">Directory</Link></li>
        <li><Link href="/demo-login">Demo Login (Outseta)</Link></li>
      </ul>
    </main>
  );
}
