import fs from 'fs/promises';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'src/content/config');
const NAV_FILE = path.join(CONFIG_DIR, 'navigation.json');

// Default navigation
const DEFAULT_NAVIGATION = [
  { title: 'Home', url: '/' }
];

async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
}

async function ensureNavigationFile() {
  await ensureConfigDir();
  try {
    await fs.access(NAV_FILE);
  } catch {
    await fs.writeFile(NAV_FILE, JSON.stringify(DEFAULT_NAVIGATION, null, 2));
  }
}

export async function GET() {
  try {
    await ensureNavigationFile();
    const content = await fs.readFile(NAV_FILE, 'utf-8');
    const navigation = JSON.parse(content);
    
    return new Response(JSON.stringify(navigation), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify(DEFAULT_NAVIGATION), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    const navigation = await request.json();
    
    if (!Array.isArray(navigation)) {
      return new Response(JSON.stringify({ message: 'Navigation must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await ensureNavigationFile();
    await fs.writeFile(NAV_FILE, JSON.stringify(navigation, null, 2));
    
    return new Response(JSON.stringify({ message: 'Navigation updated successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}