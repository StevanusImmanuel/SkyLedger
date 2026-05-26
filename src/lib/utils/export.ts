// Export utilities for CSV and PDF generation

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: any[], filename: string, title: string) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create HTML content for PDF
  const headers = Object.keys(data[0]);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #1a2d5a;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .meta {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #1a2d5a;
          color: white;
          padding: 10px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          color: #475569;
        }
        tr:hover {
          background-color: #f8fafc;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated on ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open print dialog with the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } else {
    alert('Please allow pop-ups to export PDF');
  }
}
