
import { createClient } from "@/lib/supabase-server";
import { requireFeature } from "@/lib/feature-gate";

export const revalidate = 60;

export default async function Directory() {
  // Server-side: verify session + feature access (directory_access)
  //await requireFeature("directory_access");

  const supabase = createClient();
  const { data: firms, error } = await supabase
    .from("firms")
    .select("*")
    .order("name", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main style={{padding: 24}}>
      <h1>Hiring Firms</h1>
      <ul style={{marginTop: 12, display: "grid", gap: 12}}>
        {firms?.map((f: any) => (
          <li key={f.id} style={{border: "1px solid #e5e7eb", borderRadius: 8, padding: 12}}>
            <strong>{f.name}</strong>
            {f.website ? <> — <a href={f.website} target="_blank">Site</a></> : null}
            <div style={{color: "#4b5563", fontSize: 14}}>{f.niche || "—"} • {f.location || "Remote/Varies"}</div>
            <div style={{fontSize: 14}}>{f.pay_range || ""}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
