import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDocuments } from '@/lib/pdf-service';

export async function GET() {
  const docsDir = path.join(process.cwd(), 'public', 'docs');
  const exists = fs.existsSync(docsDir);
  const files = exists ? fs.readdirSync(docsDir) : [];
  
  let documents = [];
  try {
    documents = await getDocuments();
  } catch (e) {
    console.error('getDocuments failed in test:', e);
  }

  return NextResponse.json({
    cwd: process.cwd(),
    docsDir,
    exists,
    files,
    documentsCount: documents.length,
    documentsMetadata: documents.map(d => ({ id: d.id, title: d.title, pageCount: d.pageCount }))
  });
}
