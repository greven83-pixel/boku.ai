import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";

// ==================== DATA GENERATION ====================
const SERVICES = [
  { id: "bath_small", name: "Bagno Piccola Taglia", duration: 30, price: 25, cost: 8 },
  { id: "bath_med", name: "Bagno Media Taglia", duration: 45, price: 35, cost: 10 },
  { id: "bath_large", name: "Bagno Grande Taglia", duration: 60, price: 45, cost: 14 },
  { id: "groom_small", name: "Toelettatura Completa Piccola", duration: 60, price: 40, cost: 12 },
  { id: "groom_med", name: "Toelettatura Completa Media", duration: 75, price: 55, cost: 15 },
  { id: "groom_large", name: "Toelettatura Completa Grande", duration: 90, price: 70, cost: 20 },
  { id: "stripping", name: "Stripping", duration: 120, price: 85, cost: 22 },
  { id: "trim", name: "Taglio Igienico", duration: 20, price: 15, cost: 5 },
  { id: "nails", name: "Taglio Unghie", duration: 10, price: 10, cost: 2 },
  { id: "teeth", name: "Pulizia Denti", duration: 15, price: 12, cost: 3 },
  { id: "deshed", name: "Trattamento Anti-Muta", duration: 45, price: 50, cost: 16 },
  { id: "spa", name: "SPA Premium", duration: 90, price: 95, cost: 28 },
];

const PET_DATA = {
  cane:     { names: ["Luna","Buddy","Rocky","Bella","Max","Kira","Zeus","Mia","Leo","Lola","Oscar","Nina","Thor","Stella","Rex","Zoe","Duke","Daisy","Simba","Ruby","Charlie","Nala","Bruno","Coco","Jack","Maya","Toby","Lilli","Ares","Moka","Lucky","Pippi","Axel","Bianca","Pluto","Greta","Spike","Chanel","Ringo","Perla"], breeds: ["Barboncino","Golden Retriever","Shih Tzu","Yorkshire","Labrador","Cocker Spaniel","Maltese","Bulldog Francese","Pastore Tedesco","Border Collie","Chihuahua","Beagle","Jack Russell","Setter Irlandese","Schnauzer","Cavalier King","Husky","Bassotto","Boxer","Lagotto Romagnolo"] },
  gatto:    { names: ["Micio","Neve","Tigre","Sole","Luna","Pixel","Momo","Fufi","Birba","Ombra","Pepita","Faro","Briciola","Speedy","Polpo","Nuvola","Zenzero","Cleo","Tartufo","Miele"], breeds: ["Europeo","Persiano","Siamese","Maine Coon","Ragdoll","British Shorthair","Bengala","Sphynx","Certosino","Abissino"] },
  coniglio: { names: ["Fiocco","Polpetta","Biscotto","Batuffolo","Ciuffo","Palla","Carota","Cotone","Macchia","Bolla"], breeds: ["Nano","Ariete","Angorà","Rex","Lionhead","Olandese","Gigante Fiammingo","Mini Rex"] },
  uccello:  { names: ["Cip","Tweetie","Fly","Sole","Pico","Cielo","Birillo","Fifi","Arco","Rio"], breeds: ["Pappagallo","Canarino","Parrocchetto","Cacatua","Cocorita","Ninfea","Inseparabile","Cardellino"] },
  rettile:  { names: ["Spike","Rex","Geko","Flash","Drago","Sandy","Sasso","Bolt","Kaa","Iggy"], breeds: ["Iguana","Leopard Gecko","Pitone Reale","Drago Barbuto","Camaleonte","Tartaruga","Geco Diurno","Serpente del Grano"] },
};
const ANIMAL_TYPES = ["cane","cane","cane","cane","cane","cane","gatto","gatto","gatto","coniglio","uccello","rettile"];
const OWNER_FIRST = ["Marco","Giulia","Alessandro","Francesca","Luca","Arianna","Andrea","Sara","Davide","Elena","Matteo","Chiara","Stefano","Valentina","Roberto","Laura","Paolo","Silvia","Giuseppe","Anna","Lorenzo","Maria","Fabio","Claudia","Simone","Federica","Antonio","Elisa","Michele","Martina"];
const OWNER_LAST = ["Rossi","Bianchi","Ferrari","Russo","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Mancini","Costa","Giordano","Rizzo","Lombardi","Moretti","Barbieri","Fontana","Santoro","Mariani","Rinaldi","Caruso","Ferrara","Galli","Martini","Leone","Longo"];
const SIZES = ["piccola","media","grande"];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateData() {
  const rng = seededRandom(42);
  const ri = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  const pick = arr => arr[ri(0, arr.length - 1)];
  const clients = [];
  const usedPairs = new Set();
  for (let i = 0; i < 60; i++) {
    let fn, ln, key;
    do { fn = pick(OWNER_FIRST); ln = pick(OWNER_LAST); key = fn+ln; } while (usedPairs.has(key));
    usedPairs.add(key);
    const size = pick(SIZES);
    const animalType = pick(ANIMAL_TYPES);
    const petPool = PET_DATA[animalType];
    clients.push({
      id: `c${i}`, firstName: fn, lastName: ln,
      phone: `+39 ${ri(320,389)} ${ri(100,999)} ${ri(1000,9999)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.it`,
      animalType, petName: pick(petPool.names), breed: pick(petPool.breeds), size,
      notes: rng() > 0.7 ? pick(["Animale ansioso, maneggiare con cura","Allergia a shampoo profumati","Preferisce appuntamenti mattutini","Animale anziano, fare attenzione","Pelo annodato frequente","Cliente VIP","Tende a mordere durante taglio unghie","Richiede museruola"]) : "",
      registeredDate: `2025-${String(ri(1,8)).padStart(2,"0")}-${String(ri(1,28)).padStart(2,"0")}`,
      totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
      preferredDay: pick(["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"]),
      source: pick(["whatsapp","instagram","passaparola","google","walk-in"]),
      rating: ri(3,5),
      mordace: rng() > 0.85,
    });
  }
  const bookings = [];
  const statuses = ["completato","completato","completato","completato","completato","completato","completato","cancellato","no-show"];
  let bid = 0;
  for (let m = 0; m < 6; m++) {
    const year = m < 3 ? 2025 : 2026;
    const month = m < 3 ? m + 10 : m - 2;
    const daysInMonth = new Date(year, month, 0).getDate();
    const bookingsThisMonth = ri(95, 135);
    const seasonMult = month === 12 || month === 1 ? 1.15 : month >= 6 && month <= 8 ? 1.1 : 1.0;
    for (let b = 0; b < bookingsThisMonth; b++) {
      const client = pick(clients);
      const day = ri(1, daysInMonth);
      if (new Date(year, month - 1, day).getDay() === 0) continue;
      const hour = ri(8, 17), minute = pick([0, 15, 30, 45]);
      let avail = SERVICES;
      if (client.size === "piccola") avail = SERVICES.filter(s => !s.id.includes("large"));
      if (client.size === "grande") avail = SERVICES.filter(s => !s.id.includes("small"));
      const service = pick(avail);
      const status = m < 5 ? pick(statuses) : (rng() > 0.15 ? "confermato" : "in-attesa");
      const finalPrice = Math.round(service.price * seasonMult * (rng() > 0.85 ? 0.9 : 1));
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      bookings.push({
        id: `b${bid++}`, clientId: client.id, clientName: `${client.firstName} ${client.lastName}`,
        petName: client.petName, animalType: client.animalType, breed: client.breed, serviceId: service.id, serviceName: service.name,
        date: dateStr, time: `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,
        duration: service.duration, price: finalPrice, cost: service.cost, status,
        notes: rng() > 0.8 ? pick(["Richiesto shampoo biologico","Extra profumazione","Fiocco regalo","Taglio specifico come foto","Portare guinzaglio nuovo"]) : "",
        createdVia: pick(["whatsapp","telefono","walk-in","online","instagram"]),
        reminderSent: rng() > 0.3,
        payment: status === "completato" ? pick(["pos","contanti","pos","pos","contanti","bonifico"]) : "",
      });
      if (status === "completato") {
        client.totalSpent += finalPrice; client.visitCount++;
        if (!client.lastVisit || dateStr > client.lastVisit) client.lastVisit = dateStr;
        client.loyaltyPoints += Math.floor(finalPrice / 5);
      }
    }
  }
  bookings.sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
  return { clients, bookings, services: SERVICES };
}

// ==================== DB MAPPERS ====================
const dbToClient = (c) => ({
  id: c.id, firstName: c.first_name, lastName: c.last_name,
  phone: c.phone || "", email: c.email || "",
  notes: c.notes || "", registeredDate: c.registered_date,
  totalSpent: Number(c.total_spent) || 0, visitCount: c.visit_count || 0,
  lastVisit: c.last_visit, loyaltyPoints: c.loyalty_points || 0,
  preferredDay: c.preferred_day, source: c.source, rating: c.rating,
});

const dbToPet = (p) => ({
  id: p.id, clientId: p.client_id, name: p.name,
  animalType: p.animal_type || "cane", breed: p.breed || "Meticcio",
  size: p.size || "media", mordace: p.mordace || false, notes: p.notes || "",
});

const dbToBooking = (b) => ({
  id: b.id, clientId: b.client_id, clientName: b.client_name,
  petName: b.pet_name, animalType: b.animal_type, breed: b.breed,
  serviceId: b.service_id, serviceName: b.service_name,
  date: b.date, time: b.time, duration: b.duration,
  price: Number(b.price) || 0, cost: Number(b.cost) || 0, status: b.status,
  notes: b.notes || "", createdVia: b.created_via, reminderSent: b.reminder_sent || false,
  payment: b.payment || "",
});

// ==================== ICONS ====================
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const icons = {
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
    trend: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/><polyline points="16,7 22,7 22,13"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    whatsapp: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
    arrow_up: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
    arrow_down: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
    left: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
    right: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    brain: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a5 5 0 015 5c0 1.5-.5 2.5-1.5 3.5L12 14l-3.5-3.5C7.5 9.5 7 8.5 7 7a5 5 0 015-5z"/><path d="M12 14v8M8 18h8"/></svg>,
    dog: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 2.028M10 5.172c1.056.886 2 2.386 2 4.328V12h1a4 4 0 010 8H7a4 4 0 01-4-4v-1l1.538-1.769A2 2 0 006 11.5h0"/><path d="M14 6l1-1 1 1M14 9h4l1-4"/><circle cx="8.5" cy="16.5" r=".5" fill={color}/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  };
  return icons[name] || null;
};

// ==================== ANIMAL COLORS ====================
const ANIMAL_COLORS = {
  cane:     { bg: "rgba(110,231,183,0.18)", border: "#6EE7B7", text: "#6EE7B7", emoji: "🐕" },
  gatto:    { bg: "rgba(167,139,250,0.18)", border: "#A78BFA", text: "#A78BFA", emoji: "🐈" },
  coniglio: { bg: "rgba(251,191,36,0.18)",  border: "#FBBF24", text: "#FBBF24", emoji: "🐇" },
  uccello:  { bg: "rgba(96,165,250,0.18)",  border: "#60A5FA", text: "#60A5FA", emoji: "🦜" },
  rettile:  { bg: "rgba(244,114,182,0.18)", border: "#F472B6", text: "#F472B6", emoji: "🦎" },
  altro:    { bg: "rgba(148,163,184,0.18)", border: "#94A3B8", text: "#94A3B8", emoji: "🐾" },
};

// ==================== STYLES ====================
const CSS = `
:root {
  --bg: #0B1120;
  --bg2: #111827;
  --bg3: #1A2332;
  --bg-card: #151E2D;
  --bg-hover: #1E293B;
  --text: #F1F5F9;
  --text-dim: #94A3B8;
  --text-muted: #64748B;
  --border: rgba(255,255,255,0.06);
  --border-light: rgba(255,255,255,0.04);
  --accent: #6EE7B7;
  --accent-dim: rgba(110,231,183,0.12);
  --accent-hover: #5CD9A7;
  --purple: #A78BFA;
  --purple-dim: rgba(167,139,250,0.12);
  --blue: #60A5FA;
  --blue-dim: rgba(96,165,250,0.12);
  --pink: #F472B6;
  --orange: #FBBF24;
  --orange-dim: rgba(251,191,36,0.12);
  --red: #F87171;
  --red-dim: rgba(248,113,113,0.12);
  --success: #34D399;
  --success-dim: rgba(52,211,153,0.12);
  --warning: #FBBF24;
  --warning-dim: rgba(251,191,36,0.12);
  --danger: #F87171;
  --danger-dim: rgba(248,113,113,0.12);
  --radius: 10px;
  --radius-sm: 6px;
  --shadow: 0 1px 3px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.4);
  --font: 'Outfit', sans-serif;
  --transition: 180ms ease;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body, html, #root { height: 100%; width: 100%; font-family: var(--font); font-size: 16px; background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
.app { display: flex; height: 100vh; overflow: hidden; }

/* Sidebar */
.sidebar { width: 240px; min-width: 240px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid var(--border); }
.sidebar-logo h1 { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.03em; }
.sidebar-logo h1 span { background: linear-gradient(135deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sidebar-logo .ai-badge { display: inline-flex; align-items: center; background: #10B981; color: #fff; font-size: 14px; font-weight: 900; padding: 4px 12px; border-radius: 6px; margin-left: 8px; letter-spacing: 0.12em; vertical-align: middle; -webkit-text-fill-color: #fff; -webkit-background-clip: unset; }
.sidebar-logo p { font-size: 11px; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; }
.sidebar-nav { padding: 12px 10px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 8px; color: var(--text-dim); cursor: pointer; font-size: 16px; font-weight: 400; transition: all var(--transition); margin-bottom: 2px; border: 1px solid transparent; }
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--bg3); color: var(--text); font-weight: 600; border-color: var(--border); }
.nav-item.active .nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-muted); }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--bg2); }
.header-left h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
.header-left p { font-size: 14px; color: var(--text-muted); margin-top: 2px; }
.content { flex: 1; overflow-y: auto; padding: 24px 32px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--bg3); color: var(--text); transition: all var(--transition); font-family: var(--font); }
.btn:hover { border-color: var(--text-muted); background: var(--bg-hover); }
.btn-primary { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.btn-whatsapp { background: #25D366; color: white; border-color: #25D366; }
.btn-whatsapp:hover { background: #1ebe5d; }

/* Cards */
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header h3 { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
.badge { font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; }
.stat-label { font-size: 13px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 28px; font-weight: 800; margin-top: 6px; letter-spacing: -0.03em; }
.stat-change { display: inline-flex; align-items: center; gap: 3px; font-size: 13px; font-weight: 600; margin-top: 6px; padding: 2px 8px; border-radius: 20px; }
.stat-change.up { color: var(--success); background: var(--success-dim); }
.stat-change.down { color: var(--danger); background: var(--danger-dim); }

/* Calendar */
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.cal-header-cell { background: var(--bg3); padding: 10px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
.cal-cell { background: var(--bg-card); min-height: 100px; padding: 6px; cursor: pointer; transition: background var(--transition); position: relative; }
.cal-cell:hover { background: var(--bg3); }
.cal-cell.other-month { background: var(--bg2); }
.cal-cell.other-month .cal-day { color: var(--text-muted); }
.cal-cell.today { background: var(--accent-dim); }
.cal-day { font-size: 13px; font-weight: 600; margin-bottom: 4px; padding: 2px 4px; }
.cal-booking { font-size: 11px; padding: 2px 5px; margin-bottom: 2px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-weight: 500; }
.cal-booking.cancellato, .cal-booking.no-show { opacity: 0.4; }
.cal-more { font-size: 10px; color: var(--text-muted); padding: 2px 5px; font-weight: 500; }

/* Table */
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--bg3); }
tbody td { padding: 12px 14px; font-size: 15px; border-bottom: 1px solid var(--border); }
tbody tr:hover { background: var(--bg3); }
.status-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.status-badge.completato { background: var(--success-dim); color: var(--success); }
.status-badge.confermato { background: var(--blue-dim); color: var(--blue); }
.status-badge.in-attesa { background: var(--warning-dim); color: var(--warning); }
.status-badge.cancellato { background: var(--danger-dim); color: var(--danger); }
.status-badge.no-show { background: var(--purple-dim); color: var(--purple); }

/* Input */
input, select, textarea { font-family: var(--font); font-size: 15px; padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg3); color: var(--text); width: 100%; transition: border var(--transition); outline: none; }
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
input::placeholder, textarea::placeholder { color: var(--text-muted); }
label { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 5px; display: block; }

/* Tabs */
.tabs { display: flex; gap: 2px; background: var(--bg2); border-radius: 8px; padding: 3px; margin-bottom: 20px; width: fit-content; border: 1px solid var(--border); }
.tab { padding: 7px 16px; border-radius: 6px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all var(--transition); color: var(--text-muted); border: none; background: transparent; font-family: var(--font); }
.tab.active { background: var(--bg3); color: var(--text); box-shadow: var(--shadow); }

/* Charts */
.bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 210px; padding-top: 10px; overflow: hidden; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; }
.bar { width: 100%; border-radius: 4px 4px 0 0; transition: height 600ms ease; min-height: 2px; }
.bar:hover { opacity: 0.8; }
.bar-label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.bar-value { font-size: 12px; font-weight: 700; }

/* Forecast bar */
.forecast-bar-bg { flex: 1; height: 24px; background: var(--bg3); border-radius: 12px; overflow: hidden; }
.forecast-bar-fill { height: 100%; border-radius: 12px; transition: width 800ms ease; }

/* Pills */
.pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
.pill-wa { background: rgba(37,211,102,0.15); color: #25D366; }
.pill-ig { background: rgba(193,53,132,0.15); color: #E1306C; }
.pill-tel { background: var(--blue-dim); color: var(--blue); }
.pill-walk { background: var(--purple-dim); color: var(--purple); }
.pill-online { background: var(--accent-dim); color: var(--accent); }

/* AI Insight */
.insight-card { background: linear-gradient(135deg, rgba(110,231,183,0.06) 0%, rgba(167,139,250,0.06) 100%); border: 1px solid rgba(110,231,183,0.15); border-radius: var(--radius); padding: 22px; margin-bottom: 16px; }
.insight-card h4 { font-size: 16px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.insight-card p { font-size: 14px; line-height: 1.6; color: var(--text-dim); }
.insight-tag { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 6px; margin-top: 10px; }
.insight-tag.revenue { background: var(--success-dim); color: var(--success); }
.insight-tag.action { background: var(--orange-dim); color: var(--orange); }
.insight-tag.alert { background: var(--danger-dim); color: var(--danger); }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 200ms ease; }
.modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 28px; max-width: 520px; width: 90%; box-shadow: var(--shadow-lg); animation: slideUp 300ms ease; max-height: 85vh; overflow-y: auto; }
.modal h3 { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.form-group { margin-bottom: 14px; }

/* WhatsApp */
.wa-chat { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; padding: 12px; background: rgba(37,211,102,0.04); border: 1px solid rgba(37,211,102,0.1); border-radius: 8px; }
.wa-msg { max-width: 80%; padding: 8px 12px; border-radius: 8px; font-size: 14px; line-height: 1.4; }
.wa-msg.out { background: rgba(37,211,102,0.15); color: var(--text); align-self: flex-end; border-bottom-right-radius: 2px; }
.wa-msg.in { background: var(--bg3); color: var(--text); align-self: flex-start; border-bottom-left-radius: 2px; }
.wa-msg .wa-time { font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 3px; }
.wa-input-row { display: flex; gap: 8px; margin-top: 8px; }
.wa-input-row input { flex: 1; border-radius: 20px; padding: 10px 16px; }

/* Layout */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Scrollbar */
.content::-webkit-scrollbar { width: 5px; }
.content::-webkit-scrollbar-track { background: transparent; }
.content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

select option { background: var(--bg3); color: var(--text); }

/* Client search picker */
.client-picker { position: relative; }
.client-picker-input { display: flex; gap: 8px; }
.client-picker-input input { flex: 1; }
.client-picker-add { width: 40px; min-width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--accent); color: var(--bg); border: none; cursor: pointer; font-size: 20px; font-weight: 700; transition: background var(--transition); }
.client-picker-add:hover { background: var(--accent-hover); }
.client-picker-dropdown { position: absolute; top: 100%; left: 0; right: 48px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); margin-top: 4px; max-height: 240px; overflow-y: auto; z-index: 20; box-shadow: var(--shadow-lg); }
.client-picker-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background var(--transition); border-bottom: 1px solid var(--border); }
.client-picker-item:last-child { border-bottom: none; }
.client-picker-item:hover { background: var(--bg3); }
.client-picker-item.selected { background: var(--accent-dim); }
.client-picker-item .cpi-name { font-size: 14px; font-weight: 600; }
.client-picker-item .cpi-dog { font-size: 13px; color: var(--text-dim); }
.client-picker-item .cpi-breed { font-size: 11px; color: var(--text-muted); }
.client-picker-selected { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--accent-dim); border: 1px solid rgba(110,231,183,0.2); border-radius: var(--radius-sm); }
.client-picker-selected .cps-info { flex: 1; }
.client-picker-selected .cps-name { font-size: 13px; font-weight: 600; color: var(--accent); }
.client-picker-selected .cps-detail { font-size: 11px; color: var(--text-dim); }
.client-picker-selected .cps-clear { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; display: flex; transition: color var(--transition); }
.client-picker-selected .cps-clear:hover { color: var(--danger); }
.client-picker-empty { padding: 16px; text-align: center; font-size: 12px; color: var(--text-muted); }

