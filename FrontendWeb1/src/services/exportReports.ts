import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface DashboardData {
  dateRange: string;
  totalViews: number;
  totalMale: number;
  totalFemale: number;
  avgScreenTime: number;
  ageData: Array<{ age: string; probability: number; count: number }>;
  genderData: Array<{ name: string; value: number; color: string }>;
  screenTimeData: Array<{ range: string; pct: number }>;
  hourlyData: Array<{ hour: string; views: number }>;
  radarData: Array<{ metric: string; A: number }>;
  dailyData: Array<{
    date: string;
    views: number;
    male: number;
    female: number;
    screenTime: number;
  }>;
  startDate?: string;
  endDate?: string;
}

// Générer rapport personnalisé en HTML
export function generateReportHTML(data: DashboardData): string {
  const reportDate = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #F59E0B; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #1f2937; margin: 0; font-size: 28px; }
        .header p { color: #6b7280; margin: 5px 0 0 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { 
          background: linear-gradient(135deg, #f9fafb, #ffffff);
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .stat-icon { font-size: 32px; margin-bottom: 10px; }
        .stat-value { font-size: 28px; font-weight: 800; color: #1f2937; margin: 10px 0; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .section { margin-bottom: 30px; break-inside: avoid; }
        .section-title { 
          font-size: 18px; 
          font-weight: 700; 
          color: #1f2937; 
          border-left: 4px solid #F59E0B; 
          padding-left: 15px; 
          margin-bottom: 15px; 
        }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { 
          background: #f3f4f6; 
          color: #1f2937; 
          padding: 12px; 
          text-align: left; 
          font-weight: 600; 
          border-bottom: 2px solid #e5e7eb;
        }
        td { 
          padding: 12px; 
          border-bottom: 1px solid #e5e7eb; 
        }
        tr:nth-child(even) { background: #f9fafb; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
        .metric-item { 
          background: #f9fafb; 
          padding: 12px; 
          border-radius: 8px; 
          border-left: 3px solid #34D399;
        }
        .metric-label { font-size: 12px; color: #6b7280; }
        .metric-value { font-size: 20px; font-weight: 700; color: #1f2937; margin-top: 5px; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #e5e7eb; 
          text-align: center; 
          color: #9ca3af; 
          font-size: 12px; 
        }
        .chart-placeholder { 
          background: #f3f4f6; 
          padding: 20px; 
          border-radius: 8px; 
          text-align: center; 
          color: #6b7280;
        }
        .badge { 
          display: inline-block; 
          background: #fef3c7; 
          color: #F59E0B; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px; 
          font-weight: 600;
        }
        @media print { 
          .page-break { page-break-after: always; } 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Rapport Opérateur Dashboard</h1>
          <p>Généré le ${reportDate}</p>
          <p style="font-size: 14px; margin-top: 10px;">Période: ${data.dateRange}</p>
        </div>

        <!-- Statistiques Principales -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-label">Vues Totales</div>
            <div class="stat-value">${data.totalViews.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👨</div>
            <div class="stat-label">Spectateurs H</div>
            <div class="stat-value" style="color: #60A5FA;">${data.totalMale.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👩</div>
            <div class="stat-label">Spectatrices F</div>
            <div class="stat-value" style="color: #F472B6;">${data.totalFemale.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-label">Temps Moy. (sec)</div>
            <div class="stat-value" style="color: #34D399;">${data.avgScreenTime}</div>
          </div>
        </div>

        <!-- Analyse Genre -->
        <div class="section">
          <div class="section-title">👥 Répartition Genre</div>
          <div class="metrics-grid">
            ${data.genderData
              .map(
                (g) =>
                  `<div class="metric-item" style="border-left-color: ${g.color};">
              <div class="metric-label">${g.name}</div>
              <div class="metric-value" style="color: ${g.color};">${g.value}%</div>
            </div>`
              )
              .join('')}
          </div>
        </div>

        <!-- Analyse d'Âge -->
        <div class="section">
          <div class="section-title">📊 Distribution par Âge</div>
          <table>
            <thead>
              <tr>
                <th>Tranche d'Âge</th>
                <th>Probabilité (%)</th>
                <th>Nombre de Spectateurs</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${data.ageData
                .map(
                  (a) =>
                    `<tr>
                <td>${a.age}</td>
                <td><strong>${a.probability}%</strong></td>
                <td>${a.count.toLocaleString()}</td>
                <td><span class="badge">${a.probability > 25 ? '✓ Élevé' : '◐ Modéré'}</span></td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Temps d'Écran -->
        <div class="section">
          <div class="section-title">⏱️ Distribution Temps d'Écran</div>
          <div class="metrics-grid">
            ${data.screenTimeData
              .map(
                (s) =>
                  `<div class="metric-item" style="border-left-color: #34D399;">
              <div class="metric-label">${s.range}</div>
              <div class="metric-value">${s.pct}%</div>
              <div style="margin-top: 8px; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; width: ${s.pct * 2.8}%; background: linear-gradient(90deg, #34D399, #059669);"></div>
              </div>
            </div>`
              )
              .join('')}
          </div>
        </div>

        <!-- Performance -->
        <div class="section">
          <div class="section-title">🎯 Métriques de Performance</div>
          <table>
            <thead>
              <tr>
                <th>Métrique</th>
                <th>Score</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${data.radarData
                .map(
                  (r) =>
                    `<tr>
                <td>${r.metric}</td>
                <td><strong>${r.A}/100</strong></td>
                <td>
                  <span class="badge" style="background: ${r.A > 70 ? '#dcfce7' : r.A > 50 ? '#fef3c7' : '#fee2e2'}; color: ${r.A > 70 ? '#059669' : r.A > 50 ? '#F59E0B' : '#dc2626'};">
                    ${r.A > 70 ? '✓ Excellent' : r.A > 50 ? '◐ Bon' : '✗ À améliorer'}
                  </span>
                </td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Résumé Horaire -->
        <div class="section">
          <div class="section-title">🕐 Heures Pics d'Audience</div>
          <table>
            <thead>
              <tr>
                <th>Heure</th>
                <th>Nombre de Vues</th>
                <th>Intensité</th>
              </tr>
            </thead>
            <tbody>
              ${data.hourlyData
                .filter((_, i) => i % 3 === 0)
                .map(
                  (h) =>
                    `<tr>
                <td>${h.hour}</td>
                <td><strong>${h.views.toLocaleString()}</strong></td>
                <td>
                  <div style="height: 20px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${(h.views / 3200) * 100}%; background: linear-gradient(90deg, #60A5FA, #3b82f6);"></div>
                  </div>
                </td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Ce rapport a été généré automatiquement. Les données sont à jour au moment de la génération.</p>
          <p>Pour plus d'informations, consultez le dashboard en ligne.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Exporter en PDF
export async function exportToPDF(data: DashboardData, filename: string = 'rapport-dashboard.pdf') {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    // En-tête
    doc.setFontSize(20);
    doc.setTextColor(31, 41, 55);
    doc.text('📊 Rapport Opérateur Dashboard', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')} - Période: ${data.dateRange}`,
      pageWidth / 2,
      yPos,
      { align: 'center' }
    );

    yPos += 12;
    doc.setDrawColor(245, 158, 11);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 5;

    // Statistiques Principales
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('STATISTIQUES PRINCIPALES', 15, yPos);
    yPos += 8;

    const stats = [
      ['👁️ Vues Totales', data.totalViews.toLocaleString()],
      ['👨 Spectateurs H', data.totalMale.toLocaleString()],
      ['👩 Spectatrices F', data.totalFemale.toLocaleString()],
      ['⏱️ Temps Moy. (sec)', data.avgScreenTime.toString()],
    ];

    doc.setFontSize(9);
    stats.forEach((stat, idx) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 15;
      }
      doc.setTextColor(31, 41, 55);
      doc.text(stat[0], 15, yPos);
      doc.setTextColor(59, 130, 246);
      doc.text(stat[1], pageWidth - 15, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 5;
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 15;
    }

    // Répartition Genre
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('RÉPARTITION GENRE', 15, yPos);
    yPos += 8;

    doc.setFontSize(9);
    data.genderData.forEach((g) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 15;
      }
      doc.setTextColor(31, 41, 55);
      doc.text(`${g.name}`, 15, yPos);
      doc.setTextColor(59, 130, 246);
      doc.text(`${g.value}%`, pageWidth - 15, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 5;
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 15;
    }

    // Distribution par âge (top 5)
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('DISTRIBUTION PAR ÂGE', 15, yPos);
    yPos += 8;

    doc.setFontSize(9);
    data.ageData.slice(0, 5).forEach((a) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 15;
      }
      doc.setTextColor(31, 41, 55);
      doc.text(`${a.age}`, 15, yPos);
      doc.setTextColor(59, 130, 246);
      doc.text(`Proba: ${a.probability}% | Spectateurs: ${a.count}`, pageWidth - 15, yPos, { align: 'right' });
      yPos += 6;
    });

    // Sauvegarder le PDF
    doc.save(filename);
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    // Fallback: télécharger comme HTML
    const html = generateReportHTML(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename.replace('.pdf', '.html');
    link.click();
  }
}

// Exporter en Excel
export function exportToExcel(data: DashboardData, filename: string = 'rapport-dashboard.xlsx') {
  try {
    const wb = XLSX.utils.book_new();

    // Feuille 1: Statistiques Principales
    const statsData = [
      ['STATISTIQUES PRINCIPALES', ''],
      [],
      ['Métrique', 'Valeur'],
      ['Vues Totales', data.totalViews],
      ['Spectateurs Hommes', data.totalMale],
      ['Spectatrices Femmes', data.totalFemale],
      ['Temps Moyen (sec)', data.avgScreenTime],
      ['Période', data.dateRange],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(statsData);
    ws1['!cols'] = [{ wch: 30 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Résumé');

    // Feuille 2: Analyse Genre
    const genderRows = [
      ['RÉPARTITION GENRE', ''],
      [],
      ['Genre', 'Pourcentage (%)'],
      ...data.genderData.map((g) => [g.name, g.value]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(genderRows);
    ws2['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Genre');

    // Feuille 3: Analyse par Âge
    const ageRows = [
      ['DISTRIBUTION PAR ÂGE', '', ''],
      [],
      ['Tranche d\'Âge', 'Probabilité (%)', 'Nombre de Spectateurs'],
      ...data.ageData.map((a) => [a.age, a.probability, a.count]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(ageRows);
    ws3['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Âge');

    // Feuille 4: Temps d'Écran
    const screenTimeRows = [
      ['DISTRIBUTION TEMPS D\'ÉCRAN', ''],
      [],
      ['Plage Horaire', 'Pourcentage (%)'],
      ...data.screenTimeData.map((s) => [s.range, s.pct]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(screenTimeRows);
    ws4['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Temps Écran');

    // Feuille 5: Performance
    const radarRows = [
      ['MÉTRIQUES DE PERFORMANCE', ''],
      [],
      ['Métrique', 'Score /100'],
      ...data.radarData.map((r) => [r.metric, r.A]),
    ];
    const ws5 = XLSX.utils.aoa_to_sheet(radarRows);
    ws5['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Performance');

    // Feuille 6: Données Horaires (top 10)
    const hourlyRows = [
      ['HEURES PICS D\'AUDIENCE', ''],
      [],
      ['Heure', 'Nombre de Vues'],
      ...data.hourlyData
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map((h) => [h.hour, h.views]),
    ];
    const ws6 = XLSX.utils.aoa_to_sheet(hourlyRows);
    ws6['!cols'] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws6, 'Heures Pics');

    // Écrire et télécharger le fichier
    if (XLSX.writeFile && typeof XLSX.writeFile === 'function') {
      XLSX.writeFile(wb, filename);
    } else {
      // Fallback: utiliser la méthode alternative
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    // Fallback: exporter en CSV
    exportToCSV(data, filename.replace('.xlsx', '.csv'));
  }
}

// Fonction auxiliaire pour convertir string en ArrayBuffer
function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
}

// Exporter en CSV
export function exportToCSV(data: DashboardData, filename: string = 'rapport-dashboard.csv') {
  try {
    let csv = 'RAPPORT DASHBOARD\n';
    csv += `Généré le: ${new Date().toLocaleString('fr-FR')}\n`;
    csv += `Période: ${data.dateRange}\n\n`;

    csv += 'STATISTIQUES PRINCIPALES\n';
    csv += `Vues Totales,${data.totalViews}\n`;
    csv += `Spectateurs Hommes,${data.totalMale}\n`;
    csv += `Spectatrices Femmes,${data.totalFemale}\n`;
    csv += `Temps Moyen (sec),${data.avgScreenTime}\n\n`;

    csv += 'RÉPARTITION GENRE\n';
    csv += 'Genre,Pourcentage\n';
    data.genderData.forEach((g) => {
      csv += `${g.name},${g.value}%\n`;
    });
    csv += '\n';

    csv += 'DISTRIBUTION PAR ÂGE\n';
    csv += 'Tranche d\'Âge,Probabilité,Nombre\n';
    data.ageData.forEach((a) => {
      csv += `${a.age},${a.probability}%,${a.count}\n`;
    });
    csv += '\n';

    csv += 'DISTRIBUTION TEMPS D\'ÉCRAN\n';
    csv += 'Plage,Pourcentage\n';
    data.screenTimeData.forEach((s) => {
      csv += `${s.range},${s.pct}%\n`;
    });
    csv += '\n';

    csv += 'MÉTRIQUES DE PERFORMANCE\n';
    csv += 'Métrique,Score\n';
    data.radarData.forEach((r) => {
      csv += `${r.metric},${r.A}/100\n`;
    });
    csv += '\n';

    csv += 'HEURES PICS D\'AUDIENCE\n';
    csv += 'Heure,Vues\n';
    data.hourlyData.forEach((h) => {
      csv += `${h.hour},${h.views}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error);
    throw error;
  }
}
