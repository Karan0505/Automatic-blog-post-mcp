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
    this.strapiBaseUrl = (strapiUrl || process.env.STRAPI_URL || 'http://localhost:1337')
      .trim()
      .replace(/\/+$/, '')
      .replace(/\/api$/, '');
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

    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { error: await response.text() };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  public async checkDuplicate(title: string, slug?: string, locale: string = 'en') {
    try {
      const filter = slug
        ? `filters[$or][0][title][$eq]=${encodeURIComponent(title)}&filters[$or][1][slug][$eq]=${encodeURIComponent(slug)}`
        : `filters[title][$eq]=${encodeURIComponent(title)}`;
      const url = `${this.strapiBaseUrl}/api/posts?${filter}&locale=${locale}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const exists = (data?.data?.length || 0) > 0;
        return { exists, matches: data?.data || [] };
      }

      // Fallback to /api/ai-blog/check-duplicate
      const fallbackUrl = `${this.strapiBaseUrl}/api/ai-blog/check-duplicate`;
      const fallbackBody = JSON.stringify({ title, slug, locale });
      const fallbackHeaders = McpSecurity.generateSignedHeaders(fallbackBody, this.sharedSecret);
      const fallbackResp = await fetch(fallbackUrl, {
        method: 'POST',
        headers: fallbackHeaders,
        body: fallbackBody,
      });
      if (fallbackResp.ok) {
        return await fallbackResp.json();
      }

      return { exists: false, status: response.status };
    } catch (err: any) {
      return { exists: false, error: err.message };
    }
  }

  public async getCategories(locale: string = 'en') {
    try {
      const url = `${this.strapiBaseUrl}/api/categories?locale=${locale}`;
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
      // Fallback
      const fallbackUrl = `${this.strapiBaseUrl}/api/ai-blog/categories?locale=${locale}`;
      const fallbackResp = await fetch(fallbackUrl);
      return await fallbackResp.json();
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  }

  public async checkConnection() {
    try {
      let targetUrl = `${this.strapiBaseUrl}/api/categories`;
      let response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Try fallback to /api/ai-blog/categories
        const altUrl = `${this.strapiBaseUrl}/api/ai-blog/categories`;
        const altResp = await fetch(altUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (altResp.ok) {
          response = altResp;
          targetUrl = altUrl;
        }
      }

      return {
        connected: response.ok,
        status: response.status,
        strapiUrl: this.strapiBaseUrl,
        endpointChecked: targetUrl,
        ...(!response.ok ? { hint: `Strapi responded with HTTP ${response.status}. Please ensure STRAPI_URL points to the base domain (e.g. ${this.strapiBaseUrl}) without trailing /api.` } : {})
      };
    } catch (err: any) {
      return {
        connected: false,
        error: err.message,
        strapiUrl: this.strapiBaseUrl,
        hint: 'Could not reach Strapi CMS. Ensure the Strapi server is running and accessible.'
      };
    }
  }
}
