import { useState, useMemo, useCallback, useEffect, Fragment } from "react";

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

const DOG_NAMES = ["Luna","Buddy","Rocky","Bella","Max","Kira","Zeus","Mia","Leo","Lola","Oscar","Nina","Thor","Stella","Rex","Zoe","Duke","Daisy","Simba","Ruby","Charlie","Nala","Bruno","Coco","Jack","Maya","Toby","Lilli","Ares","Moka","Lucky","Pippi","Axel","Bianca","Pluto","Greta","Spike","Chanel","Ringo","Perla"];
const BREEDS = ["Barboncino","Golden Retriever","Shih Tzu","Yorkshire","Labrador","Cocker Spaniel","Maltese","Bulldog Francese","Pastore Tedesco","Border Collie","Chihuahua","Beagle","Jack Russell","Setter Irlandese","Schnauzer","Cavalier King","Husky","Bassotto","Boxer","Lagotto Romagnolo"];
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
    clients.push({
      id: `c${i}`, firstName: fn, lastName: ln,
      phone: `+39 ${ri(320,389)} ${ri(100,999)} ${ri(1000,9999)}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.it`,
      dogName: pick(DOG_NAMES), breed: pick(BREEDS), size,
      notes: rng() > 0.7 ? pick(["Cane ansioso, maneggiare con cura","Allergia a shampoo profumati","Preferisce appuntamenti mattutini","Cane anziano, fare attenzione","Pelo annodato frequente","Cliente VIP","Tende a mordere durante taglio unghie","Richiede museruola"]) : "",
      registeredDate: `2025-${String(ri(1,8)).padStart(2,"0")}-${String(ri(1,28)).padStart(2,"0")}`,
      totalSpent: 0, visitCount: 0, lastVisit: null, loyaltyPoints: 0,
      preferredDay: pick(["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"]),
      source: pick(["whatsapp","instagram","passaparola","google","walk-in"]),
      rating: ri(3,5),
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
        dogName: client.dogName, breed: client.breed, serviceId: service.id, serviceName: service.name,
        date: dateStr, time: `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,
        duration: service.duration, price: finalPrice, cost: service.cost, status,
        notes: rng() > 0.8 ? pick(["Richiesto shampoo biologico","Extra profumazione","Fiocco regalo","Taglio specifico come foto","Portare guinzaglio nuovo"]) : "",
        createdVia: pick(["whatsapp","telefono","walk-in","online","instagram"]),
        reminderSent: rng() > 0.3,
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
  };
  return icons[name] || null;
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
body, html, #root { height: 100%; width: 100%; font-family: var(--font); background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
.app { display: flex; height: 100vh; overflow: hidden; }

/* Sidebar */
.sidebar { width: 240px; min-width: 240px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
.sidebar-logo { padding: 24px 20px 20px; border-bottom: 1px solid var(--border); }
.sidebar-logo h1 { font-size: 26px; font-weight: 800; color: white; letter-spacing: -0.03em; }
.sidebar-logo h1 span { background: linear-gradient(135deg, var(--accent), var(--purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sidebar-logo .ai-badge { display: inline-flex; align-items: center; background: #10B981; color: #fff; font-size: 14px; font-weight: 900; padding: 4px 12px; border-radius: 6px; margin-left: 8px; letter-spacing: 0.12em; vertical-align: middle; -webkit-text-fill-color: #fff; -webkit-background-clip: unset; }
.sidebar-logo p { font-size: 11px; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; }
.sidebar-nav { padding: 12px 10px; flex: 1; }
.nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 8px; color: var(--text-dim); cursor: pointer; font-size: 14px; font-weight: 400; transition: all var(--transition); margin-bottom: 2px; border: 1px solid transparent; }
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--bg3); color: var(--text); font-weight: 600; border-color: var(--border); }
.nav-item.active .nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-muted); }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.header { padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--bg2); }
.header-left h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.header-left p { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.content { flex: 1; overflow-y: auto; padding: 24px 32px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--bg3); color: var(--text); transition: all var(--transition); font-family: var(--font); }
.btn:hover { border-color: var(--text-muted); background: var(--bg-hover); }
.btn-primary { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-whatsapp { background: #25D366; color: white; border-color: #25D366; }
.btn-whatsapp:hover { background: #1ebe5d; }

/* Cards */
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.card-header h3 { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
.badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }

/* Stats */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; }
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
.stat-value { font-size: 28px; font-weight: 800; margin-top: 6px; letter-spacing: -0.03em; }
.stat-change { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; margin-top: 6px; padding: 2px 8px; border-radius: 20px; }
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
.cal-day { font-size: 12px; font-weight: 600; margin-bottom: 4px; padding: 2px 4px; }
.cal-booking { font-size: 10px; padding: 2px 5px; margin-bottom: 2px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; font-weight: 500; }
.cal-booking.completato { background: var(--success-dim); color: var(--success); }
.cal-booking.confermato { background: var(--blue-dim); color: var(--blue); }
.cal-booking.in-attesa { background: var(--warning-dim); color: var(--warning); }
.cal-booking.cancellato { background: var(--danger-dim); color: var(--danger); }
.cal-booking.no-show { background: var(--purple-dim); color: var(--purple); }
.cal-more { font-size: 10px; color: var(--text-muted); padding: 2px 5px; font-weight: 500; }

/* Table */
table { width: 100%; border-collapse: collapse; }
thead th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: var(--bg3); }
tbody td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid var(--border); }
tbody tr:hover { background: var(--bg3); }
.status-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-badge.completato { background: var(--success-dim); color: var(--success); }
.status-badge.confermato { background: var(--blue-dim); color: var(--blue); }
.status-badge.in-attesa { background: var(--warning-dim); color: var(--warning); }
.status-badge.cancellato { background: var(--danger-dim); color: var(--danger); }
.status-badge.no-show { background: var(--purple-dim); color: var(--purple); }

/* Input */
input, select, textarea { font-family: var(--font); font-size: 13px; padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg3); color: var(--text); width: 100%; transition: border var(--transition); outline: none; }
input:focus, select:focus, textarea:focus { border-color: var(--accent); }
input::placeholder, textarea::placeholder { color: var(--text-muted); }
label { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 5px; display: block; }

/* Tabs */
.tabs { display: flex; gap: 2px; background: var(--bg2); border-radius: 8px; padding: 3px; margin-bottom: 20px; width: fit-content; border: 1px solid var(--border); }
.tab { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all var(--transition); color: var(--text-muted); border: none; background: transparent; font-family: var(--font); }
.tab.active { background: var(--bg3); color: var(--text); box-shadow: var(--shadow); }

/* Charts */
.bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 180px; padding-top: 10px; }
.bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; }
.bar { width: 100%; border-radius: 4px 4px 0 0; transition: height 600ms ease; min-height: 2px; }
.bar:hover { opacity: 0.8; }
.bar-label { font-size: 10px; color: var(--text-muted); font-weight: 500; }
.bar-value { font-size: 10px; font-weight: 700; }

/* Forecast bar */
.forecast-bar-bg { flex: 1; height: 24px; background: var(--bg3); border-radius: 12px; overflow: hidden; }
.forecast-bar-fill { height: 100%; border-radius: 12px; transition: width 800ms ease; }

/* Pills */
.pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
.pill-wa { background: rgba(37,211,102,0.15); color: #25D366; }
.pill-ig { background: rgba(193,53,132,0.15); color: #E1306C; }
.pill-tel { background: var(--blue-dim); color: var(--blue); }
.pill-walk { background: var(--purple-dim); color: var(--purple); }
.pill-online { background: var(--accent-dim); color: var(--accent); }

/* AI Insight */
.insight-card { background: linear-gradient(135deg, rgba(110,231,183,0.06) 0%, rgba(167,139,250,0.06) 100%); border: 1px solid rgba(110,231,183,0.15); border-radius: var(--radius); padding: 22px; margin-bottom: 16px; }
.insight-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
.insight-card p { font-size: 13px; line-height: 1.6; color: var(--text-dim); }
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
.wa-msg { max-width: 80%; padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.4; }
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
`;

// ==================== MAIN APP ====================
export default function BokuAI() {
  const { clients, bookings, services } = useMemo(() => generateData(), []);
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

  const currentMonthBookings = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    return bookings.filter(b => b.date.startsWith(prefix));
  }, [bookings, calMonth, calYear]);

  const thisMonthStr = "2026-03", lastMonthStr = "2026-02";
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
    const months = ["Ott","Nov","Dic","Gen","Feb","Mar"];
    const prefixes = ["2025-10","2025-11","2025-12","2026-01","2026-02","2026-03"];
    return prefixes.map((p, i) => {
      const mb = bookings.filter(b => b.date.startsWith(p) && (b.status === "completato" || b.status === "confermato"));
      return { label: months[i], revenue: mb.reduce((s, b) => s + b.price, 0), count: mb.length, profit: mb.reduce((s, b) => s + b.price - b.cost, 0) };
    });
  }, [bookings]);

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

  // ============ BOTTOM-UP CLIENT-LEVEL FORECAST ============
  const clientForecast = useMemo(() => {
    const TODAY = new Date("2026-03-15");
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
        // Single visit — assume 45-day cycle (industry average), low confidence
        const lastDate = dates[0];
        const nextExpected = new Date(lastDate.getTime() + 45 * 86400000);
        return { ...client, cycle: 45, stddev: 20, confidence: "low", nextExpected, lastVisitDate: lastDate, intervals: [], avgRevenue, visitDates: dates };
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
    const initMonth = (key) => { if (!monthBuckets[key]) monthBuckets[key] = { high: [], medium: [], low: [], newClients: 0, totalRev: 0 }; };
    
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
          dogName: cp.dogName,
          expectedDate: new Date(nextDate),
          cycle: cp.cycle,
          avgRevenue: cp.avgRevenue,
        });
        monthBuckets[mKey].totalRev += cp.avgRevenue;
        nextDate = new Date(nextDate.getTime() + cp.cycle * 86400000);
      }
    });
    
    // Estimate new client acquisition per month (based on historical rate)
    const monthsWithData = 6;
    const newClientsPerMonth = Math.round(clients.filter(c => c.registeredDate >= "2025-10-01").length / monthsWithData);
    const avgNewClientRev = 35; // first-visit average
    
    Object.keys(monthBuckets).forEach(k => {
      monthBuckets[k].newClients = newClientsPerMonth;
      monthBuckets[k].totalRev += newClientsPerMonth * avgNewClientRev;
    });
    
    // Summary stats
    const activeClients = clientProfiles.filter(cp => cp.confidence === "high" || cp.confidence === "medium");
    const churnedClients = clientProfiles.filter(cp => cp.confidence === "churned");
    const avgCycleAll = activeClients.length ? Math.round(activeClients.reduce((s, c) => s + (c.cycle || 0), 0) / activeClients.length) : 0;
    
    return { clientProfiles, monthBuckets, newClientsPerMonth, avgCycleAll, activeClients, churnedClients };
  }, [clients, bookings]);

  // Build forecastData (table) from client-level forecast
  const forecastData = useMemo(() => {
    const months = ["Apr 2026","Mag 2026","Giu 2026","Lug 2026","Ago 2026","Set 2026"];
    const keys = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
    const avgRev = monthlyData.reduce((s, m) => s + m.revenue, 0) / monthlyData.reduce((s, m) => s + m.count, 0);
    
    return months.map((m, i) => {
      const bucket = clientForecast.monthBuckets[keys[i]] || { high: [], medium: [], low: [], newClients: 0, totalRev: 0 };
      const highCount = bucket.high.length;
      const medCount = bucket.medium.length;
      const lowCount = bucket.low.length;
      const newCount = bucket.newClients;
      const predicted = highCount + medCount + lowCount + newCount;
      // Confidence interval: high clients are certain, others have variance
      const low = highCount + Math.round(medCount * 0.6) + Math.round(lowCount * 0.3) + Math.round(newCount * 0.5);
      const high = highCount + Math.round(medCount * 1.3) + Math.round(lowCount * 1.8) + Math.round(newCount * 1.5);
      const revenue = Math.round(bucket.totalRev);
      return { month: m, predicted, low, high, revenue, highCount, medCount, lowCount, newCount };
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
      type: "actual", highCount: 0, medCount: 0, lowCount: 0, newCount: 0
    }));

    // Synthetic 12m extra history
    const rng = seededRandom(77);
    const hist12extra = [];
    for (let i = 0; i < 6; i++) {
      const mIdx = i + 3;
      const r1 = rng(), r2 = rng();
      const base = Math.round(75 + r1 * 30);
      const rev = Math.round(base * avgRev * (0.92 + r2 * 0.08));
      hist12extra.push({ label: monthNames[mIdx], fullLabel: `${monthNames[mIdx]} 2025`, count: base, revenue: rev, profit: Math.round(rev * 0.65), type: "actual", highCount: 0, medCount: 0, lowCount: 0, newCount: 0 });
    }

    // Build forecast months from client-level data
    const buildFcMonths = (count) => {
      const fc = [];
      for (let i = 0; i < count; i++) {
        const absMonth = 3 + i; // starting April
        const mIdx = absMonth % 12;
        const yearLabel = absMonth < 12 ? "2026" : "2027";
        const key = `${yearLabel}-${String(mIdx + 1).padStart(2, "0")}`;
        const bucket = clientForecast.monthBuckets[key] || { high: [], medium: [], low: [], newClients: 0, totalRev: 0 };
        const hc = bucket.high.length, mc = bucket.medium.length, lc = bucket.low.length, nc = bucket.newClients;
        const predicted = hc + mc + lc + nc;
        const low = hc + Math.round(mc * 0.6) + Math.round(lc * 0.3) + Math.round(nc * 0.5);
        const high = hc + Math.round(mc * 1.3) + Math.round(lc * 1.8) + Math.round(nc * 1.5);
        fc.push({
          label: monthNames[mIdx], fullLabel: `${monthNames[mIdx]} ${yearLabel}`,
          count: predicted, low, high,
          revenue: Math.round(bucket.totalRev), profit: Math.round(bucket.totalRev * 0.68),
          type: "forecast", highCount: hc, medCount: mc, lowCount: lc, newCount: nc
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
  const filteredClients = useMemo(() => {
    const list = clientFilter ? clients.filter(c => `${c.firstName} ${c.lastName} ${c.dogName} ${c.breed} ${c.phone}`.toLowerCase().includes(clientFilter.toLowerCase())) : clients;
    return [...list].sort((a, b) => b.visitCount - a.visitCount);
  }, [clients, clientFilter]);

  const maxMonthlyRev = Math.max(...monthlyData.map(m => m.revenue));
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
    { id: "analytics", icon: "trend", label: "Analytics" },
    { id: "ai", icon: "sparkle", label: "AI Insights" },
    { id: "forecast", icon: "brain", label: "Forecast" },
    { id: "whatsapp", icon: "whatsapp", label: "WhatsApp" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>boku<span>.</span><span className="ai-badge">AI</span></h1>
            <p>AI-Powered Pet Grooming</p>
          </div>
          <nav className="sidebar-nav">
            {navItems.map(n => (
              <div key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
                {view === n.id && <span className="nav-dot" />}
                <Icon name={n.icon} size={18} />
                <span>{n.label}</span>
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">boku.ai • POC v1.0 • Demo Data</div>
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
                  <div className="card-header"><h3>Fatturato Mensile</h3><span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>6 mesi</span></div>
                  <div className="bar-chart">
                    {monthlyData.map((m, i) => (
                      <div className="bar-col" key={i}>
                        <div className="bar-value" style={{ color: i === 5 ? "var(--accent)" : "var(--text-dim)" }}>€{(m.revenue / 1000).toFixed(1)}k</div>
                        <div className="bar" style={{ height: `${(m.revenue / maxMonthlyRev) * 140}px`, background: i === 5 ? "var(--accent)" : "rgba(110,231,183,0.2)" }} />
                        <div className="bar-label">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
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
              </div>
              <div className="two-col">
                <div className="card">
                  <div className="card-header"><h3>Top 5 Clienti</h3></div>
                  {topClients.slice(0, 5).map((c, i) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: ["var(--accent-dim)","var(--purple-dim)","var(--orange-dim)","var(--blue-dim)","var(--danger-dim)"][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: ["var(--accent)","var(--purple)","var(--orange)","var(--blue)","var(--danger)"][i] }}>{c.firstName[0]}{c.lastName[0]}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{c.firstName} {c.lastName}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.dogName} • {c.visitCount} visite</div></div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--accent)" }}>€{c.totalSpent}</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header"><h3>Canali di Acquisizione</h3></div>
                  {sourceStats.map(([source, count], i) => (
                    <div key={source} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <SourcePill source={source} />
                      <div style={{ flex: 1 }}><div className="forecast-bar-bg"><div className="forecast-bar-fill" style={{ width: `${(count / sourceStats[0][1]) * 100}%`, background: ["#25D366","#E1306C","var(--accent)","var(--blue)","var(--purple)"][i] || "var(--accent)" }} /></div></div>
                      <div style={{ fontWeight: 700, fontSize: 13, minWidth: 40, textAlign: "right" }}>{count}</div>
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
                <button className="btn btn-sm" onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}><Icon name="left" size={14} /></button>
                <span style={{ fontWeight: 600, fontSize: 15, minWidth: 140, textAlign: "center" }}>{["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"][calMonth]} {calYear}</span>
                <button className="btn btn-sm" onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}><Icon name="right" size={14} /></button>
                <button className="btn btn-primary" onClick={() => setShowModal("new")}><Icon name="plus" size={16} /> Prenota</button>
              </div>
            </div>
            <div className="content">
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <div className="cal-grid">
                    {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(d => <div className="cal-header-cell" key={d}>{d}</div>)}
                    {calDays.map((d, i) => {
                      const db = getBookingsForDay(d.day, d.month);
                      const ds = `${d.month > 11 ? calYear + 1 : d.month < 0 ? calYear - 1 : calYear}-${String((d.month < 0 ? d.month + 12 : d.month > 11 ? d.month - 12 : d.month) + 1).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
                      return (
                        <div key={i} className={`cal-cell ${d.other ? "other-month" : ""} ${isToday(d.day, d.month) ? "today" : ""}`} onClick={() => !d.other && setSelectedDate(ds)}>
                          <div className="cal-day">{d.day}</div>
                          {db.slice(0, 3).map(b => <div key={b.id} className={`cal-booking ${b.status}`}>{b.time} {b.dogName}</div>)}
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
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{dayBookings.length} app.</span>
                      </div>
                      {dayBookings.length === 0 ? <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Nessun appuntamento</p> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {dayBookings.map(b => (
                            <div key={b.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg3)" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 600, fontSize: 13 }}>{b.time}</span><span className={`status-badge ${b.status}`}>{b.status}</span></div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{b.dogName} ({b.breed})</div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.clientName} • {b.serviceName}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}><span style={{ fontSize: 12, color: "var(--text-muted)" }}><Icon name="clock" size={12} /> {b.duration}min</span><span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>€{b.price}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>)}

          {/* CLIENTS */}
          {view === "clients" && (<>
            <div className="header">
              <div className="header-left"><h2>Clienti</h2><p>{clients.length} clienti registrati</p></div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input placeholder="Cerca cliente, cane, razza..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ width: 280 }} />
                <button className="btn btn-primary"><Icon name="plus" size={16} /> Nuovo Cliente</button>
              </div>
            </div>
            <div className="content">
              {selectedClient ? (
                <div>
                  <button className="btn btn-sm" onClick={() => setSelectedClient(null)} style={{ marginBottom: 16 }}><Icon name="left" size={14} /> Torna alla lista</button>
                  <div className="two-col" style={{ marginBottom: 20 }}>
                    <div className="card">
                      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>{selectedClient.firstName} {selectedClient.lastName}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {[["Telefono", selectedClient.phone],["Email", selectedClient.email],["Cane", selectedClient.dogName],["Razza", selectedClient.breed],["Taglia", selectedClient.size],["Canale", null],["Giorno Pref.", selectedClient.preferredDay],["Registrato", selectedClient.registeredDate]].map(([l, v], i) => (
                          <div key={i}><label>{l}</label>{i === 5 ? <SourcePill source={selectedClient.source} /> : <div style={{ fontSize: 13, textTransform: i === 4 ? "capitalize" : "none" }}>{v}</div>}</div>
                        ))}
                      </div>
                      {selectedClient.notes && <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--warning-dim)", borderRadius: 8, fontSize: 13, color: "var(--warning)" }}>⚠️ {selectedClient.notes}</div>}
                    </div>
                    <div className="card">
                      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Statistiche Cliente</h3>
                      {(() => {
                        const profile = clientForecast.clientProfiles.find(cp => cp.id === selectedClient.id);
                        const hasCycle = profile && profile.cycle && profile.confidence !== "none";
                        return (<>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            {[["Spesa Totale", `€${selectedClient.totalSpent}`, "var(--accent)"],["Visite", selectedClient.visitCount, "var(--text)"],["Punti Fedeltà", selectedClient.loyaltyPoints, "var(--orange)"],["Scontrino Medio", `€${selectedClient.visitCount ? Math.round(selectedClient.totalSpent / selectedClient.visitCount) : 0}`, "var(--text)"]].map(([l, v, c], i) => (
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
                                <div style={{ textAlign: "center", padding: 12, background: "var(--bg-card)", borderRadius: 8 }}>
                                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Prossima Visita</div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: profile.churned ? "var(--danger)" : "var(--purple)", marginTop: 8 }}>
                                    {profile.churned ? "Probabilmente perso" : profile.nextExpected ? profile.nextExpected.toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—"}
                                  </div>
                                </div>
                              </div>

                              {/* Visual timeline of intervals */}
                              {profile.intervals && profile.intervals.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginBottom: 8 }}>INTERVALLI TRA VISITE (giorni)</div>
                                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50 }}>
                                    {profile.intervals.map((interval, idx) => {
                                      const maxInt = Math.max(...profile.intervals);
                                      const h = maxInt ? (interval / maxInt) * 40 : 20;
                                      const isAbove = interval > profile.cycle * 1.3;
                                      const isBelow = interval < profile.cycle * 0.7;
                                      return (
                                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
                                          <div style={{ fontSize: 10, fontWeight: 700, color: isAbove ? "var(--danger)" : isBelow ? "var(--blue)" : "var(--accent)" }}>{interval}</div>
                                          <div style={{ 
                                            width: "100%", height: h, borderRadius: "3px 3px 0 0",
                                            background: isAbove ? "var(--danger)" : isBelow ? "var(--blue)" : "var(--accent)",
                                            opacity: 0.7, transition: "height 400ms ease"
                                          }} />
                                        </div>
                                      );
                                    })}
                                    {/* Projected next interval */}
                                    {!profile.churned && (
                                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--purple)" }}>~{profile.cycle}</div>
                                        <div style={{ 
                                          width: "100%", height: Math.max(...profile.intervals) ? (profile.cycle / Math.max(...profile.intervals)) * 40 : 20, 
                                          borderRadius: "3px 3px 0 0",
                                          background: "var(--purple)", opacity: 0.4, 
                                          border: "1px dashed var(--purple)", borderBottom: "none",
                                          transition: "height 400ms ease"
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                    {profile.intervals.map((_, idx) => (
                                      <div key={idx} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--text-muted)" }}>v{idx + 1}→v{idx + 2}</div>
                                    ))}
                                    {!profile.churned && <div style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--purple)" }}>prossima</div>}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} /> nella norma
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger)" }} /> ritardo
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--blue)" }} /> anticipato
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--purple)", opacity: 0.5 }} /> previsto
                                  </div>
                                </div>
                              )}
                              
                              {profile.intervals && profile.intervals.length === 0 && (
                                <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
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
                    <table><thead><tr><th>Data</th><th>Ora</th><th>Servizio</th><th>Stato</th><th>Importo</th></tr></thead>
                    <tbody>{bookings.filter(b => b.clientId === selectedClient.id).sort((a, b) => b.date.localeCompare(a.date)).map(b => (
                      <tr key={b.id}><td>{b.date}</td><td>{b.time}</td><td>{b.serviceName}</td><td><span className={`status-badge ${b.status}`}>{b.status}</span></td><td style={{ fontWeight: 600, color: "var(--accent)" }}>€{b.price}</td></tr>
                    ))}</tbody></table>
                  </div>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <table><thead><tr><th>Cliente</th><th>Cane</th><th>Razza</th><th>Taglia</th><th>Visite</th><th>Ciclo</th><th>Stato</th><th>Spesa Tot.</th><th>Ultima Visita</th><th>Canale</th></tr></thead>
                  <tbody>{filteredClients.map(c => {
                    const profile = clientForecast.clientProfiles.find(cp => cp.id === c.id);
                    const cycle = profile?.cycle;
                    const conf = profile?.confidence;
                    const cv = (profile?.stddev && cycle) ? profile.stddev / cycle : null;
                    let statusLabel, statusBg, statusColor;
                    if (conf === "churned") { statusLabel = "Churn risk"; statusBg = "var(--danger-dim)"; statusColor = "var(--danger)"; }
                    else if (conf === "high") { statusLabel = "Stabile"; statusBg = "var(--success-dim)"; statusColor = "var(--success)"; }
                    else if (conf === "medium") { statusLabel = "Irregolare"; statusBg = "var(--orange-dim)"; statusColor = "var(--orange)"; }
                    else if (conf === "low") { statusLabel = "Nuovo"; statusBg = "var(--blue-dim)"; statusColor = "var(--blue)"; }
                    else { statusLabel = "—"; statusBg = "transparent"; statusColor = "var(--text-muted)"; }
                    return (
                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelectedClient(c)}>
                      <td style={{ fontWeight: 500 }}>{c.firstName} {c.lastName}</td><td>{c.dogName}</td><td>{c.breed}</td><td style={{ textTransform: "capitalize" }}>{c.size}</td>
                      <td><span style={{ fontWeight: 700 }}>{c.visitCount}</span></td>
                      <td style={{ fontWeight: 600 }}>{cycle ? `${cycle}gg` : "—"}</td>
                      <td><span className="status-badge" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span></td>
                      <td style={{ fontWeight: 600, color: "var(--accent)" }}>€{c.totalSpent}</td><td>{c.lastVisit || "—"}</td><td><SourcePill source={c.source} /></td>
                    </tr>);
                  })}</tbody></table>
                </div>
              )}
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
                    {monthlyData.map((m, i) => (
                      <div className="bar-col" key={i}>
                        <div className="bar-value" style={{ color: "var(--text-dim)" }}>€{(m.revenue / 1000).toFixed(1)}k</div>
                        <div style={{ width: "100%", display: "flex", gap: 3, justifyContent: "center", height: `${(m.revenue / maxMonthlyRev) * 140}px` }}>
                          <div className="bar" style={{ flex: 1, background: "var(--accent)", height: "100%", borderRadius: "4px 4px 0 0" }} />
                          <div className="bar" style={{ flex: 1, background: "var(--purple)", height: `${(m.profit / m.revenue) * 100}%`, borderRadius: "4px 4px 0 0", alignSelf: "flex-end" }} />
                        </div>
                        <div className="bar-label">{m.label}</div>
                      </div>
                    ))}
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
              {analyticsTab === "clients" && (<div className="two-col">
                <div className="card">
                  <div className="card-header"><h3>Distribuzione Visite</h3></div>
                  {[["1 visita", clients.filter(c => c.visitCount === 1).length],["2-3 visite", clients.filter(c => c.visitCount >= 2 && c.visitCount <= 3).length],["4-6 visite", clients.filter(c => c.visitCount >= 4 && c.visitCount <= 6).length],["7+ visite", clients.filter(c => c.visitCount >= 7).length]].map(([label, count]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 80, fontSize: 13, fontWeight: 500 }}>{label}</div>
                      <div style={{ flex: 1 }}><div className="forecast-bar-bg"><div className="forecast-bar-fill" style={{ width: `${(count / clients.length) * 100}%`, background: "var(--accent)" }} /></div></div>
                      <div style={{ fontWeight: 700, fontSize: 13, minWidth: 50 }}>{count} ({Math.round(count / clients.length * 100)}%)</div>
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-header"><h3>Segmentazione Valore</h3></div>
                  {[["🥇 Gold (>€300)", clients.filter(c => c.totalSpent > 300), "var(--orange)"],["🥈 Silver (€150-300)", clients.filter(c => c.totalSpent >= 150 && c.totalSpent <= 300), "var(--text-muted)"],["🥉 Bronze (<€150)", clients.filter(c => c.totalSpent < 150 && c.totalSpent > 0), "var(--purple)"],["👻 Dormienti (€0)", clients.filter(c => c.totalSpent === 0), "var(--text-muted)"]].map(([label, seg, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--bg3)", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color }}>{seg.length}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 80, textAlign: "right" }}>€{seg.reduce((s, c) => s + c.totalSpent, 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>)}
            </div>
          </>)}

          {/* AI INSIGHTS */}
          {view === "ai" && (<>
            <div className="header">
              <div className="header-left"><h2>AI Insights</h2><p>Suggerimenti intelligenti per massimizzare il profitto</p></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><Icon name="sparkle" size={14} color="var(--accent)" /> Powered by boku.ai engine</div>
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
                  ["Nuovi Clienti/Mese", `~${clientForecast.newClientsPerMonth}`, "var(--blue)"],
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
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--orange)" }} /> Nuovi clienti</span>
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
                            const nH = d.newCount ? (d.newCount / maxCount) * (chartH - 30) : 0;
                            
                            return (
                              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: barW, position: "relative" }}>
                                {d.high && (
                                  <div style={{ position: "absolute", bottom: 0, width: barW + 6, height: ((d.high - d.low) / maxCount) * (chartH - 30), bottom: (d.low / maxCount) * (chartH - 30), background: "rgba(167,139,250,0.08)", borderRadius: 4, border: "1px dashed rgba(167,139,250,0.15)", zIndex: 0 }} />
                                )}
                                <div style={{ fontSize: forecastRange === "12m" ? 9 : 10, fontWeight: 700, color: "var(--purple)", marginBottom: 4 }}>{d.count}</div>
                                <div style={{ display: "flex", flexDirection: "column", width: barW, cursor: "pointer" }}
                                  title={`${d.fullLabel}: ${d.count} tot — ✅${d.highCount} alta, ⚡${d.medCount} media, ❓${d.lowCount} bassa, 🆕${d.newCount} nuovi (range ${d.low}–${d.high})`}>
                                  <div style={{ width: barW, height: nH, background: "var(--orange)", borderRadius: nH > 0 && hH + mH + lH === 0 ? "4px 4px 0 0" : "0", transition: "height 600ms ease" }} />
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
                    <th style={{ color: "var(--orange)" }}>🆕 Nuovi</th>
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
                        <td><span style={{ fontWeight: 700, color: "var(--orange)" }}>{f.newCount}</span></td>
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
                  <div className="card-header"><h3>Come funziona il modello</h3><span className="badge" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>boku.ai engine</span></div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.8 }}>
                    {[
                      ["1️⃣", "Calcola il ciclo medio di ritorno per ogni cliente dagli intervalli tra visite"],
                      ["2️⃣", "Proietta la prossima visita attesa: ultima visita + ciclo medio"],
                      ["3️⃣", "Classifica la confidenza in base a regolarità (CV < 0.3 = alta) e numero visite"],
                      ["4️⃣", "Identifica il churn: se > 2.5× il ciclo è passato senza visita, il cliente è probabilmente perso"],
                      ["5️⃣", "Stima i nuovi clienti/mese dal tasso di acquisizione storico per canale"],
                      ["6️⃣", "Aggrega tutti i clienti per mese → forecast bottom-up con intervallo di confidenza pesato"],
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
                <div className="insight-card"><h4><Icon name="sparkle" size={14} color="var(--accent)" /> Actionable: WhatsApp Reminder</h4><p>Il modello identifica {clientForecast.activeClients.filter(c => c.confidence === "high").length} clienti ad alta confidenza. Per ognuno, boku.ai può inviare un reminder WhatsApp personalizzato X giorni prima della data prevista, massimizzando il tasso di riprenotazione e riempiendo il calendario in anticipo.</p></div>
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
              <div className="form-group"><label>Cliente</label><select><option value="">Seleziona cliente...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.dogName} ({c.breed})</option>)}</select></div>
              <div className="form-row"><div><label>Data</label><input type="date" defaultValue="2026-03-16" /></div><div><label>Ora</label><input type="time" defaultValue="10:00" /></div></div>
              <div className="form-group"><label>Servizio</label><select><option value="">Seleziona servizio...</option>{services.map(s => <option key={s.id} value={s.id}>{s.name} — €{s.price} ({s.duration}min)</option>)}</select></div>
              <div className="form-group"><label>Note</label><textarea rows={3} placeholder="Note aggiuntive..." /></div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                <button className="btn" onClick={() => setShowModal(null)}>Annulla</button>
                <button className="btn btn-whatsapp" onClick={() => setShowModal(null)}><Icon name="whatsapp" size={14} color="white" /> Prenota + WhatsApp</button>
                <button className="btn btn-primary" onClick={() => setShowModal(null)}><Icon name="check" size={14} /> Conferma</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
