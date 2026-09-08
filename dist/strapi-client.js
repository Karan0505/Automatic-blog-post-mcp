import { McpSecurity } from './security.js';
export class StrapiClient {
    strapiBaseUrl;
    sharedSecret;
    constructor(strapiUrl, sharedSecret) {
        this.strapiBaseUrl = (strapiUrl || process.env.STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
        this.sharedSecret = sharedSecret || process.env.MCP_SHARED_SECRET || 'chronicle-mcp-shared-secret-key-2026';
    }
    async publishBlog(payload) {
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
    async checkDuplicate(title, slug, locale = 'en') {
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
    async getCategories(locale = 'en') {
        const url = `${this.strapiBaseUrl}/api/ai-blog/categories?locale=${locale}`;
        const response = await fetch(url);
        return response.json();
    }
    async checkConnection() {
        try {
            const response = await fetch(`${this.strapiBaseUrl}/api/ai-blog/categories`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            return { connected: response.ok, status: response.status };
        }
        catch (err) {
            return { connected: false, error: err.message };
        }
    }
}
