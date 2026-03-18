import { createClient } from '@supabase/supabase-js'

// ── Credenziali Supabase ──────────────────────────────────────────────────────
const SUPABASE_URL = 'https://azjqamhugffwpimwjsnp.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6anFhbWh1Z2Zmd3BpbXdqc25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzIyNzAsImV4cCI6MjA4OTQwODI3MH0.PHuq-UR2JKiNeuSfCsRe_H6uVmFQtSD60COdAW1qNiM'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── Data generation (copiata da App.jsx) ─────────────────────────────────────
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
]

const PET_DATA = {
  cane:     { names: ["Luna","Buddy","Rocky","Bella","Max","Kira","Zeus","Mia","Leo","Lola","Oscar","Nina","Thor","Stella","Rex","Zoe","Duke","Daisy","Simba","Ruby","Charlie","Nala","Bruno","Coco","Jack","Maya","Toby","Lilli","Ares","Moka","Lucky","Pippi","Axel","Bianca","Pluto","Greta","Spike","Chanel","Ringo","Perla"], breeds: ["Barboncino","Golden Retriever","Shih Tzu","Yorkshire","Labrador","Cocker Spaniel","Maltese","Bulldog Francese","Pastore Tedesco","Border Collie","Chihuahua","Beagle","Jack Russell","Setter Irlandese","Schnauzer","Cavalier King","Husky","Bassotto","Boxer","Lagotto Romagnolo"] },
  gatto:    { names: ["Micio","Neve","Tigre","Sole","Luna","Pixel","Momo","Fufi","Birba","Ombra","Pepita","Faro","Briciola","Speedy","Polpo","Nuvola","Zenzero","Cleo","Tartufo","Miele"], breeds: ["Europeo","Persiano","Siamese","Maine Coon","Ragdoll","British Shorthair","Bengala","Sphynx","Certosino","Abissino"] },
  coniglio: { names: ["Fiocco","Polpetta","Biscotto","Batuffolo","Ciuffo","Palla","Carota","Cotone","Macchia","Bolla"], breeds: ["Nano","Ariete","Angorà","Rex","Lionhead","Olandese","Gigante Fiammingo","Mini Rex"] },
  uccello:  { names: ["Cip","Tweetie","Fly","Sole","Pico","Cielo","Birillo","Fifi","Arco","Rio"], breeds: ["Pappagallo","Canarino","Parrocchetto","Cacatua","Cocorita","Ninfea","Inseparabile","Cardellino"] },
  rettile:  { names: ["Spike","Rex","Geko","Flash","Drago","Sandy","Sasso","Bolt","Kaa","Iggy"], breeds: ["Iguana","Leopard Gecko","Pitone Reale","Drago Barbuto","Camaleonte","Tartaruga","Geco Diurno","Serpente del Grano"] },
}
const ANIMAL_TYPES = ["cane","cane","cane","cane","cane","cane","gatto","gatto","gatto","coniglio","uccello","rettile"]
const OWNER_FIRST = ["Marco","Giulia","Alessandro","Francesca","Luca","Arianna","Andrea","Sara","Davide","Elena","Matteo","Chiara","Stefano","Valentina","Roberto","Laura","Paolo","Silvia","Giuseppe","Anna","Lorenzo","Maria","Fabio","Claudia","Simone","Federica","Antonio","Elisa","Michele","Martina"]
const OWNER_LAST = ["Rossi","Bianchi","Ferrari","Russo","Romano","Colombo","Ricci","Marino","Greco","Bruno","Gallo","Conti","De Luca","Mancini","Costa","Giordano","Rizzo","Lombardi","Moretti","Barbieri","Fontana","Santoro","Mariani","Rinaldi","Caruso","Ferrara","Galli","Martini","Leone","Longo"]
const SIZES = ["piccola","media","grande"]

