import crypto from 'crypto';

export type SignedHeaders = Record<string, string>;

export class McpSecurity {
  /**
   * Generates secure HMAC-SHA256 headers for outbound requests to Strapi
   */
  public static generateSignedHeaders(bodyString: string, secret?: string): SignedHeaders {
    const sharedSecret = secret || process.env.MCP_SHARED_SECRET || 'chronicle-mcp-shared-secret-key-2026';
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const stringToSign = `${timestamp}:${nonce}:${bodyString}`;
    const signature = crypto.createHmac('sha256', sharedSecret).update(stringToSign).digest('hex');

    return {
      'Content-Type': 'application/json',
      'x-mcp-signature': signature,
      'x-mcp-timestamp': timestamp,
      'x-mcp-nonce': nonce,
      Authorization: `Bearer ${sharedSecret}`,
    };
  }
}
