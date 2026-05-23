/**
 * GHE UVCI - Université Virtuelle de Côte d'Ivoire
 * PDF / Print List Export Helper
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PDFExportConfig {
  title: string;
  headers: string[];
  rows: string[][];
  metadata?: Record<string, string>;
}

export function exportListToPDF({ title, headers, rows, metadata = {} }: PDFExportConfig) {
  // Opening a new tab with print stylesheet to let browser handle PDF generation
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les popups pour pouvoir télécharger le PDF.");
    return;
  }

  const currentDateStr = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  
  // Format metadata block
  const metaHTML = Object.entries(metadata)
    .map(([key, val]) => `<p><strong>${key} :</strong> ${val}</p>`)
    .join("");

  // Format headers
  const headersHTML = headers.map(h => `<th>${h}</th>`).join("");

  // Format rows
  const rowsHTML = rows
    .map(
      row => `
    <tr>
      ${row.map(val => `<td>${val || "-"}</td>`).join("")}
    </tr>
  `
    )
    .join("");

  const logoUrl = "https://lh3.googleusercontent.com/d/1fVHD32zx_GEBKBP7kJN8vM6tu227kvMF";

  const content = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 40px;
          line-height: 1.5;
        }
        
        /* Official Header UVCI */
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #4f46e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .logo-box {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo-box img {
          height: 70px;
          object-fit: contain;
        }
        
        .title-box {
          text-align: right;
        }
        
        .title-box h1 {
          font-size: 18px;
          color: #4f46e5;
          margin: 0 0 5px 0;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        
        .title-box p {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          text-transform: uppercase;
          font-weight: 600;
        }
        
        /* Main Document Title */
        .doc-title {
          font-size: 22px;
          color: #1e1b4b;
          text-align: center;
          margin: 30px 0 20px 0;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        /* Metadata block */
        .metadata-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 30px;
          font-size: 13px;
        }
        
        .metadata-grid p {
          margin: 4px 0;
        }
        
        /* Beautiful Report Table */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
          font-size: 11px;
        }
        
        th {
          background-color: #4f46e5;
          color: white;
          text-align: left;
          padding: 12px 10px;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        
        td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          color: #334155;
        }
        
        /* Official Stamp / Footer Area */
        .footer-stamp {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .stamp-box {
          border-top: 1px dashed #cbd5e1;
          padding-top: 10px;
          width: 200px;
          text-align: center;
          color: #64748b;
        }

        .copyright-footer {
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          margin-top: 80px;
          position: relative;
        }
        
        @media print {
          body {
            padding: 20px 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <!-- Dynamic header -->
      <div class="header-container">
        <div class="logo-box">
          <img src="${logoUrl}" alt="UVCI Logo">
        </div>
        <div class="title-box">
          <h1>UNIVERSITÉ VIRTUELLE DE CÔTE D'IVOIRE</h1>
          <p>Gestion des Heures d'Enseignement (GHE)</p>
          <p style="color: #10b981; font-weight: bold; margin-top: 2px;">Plateforme Officielle</p>
        </div>
      </div>

      <!-- Main Title -->
      <div class="doc-title">${title}</div>

      <!-- Info details -->
      <div class="metadata-grid">
        <div>
          ${metaHTML}
        </div>
        <div style="text-align: right;">
          <p><strong>Généré le :</strong> ${currentDateStr}</p>
          <p><strong>Statut du rapport :</strong> Document Officiel</p>
        </div>
      </div>

      <!-- Tables -->
      <table>
        <thead>
          <tr>
            ${headersHTML}
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <!-- Stamp and signatures -->
      <div class="footer-stamp">
        <div class="stamp-box">
          <p>Visa Agent UVCI</p>
          <div style="height: 60px;"></div>
        </div>
        <div class="stamp-box">
          <p>Signature Direction académique</p>
          <div style="height: 60px;"></div>
        </div>
      </div>

      <!-- Bottom footer page -->
      <div class="copyright-footer">
        Université Virtuelle de Côte d'Ivoire (UVCI) • Ministère de l'Enseignement Supérieur et de la Recherche Scientifique
        <br>
        22 BP 1563 Abidjan 22 • Cocody Deux-Plateaux • Tél: +225 27 20 20 06 00 • www.uvci.edu.ci
      </div>

      <script>
        // Start printing automatically on load
        window.addEventListener('load', () => {
          window.print();
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
}
