import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { Document } from './documents';

/**
 * PDF SERVICE
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans the /public/docs directory for PDF files, extracts their metadata 
 * and text contents using pdf-parse, and returns a list of Document objects.
 */
export async function getDocuments(): Promise<Document[]> {
  // Use documents-store at the root (works reliably on Vercel)
  const docsDir = path.join(process.cwd(), 'documents-store');
  
  console.log('[pdf-service] docsDir resolved to:', docsDir);
  
  if (!fs.existsSync(docsDir)) {
    console.warn('[pdf-service] documents-store folder does not exist at root');
    return [];
  }

  const files = fs.readdirSync(docsDir).filter(file => file.toLowerCase().endsWith('.pdf'));
  console.log('[pdf-service] files found:', files);
  
  const documents: Document[] = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(docsDir, file);
      
      try {
        const dataBuffer = fs.readFileSync(filePath);
        // Custom pagerender to add markers
        const options = {
          pagerender: (pageData: any) => {
            return pageData.getTextContent()
              .then((textContent: any) => {
                let lastY, text = '';
                for (let item of textContent.items) {
                  if (lastY === item.transform[5] || !lastY) {
                    text += item.str;
                  } else {
                    text += '\n' + item.str;
                  }
                  lastY = item.transform[5];
                }
                return `--- PAGE ${pageData.pageIndex + 1} ---\n${text}\n`;
              });
          }
        };

        console.log(`[pdf-service] Starting parse for: ${file}`);
        const data = await pdf(dataBuffer, options);
        console.log(`[pdf-service] Parse complete for: ${file}, pages: ${data.numpages}`);
        
        // Simple heuristic for title and category
        const title = file.replace(/\.pdf$/i, '').split(/[-_]/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        // Default category based on filename keywords or just "Advisory"
        let category: Document['category'] = 'Advisory';
        if (file.toLowerCase().includes('ipo')) category = 'IPO';
        else if (file.toLowerCase().includes('tax')) category = 'Tax';
        else if (file.toLowerCase().includes('legal')) category = 'Legal';

        return {
          id: file.replace(/\.pdf$/i, '').toLowerCase(),
          title: title,
          subtitle: `Automated analysis of ${file}`,
          category: category,
          dateAdded: new Date().toISOString().split('T')[0],
          pageCount: data.numpages,
          pdfPath: `/api/view-pdf?file=${encodeURIComponent(file)}`,
          extractedText: data.text,
        };
      } catch (error) {
        console.error(`[pdf-service] Error processing file ${file}:`, error);
        return {
          id: file.replace(/\.pdf$/i, '').toLowerCase(),
          title: file,
          subtitle: "Metadata only (Processing failed)",
          category: "Advisory",
          dateAdded: new Date().toISOString().split('T')[0],
          pageCount: 0,
          pdfPath: `/api/view-pdf?file=${encodeURIComponent(file)}`,
          extractedText: "",
        };
      }
    })
  );

  console.log('[pdf-service] returning documents count:', documents.length);
  return documents;
}
