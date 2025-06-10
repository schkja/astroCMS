import fs from 'fs/promises';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/pages');

// Simple markdown to HTML converter
function markdownToHtml(markdown) {
  return markdown
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n/, '')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.*)$/gm, function(match) {
      if (match.trim() && !match.startsWith('<')) {
        return '<p>' + match + '</p>';
      }
      return match;
    })
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[^>]+>)/g, '$1')
    .replace(/(<\/[^>]+>)<\/p>/g, '$1');
}

export async function GET({ params }) {
  try {
    const slug = params.slug || 'index';
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    let title = slug;
    let rawContent = content;
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      rawContent = content.replace(frontmatterMatch[0], '');
    } else {
      // Try to extract title from first heading
      const headingMatch = rawContent.match(/^#\s+(.+)$/m);
      if (headingMatch) {
        title = headingMatch[1].trim();
      }
    }
    
    const html = markdownToHtml(rawContent);
    
    return new Response(JSON.stringify({
      slug,
      title,
      content: rawContent,
      html
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}