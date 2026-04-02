import { PrismaClient, Role, ClientType, ServiceType, CardPointType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── USERS ───────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const managerPassword = await bcrypt.hash('Manager1234!', 12);
  const techPassword = await bcrypt.hash('Tech1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hygienix.app' },
    update: {},
    create: {
      email: 'admin@hygienix.app',
      passwordHash: adminPassword,
      firstName: 'Marco',
      lastName: 'Rossi',
      role: Role.ADMIN,
      phone: '+39 02 1234567',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@hygienix.app' },
    update: {},
    create: {
      email: 'manager@hygienix.app',
      passwordHash: managerPassword,
      firstName: 'Laura',
      lastName: 'Bianchi',
      role: Role.MANAGER,
      phone: '+39 02 7654321',
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tecnico1@hygienix.app' },
    update: {},
    create: {
      email: 'tecnico1@hygienix.app',
      passwordHash: techPassword,
      firstName: 'Giuseppe',
      lastName: 'Verdi',
      role: Role.TECHNICIAN,
      phone: '+39 333 1234567',
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tecnico2@hygienix.app' },
    update: {},
    create: {
      email: 'tecnico2@hygienix.app',
      passwordHash: techPassword,
      firstName: 'Anna',
      lastName: 'Ferrari',
      role: Role.TECHNICIAN,
      phone: '+39 333 7654321',
    },
  });

  // ─── PRODUCTS ────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'product-rat-bait-1' },
      update: {},
      create: {
        id: 'product-rat-bait-1',
        name: 'Ratoblok Pro',
        activeIngredient: 'Brodifacoum 0.005%',
        category: 'RODENTICIDE',
        manufacturer: 'AgriChim',
        registrationNumber: 'IT/2023/001',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-insect-1' },
      update: {},
      create: {
        id: 'product-insect-1',
        name: 'InsettoStop 50WP',
        activeIngredient: 'Deltametrina 50%',
        category: 'INSECTICIDE',
        manufacturer: 'PestChem Italia',
        registrationNumber: 'IT/2022/045',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-cockroach-1' },
      update: {},
      create: {
        id: 'product-cockroach-1',
        name: 'BlattoKill Gel',
        activeIngredient: 'Fipronil 0.05%',
        category: 'INSECTICIDE',
        manufacturer: 'Urban Pest',
        registrationNumber: 'IT/2021/089',
      },
    }),
    prisma.product.upsert({
      where: { id: 'product-disinfect-1' },
      update: {},
      create: {
        id: 'product-disinfect-1',
        name: 'ChloroClean Pro',
        activeIngredient: 'Ipoclorito di sodio 5%',
        category: 'DISINFECTANT',
        manufacturer: 'CleanTech',
        registrationNumber: 'IT/2023/112',
      },
    }),
  ]);

  // ─── CLIENTS ─────────────────────────────────────────────────────────────
  const client1 = await prisma.client.upsert({
    where: { id: 'client-ristorante-1' },
    update: {},
    create: {
      id: 'client-ristorante-1',
      businessName: 'Ristorante da Mario S.r.l.',
      type: ClientType.RESTAURANT,
      taxCode: '02345678901',
      vatNumber: 'IT02345678901',
      contactName: 'Mario Conti',
      contactPhone: '+39 02 9876543',
      contactEmail: 'mario.conti@damario.it',
      address: 'Via Torino 45',
      city: 'Milano',
      province: 'MI',
      zip: '20123',
      notes: 'Cliente storico. Richiede interventi mensili. Area cucina molto sensibile.',
      createdById: admin.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client-magazzino-1' },
    update: {},
    create: {
      id: 'client-magazzino-1',
      businessName: 'LogisTech S.p.A.',
      type: ClientType.INDUSTRY,
      taxCode: '08765432109',
      vatNumber: 'IT08765432109',
      contactName: 'Ing. Fabio Riva',
      contactPhone: '+39 02 5555000',
      contactEmail: 'f.riva@logistech.it',
      address: 'Via Industriale 100',
      city: 'Sesto San Giovanni',
      province: 'MI',
      zip: '20099',
      notes: 'Magazzino alimentare certificato. Audit HACCP bimestrale obbligatorio.',
      createdById: admin.id,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: 'client-condominio-1' },
    update: {},
    create: {
      id: 'client-condominio-1',
      businessName: 'Condominio Piazza Duomo 8',
      type: ClientType.CONDO,
      taxCode: '97654321000',
      contactName: 'Avv. Sergio Mantova',
      contactPhone: '+39 335 8901234',
      contactEmail: 's.mantova@amministrazioni.it',
      address: 'Piazza Duomo 8',
      city: 'Milano',
      province: 'MI',
      zip: '20121',
      notes: 'Problema cronico topi nelle cantine. Trattamento trimestrale.',
      createdById: admin.id,
    },
  });

  // ─── SITES ───────────────────────────────────────────────────────────────
  const site1 = await prisma.site.upsert({
    where: { id: 'site-damario-1' },
    update: {},
    create: {
      id: 'site-damario-1',
      clientId: client1.id,
      name: 'Sede Principale — Cucina e Sala',
      type: 'Ristorante',
      address: 'Via Torino 45',
      city: 'Milano',
      province: 'MI',
      zip: '20123',
      lat: 45.4642,
      lng: 9.1900,
      localContactName: 'Mario Conti',
      localContactPhone: '+39 02 9876543',
      criticalZones: 'Cucina (zona lavastoviglie), magazzino derrate, area spazzatura esterna',
      operationalNotes: 'Accesso solo prima delle 10:00 o dopo le 15:00. Chiedere di Mario.',
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: 'site-logistech-1' },
    update: {},
    create: {
      id: 'site-logistech-1',
      clientId: client2.id,
      name: 'Magazzino A — Settore Alimentare',
      type: 'Magazzino industriale',
      address: 'Via Industriale 100, Corpo A',
      city: 'Sesto San Giovanni',
      province: 'MI',
      zip: '20099',
      lat: 45.5379,
      lng: 9.2395,
      localContactName: 'Sig. Roberto Fumagalli',
      localContactPhone: '+39 349 1234567',
      criticalZones: 'Perimetro esterno, dock carico/scarico, area rifiuti, soffittatura zona A3',
      operationalNotes: 'Indossare sempre DPI. Firma su registro accessi all\'ingresso.',
    },
  });

  const site3 = await prisma.site.upsert({
    where: { id: 'site-condominio-cantine' },
    update: {},
    create: {
      id: 'site-condominio-cantine',
      clientId: client3.id,
      name: 'Cantine e Aree Comuni',
      type: 'Condominio',
      address: 'Piazza Duomo 8 — Piano Interrato',
      city: 'Milano',
      province: 'MI',
      zip: '20121',
      lat: 45.4654,
      lng: 9.1859,
      localContactName: 'Portiere — Sig. Carmine',
      localContactPhone: '+39 02 8765432',
      criticalZones: 'Cantine nord, locale contatori, area bidoni',
      operationalNotes: 'Suonare al portiere. Orario 9-12 e 14-17. Sabato chiuso.',
    },
  });

  // ─── SITE CARDS ──────────────────────────────────────────────────────────
  const card1 = await prisma.siteCard.upsert({
    where: { siteId: site1.id },
    update: {},
    create: {
      siteId: site1.id,
      notes: 'Planimetria aggiornata Marzo 2024. Cucina ristrutturata.',
      version: 2,
    },
  });

  await prisma.siteCardPoint.createMany({
    skipDuplicates: true,
    data: [
      { siteCardId: card1.id, code: 'T-01', type: CardPointType.TRAP, label: 'Trappola ingresso cucina', positionX: 15, positionY: 45, frequency: 'Settimanale', instructions: 'Verificare presenza di roditori. Sostituire esca se consumata >50%.', status: 'OK' },
      { siteCardId: card1.id, code: 'T-02', type: CardPointType.TRAP, label: 'Trappola magazzino', positionX: 75, positionY: 30, frequency: 'Settimanale', instructions: 'Area derrate: massima attenzione. Foto obbligatoria se positivo.', status: 'ATTENTION' },
      { siteCardId: card1.id, code: 'E-01', type: CardPointType.BAIT, label: 'Esca esterna — area spazzatura', positionX: 88, positionY: 80, frequency: 'Mensile', instructions: 'Esca topicida. Verificare consumo. Sostituire sempre con guanti.', status: 'OK' },
      { siteCardId: card1.id, code: 'UV-01', type: CardPointType.UV_LAMP, label: 'Lampada UV — sala principale', positionX: 50, positionY: 60, frequency: 'Mensile', instructions: 'Verificare stato lampada e vassoio raccolta. Sostituire lampada ogni 12 mesi.', status: 'OK' },
      { siteCardId: card1.id, code: 'A-01', type: CardPointType.SENSITIVE_ACCESS, label: 'Griglia scarico cucina', positionX: 25, positionY: 70, frequency: 'Mensile', instructions: 'Ispezionare griglia. Applicare gel anti-blatte se necessario.', status: 'CRITICAL', lastNotes: 'Trovate tracce blatte ultima visita' },
    ],
  });

  const card2 = await prisma.siteCard.upsert({
    where: { siteId: site2.id },
    update: {},
    create: {
      siteId: site2.id,
      notes: 'Mappa perimetrale magazzino A. Punti aggiornati dopo audit HACCP.',
      version: 1,
    },
  });

  await prisma.siteCardPoint.createMany({
    skipDuplicates: true,
    data: [
      { siteCardId: card2.id, code: 'T-01', type: CardPointType.TRAP, label: 'Trappola — angolo NE', positionX: 90, positionY: 10, frequency: 'Bisettimanale', status: 'OK' },
      { siteCardId: card2.id, code: 'T-02', type: CardPointType.TRAP, label: 'Trappola — angolo NW', positionX: 10, positionY: 10, frequency: 'Bisettimanale', status: 'OK' },
      { siteCardId: card2.id, code: 'T-03', type: CardPointType.TRAP, label: 'Trappola — angolo SE', positionX: 90, positionY: 90, frequency: 'Bisettimanale', status: 'OK' },
      { siteCardId: card2.id, code: 'T-04', type: CardPointType.TRAP, label: 'Trappola — angolo SW', positionX: 10, positionY: 90, frequency: 'Bisettimanale', status: 'OK' },
      { siteCardId: card2.id, code: 'T-05', type: CardPointType.TRAP, label: 'Trappola — dock carico', positionX: 50, positionY: 95, frequency: 'Settimanale', status: 'ATTENTION', lastNotes: 'Area dock: attività notturna sospetta' },
      { siteCardId: card2.id, code: 'E-01', type: CardPointType.BAIT, label: 'Esca — perimetro esterno ovest', positionX: 5, positionY: 50, frequency: 'Mensile', status: 'OK' },
    ],
  });

  // ─── INTERVENTIONS ───────────────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);
  const lastWeek = new Date(now); lastWeek.setDate(now.getDate() - 7);
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);

  // Intervento completato (ieri)
  await prisma.intervention.upsert({
    where: { id: 'int-closed-001' },
    update: {},
    create: {
      id: 'int-closed-001',
      clientId: client1.id,
      siteId: site1.id,
      assignedTechnicianId: tech1.id,
      createdById: admin.id,
      serviceType: ServiceType.MONITORING,
      status: 'CLOSED',
      priority: 'NORMAL',
      scheduledAt: lastWeek,
      scheduledEndAt: new Date(lastWeek.getTime() + 2 * 60 * 60 * 1000),
      startedAt: lastWeek,
      completedAt: new Date(lastWeek.getTime() + 90 * 60 * 1000),
      closedAt: new Date(lastWeek.getTime() + 95 * 60 * 1000),
      description: 'Monitoraggio mensile trappole e lampade UV',
      outcome: 'Trappola T-02 positiva (1 roditore). Esca E-01 consumata al 60%, sostituita. Lampada UV OK.',
    },
  });

  // Intervento di oggi - assegnato
  await prisma.intervention.upsert({
    where: { id: 'int-today-001' },
    update: {},
    create: {
      id: 'int-today-001',
      clientId: client2.id,
      siteId: site2.id,
      assignedTechnicianId: tech1.id,
      createdById: manager.id,
      serviceType: ServiceType.RODENT_CONTROL,
      status: 'ASSIGNED',
      priority: 'HIGH',
      scheduledAt: new Date(now.setHours(9, 0, 0, 0)),
      scheduledEndAt: new Date(now.setHours(12, 0, 0, 0)),
      description: 'Controllo perimetrale e sostituzione esche. Referto obbligatorio per HACCP.',
      operationalNotes: 'Portare Ratoblok Pro (almeno 500g). Compilare scheda HACCP cartacea.',
    },
  });

  // Intervento di domani - pianificato
  await prisma.intervention.upsert({
    where: { id: 'int-tomorrow-001' },
    update: {},
    create: {
      id: 'int-tomorrow-001',
      clientId: client3.id,
      siteId: site3.id,
      assignedTechnicianId: tech2.id,
      createdById: admin.id,
      serviceType: ServiceType.RODENT_CONTROL,
      status: 'PLANNED',
      priority: 'NORMAL',
      scheduledAt: new Date(tomorrow.setHours(10, 0, 0, 0)),
      scheduledEndAt: new Date(tomorrow.setHours(12, 0, 0, 0)),
      description: 'Controllo trimestrale cantine. Verifica trappole e stato esche.',
    },
  });

  // Intervento della prossima settimana
  await prisma.intervention.upsert({
    where: { id: 'int-nextweek-001' },
    update: {},
    create: {
      id: 'int-nextweek-001',
      clientId: client1.id,
      siteId: site1.id,
      assignedTechnicianId: tech1.id,
      createdById: admin.id,
      serviceType: ServiceType.DISINFECTION,
      status: 'PLANNED',
      priority: 'NORMAL',
      scheduledAt: new Date(nextWeek.setHours(8, 0, 0, 0)),
      scheduledEndAt: new Date(nextWeek.setHours(11, 0, 0, 0)),
      description: 'Disinfestazione cucina — trattamento anti-blatte con gel e spray.',
      operationalNotes: 'Usare BlattoKill Gel in tutte le fessure. Trattare griglia scarico A-01.',
    },
  });

  console.log('✅ Seed completato!');
  console.log('');
  console.log('📧 Credenziali demo:');
  console.log('  Admin:    admin@hygienix.app     / Admin1234!');
  console.log('  Manager:  manager@hygienix.app   / Manager1234!');
  console.log('  Tecnico1: tecnico1@hygienix.app  / Tech1234!');
  console.log('  Tecnico2: tecnico2@hygienix.app  / Tech1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
