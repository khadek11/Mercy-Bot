// src/app/api/upload-pdf/route.js
import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile');
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    // Convert the file to a buffer
    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse the PDF
    const data = await pdf(buffer);
    
    // Extract the text
    const extractedText = data.text;

    return NextResponse.json({ 
      text: extractedText,
      message: 'PDF processed successfully' 
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to process PDF',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'PDF upload endpoint is working. Send a POST request with a PDF file to process it.' 
  });
}