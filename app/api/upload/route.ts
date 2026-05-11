import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { getDocuments } from '@/lib/pdf-service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const docsDir = path.join(process.cwd(), 'documents-store');

    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const filePath = path.join(docsDir, file.name);
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ 
      message: "File uploaded successfully",
      filename: file.name
    });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
