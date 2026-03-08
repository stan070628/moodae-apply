import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// This path is relative to the dig-web directory when running next dev
// We want to point to ../data/api_keys.json
const KEYS_FILE = path.join(process.cwd(), '..', 'data', 'api_keys.json');

export async function GET() {
  try {
    const data = await fs.readFile(KEYS_FILE, 'utf-8');
    return NextResponse.json({ keys: JSON.parse(data) });
  } catch (error) {
    console.error("Failed to read keys:", error);
    return NextResponse.json({ keys: {} });
  }
}

export async function POST(request) {
  try {
    const newKeys = await request.json();
    
    let existingKeys = {};
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf-8');
      existingKeys = JSON.parse(data);
    } catch (e) {
      // File doesn't exist yet, it's ok
    }

    const mergedKeys = { ...existingKeys, ...newKeys };
    
    // Ensure directory exists
    const dirname = path.dirname(KEYS_FILE);
    try {
      await fs.mkdir(dirname, { recursive: true });
    } catch(e) {}

    await fs.writeFile(KEYS_FILE, JSON.stringify(mergedKeys, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write keys:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