function seededRandom(seed) {
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function generateData() {
  const rng = seededRandom(42)
  const ri = (min, max) => Math.floor(rng() * (max - min + 1)) + min
  const pick = arr => arr[ri(0, arr.length - 1)]
  const clients = []
  const usedPairs = new Set()
  for (let i = 0; i < 60; i++) {
    let fn, ln, key
    do { fn = pick(OWNER_FIRST); ln = pick(OWNER_LAST); key = fn+ln } while (usedPairs.has(key))
    usedPairs.add(key)
    const size = pick(SIZES)
    const animalType = pick(ANIMAL_TYPES)
    const petPool = PET_DATA[animalType]
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
    })
  }
  const bookings = []
  const statuses = ["completato","completato","completato","completato","completato","completato","completato","cancellato","no-show"]
  let bid = 0
  for (let m = 0; m < 6; m++) {
    const year = m < 3 ? 2025 : 2026
    const month = m < 3 ? m + 10 : m - 2
    const daysInMonth = new Date(year, month, 0).getDate()
    const bookingsThisMonth = ri(95, 135)
    const seasonMult = month === 12 || month === 1 ? 1.15 : month >= 6 && month <= 8 ? 1.1 : 1.0
    for (let b = 0; b < bookingsThisMonth; b++) {
      const client = pick(clients)
      const day = ri(1, daysInMonth)
      if (new Date(year, month - 1, day).getDay() === 0) continue
      const hour = ri(8, 17), minute = pick([0, 15, 30, 45])
      let avail = SERVICES
      if (client.size === "piccola") avail = SERVICES.filter(s => !s.id.includes("large"))
      if (client.size === "grande") avail = SERVICES.filter(s => !s.id.includes("small"))
      const service = pick(avail)
      const status = m < 5 ? pick(statuses) : (rng() > 0.15 ? "confermato" : "in-attesa")
      const finalPrice = Math.round(service.price * seasonMult * (rng() > 0.85 ? 0.9 : 1))
      const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`
      bookings.push({
        id: `b${bid++}`, clientId: client.id, clientName: `${client.firstName} ${client.lastName}`,
        petName: client.petName, animalType: client.animalType, breed: client.breed,
        serviceId: service.id, serviceName: service.name,
        date: dateStr, time: `${String(hour).padStart(2,"0")}:${String(minute).padStart(2,"0")}`,
        duration: service.duration, price: finalPrice, cost: service.cost, status,
        notes: rng() > 0.8 ? pick(["Richiesto shampoo biologico","Extra profumazione","Fiocco regalo","Taglio specifico come foto","Portare guinzaglio nuovo"]) : "",
        createdVia: pick(["whatsapp","telefono","walk-in","online","instagram"]),
        reminderSent: rng() > 0.3,
        payment: status === "completato" ? pick(["pos","contanti","pos","pos","contanti","bonifico"]) : "",
      })
      if (status === "completato") {
        client.totalSpent += finalPrice; client.visitCount++
        if (!client.lastVisit || dateStr > client.lastVisit) client.lastVisit = dateStr
        client.loyaltyPoints += Math.floor(finalPrice / 5)
      }
    }
  }
  return { clients, bookings }
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('Generazione dati...')
  const { clients, bookings } = generateData()

  // Mappa camelCase → snake_case per Supabase
  const clientRows = clients.map(c => ({
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    phone: c.phone,
    email: c.email,
    animal_type: c.animalType,
    pet_name: c.petName,
    breed: c.breed,
    size: c.size,
    notes: c.notes,
    registered_date: c.registeredDate,
    total_spent: c.totalSpent,
    visit_count: c.visitCount,
    last_visit: c.lastVisit,
    loyalty_points: c.loyaltyPoints,
    preferred_day: c.preferredDay,
    source: c.source,
    rating: c.rating,
    mordace: c.mordace,
  }))

  const bookingRows = bookings.map(b => ({
    id: b.id,
    client_id: b.clientId,
    client_name: b.clientName,
    pet_name: b.petName,
    animal_type: b.animalType,
    breed: b.breed,
    service_id: b.serviceId,
    service_name: b.serviceName,
    date: b.date,
    time: b.time,
    duration: b.duration,
    price: b.price,
    cost: b.cost,
    status: b.status,
    notes: b.notes,
    created_via: b.createdVia,
    reminder_sent: b.reminderSent,
    payment: b.payment,
  }))

  console.log(`Inserimento ${clientRows.length} clienti...`)
  const { error: clientError } = await supabase.from('clients').insert(clientRows)
  if (clientError) { console.error('Errore clienti:', clientError.message); process.exit(1) }
  console.log('✓ Clienti inseriti')

  console.log(`Inserimento ${bookingRows.length} prenotazioni...`)
  const { error: bookingError } = await supabase.from('bookings').insert(bookingRows)
  if (bookingError) { console.error('Errore prenotazioni:', bookingError.message); process.exit(1) }
  console.log('✓ Prenotazioni inserite')

  console.log('\nSeed completato!')
}

seed()
