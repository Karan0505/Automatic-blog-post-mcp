import { z } from 'zod';
import { StrapiClient, BlogPublishRequest } from '../strapi-client.js';

export const publishBlogSchema = {
  title: z.string().min(5).describe('The compelling, high-converting article title (30-60 characters ideal).'),
  slug: z.string().optional().describe('URL-friendly kebab-case slug (e.g. "nextjs-16-app-router-performance").'),
  content: z.string().min(800).describe('Full long-form Markdown body (minimum 800 words). Must use ## (H2) and ### (H3) sections. NEVER include an H1 (#) in the body.'),
  excerpt: z.string().optional().describe('Concise 2-3 sentence executive summary of the article.'),
  category: z.string().describe('Primary category name (e.g. "Next.js", "Web Development", "Software Architecture").'),
  tags: z.array(z.string()).min(1).max(5).describe('3 to 5 relevant technical tags.'),
  author: z.string().optional().describe('Author name to attribute (or leave blank to use default editor).'),
  faqs: z.array(
    z.object({
      question: z.string().min(5).describe('The user question.'),
      answer: z.string().min(10).describe('The substantive, practical answer.'),
    })
  ).min(3).describe('At least 3 practical Frequently Asked Questions with questions and answers.'),
  conclusion: z.string().min(50).describe('Explicit conclusion section providing actionable takeaways and next steps.'),
  metaTitle: z.string().min(30).max(70).optional().describe('SEO meta title between 30 and 60 characters.'),
  metaDescription: z.string().min(100).max(175).optional().describe('SEO meta description between 120 and 160 characters.'),
  focusKeyword: z.string().optional().describe('Primary search keyword for the article.'),
  canonicalUrl: z.string().optional().describe('Optional canonical URL override.'),
  imagePrompt: z.string().optional().describe('Editorial prompt describing the ideal cover illustration for this article.'),
  headings: z.array(
    z.object({
      level: z.number().int().min(2).max(3),
      text: z.string(),
      anchor: z.string().optional(),
    })
  ).optional().describe('Structured table of contents outline.'),
  locale: z.string().default('en').describe('Language locale code (defaults to "en").'),
  generateImage: z.boolean().default(false).describe('Whether to generate an editorial cover image if image generation is available.'),
  idempotencyKey: z.string().optional().describe('Unique client-generated request ID to prevent duplicate publishing on retry.'),
};

export const PUBLISH_BLOG_TOOL_DEFINITION = {
  name: 'publish_blog_to_strapi',
  description:
    'Publish a reviewed blog article to the connected Strapi CMS and Next.js website. ' +
    'CRITICAL: Only call this tool when the user explicitly requests publication (e.g., "Publish this blog to my Strapi CMS"). ' +
    'Do NOT call this tool merely because a blog was generated or researched. ' +
    'The tool validates content (800+ words, H2/H3, 3+ FAQs, conclusion), verifies SEO metadata, checks for duplicates, ' +
    'creates the Strapi 5 document, publishes it, revalidates the Next.js cache, and returns the live public URL.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Article title (30-60 chars)' },
      slug: { type: 'string', description: 'Kebab-case slug' },
      content: { type: 'string', description: 'Long-form Markdown content (800+ words, ## H2 and ### H3 only, no H1)' },
      excerpt: { type: 'string', description: 'Article executive summary' },
      category: { type: 'string', description: 'Category name (e.g. "Next.js")' },
      tags: { type: 'array', items: { type: 'string' }, description: '3-5 technical tags' },
      author: { type: 'string', description: 'Author name' },
      faqs: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
          },
          required: ['question', 'answer'],
        },
        description: 'Minimum 3 FAQ pairs',
      },
      conclusion: { type: 'string', description: 'Conclusion section with takeaways' },
      metaTitle: { type: 'string', description: 'SEO title (30-60 chars)' },
      metaDescription: { type: 'string', description: 'SEO description (120-160 chars)' },
      focusKeyword: { type: 'string', description: 'Primary keyword' },
      imagePrompt: { type: 'string', description: 'Editorial cover image prompt' },
      locale: { type: 'string', default: 'en' },
      generateImage: { type: 'boolean', default: false },
      idempotencyKey: { type: 'string', description: 'Client request UUID' },
    },
    required: ['title', 'content', 'category', 'tags', 'faqs', 'conclusion'],
  },
};

export async function handlePublishBlog(client: StrapiClient, args: any) {
  try {
    const parsed = z.object(publishBlogSchema).parse(args);
    const result = await client.publishBlog(parsed as BlogPublishRequest);

    if (!result.ok) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                status: result.data?.status || 'failed',
                stage: result.data?.stage || 'publishing',
                error: result.data?.error || 'Strapi returned an error during publishing.',
                details: result.data?.errors || result.data?.message || null,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              status: result.data.status,
              revalidation: result.data.revalidation,
              documentId: result.data.documentId,
              title: result.data.title,
              slug: result.data.slug,
              liveUrl: result.data.liveUrl,
              message: `✅ Blog "${result.data.title}" has been successfully published to Strapi and is now LIVE!`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            stage: 'schema_validation',
            error: err.message,
            issues: err.issues || null,
          }),
        },
      ],
      isError: true,
    };
  }
}
