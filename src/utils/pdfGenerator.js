import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download PDF from HTML content
 * Works on all devices including mobile/tablet
 */
export const generatePDF = async (content, filename = 'export.pdf', options = {}) => {
  try {
    const {
      title = 'Export Report',
      subtitle = '',
      margin = 20,
      pageSize = 'a4',
      orientation = 'portrait'
    } = options;

    // Create a temporary container for the content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.color = 'black';
    tempContainer.innerHTML = content;

    // Add to document temporarily
    document.body.appendChild(tempContainer);

    // Generate canvas from HTML
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 800,
      height: tempContainer.scrollHeight
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: pageSize
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add image to PDF
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add new pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

/**
 * Generate PDF from table data with proper formatting
 */
export const generateTablePDF = async (data, columns, filename = 'table-export.pdf', options = {}) => {
  try {
    const {
      title = 'Table Export',
      subtitle = '',
      showRowNumbers = true
    } = options;

    // Create table HTML
    let tableHTML = `
      <div style="font-family: Arial, sans-serif; color: black;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">${title}</h1>
          ${subtitle ? `<p style="color: #666; margin: 5px 0; font-size: 14px;">${subtitle}</p>` : ''}
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Records: ${data.length}</p>
        </div>
        
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              ${showRowNumbers ? '<th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0; width: 40px;">#</th>' : ''}
              ${columns.map(col => `
                <th style="padding: 8px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">
                  ${col.label || col.key}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map((row, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;'}">
                ${showRowNumbers ? `<td style="padding: 8px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: 500;">${index + 1}</td>` : ''}
                ${columns.map(col => {
                  const value = row[col.key];
                  let displayValue = value;
                  
                  // Handle different data types
                  if (typeof value === 'boolean') {
                    displayValue = value ? 'Yes' : 'No';
                  } else if (value === null || value === undefined) {
                    displayValue = 'N/A';
                  } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                  }
                  
                  return `
                    <td style="padding: 8px; color: #111827; border-right: 1px solid #e2e8f0; max-width: 150px; word-wrap: break-word;">
                      ${displayValue}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <p>This report was generated from the Voting System Admin Panel</p>
        </div>
      </div>
    `;

    return await generatePDF(tableHTML, filename, { title, subtitle });
  } catch (error) {
    console.error('Table PDF generation error:', error);
    throw new Error('Failed to generate table PDF: ' + error.message);
  }
};

/**
 * Check if device supports automatic PDF download
 */
export const supportsAutoDownload = () => {
  // Check if device is mobile or tablet
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  // Check if browser supports download attribute
  const supportsDownload = 'download' in document.createElement('a');
  
  // For mobile/tablet, we need to use PDF generation instead of print
  return isMobile || isTablet || !supportsDownload;
};

/**
 * Generate PDF with device-specific handling
 */
export const generatePDFWithDeviceHandling = async (content, filename, options = {}) => {
  if (supportsAutoDownload()) {
    // Use PDF generation for mobile/tablet or unsupported browsers
    return await generatePDF(content, filename, options);
  } else {
    // Use print dialog for desktop browsers that support it
    return await generatePrintDialog(content, filename, options);
  }
};

/**
 * Generate print dialog for desktop browsers
 */
export const generatePrintDialog = async (content, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create print styles
      const printStyles = document.createElement('style');
      printStyles.textContent = `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `;
      document.head.appendChild(printStyles);

      // Create print content
      const printElement = document.createElement('div');
      printElement.className = 'print-content';
      printElement.innerHTML = content;
      document.body.appendChild(printElement);

      // Trigger print
      window.print();

      // Clean up
      setTimeout(() => {
        if (document.body.contains(printElement)) {
          document.body.removeChild(printElement);
        }
        if (document.head.contains(printStyles)) {
          document.head.removeChild(printStyles);
        }
        resolve(true);
      }, 1000);

    } catch (error) {
      reject(error);
    }
  });
};
