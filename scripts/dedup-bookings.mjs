/**
 * Rimuove booking duplicati da Supabase.
 * Un duplicato è definito come stesso (client_id o client_name) + date + time.
 * Per ogni gruppo di duplicati, mantiene solo il record con ID più recente
 * (quello importato dopo il fix delle date).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://azjqamhugffwpimwjsnp.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6anFhbWh1Z2Zmd3BpbXdqc25wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgzMjI3MCwiZXhwIjoyMDg5NDA4MjcwfQ.O8nskWgSd58Opg0xXCS1-2VoFBDHidbGsSkuqKntoYo";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("🔍 Carico tutti i booking...");

  // Carica tutto in pagine da 1000
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.from("bookings").select("id, client_id, client_name, date, time, created_via").range(from, from + 999);
    if (error) { console.error("Errore:", error.message); process.exit(1); }
    if (!data.length) break;
    all = all.concat(data);
    from += 1000;
    if (data.length < 1000) break;
  }
  console.log(`📊 Totale booking: ${all.length}`);

  // Raggruppa per chiave (client_id + date + time)
  const groups = {};
  for (const b of all) {
    const key = `${b.client_id}|${b.date}|${b.time}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }

  // Trova duplicati
  const toDelete = [];
  let dupGroups = 0;
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      dupGroups++;
      // Mantieni l'ultimo per ID (alfabeticamente più alto = più recente per b_imp_N_xxx)
      const sorted = [...group].sort((a, b) => b.id.localeCompare(a.id));
      const keep = sorted[0];
      const remove = sorted.slice(1);
      toDelete.push(...remove.map(b => b.id));
      if (dupGroups <= 5) {
        console.log(`  Duplicato: ${key} → tengo ${keep.id}, elimino ${remove.map(b => b.id).join(", ")}`);
      }
    }
  }

  if (!toDelete.length) {
    console.log("✅ Nessun duplicato trovato!");
    return;
  }

  console.log(`\n🗑  Trovo ${toDelete.length} duplicati in ${dupGroups} gruppi. Elimino...`);

  // Elimina in batch da 100
  for (let i = 0; i < toDelete.length; i += 100) {
    const batch = toDelete.slice(i, i + 100);
    const { error } = await supabase.from("bookings").delete().in("id", batch);
    if (error) { console.error("Errore delete:", error.message); process.exit(1); }
    process.stdout.write(`\r  ${Math.min(i + 100, toDelete.length)}/${toDelete.length} eliminati...`);
  }

  console.log(`\n✅ Pulizia completata! Rimasti ${all.length - toDelete.length} booking.`);
}

main().catch(err => {
  console.error("❌ Errore:", err.message);
  process.exit(1);
});
