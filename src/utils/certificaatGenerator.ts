import jsPDF from 'jspdf';
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
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Voorblad
  await generateVoorblad(pdf, data, appConfig);
  
  // Voeg nieuwe pagina toe voor overzicht
  pdf.addPage();
  generateOverzichtPagina(pdf, data, appConfig);
  
  // Voeg nieuwe pagina toe voor categorie analyse
  pdf.addPage();
  generateCategoriePagina(pdf, data, appConfig);
  
  // Voeg nieuwe pagina toe voor achievements
  pdf.addPage();
  generateAchievementsPagina(pdf, data, appConfig);

  // Download het PDF bestand
  const filename = `certificaat_${data.studentName.replace(/\s+/g, '_')}_${data.datum}.pdf`;
  pdf.save(filename);
};

const generateVoorblad = async (pdf: jsPDF, data: CertificaatData, appConfig: any) => {
  // Return2Performance Header
  pdf.setFontSize(32);
  pdf.setTextColor(99, 179, 237); // Neon-blauw zoals in de app
  pdf.text(appConfig.title, 105, 40, { align: 'center' });
  
  // Subtitle
  pdf.setFontSize(14);
  pdf.setTextColor(118, 75, 162); // HAN paars
  pdf.text('Fruitautomaat Leeranalyse Certificaat', 105, 50, { align: 'center' });
  
  // Titel
  pdf.setFontSize(28);
  pdf.setTextColor(102, 126, 234); // HAN blauw
  pdf.text(appConfig.title, 105, 70, { align: 'center' });
  
  // Subtitel
  pdf.setFontSize(16);
  pdf.setTextColor(118, 75, 162); // HAN paars
  pdf.text(appConfig.subtitle || 'Leeranalyse Certificaat', 105, 85, { align: 'center' });
  
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

const generateOverzichtPagina = (pdf: jsPDF, data: CertificaatData, _appConfig: any) => {
  // Pagina titel
  pdf.setFontSize(20);
  pdf.setTextColor(102, 126, 234);
  pdf.text('Leerprestaties Overzicht', 20, 30);
  
  // Statistieken tabel
  const stats = [
    ['Totaal Opdrachten', data.leerData.statistieken.totaalOpdrachten.toString()],
    ['Totaal Sessies', data.leerData.statistieken.totaalSessies.toString()],
    ['Totaal Speeltijd', `${Math.round(data.leerData.statistieken.totaalSpeeltijd)} minuten`],
    ['Gemiddelde Sessie Duur', `${Math.round(data.leerData.statistieken.gemiddeldeSessieDuur)} minuten`],
    ['Gemiddelde Score', `${data.leerData.statistieken.gemiddeldeScore.toFixed(1)}/5`],
    ['Hoogste Score', `${data.leerData.statistieken.hoogsteScore}/5`],
    ['Laagste Score', `${data.leerData.statistieken.laagsteScore}/5`],
    ['Consistentie Score', `${data.leerData.statistieken.consistentieScore}%`],
    ['Favoriete Categorie', data.leerData.statistieken.favorieteCategorie || 'N/A'],
    ['Zwakste Categorie', data.leerData.statistieken.zwaksteCategorie || 'N/A']
  ];
  
  let yPos = 50;
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  stats.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, 120, yPos);
    yPos += 10;
  });
  
  // Laatste activiteit
  yPos += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Laatste Activiteit:', 20, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(formatDatum(data.leerData.statistieken.laatsteActiviteit), 120, yPos);
};

const generateCategoriePagina = (pdf: jsPDF, data: CertificaatData, _appConfig: any) => {
  // Pagina titel
  pdf.setFontSize(20);
  pdf.setTextColor(102, 126, 234);
  pdf.text('Categorie Analyse', 20, 30);
  
  const categorieen = Object.values(data.leerData.statistieken.categorieStatistieken);
  
  if (categorieen.length === 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Nog geen categorie data beschikbaar.', 20, 60);
    return;
  }
  
  let yPos = 50;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  categorieen.forEach((categorie) => {
    if (yPos > 250) {
      pdf.addPage();
      yPos = 30;
    }
    
    // Categorie naam
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(102, 126, 234);
    pdf.text(categorie.categorie, 20, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Categorie statistieken
    const catStats = [
      `Aantal opdrachten: ${categorie.aantalOpdrachten}`,
      `Gemiddelde score: ${categorie.gemiddeldeScore.toFixed(1)}/5`,
      `Sterkste punt: ${categorie.sterkstePunt}`,
      `Verbeterpunt: ${categorie.verbeterpunt}`,
      `Laatste activiteit: ${formatDatum(categorie.laatsteActiviteit)}`
    ];
    
    catStats.forEach(stat => {
      pdf.text(stat, 25, yPos);
      yPos += 6;
    });
    
    yPos += 10;
  });
};

const generateAchievementsPagina = (pdf: jsPDF, data: CertificaatData, _appConfig: any) => {
  // Pagina titel
  pdf.setFontSize(20);
  pdf.setTextColor(102, 126, 234);
  pdf.text('Behaalde Achievements', 20, 30);
  
  if (data.achievements.length === 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Nog geen achievements behaald.', 20, 60);
    return;
  }
  
  let yPos = 50;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  
  data.achievements.forEach((achievement) => {
    if (yPos > 250) {
      pdf.addPage();
      yPos = 30;
    }
    
    // Achievement icon en naam
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(102, 126, 234);
    pdf.text(`${achievement.icon} ${achievement.naam}`, 20, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Achievement details
    pdf.text(`Beschrijving: ${achievement.beschrijving}`, 25, yPos);
    yPos += 6;
    pdf.text(`Categorie: ${achievement.categorie}`, 25, yPos);
    yPos += 6;
    pdf.text(`Behaald op: ${formatDatum(achievement.behaaldOp)}`, 25, yPos);
    
    yPos += 15;
  });
};

const formatDatum = (datumString: string): string => {
  const datum = new Date(datumString);
  return datum.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 