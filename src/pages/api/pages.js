import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/pages');

// Ensure content directory exists
async function ensureContentDir() {
  try {
    await fs.access(CONTENT_DIR);
  } catch {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
  }
}

export async function GET() {
  try {
    await ensureContentDir();
    const files = await fs.readdir(CONTENT_DIR);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    const pages = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
        const slug = file.replace('.md', '');
        
        // Extract title from frontmatter or first heading
        const titleMatch = content.match(/^title:\s*(.+)$/m) || content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : slug;
        
        return { slug, title };
      })
    );
    
    return new Response(JSON.stringify(pages), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }) {
  try {
    const { title, slug, content } = await request.json();
    
    if (!title || !slug || !content) {
      return new Response(JSON.stringify({ message: 'Title, slug, and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await ensureContentDir();
    
    // Check if file already exists
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    try {
      await fs.access(filePath);
      return new Response(JSON.stringify({ message: 'Page already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      // File doesn't exist, which is what we want
    }
    
    // Create markdown content with frontmatter
    const markdownContent = `---
title: ${title}
slug: ${slug}
---

${content}`;
    
    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    return new Response(JSON.stringify({ slug, title, message: 'Page created successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT({ request }) {
  try {
    const { title, slug, content } = await request.json();
    
    if (!title || !slug || !content) {
      return new Response(JSON.stringify({ message: 'Title, slug, and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    await ensureContentDir();
    
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    
    // Create markdown content with frontmatter
    const markdownContent = `---
title: ${title}
slug: ${slug}
---

${content}`;
    
    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    return new Response(JSON.stringify({ slug, title, message: 'Page updated successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ request }) {
  try {
    const { slug } = await request.json();
    
    if (!slug) {
      return new Response(JSON.stringify({ message: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    await fs.unlink(filePath);
    
    return new Response(JSON.stringify({ message: 'Page deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}