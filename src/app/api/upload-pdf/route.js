import { NextResponse } from 'next/server';

// Make sure to export both POST and GET methods
export async function POST(request) {
  try {
    // Check if pdf-parse is available
    let pdf;
    try {
      pdf = (await import('pdf-parse')).default;
    } catch (importError) {
      console.error('Failed to import pdf-parse:', importError);
      return NextResponse.json({ 
        error: 'PDF processing not available on this server',
        details: importError.message 
      }, { status: 500 });
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile');
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF file uploaded' }, { status: 400 });
    }

    // Check file type
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (pdfFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
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

// Add a GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'PDF upload endpoint is working. Send a POST request with a PDF file to process it.',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}

// Explicitly set the runtime (important for Vercel)
export const runtime = 'nodejs';