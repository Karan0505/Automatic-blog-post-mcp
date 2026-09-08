import { McpSecurity } from './security.js';

export interface BlogPublishRequest {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  author?: string;
  faqs?: Array<{ question: string; answer: string }>;
  conclusion?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  imagePrompt?: string;
  headings?: Array<{ level: number; text: string; anchor?: string }>;
  locale?: string;
  generateImage?: boolean;
  idempotencyKey?: string;
}

export class StrapiClient {
  private strapiBaseUrl: string;
  private sharedSecret: string;

  constructor(strapiUrl?: string, sharedSecret?: string) {
    this.strapiBaseUrl = (strapiUrl || process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
    this.sharedSecret = sharedSecret || process.env.MCP_SHARED_SECRET || 'chronicle-mcp-shared-secret-key-2026';
  }

  public async publishBlog(payload: BlogPublishRequest) {
    const url = `${this.strapiBaseUrl}/api/ai-blog/publish`;
    const bodyString = JSON.stringify(payload);
    const headers = McpSecurity.generateSignedHeaders(bodyString, this.sharedSecret);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString,
    });

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  public async checkDuplicate(title: string, slug?: string, locale: string = 'en') {
    const url = `${this.strapiBaseUrl}/api/ai-blog/check-duplicate`;
    const bodyString = JSON.stringify({ title, slug, locale });
    const headers = McpSecurity.generateSignedHeaders(bodyString, this.sharedSecret);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString,
    });

    return response.json();
  }

  public async getCategories(locale: string = 'en') {
    const url = `${this.strapiBaseUrl}/api/ai-blog/categories?locale=${locale}`;
    const response = await fetch(url);
    return response.json();
  }

  public async checkConnection() {
    try {
      const response = await fetch(`${this.strapiBaseUrl}/api/ai-blog/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return { connected: response.ok, status: response.status };
    } catch (err: any) {
      return { connected: false, error: err.message };
    }
  }
}