/* Weekly view */
.week-grid { display: grid; grid-template-columns: 56px repeat(7, 1fr); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.week-header-cell { background: var(--bg3); padding: 10px 6px; text-align: center; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); }
.week-header-cell .wh-day { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.week-header-cell .wh-num { font-size: 18px; font-weight: 700; margin-top: 2px; }
.week-header-cell.wh-today .wh-num { color: var(--accent); }
.week-time-col { background: var(--bg3); border-right: 1px solid var(--border); }
.week-time-label { height: 36px; display: flex; align-items: flex-start; justify-content: flex-end; padding: 2px 8px 0 0; font-size: 10px; font-weight: 500; color: var(--text-muted); }
.week-day-col { position: relative; border-left: 1px solid var(--border); min-height: 720px; user-select: none; }
.week-slot { height: 36px; border-bottom: 1px solid var(--border-light); cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cg transform='rotate(-30 16 16)'%3E%3Cpath d='M16 27c-3.5 0-6.5-2.3-6.5-5.2S12.5 16 16 16s6.5 2.5 6.5 5.8S19.5 27 16 27z' fill='%236EE7B7'/%3E%3Ccircle cx='8.5' cy='12.5' r='3' fill='%23A78BFA'/%3E%3Ccircle cx='23.5' cy='12.5' r='3' fill='%23A78BFA'/%3E%3Ccircle cx='12' cy='8' r='2.7' fill='%23A78BFA'/%3E%3Ccircle cx='20' cy='8' r='2.7' fill='%23A78BFA'/%3E%3C/g%3E%3C/svg%3E") 4 4, pointer; transition: background 120ms; }
.week-slot:hover { background: var(--accent-dim); }
.week-slot.drag-active { background: rgba(110,231,183,0.2); border-color: rgba(110,231,183,0.3); }
.week-slot.drag-preview { background: rgba(110,231,183,0.12); position: relative; }
.week-slot.drag-preview-start { border-radius: 6px 6px 0 0; }
.week-slot.drag-preview-end { border-radius: 0 0 6px 6px; }
.week-slot.drag-preview-start.drag-preview-end { border-radius: 6px; }
.week-drag-overlay { position: absolute; left: 3px; right: 3px; background: rgba(110,231,183,0.18); border: 2px solid var(--accent); border-radius: 6px; z-index: 1; pointer-events: none; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--accent); }
.week-slot.half { border-bottom-style: dashed; border-bottom-color: rgba(255,255,255,0.02); }
.week-booking-block { position: absolute; border-radius: 5px; padding: 4px 6px; font-size: 11px; font-weight: 500; overflow: hidden; cursor: pointer; transition: opacity 150ms; z-index: 2; border-left: 3px solid; }
.week-booking-block:hover { opacity: 0.85; }
.week-booking-block .wb-time { font-weight: 700; font-size: 10px; }
.week-booking-block .wb-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.week-booking-block .wb-service { font-size: 10px; opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.week-now-line { position: absolute; left: 0; right: 0; height: 2px; background: var(--danger); z-index: 3; pointer-events: none; }
.week-now-line::before { content: ''; position: absolute; left: -4px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }

/* Mobile hamburger button */
.hamburger-btn { display: none; position: fixed; top: 14px; left: 14px; z-index: 200; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; cursor: pointer; color: var(--text); line-height: 1; }
.mobile-overlay { display: none; }

/* Mobile responsive */
@media (max-width: 768px) {
  .hamburger-btn { display: flex; align-items: center; justify-content: center; }
  .mobile-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
  .app { flex-direction: column; height: auto; min-height: 100vh; overflow: auto; }
  .sidebar { position: fixed; top: 0; left: 0; height: 100vh; z-index: 100; transform: translateX(-100%); transition: transform 0.25s ease; min-width: 260px; width: 260px; }
  .sidebar.open { transform: translateX(0); }
  .main { width: 100%; flex: none; overflow: visible; }
  .header { padding: 14px 16px 14px 56px; }
  .header-left h2 { font-size: 18px; }
  .content { padding: 16px; overflow-y: visible; flex: none; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .two-col { grid-template-columns: 1fr; }
  .card { padding: 14px; }
  .bar-chart { height: 180px; }
  table { font-size: 12px; }
  thead th, tbody td { padding: 8px 8px; }
  .modal-overlay .card { margin: 16px; width: auto; max-width: 100%; }
  .tabs { overflow-x: auto; width: 100%; }
  .cal-grid { font-size: 11px; }
  .cal-cell { min-height: 60px; padding: 4px; }
}
`;

// ==================== MAIN APP ====================
export default function ShifuKuAI() {
  const [clients, setClients] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState(SERVICES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll(table, query) {
      const PAGE = 1000;
      let all = [], from = 0;
      while (true) {
        const { data, error } = await query.range(from, from + PAGE - 1);
        if (error || !data?.length) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    }
    async function loadData() {
      const [c, b, p] = await Promise.all([
        fetchAll('clients', supabase.from('clients').select('*')),
        fetchAll('bookings', supabase.from('bookings').select('*').order('date').order('time')),
        fetchAll('pets', supabase.from('pets').select('*')),
      ]);
      setClients(c.map(dbToClient));
      setBookings(b.map(dbToBooking));
      setPets(p.map(dbToPet));
      setLoading(false);
    }
    loadData();
  }, []);
  
  const [view, setView] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(null);
  const [calMonth, setCalMonth] = useState(2);
  const [calYear, setCalYear] = useState(2026);
  const [showModal, setShowModal] = useState(null);
  const [clientFilter, setClientFilter] = useState("");
  const [analyticsTab, setAnalyticsTab] = useState("overview");
  const [selectedClient, setSelectedClient] = useState(null);
  const [waMessages, setWaMessages] = useState([
    { text: "Ciao! Vorrei prenotare un bagno per Luna sabato mattina", from: "in", time: "09:12" },
    { text: "Ciao! Sabato mattina abbiamo disponibilità alle 9:30 o alle 11:00. Quale preferisci? 🐾", from: "out", time: "09:14" },
    { text: "9:30 perfetto! Grazie", from: "in", time: "09:15" },
    { text: "Prenotato! Ti manderò un promemoria venerdì sera. A sabato! ✅", from: "out", time: "09:16" },
  ]);
  const [waInput, setWaInput] = useState("");
  const [forecastRange, setForecastRange] = useState("6m");
  const [overviewPastColor, setOverviewPastColor] = useState("#6EE7B7");
  const [overviewFutureColor, setOverviewFutureColor] = useState("#A78BFA");
  const [overviewLinePastColor, setOverviewLinePastColor] = useState("#F59E0B");
  const [overviewLineFutureColor, setOverviewLineFutureColor] = useState("#FB923C");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState(new Set());
  const [selectedBookingIds, setSelectedBookingIds] = useState(new Set());
  const [calView, setCalView] = useState("month"); // "month" | "week" | "list"
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  // Drag-to-book state
  const [dragState, setDragState] = useState(null); // { dayIdx, startSlot, currentSlot }
  const isDragging = useRef(false);

  const onSlotMouseDown = (dayIdx, slotIdx, dateStr) => {
    isDragging.current = true;
    setDragState({ dayIdx, startSlot: slotIdx, currentSlot: slotIdx, dateStr });
  };

  const onSlotMouseEnter = (dayIdx, slotIdx) => {
    if (!isDragging.current || !dragState || dragState.dayIdx !== dayIdx) return;
    setDragState(prev => prev ? { ...prev, currentSlot: slotIdx } : null);
  };

  const onSlotMouseUp = () => {
    if (!isDragging.current || !dragState) { isDragging.current = false; setDragState(null); return; }
    isDragging.current = false;
    const START_HOUR = 8;
    const minSlot = Math.min(dragState.startSlot, dragState.currentSlot);
    const maxSlot = Math.max(dragState.startSlot, dragState.currentSlot);
    const startH = START_HOUR + Math.floor(minSlot / 2);
    const startM = minSlot % 2 === 0 ? "00" : "30";
    const durationSlots = maxSlot - minSlot + 1;
    const durationMin = durationSlots * 30;
    setNewBookingForm(f => ({
      ...f,
      date: dragState.dateStr,
      time: `${String(startH).padStart(2, "0")}:${startM}`,
      duration: durationMin,
    }));
    setDragState(null);
    setShowModal("new");
  };

  // Cancel drag on mouse leave from grid
  const onGridMouseLeave = () => {
    if (isDragging.current) { isDragging.current = false; setDragState(null); }
  };

  // Global mouseup to end drag even outside grid
  useEffect(() => {
    const handleUp = () => { if (isDragging.current) onSlotMouseUp(); };
    const handleClick = (e) => { if (!e.target.closest(".client-picker")) setShowClientDropdown(false); };
    window.addEventListener("mouseup", handleUp);
    document.addEventListener("mousedown", handleClick);
    return () => { window.removeEventListener("mouseup", handleUp); document.removeEventListener("mousedown", handleClick); };
  }, [dragState]);
  
  // New client form
  const emptyClient = { firstName: "", lastName: "", phone: "", email: "", petName: "", petAnimalType: "cane", petBreed: "", petSize: "media", petMordace: false };
  const [newClientForm, setNewClientForm] = useState(emptyClient);

  // Pet management
  const emptyPet = { name: "", animalType: "cane", breed: "", size: "media", mordace: false };
  const [newPetForm, setNewPetForm] = useState(emptyPet);
  const [showAddPet, setShowAddPet] = useState(null); // clientId

  // Bulk import clienti
  const [importRows, setImportRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  // Bulk import appuntamenti
  const [importBookingRows, setImportBookingRows] = useState([]);
  const [importBookingLoading, setImportBookingLoading] = useState(false);
  const [importBookingStats, setImportBookingStats] = useState(null);

  // Client table sort
  const [clientSort, setClientSort] = useState("visitCount");
  const [clientSortDir, setClientSortDir] = useState("desc");

  // Analytics clienti: accordion fasce abbandono
  const [riskOpen, setRiskOpen] = useState(null); // "30" | "60" | "90"
  
  // New booking form
  const [newBookingForm, setNewBookingForm] = useState({ clientId: "", petId: "", date: new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date()), time: "10:00", serviceId: "", notes: "", price: "", duration: "", payment: "" });
  
  // Edit booking
  const [editingBooking, setEditingBooking] = useState(null);
  const [editBookingForm, setEditBookingForm] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const clientPetsMap = useMemo(() => {
    const map = {};
    pets.forEach(p => { if (!map[p.clientId]) map[p.clientId] = []; map[p.clientId].push(p); });
    return map;
  }, [pets]);

  const clientSearchResults = useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 8);
    const q = clientSearch.toLowerCase();
    return clients.filter(c => {
      if (`${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.phone.includes(q)) return true;
      return (clientPetsMap[c.id] || []).some(p => p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q));
    }).slice(0, 8);
  }, [clientSearch, clients, clientPetsMap]);

  const selectedClientForBooking = clients.find(c => c.id === newBookingForm.clientId);

  const openEditBooking = (booking) => {
    setEditBookingForm({
      id: booking.id, clientId: booking.clientId, date: booking.date, time: booking.time,
      serviceId: booking.serviceId, serviceName: booking.serviceName,
      price: booking.price, duration: booking.duration,
      notes: booking.notes || "", status: booking.status,
      payment: booking.payment || "",
    });
    setShowModal("editBooking");
  };

  const saveEditBooking = async () => {
    if (!editBookingForm) return;
    const f = editBookingForm;
    const service = services.find(s => s.id === f.serviceId);
    const updates = {
      date: f.date, time: f.time,
      service_id: f.serviceId, service_name: service?.name || f.serviceName,
      price: Number(f.price), duration: Number(f.duration),
      notes: f.notes, status: f.status, payment: f.payment,
    };
    await supabase.from('bookings').update(updates).eq('id', f.id);
    setBookings(prev => prev.map(b => b.id === f.id ? {
      ...b, date: f.date, time: f.time,
      serviceId: f.serviceId, serviceName: service?.name || b.serviceName,
      price: Number(f.price), duration: Number(f.duration),
      notes: f.notes, status: f.status, payment: f.payment,
    } : b));
    setEditBookingForm(null);
    setShowModal(null);
  };

  // CRUD: Add client
  const addClient = async () => {
    const f = newClientForm;
    if (!f.firstName || !f.lastName || !f.petName) return;
    const clientId = `c${Date.now()}`;
    const petId = `p_${clientId}`;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
    const newC = {
      id: clientId, firstName: f.firstName, lastName: f.lastName,
      phone: f.phone || "", email: f.email || `${f.firstName.toLowerCase()}.${f.lastName.toLowerCase()}@email.it`,
      notes: "", registeredDate: today,
      totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
      preferredDay: "Lunedì", source: "online", rating: 5,
    };
    const newPet = {
      id: petId, clientId, name: f.petName, animalType: f.petAnimalType || "cane",
      breed: f.petBreed || "Meticcio", size: f.petSize || "media", mordace: f.petMordace || false, notes: "",
    };
    await supabase.from('clients').insert({
      id: newC.id, first_name: newC.firstName, last_name: newC.lastName,
      phone: newC.phone, email: newC.email, notes: newC.notes,
      registered_date: newC.registeredDate, total_spent: 0, visit_count: 0,
      last_visit: null, loyalty_points: 0, preferred_day: newC.preferredDay,
      source: newC.source, rating: newC.rating,
    });
    await supabase.from('pets').insert({
      id: newPet.id, client_id: newPet.clientId, name: newPet.name,
      animal_type: newPet.animalType, breed: newPet.breed, size: newPet.size,
      mordace: newPet.mordace, notes: newPet.notes,
    });
    setClients(prev => [...prev, newC]);
    setPets(prev => [...prev, newPet]);
    setNewClientForm(emptyClient);
    setShowModal(null);
  };

  // CRUD: Add / Delete pet
  const addPet = async (clientId) => {
    const f = newPetForm;
    if (!f.name) return;
    const newP = {
      id: `p${Date.now()}`, clientId, name: f.name,
      animalType: f.animalType || "cane", breed: f.breed || "Meticcio",
      size: f.size || "media", mordace: f.mordace || false, notes: "",
    };
    await supabase.from('pets').insert({ id: newP.id, client_id: newP.clientId, name: newP.name, animal_type: newP.animalType, breed: newP.breed, size: newP.size, mordace: newP.mordace, notes: newP.notes });
    setPets(prev => [...prev, newP]);
    setNewPetForm(emptyPet);
    setShowAddPet(null);
  };

  const deletePet = async (petId) => {
    if (!confirm("Eliminare questo animale?")) return;
    await supabase.from('pets').delete().eq('id', petId);
    setPets(prev => prev.filter(p => p.id !== petId));
  };

  // BULK IMPORT: parse file into rows
  const handleImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const norm = (s) => String(s).toLowerCase().trim().replace(/[\s_]/g, "");
      const col = (row, keys) => { for (const k of keys) { const v = row[Object.keys(row).find(rk => norm(rk) === norm(k)) || ""]; if (v !== undefined && String(v).trim()) return String(v).trim(); } return ""; };

      // Raggruppa righe per cliente (stessa persona = stessa chiave)
      const clientMap = new Map();
      raw.forEach(row => {
        const firstName = col(row, ["nome","firstname","first_name","nome*"]);
        const lastName = col(row, ["cognome","lastname","last_name","surname","cognome*"]);
        const phone = col(row, ["telefono","phone","tel","cellulare"]);
        const email = col(row, ["email","mail","e-mail"]);
        const petName = col(row, ["nomeanimale","animale","pet","petname","pet_name","nomepet"]);
        // Riga valida se ha almeno telefono, email o nome animale
        if (!firstName && !lastName && !phone && !email && !petName) return;
        const key = phone || email || `${firstName.toLowerCase()}_${lastName.toLowerCase()}` || petName.toLowerCase();
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            firstName: firstName || "—",
            lastName: lastName || "",
            phone, email,
            notes: col(row, ["note","notes","annotazioni"]),
            pets: []
          });
        }
        if (petName) {
          clientMap.get(key).pets.push({
            name: petName,
            animalType: (col(row, ["tipoanimale","specie","animaltype","animal_type","tipo"]) || "cane").toLowerCase(),
            breed: col(row, ["razza","breed"]) || "Meticcio",
            size: (col(row, ["taglia","size"]) || "media").toLowerCase(),
          });
        }
      });
      setImportRows(Array.from(clientMap.values()));
    };
    reader.readAsArrayBuffer(file);
  };

  // BULK IMPORT: save to Supabase
  const bulkImportClients = async () => {
    if (!importRows.length) return;
    setImportLoading(true);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
    const newClients = importRows.map((r, i) => ({
      id: `c${Date.now()}${i}`,
      firstName: r.firstName, lastName: r.lastName,
      phone: r.phone || "", email: r.email || `${r.firstName.toLowerCase()}.${r.lastName.toLowerCase()}@email.it`,
      notes: r.notes || "", registeredDate: today,
      totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
      preferredDay: "Lunedì", source: "import", rating: 5,
    }));
    const newPets = newClients.flatMap((c, i) =>
      (importRows[i].pets || []).map((p, j) => ({
        id: `p_${c.id}_${j}`, clientId: c.id,
        name: p.name, animalType: p.animalType || "cane",
        breed: p.breed || "Meticcio", size: p.size || "media", mordace: false, notes: "",
      }))
    );
    await supabase.from("clients").insert(newClients.map(c => ({
      id: c.id, first_name: c.firstName, last_name: c.lastName,
      phone: c.phone, email: c.email, notes: c.notes,
      registered_date: c.registeredDate, total_spent: 0, visit_count: 0,
      last_visit: null, loyalty_points: 0, preferred_day: c.preferredDay,
      source: c.source, rating: c.rating,
    })));
    if (newPets.length) {
      await supabase.from("pets").insert(newPets.map(p => ({
        id: p.id, client_id: p.clientId, name: p.name, animal_type: p.animalType,
        breed: p.breed, size: p.size, mordace: p.mordace, notes: p.notes,
      })));
    }
    setClients(prev => [...prev, ...newClients]);
    setPets(prev => [...prev, ...newPets]);
    setImportRows([]);
    setImportLoading(false);
    setShowModal(null);
  };

  // IMPORT APPUNTAMENTI: parse file
  const handleImportBookingsFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const norm = (s) => String(s).toLowerCase().trim().replace(/[\s_]/g, "");
      const col = (row, keys) => { for (const k of keys) { const v = row[Object.keys(row).find(rk => norm(rk) === norm(k)) || ""]; if (v !== undefined && String(v).trim()) return String(v).trim(); } return ""; };
      const mapStatus = (s) => {
        const sl = String(s).toLowerCase();
        if (sl.includes("complet")) return "completato";
        if (sl.includes("cancel")) return "cancellato";
        if (sl.includes("corso") || sl.includes("progress")) return "completato";
        if (sl.includes("attesa") || sl.includes("pending")) return "in-attesa";
        return "confermato";
      };
      // Converte DD/MM/YYYY o DD-MM-YYYY → YYYY-MM-DD
      const normalizeDate = (s) => {
        if (!s) return "";
        const str = String(s).trim();
        // già in formato ISO
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
        // DD/MM/YYYY o DD-MM-YYYY
        const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
        if (m) {
          const y = m[3].length === 2 ? "20" + m[3] : m[3];
          return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
        }
        // Numero seriale Excel (interi o decimali, es. 45727.333)
        if (/^\d+(\.\d+)?$/.test(str)) {
          const d = new Date((parseFloat(str) - 25569) * 86400 * 1000);
          return new Intl.DateTimeFormat("en-CA").format(d);
        }
        return str;
      };
      // Estrae HH:MM dal seriale Excel o da stringa orario
      const normalizeTime = (dateRaw, timeRaw) => {
        const t = String(timeRaw || "").trim();
        if (t && /\d{1,2}:\d{2}/.test(t)) return t.slice(0, 5);
        // prova a estrarre dal seriale data (parte decimale = frazione del giorno)
        const ds = String(dateRaw || "").trim();
        if (/^\d+\.\d+$/.test(ds)) {
          const frac = parseFloat(ds) % 1;
          const totalMin = Math.round(frac * 1440);
          return `${String(Math.floor(totalMin / 60)).padStart(2,"0")}:${String(totalMin % 60).padStart(2,"0")}`;
        }
        return "09:00";
      };
      const parsed = raw.map(row => {
        const dateRaw = col(row, ["data","date"]);
        const timeRaw = col(row, ["orario","time","ora"]);
        return {
        date: normalizeDate(dateRaw),
        time: normalizeTime(dateRaw, timeRaw),
        duration: parseInt(col(row, ["duratamin","durata","duration","minuti"])) || 60,
        ownerFirstName: col(row, ["nomeproprietario","nome","firstname"]),
        ownerLastName: col(row, ["cognomeproprietario","cognome","lastname"]),
        phone: col(row, ["telefono","phone","tel","cellulare"]),
        petName: col(row, ["nomeanimale","animale","pet","nomepet"]),
        animalType: (col(row, ["tipoanimale","tipo","animaltype"]) || "cane").toLowerCase(),
        breed: col(row, ["razza","breed"]) || "Meticcio",
        price: parseFloat(col(row, ["totale","prezzo","total","price"])) || 0,
        status: mapStatus(col(row, ["stato","status","stato"])),
        notes: col(row, ["note","notes","annotazioni"]),
        };
      }).filter(r => r.date);
      setImportBookingRows(parsed);
      setImportBookingStats(null);
    };
    reader.readAsArrayBuffer(file);
  };

  // IMPORT APPUNTAMENTI: salva su Supabase
  const bulkImportBookings = async () => {
    if (!importBookingRows.length) return;
    setImportBookingLoading(true);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());

    // Lookup maps da stato corrente
    const clientByPhone = {};
    clients.forEach(c => { if (c.phone) clientByPhone[c.phone.replace(/\s/g,"")] = c; });
    const petByKey = {};
    pets.forEach(p => { petByKey[`${p.clientId}_${p.name.toLowerCase()}`] = p; });

    // Deduplicazione: chiave = clientId + date + time
    const existingBookingKeys = new Set(
      bookings.map(b => `${b.clientId}|${b.date}|${b.time}`)
    );

    const newClients = [], newPets = [], newBookings = [];
    let matchedClients = 0, createdClients = 0, createdPets = 0, skipped = 0;

    for (let i = 0; i < importBookingRows.length; i++) {
      const row = importBookingRows[i];
      const phoneClean = row.phone.replace(/\s/g,"");

      // Trova o crea cliente
      let client = clientByPhone[phoneClean];
      if (!client && phoneClean) {
        const clientId = `c_imp_${Date.now()}_${i}`;
        client = {
          id: clientId,
          firstName: row.ownerFirstName || "—", lastName: row.ownerLastName || "",
          phone: row.phone, email: "",
          notes: "", registeredDate: today,
          totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
          preferredDay: "Lunedì", source: "import", rating: 5,
        };
        newClients.push(client);
        clientByPhone[phoneClean] = client;
        createdClients++;
      } else if (client) {
        matchedClients++;
      }
      if (!client) continue;

      // Trova o crea pet
      const petKey = `${client.id}_${row.petName.toLowerCase()}`;
      let pet = petByKey[petKey];
      if (!pet && row.petName) {
        const petId = `p_imp_${client.id}_${row.petName.toLowerCase().replace(/\W/g,"_")}`;
        if (!petByKey[petKey]) {
          pet = { id: petId, clientId: client.id, name: row.petName, animalType: row.animalType, breed: row.breed, size: "media", mordace: false, notes: "" };
          newPets.push(pet);
          petByKey[petKey] = pet;
          createdPets++;
        }
      }

      // Salta se già esiste
      const bookingKey = `${client.id}|${row.date}|${row.time}`;
      if (existingBookingKeys.has(bookingKey)) { skipped++; continue; }
      existingBookingKeys.add(bookingKey);

      newBookings.push({
        id: `b_imp_${i}_${Math.random().toString(36).slice(2,8)}`,
        clientId: client.id, clientName: `${client.firstName} ${client.lastName}`.trim() || row.phone,
        petName: row.petName || "—", animalType: row.animalType, breed: row.breed,
        petId: pet?.id || null,
        serviceId: null, serviceName: "Toelettatura",
        date: row.date, time: row.time, duration: row.duration,
        price: row.price, cost: Math.round(row.price * 0.3),
        status: row.status, notes: row.notes,
        createdVia: "import", reminderSent: false, payment: "",
      });
    }

    // Inserisci nuovi clienti e pet
    if (newClients.length) {
      const { error: ce } = await supabase.from("clients").insert(newClients.map(c => ({
        id: c.id, first_name: c.firstName, last_name: c.lastName,
        phone: c.phone, email: c.email, notes: c.notes,
        registered_date: c.registeredDate, total_spent: 0, visit_count: 0,
        last_visit: null, loyalty_points: 0, preferred_day: c.preferredDay,
        source: c.source, rating: c.rating,
      })));
      if (ce) { console.error("Errore insert clienti:", ce); alert("Errore clienti: " + ce.message); setImportBookingLoading(false); return; }
    }
    if (newPets.length) {
      const { error: pe } = await supabase.from("pets").insert(newPets.map(p => ({
        id: p.id, client_id: p.clientId, name: p.name, animal_type: p.animalType,
        breed: p.breed, size: p.size, mordace: p.mordace, notes: p.notes,
      })));
      if (pe) { console.error("Errore insert pets:", pe); alert("Errore animali: " + pe.message); setImportBookingLoading(false); return; }
    }

    // Inserisci booking in batch da 200
    for (let i = 0; i < newBookings.length; i += 200) {
      const { error: be } = await supabase.from("bookings").insert(newBookings.slice(i, i + 200).map(b => ({
        id: b.id, client_id: b.clientId, client_name: b.clientName,
        pet_name: b.petName, animal_type: b.animalType, breed: b.breed,
        pet_id: b.petId, service_id: b.serviceId, service_name: b.serviceName,
        date: b.date, time: b.time, duration: b.duration,
        price: b.price, cost: b.cost, status: b.status,
        notes: b.notes, created_via: b.createdVia, reminder_sent: false, payment: b.payment,
      })));
      if (be) { console.error(`Errore insert bookings batch ${i}:`, be); alert("Errore appuntamenti: " + be.message); setImportBookingLoading(false); return; }
    }

    // Aggiorna stats clienti (total_spent, visit_count, last_visit)
    const allBookings = [...bookings, ...newBookings];
    const clientIds = new Set(newBookings.map(b => b.clientId));
    await Promise.all([...clientIds].map(clientId => {
      const cb = allBookings.filter(b => b.clientId === clientId && b.status === "completato");
      const totalSpent = cb.reduce((s, b) => s + b.price, 0);
      const visitCount = cb.length;
      const lastVisit = cb.sort((a, b) => b.date.localeCompare(a.date))[0]?.date || null;
      return supabase.from("clients").update({ total_spent: totalSpent, visit_count: visitCount, last_visit: lastVisit }).eq("id", clientId);
    }));

    // Aggiorna state
    setClients(prev => {
      const map = Object.fromEntries(newClients.map(c => [c.id, c]));
      return [...prev.map(c => map[c.id] ? { ...c } : c), ...newClients];
    });
    setPets(prev => [...prev, ...newPets]);
    setBookings(prev => [...prev, ...newBookings].sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
    setImportBookingStats({ total: newBookings.length, matchedClients, createdClients, createdPets, skipped });
    setImportBookingRows([]);
    setImportBookingLoading(false);
  };

  // CRUD: Delete client
  const deleteClient = async (clientId) => {
    if (!confirm("Eliminare questo cliente e tutte le sue prenotazioni?")) return;
    await supabase.from('bookings').delete().eq('client_id', clientId);
    await supabase.from('clients').delete().eq('id', clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    setBookings(prev => prev.filter(b => b.clientId !== clientId));
    setSelectedClient(null);
  };

  // CRUD: Add booking
  const addBooking = async () => {
    const f = newBookingForm;
    if (!f.clientId || !f.serviceId || !f.date || !f.time) return;
    const client = clients.find(c => c.id === f.clientId);
    const service = services.find(s => s.id === f.serviceId);
    if (!client || !service) return;
    const finalPrice = f.price !== "" ? Number(f.price) : service.price;
    const finalDuration = f.duration !== "" ? Number(f.duration) : service.duration;
    const pet = pets.find(p => p.id === f.petId) || (clientPetsMap[client.id] || [])[0];
    const newB = {
      id: `b${Date.now()}`, clientId: client.id, clientName: `${client.firstName} ${client.lastName}`,
      petName: pet?.name || "", animalType: pet?.animalType || "cane", breed: pet?.breed || "",
      serviceId: service.id, serviceName: service.name,
      date: f.date, time: f.time, duration: finalDuration, price: finalPrice, cost: service.cost,
      status: "confermato", notes: f.notes || "", createdVia: "online", reminderSent: false, payment: f.payment || "",
    };
    await supabase.from('bookings').insert({
      id: newB.id, client_id: newB.clientId, client_name: newB.clientName,
      pet_name: newB.petName, animal_type: newB.animalType, breed: newB.breed,
      pet_id: pet?.id || null,
      service_id: newB.serviceId, service_name: newB.serviceName,
      date: newB.date, time: newB.time, duration: newB.duration,
      price: newB.price, cost: newB.cost, status: newB.status,
      notes: newB.notes, created_via: newB.createdVia, reminder_sent: false, payment: newB.payment,
    });
    setBookings(prev => [...prev, newB].sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
    setNewBookingForm({ clientId: "", petId: "", date: f.date, time: "10:00", serviceId: "", notes: "", price: "", duration: "", payment: "" });
    setShowModal(null);
  };

  // CRUD: Delete booking
  const deleteBooking = async (bookingId) => {
    if (!confirm("Eliminare questa prenotazione?")) return;
    await supabase.from('bookings').delete().eq('id', bookingId);
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  // Bulk selection helpers
  const toggleClientSelect = (id) => setSelectedClientIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleBookingSelect = (id) => setSelectedBookingIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const selectAllClients = (ids) => setSelectedClientIds(prev => prev.size === ids.length ? new Set() : new Set(ids));
  const selectAllBookings = (ids) => setSelectedBookingIds(prev => prev.size === ids.length ? new Set() : new Set(ids));

  const bulkDeleteClients = async () => {
    if (selectedClientIds.size === 0) return;
    if (!confirm(`Eliminare ${selectedClientIds.size} clienti e tutte le loro prenotazioni?`)) return;
    const ids = [...selectedClientIds];
    await supabase.from('bookings').delete().in('client_id', ids);
    await supabase.from('clients').delete().in('id', ids);
    setClients(prev => prev.filter(c => !selectedClientIds.has(c.id)));
    setBookings(prev => prev.filter(b => !selectedClientIds.has(b.clientId)));
    setSelectedClientIds(new Set());
    setSelectedClient(null);
  };

  const bulkDeleteBookings = async () => {
    if (selectedBookingIds.size === 0) return;
    if (!confirm(`Eliminare ${selectedBookingIds.size} prenotazioni?`)) return;
    const ids = [...selectedBookingIds];
    await supabase.from('bookings').delete().in('id', ids);
    setBookings(prev => prev.filter(b => !selectedBookingIds.has(b.id)));
    setSelectedBookingIds(new Set());
  };

  const currentMonthBookings = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return bookings.filter(b => b.date.startsWith(prefix));
  }, [bookings, calMonth, calYear]);

  const _today = new Date();
  const thisMonthStr = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, "0")}`;
  const _lastM = new Date(_today.getFullYear(), _today.getMonth() - 1, 1);
  const lastMonthStr = `${_lastM.getFullYear()}-${String(_lastM.getMonth() + 1).padStart(2, "0")}`;
  const thisMonth = useMemo(() => bookings.filter(b => b.date.startsWith(thisMonthStr)), [bookings]);
  const lastMonth = useMemo(() => bookings.filter(b => b.date.startsWith(lastMonthStr)), [bookings]);
  const completedThis = thisMonth.filter(b => b.status === "completato" || b.status === "confermato");
  const completedLast = lastMonth.filter(b => b.status === "completato");
  const revenueThis = completedThis.reduce((s, b) => s + b.price, 0);
  const revenueLast = completedLast.reduce((s, b) => s + b.price, 0);
  const profitThis = completedThis.reduce((s, b) => s + b.price - b.cost, 0);
  const profitLast = completedLast.reduce((s, b) => s + b.price - b.cost, 0);
  const cancelRate = thisMonth.length ? Math.round(thisMonth.filter(b => b.status === "cancellato" || b.status === "no-show").length / thisMonth.length * 100) : 0;
  const cancelRateLast = lastMonth.length ? Math.round(lastMonth.filter(b => b.status === "cancellato" || b.status === "no-show").length / lastMonth.length * 100) : 0;
  const pctChange = (curr, prev) => prev === 0 ? 0 : Math.round((curr - prev) / prev * 100);

  const monthlyData = useMemo(() => {
    const MONTH_NAMES = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    const today = new Date();
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mb = bookings.filter(b => b.date.startsWith(prefix) && (b.status === "completato" || b.status === "confermato"));
      result.push({ label: MONTH_NAMES[d.getMonth()], revenue: mb.reduce((s, b) => s + b.price, 0), count: mb.length, profit: mb.reduce((s, b) => s + b.price - b.cost, 0), type: "actual" });
    }
    return result;
  }, [bookings]);

  // ============ BOTTOM-UP CLIENT-LEVEL FORECAST ============
  const clientForecast = useMemo(() => {
    const TODAY = new Date();
    const daysBetween = (a, b) => Math.round((b - a) / 86400000);
    const completedBookings = bookings.filter(b => b.status === "completato");

    // Per-client cycle analysis
    const clientProfiles = clients.map(client => {
      const cb = completedBookings
        .filter(b => b.clientId === client.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (cb.length === 0) return { ...client, cycle: null, confidence: "none", nextExpected: null, intervals: [], avgRevenue: 0 };

      const dates = cb.map(b => new Date(b.date));
      const avgRevenue = cb.reduce((s, b) => s + b.price, 0) / cb.length;

      if (cb.length === 1) {
        // Single visit — cannot compute a real cycle, exclude from projection
        return { ...client, cycle: null, confidence: "none", nextExpected: null, lastVisitDate: dates[0], intervals: [], avgRevenue, visitDates: dates };
      }

      // Calculate intervals between consecutive visits
      const intervals = [];
      for (let i = 1; i < dates.length; i++) {
        intervals.push(daysBetween(dates[i - 1], dates[i]));
      }

      const avgCycle = intervals.reduce((s, d) => s + d, 0) / intervals.length;
      const variance = intervals.reduce((s, d) => s + Math.pow(d - avgCycle, 2), 0) / intervals.length;
      const stddev = Math.sqrt(variance);
      const cv = stddev / avgCycle; // coefficient of variation

      const lastDate = dates[dates.length - 1];
      const nextExpected = new Date(lastDate.getTime() + avgCycle * 86400000);

      // Confidence based on visit count + regularity
      let confidence;
      if (cb.length >= 4 && cv < 0.3) confidence = "high";
      else if (cb.length >= 3 && cv < 0.5) confidence = "high";
      else if (cb.length >= 2) confidence = "medium";
      else confidence = "low";

      // Check churn risk: if > 2× cycle has passed without visit, likely churned
      const daysSinceLast = daysBetween(lastDate, TODAY);
      const churned = daysSinceLast > avgCycle * 2.5;
      if (churned) confidence = "churned";

      return { ...client, cycle: Math.round(avgCycle), stddev: Math.round(stddev), confidence, nextExpected, lastVisitDate: lastDate, intervals, avgRevenue, visitDates: dates, daysSinceLast, churned };
    });

    // Project each client's visits into future months
    const monthBuckets = {};
    const initMonth = (key) => { if (!monthBuckets[key]) monthBuckets[key] = { high: [], medium: [], low: [], totalRev: 0 }; };

    const forecastHorizon = 365; // 12 months max

    clientProfiles.forEach(cp => {
      if (!cp.cycle || cp.confidence === "none" || cp.confidence === "churned") return;

      let nextDate = cp.nextExpected;
      // If next expected is in the past, advance to next cycle
      while (nextDate < TODAY) {
        nextDate = new Date(nextDate.getTime() + cp.cycle * 86400000);
      }

      // Project multiple future visits within horizon
      const endDate = new Date(TODAY.getTime() + forecastHorizon * 86400000);
      while (nextDate <= endDate) {
        const mKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
        initMonth(mKey);
        monthBuckets[mKey][cp.confidence].push({
          clientId: cp.id,
          clientName: `${cp.firstName} ${cp.lastName}`,
          petName: cp.petName,
          expectedDate: new Date(nextDate),
          cycle: cp.cycle,
          avgRevenue: cp.avgRevenue,
        });
        monthBuckets[mKey].totalRev += cp.avgRevenue;
        nextDate = new Date(nextDate.getTime() + cp.cycle * 86400000);
      }
    });

    // Summary stats
    const activeClients = clientProfiles.filter(cp => cp.confidence === "high" || cp.confidence === "medium");
    const churnedClients = clientProfiles.filter(cp => cp.confidence === "churned");
    const avgCycleAll = activeClients.length ? Math.round(activeClients.reduce((s, c) => s + (c.cycle || 0), 0) / activeClients.length) : 0;

    return { clientProfiles, monthBuckets, avgCycleAll, activeClients, churnedClients };
  }, [clients, bookings]);

  // Dashboard: ultimi 6 mesi storici (consuntivo) + prossimi 3 mesi (prenotati + forecast AI)
  const dashboardChartData = useMemo(() => {
    const MONTH_NAMES = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    // Past 6 months: consuntivo (completato + confermato su date passate)
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const hist = monthlyData.slice(-6).map((m, i, arr) => {
      // Per il mese corrente (ultimo della lista) usa solo date <= oggi
      if (i === arr.length - 1) {
        const prefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const mb = bookings.filter(b => b.date.startsWith(prefix) && b.date <= todayKey && (b.status === "completato" || b.status === "confermato"));
        return { ...m, revenue: mb.reduce((s, b) => s + b.price, 0), count: mb.length, type: "past" };
      }
      return { ...m, type: "past" };
    });
    // Future 3 months: prenotazioni già in essere + forecast AI (additivi)
    const fcMonths = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = MONTH_NAMES[d.getMonth()];
      const bucket = clientForecast.monthBuckets[key] || { high: [], medium: [], low: [], totalRev: 0 };
      const bookedBs = bookings.filter(b => b.date.startsWith(key) && (b.status === "confermato" || b.status === "in-attesa"));
      const bookedCount = bookedBs.length;
      const bookedRev = bookedBs.reduce((s, b) => s + b.price, 0);
      const fcCount = bucket.high.length + bucket.medium.length + bucket.low.length;
      const fcRev = Math.round(bucket.totalRev);
      fcMonths.push({ label, revenue: bookedRev + fcRev, count: bookedCount + fcCount, profit: Math.round((bookedRev + fcRev) * 0.68), type: "forecast", booked: bookedCount, forecastCount: fcCount });
    }
    return [...hist, ...fcMonths];
  }, [monthlyData, clientForecast, bookings]);

  // Today's bookings (Italy timezone)
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
  const todayBookings = useMemo(() => bookings.filter(b => b.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)), [bookings]);

  const serviceStats = useMemo(() => {
    const completed = bookings.filter(b => b.status === "completato" || b.status === "confermato");
    const map = {};
    completed.forEach(b => { if (!map[b.serviceName]) map[b.serviceName] = { name: b.serviceName, count: 0, revenue: 0, profit: 0 }; map[b.serviceName].count++; map[b.serviceName].revenue += b.price; map[b.serviceName].profit += b.price - b.cost; });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [bookings]);

  const sourceStats = useMemo(() => { const map = {}; bookings.forEach(b => { map[b.createdVia] = (map[b.createdVia] || 0) + 1; }); return Object.entries(map).sort((a, b) => b[1] - a[1]); }, [bookings]);
  const topClients = useMemo(() => [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10), [clients]);

  const hourlyDist = useMemo(() => { const dist = Array(12).fill(0); bookings.filter(b => b.status === "completato" || b.status === "confermato").forEach(b => { const h = parseInt(b.time.split(":")[0]) - 8; if (h >= 0 && h < 12) dist[h]++; }); return dist; }, [bookings]);
  const dowDist = useMemo(() => { const days = ["Lun","Mar","Mer","Gio","Ven","Sab"]; const dist = Array(6).fill(0); bookings.filter(b => b.status === "completato" || b.status === "confermato").forEach(b => { const d = new Date(b.date).getDay(); const idx = d === 0 ? -1 : d - 1; if (idx >= 0 && idx < 6) dist[idx]++; }); return days.map((d, i) => ({ label: d, value: dist[i] })); }, [bookings]);
  const breedDist = useMemo(() => { const map = {}; bookings.filter(b => b.status === "completato" || b.status === "confermato").forEach(b => { map[b.breed] = (map[b.breed] || 0) + 1; }); return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8); }, [bookings]);

  const aiInsights = useMemo(() => {
    const avgTicket = revenueThis / (completedThis.length || 1);
    const avgTicketLast = revenueLast / (completedLast.length || 1);
    const marginPct = profitThis / (revenueThis || 1) * 100;
    const peakHour = hourlyDist.indexOf(Math.max(...hourlyDist)) + 8;
    const lowHour = hourlyDist.indexOf(Math.min(...hourlyDist.filter(h => h > 0))) + 8;
    const highMarginService = [...serviceStats].sort((a, b) => (b.profit / b.revenue) - (a.profit / a.revenue))[0];
    const churnRisk = clients.filter(c => c.visitCount >= 2 && c.lastVisit && c.lastVisit < "2026-01-01").length;
    return [
      { title: "💰 Dynamic Pricing Opportunity", text: `Scontrino medio €${avgTicket.toFixed(0)} (${pctChange(avgTicket, avgTicketLast) >= 0 ? "+" : ""}${pctChange(avgTicket, avgTicketLast)}% vs mese scorso). "${highMarginService?.name}" ha il margine più alto (${((highMarginService?.profit / highMarginService?.revenue) * 100).toFixed(0)}%). Aumenta del 5-8% nelle ore di punta (${peakHour}:00-${peakHour + 2}:00). Potenziale: +€${Math.round(revenueThis * 0.04)}/mese.`, tags: [{ label: `+€${Math.round(revenueThis * 0.04)}/mese`, type: "revenue" }, { label: "Dynamic pricing", type: "action" }] },
      { title: "📊 Slot Optimization", text: `Le ore ${lowHour}:00-${lowHour + 1}:00 hanno il 60% di occupazione in meno. Proposta: "Early Bird" -10% prima delle 10:00 e "Happy Hour" -15% dopo le 16:00. Stima: ~12 prenotazioni/mese spostate → +€${Math.round(avgTicket * 12 * 0.85)}.`, tags: [{ label: "Fill empty slots", type: "action" }, { label: `+€${Math.round(avgTicket * 12 * 0.85)}`, type: "revenue" }] },
      { title: "🔄 Churn Prevention Alert", text: `${churnRisk} clienti a rischio churn (nessuna visita da 3+ mesi). Attiva campagna WhatsApp "Ci manchi!" con sconto 10%. Stima recupero: ${Math.round(churnRisk * 0.35)} clienti → +€${Math.round(churnRisk * 0.35 * avgTicket * 2)}/trimestre.`, tags: [{ label: `${churnRisk} a rischio`, type: "alert" }, { label: "WhatsApp campaign", type: "action" }] },
      { title: "🐕 Upsell Intelligence", text: `68% prenota solo servizi base. Solo 12% ha provato SPA Premium o Anti-Muta. Cross-sell ai clienti con razze a pelo lungo (Golden, Shih Tzu, Cocker). Potenziale: +€${Math.round(avgTicket * 0.3 * completedThis.length * 0.15)}/mese al 15% di conversione.`, tags: [{ label: "Upsell +15%", type: "revenue" }, { label: "Smart suggestion", type: "action" }] },
      { title: "📅 Q2 2026 Forecast", text: `Margine operativo attuale: ${marginPct.toFixed(1)}%. Primavera = +15% domanda anti-muta. Previsione Q2: fatturato €${Math.round(revenueThis * 3.15)}, margine €${Math.round(profitThis * 3.2)}. Consiglio: +25% scorte shampoo anti-muta e operatore part-time il sabato.`, tags: [{ label: `Margine ${marginPct.toFixed(0)}%`, type: "revenue" }, { label: "Pianifica scorte", type: "action" }] },
    ];
  }, [serviceStats, hourlyDist, revenueThis, revenueLast, profitThis, completedThis, completedLast, clients]);

  // Build forecastData (table) from client-level forecast
  const forecastData = useMemo(() => {
    const months = ["Apr 2026","Mag 2026","Giu 2026","Lug 2026","Ago 2026","Set 2026"];
    const keys = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
    const avgRev = monthlyData.reduce((s, m) => s + m.revenue, 0) / monthlyData.reduce((s, m) => s + m.count, 0);
    
    return months.map((m, i) => {
      const bucket = clientForecast.monthBuckets[keys[i]] || { high: [], medium: [], low: [], totalRev: 0 };
      const highCount = bucket.high.length;
      const medCount = bucket.medium.length;
      const lowCount = bucket.low.length;
      const predicted = highCount + medCount + lowCount;
      // Confidence interval
      const low = highCount + Math.round(medCount * 0.6) + Math.round(lowCount * 0.3);
      const high = highCount + Math.round(medCount * 1.3) + Math.round(lowCount * 1.8);
      const revenue = Math.round(bucket.totalRev);
      return { month: m, predicted, low, high, revenue, highCount, medCount, lowCount };
    });
  }, [clientForecast, monthlyData]);

  // Extended timeline data using client-level forecast
  const timelineData = useMemo(() => {
    const monthNames = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
    const avgRev = monthlyData.reduce((s, m) => s + m.revenue, 0) / monthlyData.reduce((s, m) => s + m.count, 0);

    // Historical 6 months
    const hist6 = monthlyData.map((m, i) => ({
      label: m.label, fullLabel: `${m.label} ${i < 3 ? "2025" : "2026"}`,
      count: m.count, revenue: m.revenue, profit: m.profit,
      type: "actual", highCount: 0, medCount: 0, lowCount: 0
    }));

    // Synthetic 12m extra history
    const rng = seededRandom(77);
    const hist12extra = [];
    for (let i = 0; i < 6; i++) {
      const mIdx = i + 3;
      const r1 = rng(), r2 = rng();
      const base = Math.round(75 + r1 * 30);
      const rev = Math.round(base * avgRev * (0.92 + r2 * 0.08));
      hist12extra.push({ label: monthNames[mIdx], fullLabel: `${monthNames[mIdx]} 2025`, count: base, revenue: rev, profit: Math.round(rev * 0.65), type: "actual", highCount: 0, medCount: 0, lowCount: 0 });
    }

    // Build forecast months from client-level data
    const buildFcMonths = (count) => {
      const fc = [];
      for (let i = 0; i < count; i++) {
        const absMonth = 3 + i; // starting April
        const mIdx = absMonth % 12;
        const yearLabel = absMonth < 12 ? "2026" : "2027";
        const key = `${yearLabel}-${String(mIdx + 1).padStart(2, "0")}`;
        const bucket = clientForecast.monthBuckets[key] || { high: [], medium: [], low: [], totalRev: 0 };
        const hc = bucket.high.length, mc = bucket.medium.length, lc = bucket.low.length;
        const predicted = hc + mc + lc;
        const low = hc + Math.round(mc * 0.6) + Math.round(lc * 0.3);
        const high = hc + Math.round(mc * 1.3) + Math.round(lc * 1.8);
        fc.push({
          label: monthNames[mIdx], fullLabel: `${monthNames[mIdx]} ${yearLabel}`,
          count: predicted, low, high,
          revenue: Math.round(bucket.totalRev), profit: Math.round(bucket.totalRev * 0.68),
          type: "forecast", highCount: hc, medCount: mc, lowCount: lc
        });
      }
      return fc;
    };

    return {
      "6m": [...hist6, ...buildFcMonths(6)],
      "12m": [...hist12extra, ...hist6, ...buildFcMonths(12)],
    };
  }, [monthlyData, clientForecast]);

  // Calendar
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDow = (y, m) => { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; };
  const calDays = useMemo(() => {
    const days = []; const firstDow = getFirstDow(calYear, calMonth); const dim = getDaysInMonth(calYear, calMonth); const prevDim = getDaysInMonth(calYear, calMonth === 0 ? 11 : calMonth - 1);
    for (let i = firstDow - 1; i >= 0; i--) days.push({ day: prevDim - i, month: calMonth - 1, other: true });
    for (let d = 1; d <= dim; d++) days.push({ day: d, month: calMonth, other: false });
    while (days.length < 42) days.push({ day: days.length - firstDow - dim + 1, month: calMonth + 1, other: true });
    return days;
  }, [calYear, calMonth]);

  const getBookingsForDay = useCallback((day, month) => {
    const m = month < 0 ? month + 12 : month > 11 ? month - 12 : month;
    const y = month < 0 ? calYear - 1 : month > 11 ? calYear + 1 : calYear;
    return bookings.filter(b => b.date === `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }, [bookings, calYear]);

  const today = new Date();
  const isToday = (day, month) => day === today.getDate() && month === today.getMonth() && calYear === today.getFullYear();
  const dayBookings = useMemo(() => selectedDate ? bookings.filter(b => b.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)) : [], [bookings, selectedDate]);
  // Calcola visite/spesa/ultima visita da bookings reali (sempre aggiornato)
  // Una "visita" = appuntamento passato non cancellato (Felioom non aggiorna lo stato automaticamente)
  const clientBookingStats = useMemo(() => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
    const map = {};
    bookings.forEach(b => {
      if (!map[b.clientId]) map[b.clientId] = { visitCount: 0, totalSpent: 0, lastVisit: null };
      const isPast = b.date <= today;
      const notCancelled = b.status !== "cancellato";
      if (isPast && notCancelled) {
        map[b.clientId].visitCount++;
        map[b.clientId].totalSpent += Number(b.price) || 0;
        if (!map[b.clientId].lastVisit || b.date > map[b.clientId].lastVisit) map[b.clientId].lastVisit = b.date;
      }
    });
    return map;
  }, [bookings]);

  const filteredClients = useMemo(() => {
    const list = clientFilter ? clients.filter(c => {
      const q = clientFilter.toLowerCase();
      if (`${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(q)) return true;
      return (clientPetsMap[c.id] || []).some(p => p.name.toLowerCase().includes(q) || p.breed.toLowerCase().includes(q));
    }) : clients;
    return [...list].sort((a, b) => {
      const sa = clientBookingStats[a.id] || {};
      const sb = clientBookingStats[b.id] || {};
      let va, vb;
      if (clientSort === "name") { va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; }
      else if (clientSort === "visitCount") { va = sa.visitCount || 0; vb = sb.visitCount || 0; }
      else if (clientSort === "totalSpent") { va = sa.totalSpent || 0; vb = sb.totalSpent || 0; }
      else if (clientSort === "lastVisit") { va = sa.lastVisit || ""; vb = sb.lastVisit || ""; }
      else { va = 0; vb = 0; }
      if (va < vb) return clientSortDir === "asc" ? -1 : 1;
      if (va > vb) return clientSortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [clients, clientFilter, clientPetsMap, clientSort, clientSortDir, clientBookingStats]);

  const maxMonthlyRev = Math.max(...dashboardChartData.map(m => m.revenue));
  const SourcePill = ({ source }) => {
    const map = { whatsapp: "pill-wa", instagram: "pill-ig", telefono: "pill-tel", "walk-in": "pill-walk", online: "pill-online", passaparola: "pill-online", google: "pill-tel" };
    return <span className={`pill ${map[source] || "pill-online"}`}>{source}</span>;
  };

  const sendWaMessage = () => {
    if (!waInput.trim()) return;
    setWaMessages(prev => [...prev, { text: waInput, from: "out", time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) }]);
    setWaInput("");
    setTimeout(() => { setWaMessages(prev => [...prev, { text: "Grazie! Ho confermato la prenotazione. A presto! 🐾", from: "in", time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) }]); }, 1500);
  };

  const navItems = [
    { id: "dashboard", icon: "chart", label: "Dashboard" },
    { id: "calendar", icon: "calendar", label: "Calendario" },
    { id: "clients", icon: "users", label: "Clienti" },
    { id: "services", icon: "dog", label: "Servizi" },
    { id: "analytics", icon: "trend", label: "Analytics" },
    { id: "ai", icon: "sparkle", label: "AI Insights" },
    { id: "forecast", icon: "brain", label: "Forecast" },
    { id: "whatsapp", icon: "whatsapp", label: "WhatsApp" },
  ];

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B1120", color: "#94A3B8", fontFamily: "Outfit, sans-serif", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid #1A2332", borderTop: "3px solid #6EE7B7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 14 }}>Caricamento dati...</span>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />}
        <button className="hamburger-btn" onClick={() => setSidebarOpen(o => !o)}>
          <Icon name="menu" size={20} />
        </button>
        <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="sidebar-logo">
            <h1>shifuku<span>.</span><span className="ai-badge">AI</span></h1>
            <p>AI-Powered Pet Grooming</p>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(n => (
              <div key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => { setView(n.id); setSidebarOpen(false); }}>
                {view === n.id && <span className="nav-dot" />}
                <Icon name={n.icon} size={18} />
                <span>{n.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">shifuku.ai • POC v1.0</div>
        </aside>

        <div className="main">
          {/* DASHBOARD */}
          {view === "dashboard" && (<>
            <div className="header">
              <div className="header-left"><h2>Dashboard</h2><p>Panoramica Marzo 2026</p></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => { setView("calendar"); setShowModal("new"); }}><Icon name="plus" size={16} /> Nuova Prenotazione</button>
              </div>
            </div>
            <div className="content">
              <div className="stats-grid">
                {[
                  ["Prenotazioni", thisMonth.length, pctChange(thisMonth.length, lastMonth.length)],
                  ["Fatturato", `€${revenueThis.toLocaleString()}`, pctChange(revenueThis, revenueLast)],
                  ["Margine", `€${profitThis.toLocaleString()}`, pctChange(profitThis, profitLast)],
                  ["Cancellazioni", `${cancelRate}%`, -(cancelRate - cancelRateLast)],
                ].map(([label, val, change], i) => (
                  <div className="stat-card" key={i} style={{ borderTop: `2px solid ${["var(--accent)","var(--purple)","var(--blue)","var(--orange)"][i]}` }}>
                    <div className="stat-label">{label}</div>
                    <div className="stat-value">{val}</div>
                    <div className={`stat-change ${change >= 0 ? "up" : "down"}`}>
                      <Icon name={change >= 0 ? "arrow_up" : "arrow_down"} size={12} />
                      {Math.abs(change)}{i === 3 ? "pp" : "%"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="two-col" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-header"><h3>Overview</h3>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                      {[
                        ["Fatturato: Passato", overviewPastColor, setOverviewPastColor, false],
                        ["Fatturato: Futuro",  overviewFutureColor, setOverviewFutureColor, true],
                        ["Prenotazioni: Passato", overviewLinePastColor, setOverviewLinePastColor, false, true],
                        ["Prenotazioni: Futuro",  overviewLineFutureColor, setOverviewLineFutureColor, true, true],
                      ].map(([lbl, val, setter, dashed, isLine]) => (
                        <label key={lbl} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", position: "relative" }}>
                          {isLine
                            ? <span style={{ width: 14, height: 2, background: val, borderRadius: 1, display: "inline-block", ...(dashed ? { background: "none", borderTop: `2px dashed ${val}` } : {}) }} />
                            : <span style={{ width: 10, height: 10, borderRadius: 2, background: val, border: `1px ${dashed ? "dashed" : "solid"} rgba(255,255,255,0.2)` }} />
                          }
                          {lbl}
                          <input type="color" value={val} onChange={e => setter(e.target.value)} style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", top: 0, left: 0 }} />
                        </label>
                      ))}
                    </div>
                  </div>
                  {(() => {
                    const n = dashboardChartData.length;
                    const maxRev = Math.max(...dashboardChartData.map(m => m.revenue), 1);
                    const maxCount = Math.max(...dashboardChartData.map(m => m.count), 1);
                    const barBottom = 190; const barH = 140; const unitW = 900 / n;
                    const hex2rgba = (hex, a) => { const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };
                    const pts = dashboardChartData.map((m, i) => ({ x: i * unitW + unitW / 2, y: barBottom - (m.count / maxCount) * barH }));
                    return (
                      <div style={{ position: "relative" }}>
                        <div className="bar-chart">
                          {dashboardChartData.map((m, i) => {
                            const isFuture = m.type === "forecast";
                            const color = isFuture ? overviewFutureColor : overviewPastColor;
                            const isCurrentMonth = !isFuture && i === 5;
                            const barBg = isFuture
                              ? `linear-gradient(180deg, ${color} 0%, ${hex2rgba(color, 0.2)} 100%)`
                              : isCurrentMonth ? color : hex2rgba(color, 0.35);
                            return (
                              <div className="bar-col" key={i}>
                                <div className="bar" style={{
                                  height: `${(m.revenue / maxRev) * 140}px`,
                                  background: barBg,
                                  border: isFuture ? `1px dashed ${hex2rgba(color, 0.5)}` : "none",
                                  borderBottom: "none",
                                }} />
                                <div className="bar-value" style={{ color: isCurrentMonth ? color : isFuture ? color : "var(--text-dim)", textAlign: "center" }}>
                                  €{(m.revenue / 1000).toFixed(1)}k
                                </div>
                                <div className="bar-label" style={{ color: isFuture ? color : undefined }}>{m.label}</div>
                              </div>
                            );
                          })}
                        </div>
                        <svg viewBox="0 0 900 210" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                          {/* Segmento passato: punti 0..5 (incluso punto di giunzione) */}
                          <polyline points={pts.slice(0, 6).map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={overviewLinePastColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          {/* Segmento futuro: da punto 5 (giunzione) ai punti forecast */}
                          <polyline points={pts.slice(5).map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={overviewLineFutureColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" />
                          {pts.map((p, i) => {
                            const isFuturePt = dashboardChartData[i].type === "forecast";
                            const dotColor = isFuturePt ? overviewLineFutureColor : overviewLinePastColor;
                            return (
                              <g key={i}>
                                <circle cx={p.x} cy={p.y} r="4" fill={dotColor} stroke="var(--bg2)" strokeWidth="2" />
                                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="10" fill={dotColor} fontWeight="700" fontFamily="inherit" style={{ pointerEvents: "none" }}>{dashboardChartData[i].count}</text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* TODAY'S RECAP */}
                <div className="card">
                  <div className="card-header"><h3>Recap Oggi — {new Date().toLocaleDateString("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "long" })}</h3><span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{todayBookings.length} appuntamenti</span></div>
                  {todayBookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 13 }}>Nessun appuntamento per oggi</div>
                  ) : (<>
                    <div style={{ display: "flex", gap: 20, marginBottom: 16, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>{todayBookings.filter(b => b.status === "confermato" || b.status === "in-attesa").length}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Da fare</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--success)" }}>{todayBookings.filter(b => b.status === "completato").length}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Completati</div>
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>€{todayBookings.reduce((s, b) => s + b.price, 0)}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Incasso giornata</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
                      {todayBookings.map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: "var(--bg3)", cursor: "pointer" }} onClick={() => { setView("calendar"); setCalView("month"); setSelectedDate(todayStr); }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", minWidth: 42 }}>{b.time}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {b.petName} {clients.find(c => c.id === b.clientId)?.mordace ? "🦷" : ""}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.clientName} • {b.serviceName}</div>
                          </div>
                          <span className={`status-badge ${b.status}`} style={{ flexShrink: 0 }}>{b.status}</span>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", minWidth: 36, textAlign: "right" }}>€{b.price}</div>
                        </div>
                      ))}
                    </div>
                  </>)}
                </div>
              </div>
              <div className="two-col" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-header"><h3>Top Servizi</h3><span className="badge" style={{ background: "var(--purple-dim)", color: "var(--purple)" }}>per fatturato</span></div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {serviceStats.slice(0, 6).map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.count} prenotazioni</div></div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>€{s.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Top 5 Clienti</h3></div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          <th style={{ textAlign: "left", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Cliente</th>
                          <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Prenotazioni</th>
                          <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Media/apt</th>
                          <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Ciclo medio</th>
                          <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Ultima visita</th>
                          <th style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>Totale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topClients.slice(0, 5).map((c, i) => {
                          const colors = ["var(--accent)","var(--purple)","var(--orange)","var(--blue)","var(--danger)"];
                          const dimColors = ["var(--accent-dim)","var(--purple-dim)","var(--orange-dim)","var(--blue-dim)","var(--danger-dim)"];
                          const stats = clientBookingStats[c.id] || {};
                          const visits = stats.visitCount || 0;
                          const totalSpent = stats.totalSpent || 0;
                          const avgSpend = visits > 0 ? Math.round(totalSpent / visits) : 0;
                          const profile = clientForecast.clientProfiles.find(p => p.id === c.id);
                          const cycle = profile?.cycle ?? null;
                          const lastVisit = stats.lastVisit;
                          const daysAgo = lastVisit ? Math.floor((new Date() - new Date(lastVisit)) / 86400000) : null;
                          return (
                            <tr key={c.id} style={{ borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                              <td style={{ padding: "10px 8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: dimColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: colors[i], flexShrink: 0 }}>{c.firstName[0]}{c.lastName[0]}</div>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.firstName} {c.lastName}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                      {(clientPetsMap[c.id] || []).map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join("  ") || c.petName}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: "right", padding: "10px 8px", fontWeight: 600 }}>{visits}</td>
                              <td style={{ textAlign: "right", padding: "10px 8px", color: "var(--accent)", fontWeight: 600 }}>€{avgSpend}</td>
                              <td style={{ textAlign: "right", padding: "10px 8px", color: "var(--purple)", fontWeight: 600 }}>{cycle ? `~${cycle}gg` : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                              <td style={{ textAlign: "right", padding: "10px 8px", color: daysAgo !== null && daysAgo > 60 ? "var(--danger)" : "var(--text-dim)", fontWeight: 600 }}>{daysAgo !== null ? `${daysAgo}gg fa` : "—"}</td>
                              <td style={{ textAlign: "right", padding: "10px 8px", fontWeight: 700, fontSize: 14, color: colors[i] }}>€{totalSpent.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginBottom: 0 }}>
                <div className="card-header"><h3>Canali di Acquisizione</h3></div>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                  {sourceStats.map(([source, count], i) => (
                    <div key={source} style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 150px" }}>
                      <SourcePill source={source} />
                      <div style={{ flex: 1, minWidth: 60 }}><div className="forecast-bar-bg" style={{ height: 18 }}><div className="forecast-bar-fill" style={{ width: `${(count / sourceStats[0][1]) * 100}%`, height: 18, background: ["#25D366","#E1306C","var(--accent)","var(--blue)","var(--purple)"][i] || "var(--accent)" }} /></div></div>
                      <div style={{ fontWeight: 700, fontSize: 13, minWidth: 30, textAlign: "right" }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>)}

          {/* CALENDAR */}
          {view === "calendar" && (<>
            <div className="header">
              <div className="header-left"><h2>Calendario</h2><p>Gestione appuntamenti</p></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="tabs" style={{ marginBottom: 0 }}>
                  <button className={`tab ${calView === "month" ? "active" : ""}`} onClick={() => setCalView("month")}>Mensile</button>
                  <button className={`tab ${calView === "week" ? "active" : ""}`} onClick={() => setCalView("week")}>Settimanale</button>
                  <button className={`tab ${calView === "list" ? "active" : ""}`} onClick={() => setCalView("list")}>Lista</button>
                </div>
                {calView === "month" && (<>
                  <button className="btn btn-sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}><Icon name="left" size={14} /></button>
                  <span style={{ fontWeight: 600, fontSize: 15, minWidth: 140, textAlign: "center" }}>{["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][calMonth]} {calYear}</span>
                  <button className="btn btn-sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}><Icon name="right" size={14} /></button>
                </>)}
                {calView === "week" && (<>
                  <button className="btn btn-sm" onClick={() => setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}><Icon name="left" size={14} /></button>
                  <span style={{ fontWeight: 600, fontSize: 14, minWidth: 200, textAlign: "center" }}>
                    {weekStart.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} — {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <button className="btn btn-sm" onClick={() => setWeekStart(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}><Icon name="right" size={14} /></button>
                  <button className="btn btn-sm" onClick={() => { const d = new Date(); const day = d.getDay(); setWeekStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day === 0 ? 6 : day - 1))); }}>Oggi</button>
                </>)}
                <button className="btn" onClick={() => { setImportBookingRows([]); setImportBookingStats(null); setShowModal("importBookings"); }}>⬆ Importa Storico</button>
                <button className="btn btn-primary" onClick={() => setShowModal("new")}><Icon name="plus" size={16} /> Prenota</button>
              </div>
            </div>
            <div className="content">
              {/* CALENDAR METRICS */}
              {calView !== "list" && (() => {
                const monthPrefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
                const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
                const weekEndStr = `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, "0")}-${String(weekEnd.getDate()).padStart(2, "0")}`;
                const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
                const notCancelled = b => b.status !== "cancellato" && b.status !== "no-show";
                const confirmed = b => b.status === "confermato" || b.status === "completato" || b.status === "in-attesa";
                let viewBs;
                if (calView === "month") viewBs = bookings.filter(b => b.date.startsWith(monthPrefix));
                else if (calView === "week") viewBs = bookings.filter(b => b.date >= weekStartStr && b.date <= weekEndStr);
                else viewBs = selectedDate ? bookings.filter(b => b.date === selectedDate) : bookings.filter(b => b.date.startsWith(monthPrefix));
                const total = viewBs.filter(notCancelled).length;
                const rev = viewBs.filter(confirmed).reduce((s, b) => s + b.price, 0);
                const confirmed_ = viewBs.filter(b => b.status === "confermato" || b.status === "in-attesa").length;
                const completed = viewBs.filter(b => b.status === "completato").length;
                const cancelled = viewBs.filter(b => b.status === "cancellato" || b.status === "no-show").length;
                return (
                  <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                    {[
                      ["Appuntamenti", total, "var(--accent)", "var(--accent-dim)"],
                      ["Confermati", confirmed_, "var(--blue)", "var(--blue-dim)"],
                      ["Completati", completed, "var(--success)", "var(--success-dim)"],
                      ["Cancellati", cancelled, "var(--danger)", "var(--danger-dim)"],
                      ["Fatturato previsto", `€${rev.toLocaleString("it-IT")}`, "var(--purple)", "var(--purple-dim)"],
                    ].map(([label, value, color, bg]) => (
                      <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: "10px 16px", minWidth: 110 }}>
                        <div style={{ fontSize: 11, color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* MONTHLY VIEW */}
              {calView === "month" && (
                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <div className="cal-grid">
                      {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(d => <div className="cal-header-cell" key={d}>{d}</div>)}
                      {calDays.map((d, i) => {
                        const db = getBookingsForDay(d.day, d.month);
                        const ds = `${d.month > 11 ? calYear + 1 : d.month < 0 ? calYear - 1 : calYear}-${String((d.month < 0 ? d.month + 12 : d.month > 11 ? d.month - 12 : d.month) + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                        return (
                          <div key={i} className={`cal-cell ${d.other ? "other-month" : ""} ${isToday(d.day, d.month) ? "today" : ""}`} onClick={() => { if (!d.other) { setSelectedDate(ds); setNewBookingForm(f => ({ ...f, date: ds })); } }}>
                            <div className="cal-day">{d.day}</div>
                            {db.slice(0, 3).map(b => { const ac = ANIMAL_COLORS[b.animalType] || ANIMAL_COLORS.altro; return <div key={b.id} className={`cal-booking ${b.status}`} style={{ background: ac.bg, color: ac.text }}>{ac.emoji} {b.time} {b.petName}</div>; })}
                            {db.length > 3 && <div className="cal-more">+{db.length - 3} altri</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {selectedDate && (
                    <div style={{ width: 320, flexShrink: 0 }}>
                      <div className="card" style={{ position: "sticky", top: 0 }}>
                        <div className="card-header">
                          <h3>{new Date(selectedDate + "T00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayBookings.length} app.</span>
                            <button className="btn btn-primary btn-sm" onClick={() => setShowModal("new")} style={{ padding: "5px 10px" }}><Icon name="plus" size={14} /></button>
                          </div>
                        </div>
                        {dayBookings.length === 0 ? (
                          <div style={{ textAlign: "center", padding: 24 }}>
                            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>Nessun appuntamento</p>
                            <button className="btn btn-primary" onClick={() => setShowModal("new")}><Icon name="plus" size={16} /> Prenota per questo giorno</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {dayBookings.map(b => (
                              <div key={b.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)", cursor: "pointer" }} onClick={() => openEditBooking(b)}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{b.time}</span><div style={{ display: "flex", gap: 6, alignItems: "center" }}><span className={`status-badge ${b.status}`}>{b.status}</span><button onClick={(e) => { e.stopPropagation(); deleteBooking(b.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 2, display: "flex" }}><Icon name="x" size={14} /></button></div></div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{b.petName} ({b.breed})</div>
                                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.clientName} • {b.serviceName}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}><Icon name="clock" size={12} /> {b.duration}min</span>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {b.payment && <span className="pill" style={{ background: b.payment === "pos" ? "var(--blue-dim)" : b.payment === "contanti" ? "var(--success-dim)" : "var(--purple-dim)", color: b.payment === "pos" ? "var(--blue)" : b.payment === "contanti" ? "var(--success)" : "var(--purple)", fontSize: 10 }}>{b.payment === "pos" ? "POS" : b.payment === "contanti" ? "Cash" : b.payment}</span>}
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>€{b.price}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* WEEKLY VIEW */}
              {calView === "week" && (() => {
                const SLOT_H = 36;
                const START_HOUR = 8;
                const END_HOUR = 19;
                const SLOTS = (END_HOUR - START_HOUR) * 2; // 22 half-hour slots
                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
                  return { date: d, dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, dayName: ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"][d.getDay()], dayNum: d.getDate(), isToday: d.toDateString() === new Date().toDateString() };
                });
                const statusColors = { completato: { bg: "var(--success-dim)", border: "var(--success)", text: "var(--success)" }, confermato: { bg: "var(--blue-dim)", border: "var(--blue)", text: "var(--blue)" }, "in-attesa": { bg: "var(--warning-dim)", border: "var(--warning)", text: "var(--warning)" }, cancellato: { bg: "var(--danger-dim)", border: "var(--danger)", text: "var(--danger)" }, "no-show": { bg: "var(--purple-dim)", border: "var(--purple)", text: "var(--purple)" } };
                
                return (
                  <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}>
                    {/* Animal type legend */}
                    <div style={{ display: "flex", gap: 12, padding: "8px 16px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                      {Object.entries(ANIMAL_COLORS).map(([type, c]) => (
                        <span key={type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: c.text }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.border, display: "inline-block" }} />
                          {c.emoji} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                      ))}
                    </div>
                    <div className="week-grid">
                      {/* Header row */}
                      <div className="week-header-cell" style={{ borderLeft: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="clock" size={14} color="var(--text-muted)" />
                      </div>
                      {weekDays.map((wd, i) => (
                        <div key={i} className={`week-header-cell ${wd.isToday ? "wh-today" : ""}`}>
                          <div className="wh-day">{wd.dayName}</div>
                          <div className="wh-num">{wd.dayNum}</div>
                        </div>
                      ))}

                      {/* Time column + Day columns */}
                      <div className="week-time-col">
                        {Array.from({ length: SLOTS }, (_, s) => {
                          const h = START_HOUR + Math.floor(s / 2);
                          const m = s % 2 === 0 ? "00" : "30";
                          return <div key={s} className="week-time-label">{s % 2 === 0 ? `${h}:${m}` : ""}</div>;
                        })}
                      </div>

                      {weekDays.map((wd, di) => {
                        const dayBookingsW = bookings.filter(b => b.date === wd.dateStr);
                        const isDragDay = dragState && dragState.dayIdx === di;
                        const dragMin = isDragDay ? Math.min(dragState.startSlot, dragState.currentSlot) : -1;
                        const dragMax = isDragDay ? Math.max(dragState.startSlot, dragState.currentSlot) : -1;
                        const dragSlots = isDragDay ? dragMax - dragMin + 1 : 0;
                        const dragDuration = dragSlots * 30;
                        const dragDurLabel = dragDuration >= 60 ? (dragDuration % 60 === 0 ? `${dragDuration / 60} hr` : `${(dragDuration / 60).toFixed(1)} hr`) : `0.5 hr`;
                        const dragStartH = isDragDay ? START_HOUR + Math.floor(dragMin / 2) : 0;
                        const dragStartM = isDragDay ? (dragMin % 2 === 0 ? "00" : "30") : "00";
                        
                        return (
                          <div key={di} className="week-day-col" onMouseLeave={onGridMouseLeave} onMouseUp={onSlotMouseUp}>
                            {/* Slot grid (draggable) */}
                            {Array.from({ length: SLOTS }, (_, s) => {
                              const h = START_HOUR + Math.floor(s / 2);
                              const m = s % 2 === 0 ? "00" : "30";
                              const inDragRange = isDragDay && s >= dragMin && s <= dragMax;
                              return (
                                <div key={s}
                                  className={`week-slot ${s % 2 === 1 ? "half" : ""}`}
                                  style={inDragRange ? { background: "rgba(110,231,183,0.15)" } : undefined}
                                  onMouseDown={(e) => { e.preventDefault(); onSlotMouseDown(di, s, wd.dateStr); }}
                                  onMouseEnter={() => onSlotMouseEnter(di, s)}
                                />
                              );
                            })}

                            {/* Drag preview overlay */}
                            {isDragDay && dragSlots > 0 && (
                              <div className="week-drag-overlay" style={{ top: dragMin * SLOT_H + 1, height: dragSlots * SLOT_H - 2 }}>
                                {dragStartH}:{dragStartM} — {dragDurLabel}
                              </div>
                            )}

                            {/* Booking blocks overlaid — with overlap column layout */}
                            {(() => {
                              // Compute start/end in minutes for each booking
                              const withTimes = dayBookingsW.map(b => {
                                const [bh, bm] = b.time.split(":").map(Number);
                                const start = (bh - START_HOUR) * 60 + bm;
                                return { ...b, _start: start, _end: start + b.duration };
                              }).filter(b => b._start >= 0).sort((a, b) => a._start - b._start);

                              // Assign a column index to each booking (first free column)
                              const colEnds = [];
                              const withCols = withTimes.map(b => {
                                let col = colEnds.findIndex(e => e <= b._start);
                                if (col === -1) { col = colEnds.length; colEnds.push(b._end); }
                                else colEnds[col] = b._end;
                                return { ...b, col };
                              });

                              // Compute total columns in each overlap group
                              const withTotal = withCols.map(b => {
                                const overlapping = withCols.filter(o => o._start < b._end && o._end > b._start);
                                const totalCols = Math.max(...overlapping.map(o => o.col)) + 1;
                                return { ...b, totalCols };
                              });

                              return withTotal.map(b => {
                                const topPx = (b._start / 30) * SLOT_H;
                                const heightPx = Math.max((b.duration / 30) * SLOT_H - 2, SLOT_H - 2);
                                const ac = ANIMAL_COLORS[b.animalType] || ANIMAL_COLORS.altro;
                                const cancelled = b.status === "cancellato" || b.status === "no-show";
                                const colW = 100 / b.totalCols;
                                const leftPct = b.col * colW;
                                return (
                                  <div key={b.id} className="week-booking-block"
                                    style={{ top: topPx, height: heightPx, background: ac.bg, borderLeftColor: ac.border, color: ac.text, left: `calc(${leftPct}% + 2px)`, width: `calc(${colW}% - 4px)`, opacity: cancelled ? 0.45 : 1 }}
                                    title={`${b.time} - ${b.clientName}\n${b.petName} • ${b.serviceName}\n${b.duration}min • €${b.price}${b.payment ? "\nPagamento: " + b.payment : ""}`}
                                    onClick={(e) => { e.stopPropagation(); openEditBooking(b); }}
                                  >
                                    <div className="wb-time">{b.time}{b.payment && <span style={{ marginLeft: 4, opacity: 0.7 }}>{b.payment === "pos" ? "💳" : b.payment === "contanti" ? "💵" : "📝"}</span>}</div>
                                    <div className="wb-name">{(ANIMAL_COLORS[b.animalType]?.emoji || "🐾")} {b.petName}</div>
                                    {heightPx > 50 && <div className="wb-service">{b.serviceName}</div>}
                                    {heightPx > 70 && <div style={{ fontSize: 10, marginTop: 2 }}>{b.clientName} • €{b.price}</div>}
                                  </div>
                                );
                              });
                            })()}

                            {/* Now line */}
                            {wd.isToday && (() => {
                              const nowH = 11, nowM = 30; // Simulated "now" for demo
                              const nowMin = (nowH - START_HOUR) * 60 + nowM;
                              if (nowMin < 0 || nowMin > (END_HOUR - START_HOUR) * 60) return null;
                              return <div className="week-now-line" style={{ top: (nowMin / 30) * SLOT_H }} />;
                            })()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* LIST VIEW */}
              {calView === "list" && (
                <div>
                  {selectedBookingIds.size > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: "var(--danger-dim)", borderRadius: 10, marginBottom: 16, border: "1px solid rgba(248,113,113,0.2)" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>{selectedBookingIds.size} prenotazioni selezionate</span>
                      <button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={bulkDeleteBookings}><Icon name="x" size={14} /> Elimina selezionate</button>
                      <button className="btn btn-sm" onClick={() => setSelectedBookingIds(new Set())} style={{ marginLeft: "auto" }}>Deseleziona</button>
                    </div>
                  )}
                  <div className="card" style={{ padding: 0 }}>
                    <table>
                      <thead><tr>
                        <th style={{ width: 40, textAlign: "center" }}><input type="checkbox" checked={currentMonthBookings.length > 0 && selectedBookingIds.size === currentMonthBookings.length} onChange={() => selectAllBookings(currentMonthBookings.map(b => b.id))} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} /></th>
                        <th>Data</th><th>Ora</th><th>Cliente</th><th>Cane</th><th>Servizio</th><th>Stato</th><th>Pagamento</th><th>Importo</th><th></th>
                      </tr></thead>
                      <tbody>
                        {bookings.sort((a, b) => b.date === a.date ? a.time.localeCompare(b.time) : b.date.localeCompare(a.date)).map(b => (
                          <tr key={b.id} style={{ background: selectedBookingIds.has(b.id) ? "var(--danger-dim)" : undefined, cursor: "pointer" }}>
                            <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedBookingIds.has(b.id)} onChange={() => toggleBookingSelect(b.id)} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} /></td>
                            <td style={{ fontWeight: 500 }} onClick={() => openEditBooking(b)}>{b.date}</td>
                            <td onClick={() => openEditBooking(b)}>{b.time}</td>
                            <td onClick={() => openEditBooking(b)}>{b.clientName}</td>
                            <td onClick={() => openEditBooking(b)}>{b.petName}</td>
                            <td onClick={() => openEditBooking(b)} style={{ fontSize: 12 }}>{b.serviceName}</td>
                            <td onClick={() => openEditBooking(b)}><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                            <td onClick={() => openEditBooking(b)}>{b.payment ? <span className="pill" style={{ background: b.payment === "pos" ? "var(--blue-dim)" : b.payment === "contanti" ? "var(--success-dim)" : "var(--purple-dim)", color: b.payment === "pos" ? "var(--blue)" : b.payment === "contanti" ? "var(--success)" : "var(--purple)", fontSize: 10 }}>{b.payment === "pos" ? "POS" : b.payment === "contanti" ? "Cash" : b.payment}</span> : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>}</td>
                            <td onClick={() => openEditBooking(b)} style={{ fontWeight: 600, color: "var(--accent)" }}>€{b.price}</td>
                            <td><button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "transparent", padding: "4px 8px" }} onClick={() => deleteBooking(b.id)}><Icon name="x" size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>{bookings.length} prenotazioni totali</div>
                </div>
              )}
            </div>
          </>)}

          {/* CLIENTS */}
          {view === "clients" && (<>
            <div className="header">
              <div className="header-left"><h2>Clienti</h2><p>{clients.length} clienti registrati</p></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input placeholder="Cerca cliente, cane, razza..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ width: 280 }} />
                <button className="btn" onClick={() => { setImportRows([]); setShowModal("importClients"); }}>⬆ Importa CSV/Excel</button>
                <button className="btn btn-primary" onClick={() => setShowModal("newClient")}><Icon name="plus" size={16} /> Nuovo Cliente</button>
              </div>
            </div>
            <div className="content">
              {selectedClient ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <button className="btn btn-sm" onClick={() => setSelectedClient(null)}><Icon name="left" size={14} /> Torna alla lista</button>
                    <button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => deleteClient(selectedClient.id)}><Icon name="x" size={14} /> Elimina Cliente</button>
                  </div>
                  <div className="two-col" style={{ marginBottom: 20 }}>
                    <div className="card">
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{selectedClient.firstName} {selectedClient.lastName}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[["Telefono", selectedClient.phone],["Email", selectedClient.email],["Canale", null],["Giorno Pref.", selectedClient.preferredDay],["Registrato", selectedClient.registeredDate]].map(([l, v], i) => (
                          <div key={i}><label>{l}</label>{i === 2 ? <SourcePill source={selectedClient.source} /> : <div style={{ fontSize: 13 }}>{v}</div>}</div>
                        ))}
                      </div>

                      {/* PETS SECTION */}
                      <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>🐾 Animali</div>
                          <button className="btn btn-sm" onClick={() => { setNewPetForm(emptyPet); setShowAddPet(selectedClient.id); }}><Icon name="plus" size={13} /> Aggiungi</button>
                        </div>
                        {(clientPetsMap[selectedClient.id] || []).map(pet => (
                          <div key={pet.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "var(--bg3)", borderRadius: 8, marginBottom: 6 }}>
                            <div style={{ fontSize: 22, lineHeight: 1 }}>{ANIMAL_COLORS[pet.animalType]?.emoji || "🐾"}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{pet.name}</div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "capitalize" }}>{pet.animalType} · {pet.breed} · {pet.size}</div>
                            </div>
                            <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11 }}>
                              <input type="checkbox" checked={pet.mordace} onChange={async e => { const val = e.target.checked; await supabase.from('pets').update({ mordace: val }).eq('id', pet.id); setPets(prev => prev.map(p => p.id === pet.id ? { ...p, mordace: val } : p)); }} style={{ width: 14, height: 14, accentColor: "var(--danger)" }} />
                              <span style={{ color: "var(--danger)" }}>mordace</span>
                            </label>
                            <button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "transparent", padding: "2px 6px" }} onClick={() => deletePet(pet.id)}><Icon name="x" size={12} /></button>
                          </div>
                        ))}
                        {(clientPetsMap[selectedClient.id] || []).length === 0 && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Nessun animale registrato</div>
                        )}
                        {(clientPetsMap[selectedClient.id] || []).some(p => p.mordace) && (
                          <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--danger-dim)", borderRadius: 8, fontSize: 12, color: "var(--danger)" }}>🦷 Attenzione: uno o più animali di questo cliente sono mordaci</div>
                        )}

                        {showAddPet === selectedClient.id && (
                          <div style={{ marginTop: 10, padding: 12, background: "var(--bg-card)", borderRadius: 8, border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Nuovo animale</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                              <div><label style={{ fontSize: 11 }}>Nome *</label><input placeholder="Luna" value={newPetForm.name} onChange={e => setNewPetForm(f => ({ ...f, name: e.target.value }))} style={{ fontSize: 12 }} /></div>
                              <div><label style={{ fontSize: 11 }}>Tipo</label>
                                <select value={newPetForm.animalType} onChange={e => setNewPetForm(f => ({ ...f, animalType: e.target.value }))} style={{ fontSize: 12 }}>
                                  <option value="cane">🐕 Cane</option><option value="gatto">🐈 Gatto</option><option value="coniglio">🐇 Coniglio</option><option value="uccello">🦜 Uccello</option><option value="rettile">🦎 Rettile</option><option value="altro">🐾 Altro</option>
                                </select>
                              </div>
                              <div><label style={{ fontSize: 11 }}>Razza</label><input placeholder="Meticcio" value={newPetForm.breed} onChange={e => setNewPetForm(f => ({ ...f, breed: e.target.value }))} style={{ fontSize: 12 }} /></div>
                              <div><label style={{ fontSize: 11 }}>Taglia</label>
                                <select value={newPetForm.size} onChange={e => setNewPetForm(f => ({ ...f, size: e.target.value }))} style={{ fontSize: 12 }}>
                                  <option value="piccola">Piccola</option><option value="media">Media</option><option value="grande">Grande</option>
                                </select>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button className="btn btn-sm" onClick={() => setShowAddPet(null)}>Annulla</button>
                              <button className="btn btn-primary btn-sm" disabled={!newPetForm.name} onClick={() => addPet(selectedClient.id)}><Icon name="check" size={12} /> Salva</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="card">
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Statistiche Cliente</h3>
                      {(() => {
                        const profile = clientForecast.clientProfiles.find(cp => cp.id === selectedClient.id);
                        const hasCycle = profile && profile.cycle && profile.confidence !== "none";
                        return (<>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            {(() => { const sc = clientBookingStats[selectedClient.id] || { visitCount: 0, totalSpent: 0 }; return [["Spesa Totale", `€${sc.totalSpent}`, "var(--accent)"],["Visite", sc.visitCount, "var(--text)"],["Punti Fedeltà", selectedClient.loyaltyPoints, "var(--orange)"],["Scontrino Medio", `€${sc.visitCount ? Math.round(sc.totalSpent / sc.visitCount) : 0}`, "var(--text)"]]; })().map(([l, v, c], i) => (
                              <div key={i}><div className="stat-label">{l}</div><div style={{ fontSize: 28, fontWeight: 800, color: c }}>{v}</div></div>
                            ))}
                          </div>

                          {/* CYCLE ANALYSIS */}
                          {hasCycle && (
                            <div style={{ marginTop: 20, padding: 16, background: "var(--bg3)", borderRadius: 10, border: "1px solid var(--border)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                <Icon name="sparkle" size={14} color="var(--accent)" />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>Analisi Ciclo di Ritorno</span>
                                <span className="badge" style={{ 
                                  background: profile.confidence === "high" ? "var(--success-dim)" : profile.confidence === "medium" ? "var(--purple-dim)" : profile.confidence === "churned" ? "var(--danger-dim)" : "var(--blue-dim)",
                                  color: profile.confidence === "high" ? "var(--success)" : profile.confidence === "medium" ? "var(--purple)" : profile.confidence === "churned" ? "var(--danger)" : "var(--blue)",
                                  marginLeft: "auto"
                                }}>
                                  {profile.confidence === "high" ? "Alta confidenza" : profile.confidence === "medium" ? "Media confidenza" : profile.confidence === "churned" ? "Rischio churn" : "Bassa confidenza"}
                                </span>
                              </div>
                              
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                                <div style={{ textAlign: "center", padding: 12, background: "var(--bg-card)", borderRadius: 8 }}>
                                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Ciclo Medio</div>
                                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>{profile.cycle}gg</div>
                                </div>
                                <div style={{ textAlign: "center", padding: 12, background: "var(--bg-card)", borderRadius: 8 }}>
                                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Variabilità</div>
                                  <div style={{ fontSize: 26, fontWeight: 800, color: profile.stddev <= 10 ? "var(--success)" : "var(--orange)", marginTop: 4 }}>±{profile.stddev}gg</div>
                                </div>
                                {(() => {
                                  const nextReal = bookings
                                    .filter(b => b.clientId === selectedClient.id && b.date > todayStr && (b.status === "confermato" || b.status === "in-attesa"))
                                    .sort((a, b) => a.date.localeCompare(b.date))[0];
                                  const isAI = !nextReal;
                                  const label = isAI ? "Stima AI" : "Prossima Prenotazione";
                                  const dateStr = nextReal
                                    ? new Date(nextReal.date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) + (nextReal.time ? ` · ${nextReal.time}` : "")
                                    : profile.churned ? "Probabilmente perso" : profile.nextExpected ? profile.nextExpected.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—";
                                  return (
                                    <div style={{ textAlign: "center", padding: 12, background: isAI ? "var(--purple-dim)" : "var(--success-dim)", borderRadius: 8, border: `1px solid ${isAI ? "rgba(167,139,250,0.2)" : "rgba(52,211,153,0.2)"}` }}>
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 10, color: isAI ? "var(--purple)" : "var(--success)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                                        {isAI && <Icon name="sparkle" size={10} color="var(--purple)" />}
                                        {label}
                                      </div>
                                      <div style={{ fontSize: 14, fontWeight: 700, color: profile.churned ? "var(--danger)" : isAI ? "var(--purple)" : "var(--success)", marginTop: 8 }}>{dateStr}</div>
                                      {isAI && !profile.churned && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>stimata dal modello</div>}
                                    </div>
                                  );
                                })()}
                              </div>

                              {profile.intervals && profile.intervals.length === 0 && (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic", marginTop: 8 }}>
                                  Una sola visita registrata — ciclo stimato a 45gg (media settore). Dopo la seconda visita il modello si calibrerà automaticamente.
                                </div>
                              )}
                            </div>
                          )}

                          {!hasCycle && (
                            <div style={{ marginTop: 20, padding: 14, background: "var(--bg3)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
                              Nessuna visita completata — il modello di previsione ciclo si attiverà dopo la prima visita.
                            </div>
                          )}
                          
                          <div style={{ marginTop: 16 }}><button className="btn btn-whatsapp btn-sm"><Icon name="whatsapp" size={14} color="white" /> Invia messaggio</button></div>
                        </>);
                      })()}
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3>Storico Prenotazioni</h3></div>
                    <table><thead><tr><th>Data</th><th>Ora</th><th>Servizio</th><th>Stato</th><th>Pagamento</th><th>Importo</th><th></th></tr></thead>
                    <tbody>{bookings.filter(b => b.clientId === selectedClient.id).sort((a, b) => b.date.localeCompare(a.date)).map(b => (
                      <tr key={b.id} style={{ cursor: "pointer" }}>
                        <td onClick={() => openEditBooking(b)}>{b.date}</td>
                        <td onClick={() => openEditBooking(b)}>{b.time}</td>
                        <td onClick={() => openEditBooking(b)}>{b.serviceName}</td>
                        <td onClick={() => openEditBooking(b)}><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                        <td onClick={() => openEditBooking(b)}>{b.payment ? <span className="pill" style={{ background: b.payment === "pos" ? "var(--blue-dim)" : b.payment === "contanti" ? "var(--success-dim)" : "var(--purple-dim)", color: b.payment === "pos" ? "var(--blue)" : b.payment === "contanti" ? "var(--success)" : "var(--purple)", fontSize: 10 }}>{b.payment === "pos" ? "POS" : b.payment === "contanti" ? "Cash" : b.payment}</span> : <span style={{ fontSize: 11, color: "var(--text-muted)" }}>—</span>}</td>
                        <td onClick={() => openEditBooking(b)} style={{ fontWeight: 600, color: "var(--accent)" }}>€{b.price}</td>
                        <td><button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "transparent", padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); deleteBooking(b.id); }}><Icon name="x" size={14} /></button></td>
                      </tr>
                    ))}</tbody></table>
                  </div>
                </div>
              ) : (
                <div>
                  {selectedClientIds.size > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: "var(--danger-dim)", borderRadius: 10, marginBottom: 16, border: "1px solid rgba(248,113,113,0.2)" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>{selectedClientIds.size} clienti selezionati</span>
                      <button className="btn btn-sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={bulkDeleteClients}><Icon name="x" size={14} /> Elimina selezionati</button>
                      <button className="btn btn-sm" onClick={() => setSelectedClientIds(new Set())} style={{ marginLeft: "auto" }}>Deseleziona</button>
                    </div>
                  )}
                  <div className="card" style={{ padding: 0 }}>
                    <table><thead><tr>
                      <th style={{ width: 40, textAlign: "center" }}><input type="checkbox" checked={filteredClients.length > 0 && selectedClientIds.size === filteredClients.length} onChange={() => selectAllClients(filteredClients.map(c => c.id))} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} /></th>
                      {[["name","Cliente"],["","Animali"],["","Razza"],["","Taglia"],["visitCount","Visite"],["","Ciclo"],["","Stato"],["totalSpent","Spesa Tot."],["lastVisit","Ultima Visita"],["","Canale"]].map(([key, label]) => (
                        <th key={label} onClick={key ? () => { if (clientSort === key) setClientSortDir(d => d === "asc" ? "desc" : "asc"); else { setClientSort(key); setClientSortDir("desc"); } } : undefined}
                          style={key ? { cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" } : {}}>
                          {label}{key && clientSort === key ? (clientSortDir === "asc" ? " ▲" : " ▼") : (key ? " ↕" : "")}
                        </th>
                      ))}
                    </tr></thead>
                    <tbody>{filteredClients.map(c => {
                      const cStats = clientBookingStats[c.id] || { visitCount: 0, totalSpent: 0, lastVisit: null };
                      const profile = clientForecast.clientProfiles.find(cp => cp.id === c.id);
                      const cycle = profile?.cycle;
                      const conf = profile?.confidence;
                      let statusLabel, statusBg, statusColor;
                      if (conf === "churned") { statusLabel = "Churn risk"; statusBg = "var(--danger-dim)"; statusColor = "var(--danger)"; }
                      else if (conf === "high") { statusLabel = "Stabile"; statusBg = "var(--success-dim)"; statusColor = "var(--success)"; }
                      else if (conf === "medium") { statusLabel = "Irregolare"; statusBg = "var(--orange-dim)"; statusColor = "var(--orange)"; }
                      else if (conf === "low") { statusLabel = "Nuovo"; statusBg = "var(--blue-dim)"; statusColor = "var(--blue)"; }
                      else { statusLabel = "—"; statusBg = "transparent"; statusColor = "var(--text-muted)"; }
                      return (
                      <tr key={c.id} style={{ cursor: "pointer", background: selectedClientIds.has(c.id) ? "var(--danger-dim)" : undefined }}>
                        <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selectedClientIds.has(c.id)} onChange={() => toggleClientSelect(c.id)} style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer" }} /></td>
                        <td style={{ fontWeight: 500 }} onClick={() => setSelectedClient(c)}>{c.firstName} {c.lastName}</td>
                        <td onClick={() => setSelectedClient(c)}>{(clientPetsMap[c.id] || []).map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join(", ") || "—"}</td>
                        <td onClick={() => setSelectedClient(c)}>{(clientPetsMap[c.id] || [])[0]?.breed || "—"}</td>
                        <td onClick={() => setSelectedClient(c)} style={{ textTransform: "capitalize" }}>{(clientPetsMap[c.id] || [])[0]?.size || "—"}</td>
                        <td onClick={() => setSelectedClient(c)}><span style={{ fontWeight: 700 }}>{cStats.visitCount}</span></td>
                        <td onClick={() => setSelectedClient(c)} style={{ fontWeight: 600 }}>{cycle ? `${cycle}gg` : "—"}</td>
                        <td onClick={() => setSelectedClient(c)}><span className="status-badge" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span></td>
                        <td onClick={() => setSelectedClient(c)} style={{ fontWeight: 600, color: "var(--accent)" }}>€{cStats.totalSpent}</td><td onClick={() => setSelectedClient(c)}>{cStats.lastVisit || "—"}</td><td onClick={() => setSelectedClient(c)}><SourcePill source={c.source} /></td>
                      </tr>);
                    })}</tbody></table>
                  </div>
                </div>
              )}
            </div>
          </>)}

          {/* SERVICES */}
          {view === "services" && (<>
            <div className="header">
              <div className="header-left"><h2>Servizi</h2><p>{services.length} servizi configurati</p></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => {
                  const newS = { id: `s${Date.now()}`, name: "Nuovo Servizio", duration: 30, price: 25, cost: 8 };
                  setServices(prev => [...prev, newS]);
                }}><Icon name="plus" size={16} /> Aggiungi Servizio</button>
              </div>
            </div>
            <div className="content">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {services.map(s => {
                  const margin = s.price > 0 ? ((s.price - s.cost) / s.price * 100).toFixed(0) : 0;
                  const durLabel = s.duration >= 60 ? (s.duration % 60 === 0 ? `${s.duration / 60} hr` : `${(s.duration / 60).toFixed(1)} hr`) : `${s.duration} min`;
                  return (
                    <div key={s.id} className="card" style={{ padding: 0 }}>
                      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <input value={s.name} onChange={e => setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, name: e.target.value } : sv))} style={{ fontSize: 15, fontWeight: 700, background: "transparent", border: "none", padding: 0, color: "var(--text)", width: "100%" }} />
                          <button onClick={() => { if (confirm("Eliminare questo servizio?")) setServices(prev => prev.filter(sv => sv.id !== s.id)); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, flexShrink: 0 }}><Icon name="x" size={16} /></button>
                        </div>
                      </div>
                      <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        <div>
                          <label>Prezzo (€)</label>
                          <input type="number" min="0" step="1" value={s.price} onChange={e => setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, price: Number(e.target.value) } : sv))} />
                        </div>
                        <div>
                          <label>Durata (min)</label>
                          <input type="number" min="5" step="5" value={s.duration} onChange={e => setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, duration: Number(e.target.value) } : sv))} />
                        </div>
                        <div>
                          <label>Costo (€)</label>
                          <input type="number" min="0" step="1" value={s.cost} onChange={e => setServices(prev => prev.map(sv => sv.id === s.id ? { ...sv, cost: Number(e.target.value) } : sv))} />
                        </div>
                      </div>
                      <div style={{ padding: "0 20px 14px", display: "flex", gap: 12, fontSize: 12 }}>
                        <span style={{ color: "var(--text-muted)" }}>Durata: <strong style={{ color: "var(--text-dim)" }}>{durLabel}</strong></span>
                        <span style={{ color: "var(--text-muted)" }}>Margine: <strong style={{ color: Number(margin) > 60 ? "var(--success)" : "var(--orange)" }}>{margin}%</strong></span>
                        <span style={{ color: "var(--text-muted)" }}>Profitto: <strong style={{ color: "var(--accent)" }}>€{s.price - s.cost}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>)}

          {/* ANALYTICS */}
          {view === "analytics" && (<>
            <div className="header"><div className="header-left"><h2>Analytics</h2><p>Analisi dettagliata performance</p></div></div>
            <div className="content">
              <div className="tabs">
                {[["overview","Panoramica"],["services","Servizi"],["time","Temporale"],["clients","Clienti"]].map(([id, label]) => (
                  <button key={id} className={`tab ${analyticsTab === id ? "active" : ""}`} onClick={() => setAnalyticsTab(id)}>{label}</button>
                ))}
              </div>
              {analyticsTab === "overview" && (<div className="two-col">
                <div className="card">
                  <div className="card-header"><h3>Fatturato vs Margine</h3></div>
                  <div className="bar-chart">
                    {(() => { const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1); return monthlyData.map((m, i) => (
                      <div className="bar-col" key={i}>
                        <div className="bar-value" style={{ color: "var(--text-dim)" }}>€{(m.revenue / 1000).toFixed(1)}k</div>
                        <div style={{ width: "100%", display: "flex", gap: 3, justifyContent: "center", height: `${(m.revenue / maxRev) * 140}px`, overflow: "hidden" }}>
                          <div className="bar" style={{ flex: 1, background: "var(--accent)", height: "100%", borderRadius: "4px 4px 0 0" }} />
                          <div className="bar" style={{ flex: 1, background: "var(--purple)", height: `${m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0}%`, borderRadius: "4px 4px 0 0", alignSelf: "flex-end" }} />
                        </div>
                        <div className="bar-label">{m.label}</div>
                      </div>
                    ))})()}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--accent)", marginRight: 6 }} />Fatturato</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--purple)", marginRight: 6 }} />Margine</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Prenotazioni per Giorno</h3></div>
                  <div className="bar-chart">
                    {dowDist.map((d, i) => (
                      <div className="bar-col" key={i}><div className="bar-value">{d.value}</div><div className="bar" style={{ height: `${(d.value / Math.max(...dowDist.map(x => x.value))) * 140}px`, background: i === 5 ? "var(--purple)" : "var(--accent)" }} /><div className="bar-label">{d.label}</div></div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Distribuzione Oraria</h3></div>
                  <div className="bar-chart">
                    {hourlyDist.map((v, i) => (
                      <div className="bar-col" key={i}><div className="bar-value">{v}</div><div className="bar" style={{ height: `${(v / Math.max(...hourlyDist)) * 140}px`, background: v === Math.max(...hourlyDist) ? "var(--accent)" : "rgba(110,231,183,0.2)" }} /><div className="bar-label">{i + 8}</div></div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Top Razze</h3></div>
                  {breedDist.map(([breed, count], i) => (
                    <div key={breed} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 110, fontSize: 13, fontWeight: 500 }}>{breed}</div>
                      <div style={{ flex: 1 }}><div className="forecast-bar-bg"><div className="forecast-bar-fill" style={{ width: `${(count / breedDist[0][1]) * 100}%`, background: "var(--accent)" }} /></div></div>
                      <div style={{ fontWeight: 700, fontSize: 13, minWidth: 30 }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>)}
              {analyticsTab === "services" && (<div className="card" style={{ padding: 0 }}>
                <table><thead><tr><th>Servizio</th><th>Prenotazioni</th><th>Fatturato</th><th>Margine</th><th>% Margine</th><th>Ticket Medio</th></tr></thead>
                <tbody>{serviceStats.map(s => (
                  <tr key={s.name}><td style={{ fontWeight: 500 }}>{s.name}</td><td>{s.count}</td><td style={{ fontWeight: 600 }}>€{s.revenue.toLocaleString()}</td><td style={{ fontWeight: 600, color: "var(--accent)" }}>€{s.profit.toLocaleString()}</td>
                  <td><span className="status-badge" style={{ background: (s.profit/s.revenue) > 0.65 ? "var(--success-dim)" : "var(--warning-dim)", color: (s.profit/s.revenue) > 0.65 ? "var(--success)" : "var(--warning)" }}>{((s.profit / s.revenue) * 100).toFixed(1)}%</span></td>
                  <td>€{Math.round(s.revenue / s.count)}</td></tr>
                ))}</tbody></table>
              </div>)}
              {analyticsTab === "time" && (<div className="two-col">
                <div className="card">
                  <div className="card-header"><h3>Trend Mensile</h3></div>
                  <div className="bar-chart">{monthlyData.map((m, i) => (<div className="bar-col" key={i}><div className="bar-value">{m.count}</div><div className="bar" style={{ height: `${(m.count / Math.max(...monthlyData.map(x => x.count))) * 140}px`, background: i === 5 ? "var(--accent)" : "rgba(110,231,183,0.25)" }} /><div className="bar-label">{m.label}</div></div>))}</div>
                </div>
                <div className="card">
                  <div className="card-header"><h3>Heatmap Orario × Giorno</h3></div>
                  <div style={{ display: "grid", gridTemplateColumns: "50px repeat(6, 1fr)", gap: 3 }}>
                    <div />{["Lun","Mar","Mer","Gio","Ven","Sab"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", padding: 4 }}>{d}</div>)}
                    {[8,9,10,11,12,13,14,15,16,17].map(h => (<Fragment key={h}>
                      <div style={{ fontSize: 11, display: "flex", alignItems: "center", color: "var(--text-muted)" }}>{h}:00</div>
                      {[0,1,2,3,4,5].map(d => { const count = bookings.filter(b => { const bh = parseInt(b.time.split(":")[0]); const bd = new Date(b.date).getDay(); return bh === h && (bd === 0 ? -1 : bd - 1) === d && (b.status === "completato" || b.status === "confermato"); }).length; const intensity = Math.min(count / 15, 1); return <div key={`${h}-${d}`} style={{ height: 28, borderRadius: 4, background: count === 0 ? "var(--bg3)" : `rgba(110,231,183,${0.1 + intensity * 0.6})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: intensity > 0.3 ? "white" : "var(--text-muted)" }}>{count || ""}</div>; })}
                    </Fragment>))}
                  </div>
                </div>
              </div>)}
              {analyticsTab === "clients" && (() => {
                const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
                const daysSince = (dateStr) => {
                  if (!dateStr) return null;
                  return Math.floor((new Date(today) - new Date(dateStr)) / 86400000);
                };
                const clientsWithDays = clients
                  .map(c => ({ ...c, ...(clientBookingStats[c.id] || {}), days: daysSince((clientBookingStats[c.id] || {}).lastVisit) }))
                  .filter(c => c.days !== null && c.visitCount > 0);
                const at30 = clientsWithDays.filter(c => c.days >= 30 && c.days < 60).sort((a, b) => b.days - a.days);
                const at60 = clientsWithDays.filter(c => c.days >= 60 && c.days < 90).sort((a, b) => b.days - a.days);
                const at90 = clientsWithDays.filter(c => c.days >= 90).sort((a, b) => b.days - a.days);
                const RiskTable = ({ list, color, label, key30 }) => {
                  const isOpen = riskOpen === key30;
                  return (
                    <div style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                      <div onClick={() => setRiskOpen(isOpen ? null : key30)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: isOpen ? "var(--bg3)" : "transparent", userSelect: "none" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--bg2)", padding: "2px 10px", borderRadius: 10 }}>{list.length} clienti</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}>{isOpen ? "▲" : "▼"}</span>
                      </div>
                      {isOpen && (
                        list.length === 0 ? (
                          <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 16px" }}>Nessun cliente in questa fascia</div>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                              <thead><tr style={{ background: "var(--bg3)" }}>
                                {["Cliente","Animale","Ultima visita","Giorni fa","Visite tot.","Spesa tot."].map(h => (
                                  <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr></thead>
                              <tbody>{list.map(c => (
                                <tr key={c.id} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => { setSelectedClient(c); setView("clients"); }}>
                                  <td style={{ padding: "8px 12px", fontWeight: 500 }}>{c.firstName} {c.lastName}</td>
                                  <td style={{ padding: "8px 12px" }}>{(clientPetsMap[c.id] || []).map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join(", ") || "—"}</td>
                                  <td style={{ padding: "8px 12px" }}>{c.lastVisit || "—"}</td>
                                  <td style={{ padding: "8px 12px" }}><span style={{ fontWeight: 700, color }}>{c.days}gg</span></td>
                                  <td style={{ padding: "8px 12px" }}>{c.visitCount}</td>
                                  <td style={{ padding: "8px 12px", color: "var(--accent)", fontWeight: 600 }}>€{c.totalSpent}</td>
                                </tr>
                              ))}</tbody>
                            </table>
                          </div>
                        )
                      )}
                    </div>
                  );
                };
                return (<div>
                  <div className="stats-grid" style={{ marginBottom: 24 }}>
                    {[[at30.length, "Assenti 30+ giorni", "var(--orange)"], [at60.length, "Assenti 60+ giorni", "var(--danger)"], [at90.length, "Assenti 90+ giorni", "#7f1d1d"]].map(([v, l, c]) => (
                      <div className="stat-card" key={l} style={{ borderTop: `2px solid ${c}` }}><div className="stat-label">{l}</div><div className="stat-value" style={{ color: c }}>{v}</div></div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: 0 }}>
                    <RiskTable list={at30} color="var(--orange)" label="🟡 Assenti da 30–59 giorni" key30="30" />
                    <RiskTable list={at60} color="var(--danger)" label="🔴 Assenti da 60–89 giorni" key30="60" />
                    <RiskTable list={at90} color="#ef4444" label="⚫ Assenti da 90+ giorni" key30="90" />
                  </div>
                </div>);
              })()}
            </div>
          </>)}

          {/* AI INSIGHTS */}
          {view === "ai" && (<>
            <div className="header">
              <div className="header-left"><h2>AI Insights</h2><p>Suggerimenti intelligenti per massimizzare il profitto</p></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><Icon name="sparkle" size={14} color="var(--accent)" /> Powered by shifuku.ai engine</div>
            </div>
            <div className="content">
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[["Margine Operativo", `${(profitThis / (revenueThis || 1) * 100).toFixed(1)}%`, "var(--accent)"],["Scontrino Medio", `€${(revenueThis / (completedThis.length || 1)).toFixed(0)}`, "var(--purple)"],["CLV Medio", `€${Math.round(clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length)}`, "var(--blue)"],["Retention Rate", `${Math.round(clients.filter(c => c.visitCount >= 2).length / clients.length * 100)}%`, "var(--orange)"]].map(([l, v, c], i) => (
                  <div className="stat-card" key={i} style={{ borderTop: `2px solid ${c}` }}><div className="stat-label">{l}</div><div className="stat-value" style={{ color: c }}>{v}</div></div>
                ))}
              </div>
              {aiInsights.map((ins, i) => (
                <div className="insight-card" key={i}>
                  <h4><Icon name="sparkle" size={14} color="var(--accent)" /> {ins.title}</h4>
                  <p>{ins.text}</p>
                  <div>{ins.tags.map((t, j) => <span key={j} className={`insight-tag ${t.type}`}>{t.label}</span>)}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* FORECAST */}
          {view === "forecast" && (<>
            <div className="header">
              <div className="header-left"><h2>Forecasting</h2><p>Bottom-up client-level prediction</p></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="tabs" style={{ marginBottom: 0 }}>
                  {[["6m","6 Mesi"],["12m","12 Mesi"]].map(([id, label]) => (
                    <button key={id} className={`tab ${forecastRange === id ? "active" : ""}`} onClick={() => setForecastRange(id)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="content">
              {/* MODEL STATS */}
              <div className="stats-grid" style={{ marginBottom: 24 }}>
                {[
                  ["Clienti Attivi", clientForecast.activeClients.length, "var(--accent)"],
                  ["Ciclo Medio", `${clientForecast.avgCycleAll}gg`, "var(--purple)"],
                  ["A Rischio Churn", clientForecast.churnedClients.length, "var(--danger)"],
                  ["Clienti con Ciclo", clientForecast.clientProfiles.filter(c => c.cycle).length, "var(--blue)"],
                ].map(([l, v, c], i) => (
                  <div className="stat-card" key={i} style={{ borderTop: `2px solid ${c}` }}>
                    <div className="stat-label">{l}</div>
                    <div className="stat-value" style={{ color: c }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* STACKED TIMELINE CHART */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <h3>Timeline — Storico + Forecast per Confidenza</h3>
                  <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} /> Storico</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)" }} /> Alta conf.</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--purple)" }} /> Media conf.</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--blue)" }} /> Bassa conf.</span>
                  </div>
                </div>
                {(() => {
                  const timeline = timelineData[forecastRange];
                  const maxCount = Math.max(...timeline.map(d => d.high || d.count));
                  const chartH = 260;
                  const nowIdx = timeline.findIndex(d => d.type === "forecast") - 0.5;
                  const barW = forecastRange === "12m" ? 28 : 48;
                  const gap = forecastRange === "12m" ? 4 : 8;
                  const totalW = timeline.length * (barW + gap);
                  
                  return (
                    <div style={{ position: "relative", overflowX: "auto", paddingBottom: 8 }}>
                      <div style={{ position: "relative", minWidth: totalW + 40, height: chartH + 60, padding: "0 20px" }}>
                        {[0.25, 0.5, 0.75, 1].map(pct => (
                          <div key={pct} style={{ position: "absolute", left: 20, right: 20, top: chartH * (1 - pct) + 10, height: 1, background: "var(--border)", zIndex: 0 }}>
                            <span style={{ position: "absolute", left: -4, top: -8, fontSize: 9, color: "var(--text-muted)", fontWeight: 500 }}>{Math.round(maxCount * pct)}</span>
                          </div>
                        ))}
                        
                        {nowIdx > 0 && (
                          <div style={{ position: "absolute", left: 20 + nowIdx * (barW + gap) + barW / 2, top: 0, bottom: 30, width: 2, background: "var(--orange)", zIndex: 5, opacity: 0.7 }}>
                            <div style={{ position: "absolute", top: -2, left: "50%", transform: "translateX(-50%)", background: "var(--orange)", color: "var(--bg)", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, whiteSpace: "nowrap" }}>OGGI</div>
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "flex-end", gap, height: chartH, position: "relative", zIndex: 2, paddingTop: 20 }}>
                          {timeline.map((d, i) => {
                            const totalH = (d.count / maxCount) * (chartH - 30);
                            const isForecast = d.type === "forecast";
                            
                            if (!isForecast) {
                              return (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: barW, position: "relative" }}>
                                  <div style={{ fontSize: forecastRange === "12m" ? 9 : 10, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>{d.count}</div>
                                  <div style={{ width: barW, height: totalH, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg, var(--accent) 0%, rgba(110,231,183,0.2) 100%)", transition: "height 600ms ease", cursor: "pointer" }} 
                                    title={`${d.fullLabel}: ${d.count} prenotazioni — €${(d.revenue/1000).toFixed(1)}k`} />
                                </div>
                              );
                            }
                            
                            // Stacked forecast bar
                            const hH = d.highCount ? (d.highCount / maxCount) * (chartH - 30) : 0;
                            const mH = d.medCount ? (d.medCount / maxCount) * (chartH - 30) : 0;
                            const lH = d.lowCount ? (d.lowCount / maxCount) * (chartH - 30) : 0;
                            return (
                              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: barW, position: "relative" }}>
                                {d.high && (
                                  <div style={{ position: "absolute", width: barW + 6, height: ((d.high - d.low) / maxCount) * (chartH - 30), bottom: (d.low / maxCount) * (chartH - 30), background: "rgba(167,139,250,0.08)", borderRadius: 4, border: "1px dashed rgba(167,139,250,0.15)", zIndex: 0 }} />
                                )}
                                <div style={{ fontSize: forecastRange === "12m" ? 9 : 10, fontWeight: 700, color: "var(--purple)", marginBottom: 4 }}>{d.count}</div>
                                <div style={{ display: "flex", flexDirection: "column", width: barW, cursor: "pointer" }}
                                  title={`${d.fullLabel}: ${d.count} tot — ✅${d.highCount} alta, ⚡${d.medCount} media, ❓${d.lowCount} bassa (range ${d.low}–${d.high})`}>
                                  <div style={{ width: barW, height: lH, background: "var(--blue)", transition: "height 600ms ease" }} />
                                  <div style={{ width: barW, height: mH, background: "var(--purple)", transition: "height 600ms ease" }} />
                                  <div style={{ width: barW, height: hH, background: "var(--accent)", borderRadius: "0 0 0 0", transition: "height 600ms ease" }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div style={{ display: "flex", gap, marginTop: 8 }}>
                          {timeline.map((d, i) => (
                            <div key={i} style={{ width: barW, textAlign: "center", fontSize: forecastRange === "12m" ? 9 : 10, color: d.type === "forecast" ? "var(--purple)" : "var(--text-muted)", fontWeight: d.type === "forecast" ? 600 : 500 }}>{d.label}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Summary */}
                <div style={{ display: "flex", gap: 24, marginTop: 20, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
                  {(() => {
                    const tl = timelineData[forecastRange];
                    const actual = tl.filter(d => d.type === "actual");
                    const forecast = tl.filter(d => d.type === "forecast");
                    const actAvg = Math.round(actual.reduce((s, d) => s + d.count, 0) / actual.length);
                    const fcAvg = Math.round(forecast.reduce((s, d) => s + d.count, 0) / forecast.length);
                    const growth = actAvg ? Math.round((fcAvg - actAvg) / actAvg * 100) : 0;
                    const fcRev = forecast.reduce((s, d) => s + d.revenue, 0);
                    return (<>
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Media Storica</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)", marginTop: 4 }}>{actAvg}/mese</div>
                      </div>
                      <div style={{ width: 1, background: "var(--border)" }} />
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Media Forecast</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--purple)", marginTop: 4 }}>{fcAvg}/mese</div>
                      </div>
                      <div style={{ width: 1, background: "var(--border)" }} />
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Trend</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: growth >= 0 ? "var(--success)" : "var(--danger)", marginTop: 4 }}>{growth >= 0 ? "+" : ""}{growth}%</div>
                      </div>
                      <div style={{ width: 1, background: "var(--border)" }} />
                      <div style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Fatturato Forecast</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--orange)", marginTop: 4 }}>€{(fcRev / 1000).toFixed(1)}k</div>
                      </div>
                    </>);
                  })()}
                </div>
              </div>

              {/* CONFIDENCE BREAKDOWN TABLE */}
              <div className="card" style={{ marginBottom: 24, padding: 0 }}>
                <div style={{ padding: "16px 20px 0" }}>
                  <div className="card-header"><h3>Dettaglio per Livello di Confidenza</h3><span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>Client-Level</span></div>
                </div>
                <table>
                  <thead><tr>
                    <th>Mese</th>
                    <th style={{ color: "var(--accent)" }}>✅ Alta Conf.</th>
                    <th style={{ color: "var(--purple)" }}>⚡ Media Conf.</th>
                    <th style={{ color: "var(--blue)" }}>❓ Bassa Conf.</th>
                    <th>Totale</th>
                    <th>Range</th>
                    <th>Fatturato</th>
                  </tr></thead>
                  <tbody>
                    {forecastData.map((f, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{f.month}</td>
                        <td><span style={{ fontWeight: 700, color: "var(--accent)" }}>{f.highCount}</span></td>
                        <td><span style={{ fontWeight: 700, color: "var(--purple)" }}>{f.medCount}</span></td>
                        <td><span style={{ fontWeight: 700, color: "var(--blue)" }}>{f.lowCount}</span></td>
                        <td style={{ fontWeight: 800, fontSize: 15 }}>{f.predicted}</td>
                        <td><span style={{ fontSize: 12, color: "var(--text-dim)" }}>{f.low} – {f.high}</span></td>
                        <td style={{ fontWeight: 600, color: "var(--accent)" }}>€{(f.revenue / 1000).toFixed(1)}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CLIENT CYCLE PROFILES */}
              <div className="two-col" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-header"><h3>Distribuzione Ciclo Cliente</h3></div>
                  {[
                    ["< 20 giorni", clientForecast.activeClients.filter(c => c.cycle < 20).length, "Clienti frequenti", "var(--accent)"],
                    ["20–35 giorni", clientForecast.activeClients.filter(c => c.cycle >= 20 && c.cycle < 35).length, "Ciclo mensile", "var(--purple)"],
                    ["35–60 giorni", clientForecast.activeClients.filter(c => c.cycle >= 35 && c.cycle < 60).length, "Ciclo bi-mensile", "var(--blue)"],
                    ["60+ giorni", clientForecast.activeClients.filter(c => c.cycle >= 60).length, "Clienti occasionali", "var(--orange)"],
                  ].map(([range, count, desc, color], i) => {
                    const maxC = Math.max(...[clientForecast.activeClients.filter(c => c.cycle < 20).length, clientForecast.activeClients.filter(c => c.cycle >= 20 && c.cycle < 35).length, clientForecast.activeClients.filter(c => c.cycle >= 35 && c.cycle < 60).length, clientForecast.activeClients.filter(c => c.cycle >= 60).length]);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <div style={{ minWidth: 90 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{range}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{desc}</div>
                        </div>
                        <div style={{ flex: 1 }}><div className="forecast-bar-bg" style={{ height: 20 }}><div className="forecast-bar-fill" style={{ width: `${maxC ? (count / maxC) * 100 : 0}%`, background: color, height: 20 }} /></div></div>
                        <div style={{ fontWeight: 700, fontSize: 14, color, minWidth: 30, textAlign: "right" }}>{count}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="card">
                  <div className="card-header"><h3>Come funziona il modello</h3><span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>shifuku.ai engine</span></div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.8 }}>
                    {[
                      ["1️⃣", "Calcola il ciclo medio di ritorno per ogni cliente dagli intervalli tra visite (min. 2 visite)"],
                      ["2️⃣", "Proietta la prossima visita attesa: ultima visita + ciclo medio"],
                      ["3️⃣", "Classifica la confidenza in base a regolarità (CV < 0.3 = alta) e numero visite"],
                      ["4️⃣", "Identifica il churn: se > 2.5× il ciclo è passato senza visita, il cliente è probabilmente perso"],
                      ["5️⃣", "Aggrega tutti i clienti per mese → forecast bottom-up con intervallo di confidenza pesato"],
                    ].map(([icon, text], i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                        <span>{icon}</span>
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="two-col">
                <div className="insight-card"><h4><Icon name="sparkle" size={14} color="var(--accent)" /> Insight Stagionalità</h4><p>Maggio picco previsto ({forecastData[1].predicted} prenotazioni) per muta primaverile. Lancia campagna "Primavera Anti-Muta" a metà aprile via WhatsApp. Agosto calo fisiologico — promozioni aggressive o chiusura parziale.</p></div>
                <div className="insight-card"><h4><Icon name="sparkle" size={14} color="var(--accent)" /> Actionable: WhatsApp Reminder</h4><p>Il modello identifica {clientForecast.activeClients.filter(c => c.confidence === "high").length} clienti ad alta confidenza. Per ognuno, ShifuKu.AI può inviare un reminder WhatsApp personalizzato X giorni prima della data prevista, massimizzando il tasso di riprenotazione e riempiendo il calendario in anticipo.</p></div>
              </div>
            </div>
          </>)}

          {/* WHATSAPP */}
          {view === "whatsapp" && (<>
            <div className="header"><div className="header-left"><h2>WhatsApp Business</h2><p>Messaggistica e automazioni</p></div></div>
            <div className="content">
              <div className="two-col">
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3>Chat Simulata</h3></div>
                    <div className="wa-chat">
                      {waMessages.map((m, i) => (<div key={i} className={`wa-msg ${m.from}`}>{m.text}<div className="wa-time">{m.time}</div></div>))}
                    </div>
                    <div className="wa-input-row">
                      <input placeholder="Scrivi un messaggio..." value={waInput} onChange={e => setWaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendWaMessage()} />
                      <button className="btn btn-whatsapp btn-sm" onClick={sendWaMessage}><Icon name="send" size={14} color="white" /></button>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-header"><h3>Quick Actions</h3></div>
                    {[["📅 Conferma Appuntamento","24h prima, automatico"],["🔔 Promemoria","2h prima dell'appuntamento"],["⭐ Richiedi Recensione","Post-servizio, link review"],["🎁 Promo Compleanno","Sconto 15% birthday cane"],["🔄 Richiamo Periodico","Dopo 4 settimane"]].map(([t, d], i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--bg3)", borderRadius: 8, marginBottom: 8, cursor: "pointer" }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>{d}</div></div>
                        <button className="btn btn-whatsapp btn-sm"><Icon name="send" size={12} color="white" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="card-header"><h3>Template Messaggi</h3></div>
                    {[{ t: "Conferma Booking", b: "Ciao {nome}! ✅ Confermato per {cane} il {data} alle {ora}. Servizio: {servizio}. A presto! 🐾" },{ t: "Promemoria", b: "Ciao {nome}! 🔔 Appuntamento per {cane} domani alle {ora}. Per cancellare, rispondi ANNULLA." },{ t: "Post-Servizio", b: "Ciao {nome}! {cane} è splendido! 🐕 Ti andrebbe di lasciarci una recensione? ⭐" },{ t: "Richiamo", b: "Ciao {nome}! Sono passate 4 settimane dall'ultimo appuntamento di {cane}. Vuoi prenotare? 📅" }].map((x, i) => (
                      <div key={i} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--accent)" }}>{x.t}</div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5, background: "var(--bg3)", padding: 10, borderRadius: 8 }}>{x.b}</div>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <div className="card-header"><h3>Statistiche WhatsApp</h3></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      {[["Messaggi Inviati","342","var(--text)"],["Tasso Apertura","94%","var(--success)"],["Booking da WA","38%","#25D366"],["Tempo Risposta","12min","var(--text)"]].map(([l, v, c], i) => (
                        <div key={i} style={{ textAlign: "center", padding: 14, background: "var(--bg3)", borderRadius: 8 }}>
                          <div className="stat-label">{l}</div><div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>)}
        </div>

        {/* NEW BOOKING MODAL */}
        {showModal === "new" && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>Nuova Prenotazione</h3>
                <button onClick={() => setShowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              <div className="form-group"><label>Cliente *</label>
                <div className="client-picker">
                  {selectedClientForBooking ? (
                    <div className="client-picker-selected">
                      <div className="cps-info">
                        <div className="cps-name">{selectedClientForBooking.firstName} {selectedClientForBooking.lastName}</div>
                        <div className="cps-detail">{(clientPetsMap[selectedClientForBooking.id] || []).map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join(", ") || "—"} • {selectedClientForBooking.phone}</div>
                      </div>
                      <button className="cps-clear" onClick={() => { setNewBookingForm(f => ({ ...f, clientId: "", petId: "" })); setClientSearch(""); }}><Icon name="x" size={16} /></button>
                    </div>
                  ) : (
                    <div className="client-picker-input">
                      <input
                        placeholder="Cerca nome proprietario o cane..."
                        value={clientSearch}
                        onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                        onFocus={() => setShowClientDropdown(true)}
                      />
                      <button className="client-picker-add" title="Nuovo cliente" onClick={() => { setShowModal("newClientInline"); }}>+</button>
                    </div>
                  )}
                  {showClientDropdown && !selectedClientForBooking && (
                    <div className="client-picker-dropdown">
                      {clientSearchResults.length > 0 ? clientSearchResults.map(c => (
                        <div key={c.id} className={`client-picker-item ${newBookingForm.clientId === c.id ? "selected" : ""}`}
                          onClick={() => {
                            const cPets = clientPetsMap[c.id] || [];
                            const autoPetId = cPets.length === 1 ? cPets[0].id : "";
                            setNewBookingForm(f => ({ ...f, clientId: c.id, petId: autoPetId }));
                            setShowClientDropdown(false); setClientSearch("");
                          }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>{c.firstName[0]}{c.lastName[0]}</div>
                          <div>
                            <div className="cpi-name">{c.firstName} {c.lastName}</div>
                            <div className="cpi-dog">{(clientPetsMap[c.id] || []).map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join(" · ") || "—"}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="client-picker-empty">
                          Nessun cliente trovato per "{clientSearch}"<br/>
                          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => { setShowModal("newClientInline"); }}>
                            <Icon name="plus" size={14} /> Crea nuovo cliente
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {selectedClientForBooking && (clientPetsMap[selectedClientForBooking.id] || []).length > 1 && (
                <div className="form-group">
                  <label>Animale *</label>
                  <select value={newBookingForm.petId} onChange={e => setNewBookingForm(f => ({ ...f, petId: e.target.value }))}>
                    <option value="">Seleziona animale...</option>
                    {(clientPetsMap[selectedClientForBooking.id] || []).map(p => (
                      <option key={p.id} value={p.id}>{ANIMAL_COLORS[p.animalType]?.emoji} {p.name} ({p.breed})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-row">
                <div><label>Data *</label><input type="date" value={newBookingForm.date} onChange={e => setNewBookingForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label>Ora *</label><input type="time" value={newBookingForm.time} onChange={e => setNewBookingForm(f => ({ ...f, time: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Servizio *</label>
                <select value={newBookingForm.serviceId} onChange={e => {
                  const svc = services.find(s => s.id === e.target.value);
                  setNewBookingForm(f => ({ ...f, serviceId: e.target.value, price: svc ? svc.price : "", duration: svc ? svc.duration : "" }));
                }}>
                  <option value="">Seleziona servizio...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — €{s.price} ({s.duration}min)</option>)}
                </select>
              </div>
              {newBookingForm.serviceId && (
                <div className="form-row">
                  <div>
                    <label>Prezzo (€)</label>
                    <input type="number" min="0" step="1" value={newBookingForm.price} onChange={e => setNewBookingForm(f => ({ ...f, price: e.target.value }))} placeholder={(() => { const s = services.find(sv => sv.id === newBookingForm.serviceId); return s ? String(s.price) : ""; })()} />
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Default: €{services.find(s => s.id === newBookingForm.serviceId)?.price}</div>
                  </div>
                  <div>
                    <label>Durata (min)</label>
                    <input type="number" min="5" step="5" value={newBookingForm.duration} onChange={e => setNewBookingForm(f => ({ ...f, duration: e.target.value }))} placeholder={(() => { const s = services.find(sv => sv.id === newBookingForm.serviceId); return s ? String(s.duration) : ""; })()} />
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Default: {services.find(s => s.id === newBookingForm.serviceId)?.duration}min</div>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group"><label>Pagamento</label>
                  <select value={newBookingForm.payment} onChange={e => setNewBookingForm(f => ({ ...f, payment: e.target.value }))}>
                    <option value="">Non pagato</option>
                    <option value="pos">POS / Carta</option>
                    <option value="contanti">Contanti</option>
                    <option value="bonifico">Bonifico</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                <div className="form-group"><label>Note</label><input placeholder="Note aggiuntive..." value={newBookingForm.notes} onChange={e => setNewBookingForm(f => ({ ...f, notes: e.target.value }))} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={() => setShowModal(null)}>Annulla</button>
                <button className="btn btn-primary" onClick={addBooking} disabled={!newBookingForm.clientId || !newBookingForm.serviceId}><Icon name="check" size={14} /> Conferma</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT BOOKING MODAL */}
        {showModal === "editBooking" && editBookingForm && (
          <div className="modal-overlay" onClick={() => { setShowModal(null); setEditBookingForm(null); }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>Modifica Prenotazione</h3>
                <button onClick={() => { setShowModal(null); setEditBookingForm(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{clients.find(c => c.id === editBookingForm.clientId)?.firstName} {clients.find(c => c.id === editBookingForm.clientId)?.lastName}</span>
                <span style={{ color: "var(--text-muted)" }}> — {(clientPetsMap[editBookingForm.clientId] || []).map(p => p.name).join(", ") || bookings.find(b => b.id === editBookingForm.id)?.petName || "—"}</span>
              </div>
              <div className="form-row">
                <div><label>Data</label><input type="date" value={editBookingForm.date} onChange={e => setEditBookingForm(f => ({ ...f, date: e.target.value }))} /></div>
                <div><label>Ora</label><input type="time" value={editBookingForm.time} onChange={e => setEditBookingForm(f => ({ ...f, time: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label>Servizio</label>
                <select value={editBookingForm.serviceId} onChange={e => {
                  const svc = services.find(s => s.id === e.target.value);
                  setEditBookingForm(f => ({ ...f, serviceId: e.target.value, price: svc ? svc.price : f.price, duration: svc ? svc.duration : f.duration }));
                }}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} — €{s.price} ({s.duration}min)</option>)}
                </select>
              </div>
              <div className="form-row">
                <div><label>Prezzo (€)</label><input type="number" min="0" step="1" value={editBookingForm.price} onChange={e => setEditBookingForm(f => ({ ...f, price: e.target.value }))} /></div>
                <div><label>Durata (min)</label><input type="number" min="5" step="5" value={editBookingForm.duration} onChange={e => setEditBookingForm(f => ({ ...f, duration: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div><label>Stato</label>
                  <select value={editBookingForm.status} onChange={e => setEditBookingForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="confermato">Confermato</option>
                    <option value="completato">Completato</option>
                    <option value="in-attesa">In attesa</option>
                    <option value="cancellato">Cancellato</option>
                    <option value="no-show">No-show</option>
                  </select>
                </div>
                <div><label>Pagamento</label>
                  <select value={editBookingForm.payment} onChange={e => setEditBookingForm(f => ({ ...f, payment: e.target.value }))}>
                    <option value="">Non pagato</option>
                    <option value="pos">POS / Carta</option>
                    <option value="contanti">Contanti</option>
                    <option value="bonifico">Bonifico</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Note</label><textarea rows={2} value={editBookingForm.notes} onChange={e => setEditBookingForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => { deleteBooking(editBookingForm.id); setEditBookingForm(null); setShowModal(null); }}>Elimina</button>
                <div style={{ flex: 1 }} />
                <button className="btn" onClick={() => { setShowModal(null); setEditBookingForm(null); }}>Annulla</button>
                <button className="btn btn-primary" onClick={saveEditBooking}><Icon name="check" size={14} /> Salva</button>
              </div>
            </div>
          </div>
        )}

        {/* NEW CLIENT MODAL */}
        {showModal === "newClient" && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>Nuovo Cliente</h3>
                <button onClick={() => setShowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              <div className="form-row">
                <div><label>Nome *</label><input placeholder="Marco" value={newClientForm.firstName} onChange={e => setNewClientForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div><label>Cognome *</label><input placeholder="Rossi" value={newClientForm.lastName} onChange={e => setNewClientForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div><label>Telefono</label><input placeholder="+39 320 123 4567" value={newClientForm.phone} onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><label>Email</label><input placeholder="marco.rossi@email.it" value={newClientForm.email} onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🐾 Primo animale</div>
                <div className="form-row">
                  <div><label>Tipo</label><select value={newClientForm.petAnimalType} onChange={e => setNewClientForm(f => ({ ...f, petAnimalType: e.target.value }))}><option value="cane">🐕 Cane</option><option value="gatto">🐈 Gatto</option><option value="coniglio">🐇 Coniglio</option><option value="uccello">🦜 Uccello</option><option value="rettile">🦎 Rettile</option><option value="altro">🐾 Altro</option></select></div>
                  <div><label>Nome *</label><input placeholder="Luna" value={newClientForm.petName} onChange={e => setNewClientForm(f => ({ ...f, petName: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div><label>Razza</label><input placeholder="Meticcio" value={newClientForm.petBreed} onChange={e => setNewClientForm(f => ({ ...f, petBreed: e.target.value }))} /></div>
                  <div><label>Taglia</label>
                    <select value={newClientForm.petSize} onChange={e => setNewClientForm(f => ({ ...f, petSize: e.target.value }))}>
                      <option value="piccola">Piccola</option><option value="media">Media</option><option value="grande">Grande</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", margin: 0 }}>
                    <input type="checkbox" checked={!!newClientForm.petMordace} onChange={e => setNewClientForm(f => ({ ...f, petMordace: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--danger)", cursor: "pointer" }} />
                    <span style={{ fontSize: 13, color: "var(--danger)" }}>🦷 Mordace</span>
                  </label>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={() => { setNewClientForm(emptyClient); setShowModal(null); }}>Annulla</button>
                <button className="btn btn-primary" onClick={addClient} disabled={!newClientForm.firstName || !newClientForm.lastName || !newClientForm.petName}><Icon name="check" size={14} /> Salva Cliente</button>
              </div>
            </div>
          </div>
        )}

        {/* IMPORT CLIENTS */}
        {showModal === "importClients" && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>Importa Clienti</h3>
                <button onClick={() => setShowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              {importRows.length === 0 ? (<>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Carica un file <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>. Colonne riconosciute:<br />
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>Nome, Cognome, Telefono, Email, NomeAnimale, TipoAnimale, Razza, Taglia, Note</span><br />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Per clienti con più animali, usa una riga per animale con gli stessi dati del proprietario — verranno uniti automaticamente.</span>
                </div>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Trascina un file qui o clicca per selezionarlo</div>
                  <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} id="import-file-input"
                    onChange={e => handleImportFile(e.target.files[0])} />
                  <label htmlFor="import-file-input" className="btn btn-primary" style={{ cursor: "pointer" }}>Seleziona file</label>
                </div>
              </>) : (<>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
                    ✓ {importRows.length} clienti · {importRows.reduce((s, r) => s + (r.pets?.length || 0), 0)} animali
                  </span>
                  <button className="btn btn-sm" onClick={() => setImportRows([])}>Cambia file</button>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 260, overflowY: "auto", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--bg3)" }}>
                        {["Nome", "Cognome", "Telefono", "Animali"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 10).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 10px" }}>{r.firstName}</td>
                          <td style={{ padding: "6px 10px" }}>{r.lastName}</td>
                          <td style={{ padding: "6px 10px" }}>{r.phone}</td>
                          <td style={{ padding: "6px 10px" }}>
                            {r.pets?.length ? r.pets.map(p => `${ANIMAL_COLORS[p.animalType]?.emoji || "🐾"} ${p.name}`).join(", ") : <span style={{ color: "var(--text-muted)" }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importRows.length > 10 && <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 10px" }}>… e altri {importRows.length - 10} clienti</div>}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setShowModal(null)}>Annulla</button>
                  <button className="btn btn-primary" disabled={importLoading} onClick={bulkImportClients}>
                    {importLoading ? "Importazione..." : `⬆ Importa ${importRows.length} clienti`}
                  </button>
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* IMPORT STORICO APPUNTAMENTI */}
        {showModal === "importBookings" && (
          <div className="modal-overlay" onClick={() => setShowModal(null)}>
            <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3>Importa Storico Appuntamenti</h3>
                <button onClick={() => setShowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              {importBookingStats ? (<>
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Importazione completata!</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 2 }}>
                    <div>📅 <strong>{importBookingStats.total}</strong> appuntamenti importati</div>
                    <div>👤 <strong>{importBookingStats.createdClients}</strong> nuovi clienti creati</div>
                    <div>🐾 <strong>{importBookingStats.createdPets}</strong> nuovi animali creati</div>
                    {importBookingStats.skipped > 0 && <div style={{ color: "var(--text-muted)" }}>⏭ <strong>{importBookingStats.skipped}</strong> già presenti, saltati</div>}
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setShowModal(null); setImportBookingRows([]); setImportBookingStats(null); }}>Chiudi</button>
                </div>
              </>) : importBookingRows.length === 0 ? (<>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
                  Carica un file <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>. Colonne riconosciute:<br />
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>Data, Orario, DurataMin, NomeProprietario, CognomeProprietario, Telefono, NomeAnimale, TipoAnimale, Razza, Prezzo, Sconto, Totale, Stato, Note</span>
                </div>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 10, padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Trascina un file qui o clicca per selezionarlo</div>
                  <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} id="import-booking-file-input"
                    onChange={e => handleImportBookingsFile(e.target.files[0])} />
                  <label htmlFor="import-booking-file-input" className="btn btn-primary" style={{ cursor: "pointer" }}>Seleziona file</label>
                </div>
              </>) : (<>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>
                    ✓ {importBookingRows.length} appuntamenti · {[...new Set(importBookingRows.map(r => r.phone || r.clientName))].length} clienti
                  </span>
                  <button className="btn btn-sm" onClick={() => setImportBookingRows([])}>Cambia file</button>
                </div>
                <div style={{ overflowX: "auto", maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--bg3)" }}>
                        {["Data", "Ora", "Cliente", "Animale", "Totale", "Stato"].map(h => (
                          <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importBookingRows.slice(0, 12).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "6px 10px" }}>{r.date}</td>
                          <td style={{ padding: "6px 10px" }}>{r.time}</td>
                          <td style={{ padding: "6px 10px" }}>{r.clientName}</td>
                          <td style={{ padding: "6px 10px" }}>{r.petName || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                          <td style={{ padding: "6px 10px" }}>{r.price != null ? `€${Number(r.price).toFixed(2)}` : "—"}</td>
                          <td style={{ padding: "6px 10px" }}>
                            <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: r.status === "completato" ? "var(--success-bg,#dcfce7)" : r.status === "cancellato" ? "#fee2e2" : "var(--bg3)", color: r.status === "completato" ? "var(--success)" : r.status === "cancellato" ? "#ef4444" : "var(--text-muted)" }}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importBookingRows.length > 12 && <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 10px" }}>… e altri {importBookingRows.length - 12} appuntamenti</div>}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button className="btn" onClick={() => setShowModal(null)}>Annulla</button>
                  <button className="btn btn-primary" disabled={importBookingLoading} onClick={bulkImportBookings}>
                    {importBookingLoading ? "Importazione in corso..." : `⬆ Importa ${importBookingRows.length} appuntamenti`}
                  </button>
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* INLINE NEW CLIENT (from booking modal) */}
        {showModal === "newClientInline" && (
          <div className="modal-overlay" onClick={() => { setShowModal("new"); setNewClientForm(emptyClient); }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <h3>Nuovo Cliente</h3>
                <button onClick={() => { setShowModal("new"); setNewClientForm(emptyClient); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)" }}><Icon name="x" size={20} /></button>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Il cliente verrà creato e selezionato automaticamente nella prenotazione.</div>
              <div className="form-row">
                <div><label>Nome *</label><input placeholder="Marco" value={newClientForm.firstName} onChange={e => setNewClientForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div><label>Cognome *</label><input placeholder="Rossi" value={newClientForm.lastName} onChange={e => setNewClientForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div><label>Telefono</label><input placeholder="+39 320 123 4567" value={newClientForm.phone} onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><label>Email</label><input placeholder="marco@email.it" value={newClientForm.email} onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>🐾 Primo animale</div>
                <div className="form-row">
                  <div><label>Tipo</label><select value={newClientForm.petAnimalType} onChange={e => setNewClientForm(f => ({ ...f, petAnimalType: e.target.value }))}><option value="cane">🐕 Cane</option><option value="gatto">🐈 Gatto</option><option value="coniglio">🐇 Coniglio</option><option value="uccello">🦜 Uccello</option><option value="rettile">🦎 Rettile</option><option value="altro">🐾 Altro</option></select></div>
                  <div><label>Nome *</label><input placeholder="Luna" value={newClientForm.petName} onChange={e => setNewClientForm(f => ({ ...f, petName: e.target.value }))} /></div>
                </div>
                <div className="form-row">
                  <div><label>Razza</label><input placeholder="Meticcio" value={newClientForm.petBreed} onChange={e => setNewClientForm(f => ({ ...f, petBreed: e.target.value }))} /></div>
                  <div><label>Taglia</label>
                    <select value={newClientForm.petSize} onChange={e => setNewClientForm(f => ({ ...f, petSize: e.target.value }))}>
                      <option value="piccola">Piccola</option><option value="media">Media</option><option value="grande">Grande</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn" onClick={() => { setShowModal("new"); setNewClientForm(emptyClient); }}>Annulla</button>
                <button className="btn btn-primary" disabled={!newClientForm.firstName || !newClientForm.lastName || !newClientForm.petName} onClick={async () => {
                  const f = newClientForm;
                  const newId = `c${Date.now()}`;
                  const petId = `p_${newId}`;
                  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(new Date());
                  const newC = {
                    id: newId, firstName: f.firstName, lastName: f.lastName,
                    phone: f.phone || "", email: f.email || `${f.firstName.toLowerCase()}.${f.lastName.toLowerCase()}@email.it`,
                    notes: "", registeredDate: today,
                    totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
                    preferredDay: "Lunedì", source: "online", rating: 5,
                  };
                  const newPet = { id: petId, clientId: newId, name: f.petName, animalType: f.petAnimalType || "cane", breed: f.petBreed || "Meticcio", size: f.petSize || "media", mordace: false, notes: "" };
                  await supabase.from('clients').insert({ id: newC.id, first_name: newC.firstName, last_name: newC.lastName, phone: newC.phone, email: newC.email, notes: newC.notes, registered_date: newC.registeredDate, total_spent: 0, visit_count: 0, last_visit: null, loyalty_points: 0, preferred_day: newC.preferredDay, source: newC.source, rating: newC.rating });
                  await supabase.from('pets').insert({ id: newPet.id, client_id: newPet.clientId, name: newPet.name, animal_type: newPet.animalType, breed: newPet.breed, size: newPet.size, mordace: newPet.mordace, notes: newPet.notes });
                  setClients(prev => [...prev, newC]);
                  setPets(prev => [...prev, newPet]);
                  setNewBookingForm(bf => ({ ...bf, clientId: newId, petId }));
                  setNewClientForm(emptyClient);
                  setClientSearch("");
                  setShowClientDropdown(false);
                  setShowModal("new");
                }}><Icon name="check" size={14} /> Crea e Seleziona</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
