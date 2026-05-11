'use server'

import { getDocuments as getDocsFromService } from '@/lib/pdf-service';
import { Document } from '@/lib/documents';

export async function getDocumentsAction(): Promise<Document[]> {
  try {
    console.log('[getDocumentsAction] cwd:', process.cwd());
    const docs = await getDocsFromService();
    console.log('[getDocumentsAction] docs found:', docs.length);
    return docs;
  } catch (error) {
    console.error('getDocumentsAction failed:', error);
    return [];
  }
}
