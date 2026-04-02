import { prisma } from '@hygienix/database';
import Handlebars from 'handlebars';
import { uploadBuffer } from './storage';

const PDF_TEMPLATE = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a2e; line-height: 1.5; }
  .page { padding: 30px 40px; max-width: 210mm; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1A6B3C; padding-bottom: 20px; margin-bottom: 24px; }
  .company-name { font-size: 24px; font-weight: 900; color: #1A6B3C; letter-spacing: -0.5px; }
  .company-sub { font-size: 11px; color: #666; margin-top: 2px; }
  .report-meta { text-align: right; }
  .report-meta .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .report-meta .value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
  .status-badge { display: inline-block; background: #1A6B3C; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 6px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; color: #1A6B3C; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #D1FAE5; padding-bottom: 6px; margin-bottom: 12px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .info-block { background: #f8fdf9; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #2ECC71; }
  .info-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-value { font-size: 12px; font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1A6B3C; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 8px 10px; border-bottom: 1px solid #e8f5e9; font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f0fdf4; }
  .outcome-ok { color: #1A6B3C; font-weight: 700; }
  .outcome-attention { color: #E67E22; font-weight: 700; }
  .outcome-critical { color: #DC2626; font-weight: 700; }
  .notes-box { background: #f8fdf9; border: 1px solid #D1FAE5; border-radius: 6px; padding: 12px 16px; font-size: 11px; line-height: 1.6; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; }
  .sig-box { border-top: 2px solid #1A6B3C; padding-top: 12px; text-align: center; }
  .sig-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .sig-name { font-size: 13px; font-weight: 600; margin-top: 4px; }
  .sig-date { font-size: 10px; color: #888; }
  .footer { border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }
  .priority-urgent { color: #DC2626; }
  .priority-high { color: #E67E22; }
  .priority-normal { color: #1A6B3C; }
  .priority-low { color: #888; }
  .alert-box { background: #fef2f2; border-left: 4px solid #DC2626; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 11px; color: #7f1d1d; }
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="company-name">HYGIENIX</div>
      <div class="company-sub">Pest Control Management · Report Intervento</div>
    </div>
    <div class="report-meta">
      <div class="label">N° Intervento</div>
      <div class="value">#{{shortId}}</div>
      <div class="label" style="margin-top:8px">Data Report</div>
      <div class="value">{{reportDate}}</div>
      <div><span class="status-badge">{{statusLabel}}</span></div>
    </div>
  </div>

  <!-- INTERVENTO INFO -->
  <div class="section">
    <div class="section-title">Dettagli Intervento</div>
    <div class="grid-3">
      <div class="info-block">
        <div class="info-label">Tipologia Servizio</div>
        <div class="info-value">{{serviceTypeLabel}}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Priorità</div>
        <div class="info-value class-priority-{{priority}}">{{priorityLabel}}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Data Pianificata</div>
        <div class="info-value">{{scheduledDate}}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Check-In</div>
        <div class="info-value">{{startedAt}}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Check-Out</div>
        <div class="info-value">{{completedAt}}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Durata</div>
        <div class="info-value">{{duration}}</div>
      </div>
    </div>
  </div>

  <!-- CLIENTE & SEDE -->
  <div class="grid-2">
    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="info-block">
        <div class="info-label">Ragione Sociale</div>
        <div class="info-value">{{client.businessName}}</div>
        {{#if client.vatNumber}}<div class="info-label" style="margin-top:6px">P.IVA</div><div class="info-value">{{client.vatNumber}}</div>{{/if}}
        {{#if client.contactPhone}}<div class="info-label" style="margin-top:6px">Telefono</div><div class="info-value">{{client.contactPhone}}</div>{{/if}}
        {{#if client.contactEmail}}<div class="info-label" style="margin-top:6px">Email</div><div class="info-value">{{client.contactEmail}}</div>{{/if}}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Sede</div>
      <div class="info-block">
        <div class="info-label">Nome Sede</div>
        <div class="info-value">{{site.name}}</div>
        {{#if site.address}}<div class="info-label" style="margin-top:6px">Indirizzo</div><div class="info-value">{{site.address}}, {{site.city}}</div>{{/if}}
        {{#if site.localContactName}}<div class="info-label" style="margin-top:6px">Referente Locale</div><div class="info-value">{{site.localContactName}} {{site.localContactPhone}}</div>{{/if}}
      </div>
    </div>
  </div>

  <!-- TECNICO -->
  <div class="section">
    <div class="section-title">Tecnico Incaricato</div>
    <div class="info-block" style="max-width:300px">
      <div class="info-label">Nome</div>
      <div class="info-value">{{technician.firstName}} {{technician.lastName}}</div>
      {{#if technician.phone}}<div class="info-label" style="margin-top:6px">Telefono</div><div class="info-value">{{technician.phone}}</div>{{/if}}
    </div>
  </div>

  <!-- DESCRIZIONE -->
  {{#if description}}
  <div class="section">
    <div class="section-title">Descrizione Intervento</div>
    <div class="notes-box">{{description}}</div>
  </div>
  {{/if}}

  <!-- PRODOTTI -->
  {{#if products.length}}
  <div class="section">
    <div class="section-title">Prodotti Utilizzati</div>
    <table>
      <thead><tr><th>Prodotto</th><th>Principio Attivo</th><th>Quantità</th><th>N° Lotto</th></tr></thead>
      <tbody>
        {{#each products}}
        <tr>
          <td><strong>{{this.product.name}}</strong></td>
          <td>{{this.product.activeIngredient}}</td>
          <td>{{this.quantity}} {{this.unit}}</td>
          <td>{{this.batchNumber}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <!-- PUNTI CARTELLINO -->
  {{#if points.length}}
  <div class="section">
    <div class="section-title">Punti Controllati</div>
    <table>
      <thead><tr><th>Codice</th><th>Punto</th><th>Tipo</th><th>Esito</th><th>Note</th></tr></thead>
      <tbody>
        {{#each points}}
        <tr>
          <td><strong>{{this.siteCardPoint.code}}</strong></td>
          <td>{{this.siteCardPoint.label}}</td>
          <td>{{this.siteCardPoint.type}}</td>
          <td class="outcome-{{this.outcomeClass}}">{{this.outcomeLabel}}</td>
          <td>{{this.notes}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  {{/if}}

  <!-- ESITO FINALE -->
  {{#if outcome}}
  <div class="section">
    <div class="section-title">Esito e Note Finali</div>
    <div class="notes-box">{{outcome}}</div>
  </div>
  {{/if}}

  <!-- FIRME -->
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-label">Firma Tecnico</div>
      <div class="sig-name">{{technician.firstName}} {{technician.lastName}}</div>
      <div class="sig-date">{{closedAt}}</div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Firma Cliente / Responsabile Sede</div>
      <div class="sig-name">{{#if clientSignature}}Firmato digitalmente{{else}}Non firmato{{/if}}</div>
      <div class="sig-date">{{closedAt}}</div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>Hygienix Platform · Gestionale Pest Control · Documento generato automaticamente</span>
    <span>Intervento #{{shortId}} · {{reportDate}}</span>
  </div>
</div>
</body>
</html>`;

function formatDate(d: Date | null | undefined): string {
  if (!d) return 'N/D';
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return 'N/D';
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const SERVICE_LABELS: Record<string, string> = {
  DISINFECTION: 'Disinfestazione', RODENT_CONTROL: 'Derattizzazione', COCKROACH: 'Deblattizzazione',
  MONITORING: 'Monitoraggio', SANIFICATION: 'Sanificazione', INSPECTION: 'Sopralluogo', OTHER: 'Altro',
};

const OUTCOME_LABELS: Record<string, string> = { OK: 'OK ✓', ATTENTION: 'Attenzione ⚠', CRITICAL: 'Critico ✗', NOT_CHECKED: 'Non controllato' };

export async function generateInterventionPdf(interventionId: string): Promise<string> {
  const intervention = await prisma.intervention.findFirstOrThrow({
    where: { id: interventionId },
    include: {
      client: true,
      site: true,
      assignedTechnician: true,
      products: { include: { product: true } },
      points: { include: { siteCardPoint: true }, orderBy: { siteCardPoint: { code: 'asc' } } },
    },
  });

  const templateData = {
    shortId: interventionId.slice(-8).toUpperCase(),
    reportDate: formatDate(new Date()),
    statusLabel: 'CHIUSO',
    serviceTypeLabel: SERVICE_LABELS[intervention.serviceType] || intervention.serviceType,
    priorityLabel: intervention.priority,
    priority: intervention.priority.toLowerCase(),
    scheduledDate: formatDate(intervention.scheduledAt),
    startedAt: formatDate(intervention.startedAt),
    completedAt: formatDate(intervention.completedAt),
    closedAt: formatDate(intervention.closedAt),
    duration: formatDuration(intervention.startedAt, intervention.completedAt),
    client: intervention.client,
    site: intervention.site,
    technician: intervention.assignedTechnician || { firstName: 'N/D', lastName: '', phone: null },
    description: intervention.description,
    outcome: intervention.outcome,
    operationalNotes: intervention.operationalNotes,
    clientSignature: !!intervention.clientSignatureUrl,
    products: intervention.products,
    points: intervention.points.map(p => ({
      ...p,
      outcomeLabel: OUTCOME_LABELS[p.outcome] || p.outcome,
      outcomeClass: p.outcome.toLowerCase().replace('_', '-'),
    })),
  };

  const template = Handlebars.compile(PDF_TEMPLATE);
  const html = template(templateData);

  // Genera PDF con Puppeteer
  let pdfBuffer: Buffer;
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    pdfBuffer = Buffer.from(await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } }));
    await browser.close();
  } catch {
    // Se puppeteer non disponibile in dev, genera un HTML fittizio
    pdfBuffer = Buffer.from(html);
  }

  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const { key } = await uploadBuffer(pdfBuffer, `reports/${year}/${month}`, `report-${interventionId}.pdf`, 'application/pdf');
  return key;
}
