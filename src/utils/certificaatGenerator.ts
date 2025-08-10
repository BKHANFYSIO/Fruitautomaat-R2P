import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { LeerData, Achievement } from '../data/types';
import { getAppConfig } from '../data/appConfig';

interface CertificaatData {
  studentName: string;
  leerData: LeerData;
  achievements: Achievement[];
  datum: string;
}

export const generateCertificaat = async (data: CertificaatData): Promise<void> => {
  const appConfig = getAppConfig();
  // Gebruik overload met compressie-flag
  const pdf = new jsPDF('p', 'mm', 'a4', true);
  
  // Voorblad
  await generateVoorblad(pdf, data, appConfig);

  // Bijlagen: Leeranalyse tabs als afbeeldingen met automatische paginering
  try {
    await appendLeeranalyseBijlagen(pdf);
  } catch {}

  // Voeg paginanummering toe (onderaan rechts): "Pagina X van N"
  try {
    const totaal = pdf.getNumberOfPages();
    const pageWidth = (pdf as any).internal.pageSize.getWidth();
    const pageHeight = (pdf as any).internal.pageSize.getHeight();
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    for (let i = 1; i <= totaal; i++) {
      pdf.setPage(i);
      const label = `Pagina ${i} van ${totaal}`;
      pdf.text(label, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
  } catch {}

  // Download het PDF bestand
  const filename = `certificaat_${data.studentName.replace(/\s+/g, '_')}_${data.datum}.pdf`;
  pdf.save(filename);
};

const generateVoorblad = async (pdf: jsPDF, data: CertificaatData, appConfig: any) => {
  // Suggestie 1 – Strakke hero met subtiele band en icoontjes
  // Bovenste band
  pdf.setFillColor(40, 44, 52);
  pdf.rect(0, 0, 210, 24, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text(appConfig.title, 10, 16);
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  pdf.text(appConfig.subtitle || 'Leeranalyse Certificaat', 10, 21);

  // Titelblok in het midden
  pdf.setTextColor(102, 126, 234);
  pdf.setFontSize(28);
  pdf.text('Certificaat', 105, 55, { align: 'center' });

  // Fruitautomaat-accent: subtiele rol (slotreel) met drie vensters met joker-afbeelding
  pdf.setDrawColor(220, 220, 220);
  pdf.setFillColor(245, 245, 245);
  const reelX = 25; const reelY = 66; const reelW = 160; const reelH = 34; // grotere reel voor grotere symbolen
  pdf.roundedRect(reelX, reelY, reelW, reelH, 4, 4, 'FD');
  // Binnenvensters
  const pad = 8; // iets grotere padding
  const windowW = (reelW - pad * 4) / 3; // drie vensters + 4 paddings (links, tussen, tussen, rechts)
  const windowH = reelH - pad * 2;
  const windowY = reelY + pad;
  const winXs = [reelX + pad, reelX + pad * 2 + windowW, reelX + pad * 3 + windowW * 2];
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(210, 210, 210);
  winXs.forEach((wx) => pdf.roundedRect(wx, windowY, windowW, windowH, 3, 3, 'FD'));
  // Probeer drie keer de joker-afbeelding te plaatsen met behoud van aspect ratio
  try {
    const res = await fetch('/images/joker.png');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = url;
      });
      // Beschikbare ruimte binnen elk venster
      const availW = windowW - 6;
      const availH = windowH - 6;
      // Bepaal schaal zodat de afbeelding past zonder vervorming
      const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const offsetY = windowY + (windowH - drawH) / 2;
      winXs.forEach((wx) => {
        const drawX = wx + (windowW - drawW) / 2;
        pdf.addImage(img, 'PNG', drawX, offsetY, drawW, drawH);
      });
      URL.revokeObjectURL(url);
    } else {
      throw new Error('joker.png not found');
    }
  } catch {
    // Fallback: eenvoudige tekstsymbolen als de afbeelding niet laadt
    const symbols = ['🃏', '🃏', '🃏'];
    pdf.setTextColor(40, 40, 40);
    pdf.setFontSize(16);
    symbols.forEach((sym, idx) => {
      const cx = winXs[idx] + windowW / 2;
      const cy = windowY + windowH / 2 + 5;
      pdf.text(sym, cx, cy, { align: 'center' });
    });
  }
  
  // Student naam
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Uitgereikt aan:', 105, 110, { align: 'center' });
  pdf.setFontSize(24);
  pdf.setTextColor(102, 126, 234);
  pdf.text(data.studentName, 105, 125, { align: 'center' });
  
  // Datum
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Datum: ${formatDatum(data.datum)}`, 105, 150, { align: 'center' });
  
  // Statistieken
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  const stats = [
    `Totaal opdrachten: ${data.leerData.statistieken.totaalOpdrachten}`,
    `Gemiddelde score: ${data.leerData.statistieken.gemiddeldeScore.toFixed(1)}/5`,
    `Totaal speeltijd: ${Math.round(data.leerData.statistieken.totaalSpeeltijd)} minuten`,
    `Consistentie score: ${data.leerData.statistieken.consistentieScore}%`
  ];
  
  let yPos = 180;
  stats.forEach(stat => {
    pdf.text(stat, 105, yPos, { align: 'center' });
    yPos += 8;
  });
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`${appConfig.department}`, 105, 260, { align: 'center' });
  pdf.text(`${appConfig.institution}`, 105, 265, { align: 'center' });
  
  // Voeg HAN logo toe (linksonder)
  try {
    // Probeer eerst PNG versie
    let logoResponse = await fetch('/images/Logo-HAN.png');
    if (!logoResponse.ok) {
      // Als PNG niet beschikbaar is, probeer WEBP (maar dit kan problemen geven)
      logoResponse = await fetch('/images/Logo-HAN.webp');
    }
    
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoUrl = URL.createObjectURL(logoBlob);
      const format = logoResponse.url.includes('.png') ? 'PNG' : 'WEBP';
      pdf.addImage(logoUrl, format, 15, 250, 40, 20);
      URL.revokeObjectURL(logoUrl);
    }
      } catch (error) {
      // Logo niet geladen, doorgaan zonder logo
    }
};

// Helper: voeg leeranalyse-tabbladen als bijlagen toe
const appendLeeranalyseBijlagen = async (pdf: jsPDF) => {
  // Maak een verborgen container waar we de leeranalyse in renderen
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '1200px'; // brede layout om horizontale shrink te voorkomen
  host.style.zIndex = '-1';
  document.body.appendChild(host);

  // Dynamisch importeren om afhankelijkheden pas in runtime te laden
  const { createRoot } = await import('react-dom/client');
  const React = await import('react');
  const { Leeranalyse } = await import('../components/Leeranalyse');
  const { getLeerDataManager } = await import('../data/leerDataManager');
  // Schakel Chart.js animaties tijdelijk uit voor een snelle, stabiele render
  try {
    const ChartModule: any = await import('chart.js');
    if (ChartModule?.Chart?.defaults?.animation !== undefined) {
      ChartModule.Chart.defaults.animation = false;
    }
  } catch {}

  const leerDataManager = getLeerDataManager();
  const hasData = !!leerDataManager.loadLeerData();
  if (!hasData) {
    document.body.removeChild(host);
    return; // Geen leerdata, sla bijlagen over
  }

  const tabs: Array<{ key: any; title: string }> = [
    { key: 'overzicht', title: 'Bijlage – Overzicht' },
    { key: 'categorieen', title: 'Bijlage – Categorieën' },
    { key: 'achievements', title: 'Bijlage – Achievements' },
    { key: 'leitner', title: 'Bijlage – Leitner' },
    { key: 'tijdlijn', title: 'Bijlage – Tijdlijn' },
  ];

  const root = createRoot(host);

  // Render per tab, capture, pagineer en voeg toe
  for (const tab of tabs) {
    root.render(React.createElement(Leeranalyse as any, { isOpen: true, onClose: () => {}, forceActiveTab: tab.key, captureMode: true }));
    // Wacht op render (charts/fonts). Iets langer om canvas-tekenen te garanderen.
    await new Promise(r => requestAnimationFrame(() => r(null)));
    await new Promise(r => setTimeout(r, 600));

    // Zoek de content-container
    const modal = host.querySelector('.leeranalyse-modal') as HTMLElement | null;
    const content = modal?.querySelector('.leeranalyse-content') as HTMLElement | null;
    if (!content) continue;

    // Titelpagina + beginpositie voor secties
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(tab.title, 20, 20);
    let cursorYmm = 28; // volgende regel na titel

    // Logische sectie-selectie per tab. Valt terug op volledige content.
    const sectionSelectorsByTab: Record<string, string[]> = {
      overzicht: [
        '.leeranalyse-info-box',
        // capture per card om nette pagina-breaks te krijgen
        '.spelmodus-grid .spelmodus-card',
        '.statistieken-grid .statistiek-card',
        '.prestatie-highlights',
        '.voortgang-sectie',
      ],
      categorieen: [
        '.categorie-vergelijking',
        // elke hoofd-categorie kaart afzonderlijk (atomair)
        '.categorieen-lijst .categorie-card.hoofd-categorie',
        // het grid met subcategorieën kan groot zijn; apart blok
        '.categorieen-lijst .subcategorieen-grid',
      ],
      achievements: [
        '.achievement-charts-container',
        // elke achievement-card apart
        '.achievements-columns .achievement-card',
      ],
      leitner: [
        // capture het hele tegelblok in één keer om duplicatie te voorkomen
        '.leitner-box-overzicht',
        // capture de grafieksectie apart
        '.chart-sectie',
      ],
      tijdlijn: [
        '.tijdlijn-sectie',
      ],
    };

    const selectors = sectionSelectorsByTab[tab.key] || [];
    let sections: HTMLElement[] = [];
    if (selectors.length > 0) {
      selectors.forEach(sel => {
        content.querySelectorAll(sel).forEach(el => sections.push(el as HTMLElement));
      });
    } else {
      // Geen selector gedefinieerd voor tab: capture fallback (hele content)
      sections = [content];
    }

    // Opt-in: ontwikkelaar kan nieuwe blokken markeren als export-sectie
    content.querySelectorAll('[data-export-block]').forEach(el => sections.push(el as HTMLElement));
    // De-dupliceer secties
    sections = Array.from(new Set(sections));

    // Fallback: als we geen secties vinden, capteren we de hele content in stukken
    if (sections.length === 0) {
      sections = [content];
    }

    // PDF-parameters
    const leftMm = 15;
    const rightMm = 15;
    const topMm = 20;
    const bottomMm = 20;
    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const maxWidthMm = pageWidthMm - leftMm - rightMm; // 180mm

    // Selectors die we als "atomair" beschouwen: nooit doorsnijden; desnoods naar nieuwe pagina of schalen
    const atomicSelectorsByTab: Record<string, string[]> = {
      overzicht: ['.spelmodus-card', '.statistiek-card'],
      categorieen: ['.categorie-card.hoofd-categorie'],
      achievements: ['.achievement-card'],
      leitner: ['.box-card'],
      // Maak elke tijdlijn-sectie atomair zodat grafieken nooit halverwege worden gesneden
      tijdlijn: ['.tijdlijn-sectie'],
    };

    const isAtomicElement = (el: HTMLElement): boolean => {
      // Altijd atomair als expliciet gemarkeerd of grafiek bevat
      if (el.matches('[data-export-block]')) return true;
      if (el.querySelector('canvas')) return true;
      const list = atomicSelectorsByTab[tab.key] || [];
      return list.some(sel => el.matches(sel));
    };

    // Functie om een afbeelding toe te voegen met automatische paginering
    const addImageAuto = (sourceCanvas: HTMLCanvasElement, atomic: boolean) => {
      const imgWidthPx = sourceCanvas.width;
      const imgHeightPx = sourceCanvas.height;
      // Bepaal relatieve breedte tov content om overschalen te voorkomen (heeft effect bij kaarten)
      const containerWidthPx = content.scrollWidth || imgWidthPx;
      const relativeWidth = Math.max(0.35, Math.min(1, imgWidthPx / Math.max(1, containerWidthPx)));
      const targetWidthMm = Math.min(maxWidthMm, maxWidthMm * relativeWidth);
      const mmPerPx = targetWidthMm / imgWidthPx;
      const imgHeightMm = imgHeightPx * mmPerPx;
      const remainingMm = pageHeightMm - bottomMm - cursorYmm;
      if (imgHeightMm <= remainingMm) {
        // Converteer direct het bron-canvas naar JPEG (synchronisch)
        const jpegData = sourceCanvas.toDataURL('image/jpeg', 0.72);
        pdf.addImage(jpegData, 'JPEG', leftMm, cursorYmm, targetWidthMm, imgHeightMm);
        cursorYmm += imgHeightMm + 6; // kleine marge tussen secties
      } else {
        // Als atomair: plaats op nieuwe pagina. Past het niet op een volledige pagina? schaal het.
        if (atomic) {
          const maxPageHeightMm = pageHeightMm - topMm - bottomMm;
          const scale = Math.min(1, maxPageHeightMm / imgHeightMm);
          const targetHeightMm = imgHeightMm * scale;
          const scaledWidthMm = targetWidthMm * scale;
          // naar nieuwe pagina als geen ruimte
          pdf.addPage();
          cursorYmm = topMm;
          const jpegData = sourceCanvas.toDataURL('image/jpeg', 0.72);
          pdf.addImage(jpegData, 'JPEG', leftMm, cursorYmm, scaledWidthMm, targetHeightMm);
          cursorYmm += targetHeightMm + 6;
          return;
        }

        // Niet-atomair: Splits verticaal in meerdere pagina's, rekening houdend met resterende ruimte
        let y = 0;
        while (y < imgHeightPx) {
          const allowedMm = pageHeightMm - bottomMm - cursorYmm;
          const allowedPx = Math.floor(allowedMm / mmPerPx);
          const fullPagePx = Math.floor((pageHeightMm - topMm - bottomMm) / mmPerPx);
          const sliceHeightPx = Math.min((allowedPx > 0 ? allowedPx : fullPagePx), imgHeightPx - y);
          const slice = document.createElement('canvas');
          slice.width = imgWidthPx;
          slice.height = sliceHeightPx;
          const sctx = slice.getContext('2d')!;
          // Trek de juiste strook rechtstreeks uit het bron-canvas (synchroon)
          sctx.drawImage(sourceCanvas, 0, y, imgWidthPx, sliceHeightPx, 0, 0, imgWidthPx, sliceHeightPx);
          const part = slice.toDataURL('image/jpeg', 0.72);

          if (allowedMm <= 0) { // geen ruimte meer op deze pagina
            pdf.addPage();
            cursorYmm = topMm;
          }
          pdf.addImage(part, 'JPEG', leftMm, cursorYmm, targetWidthMm, sliceHeightPx * mmPerPx);
          cursorYmm += sliceHeightPx * mmPerPx + 6;
          y += sliceHeightPx;
          if (y < imgHeightPx) {
            pdf.addPage();
            cursorYmm = topMm;
          }
        }
      }
    };

    // Render elke sectie afzonderlijk en voeg toe aan PDF met nette pagina-breaks
    for (const section of sections) {
      // Zorg dat sectie zichtbaar is (sommige elementen hebben lazy content)
      section.scrollIntoView({ block: 'nearest' });
      await new Promise(r => requestAnimationFrame(() => r(null)));
      const canvas = await html2canvas(section, {
        useCORS: true,
        backgroundColor: '#ffffff',
        // Verlaag de schaal om resolutie/gewicht te beperken, maar blijf leesbaar
        scale: 1.5,
        logging: false,
        windowWidth: Math.max(section.scrollWidth, content.scrollWidth),
        windowHeight: section.scrollHeight,
      });
      // Tijdlijn-secties altijd atomair behandelen
      const forceAtomic = tab.key === 'tijdlijn' ? true : isAtomicElement(section);
      addImageAuto(canvas, forceAtomic);
    }
  }

  // Opruimen
  root.unmount();
  document.body.removeChild(host);
};


const formatDatum = (datumString: string): string => {
  const datum = new Date(datumString);
  return datum.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 