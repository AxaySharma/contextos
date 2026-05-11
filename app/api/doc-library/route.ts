import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/pdf-service';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  /*
  // Security check: Only authenticated users can list documents
  const session = await getServerSession(authOptions);
  console.log('[documents-api] session status:', !!session);
  if (!session) {
    console.log('[documents-api] unauthorized access attempt');
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  */

  try {
    const documents = await getDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('[Documents API Error]', error);
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 });
  }
}
