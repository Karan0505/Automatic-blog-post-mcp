import crypto from 'crypto';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const SHARED_SECRET = process.env.MCP_SHARED_SECRET || 'chronicle-mcp-shared-secret-key-2026';

const sampleBlogPayload = {
  title: 'Next.js 16 App Router Performance Optimization',
  slug: 'nextjs-16-app-router-performance-optimization',
  category: 'Architecture',
  tags: ['Next.js', 'Performance', 'React 19', 'Edge Caching'],
  author: 'Alex Vance',
  excerpt: 'A deep dive into optimizing Next.js 16 App Router applications using Partial Prerendering, modern edge cache invalidation, and React 19 Server Actions.',
  metaTitle: 'Next.js 16 App Router Performance Optimization Guide',
  metaDescription: 'Master Next.js 16 App Router performance with Partial Prerendering, sub-millisecond edge caching, and server actions optimization techniques.',
  focusKeyword: 'Next.js 16 performance',
  faqs: [
    {
      question: 'What is the most significant performance feature in Next.js 16?',
      answer: 'Next.js 16 pairs Partial Prerendering (PPR) with React 19 Server Components to stream dynamic content while serving the static shell instantly from edge CDN caches.'
    },
    {
      question: 'How do React 19 Server Actions improve user interaction metrics?',
      answer: 'Server Actions eliminate boilerplate REST/GraphQL endpoints, optimize client-side bundle size, and allow progressive enhancement without heavy client payloads.'
    },
    {
      question: 'Does on-demand cache revalidation work with headless Strapi CMS?',
      answer: 'Yes. By dispatching cryptographic HMAC-signed revalidation webhooks from Strapi to Next.js /api/revalidate, stale content is updated on the edge in sub-100ms.'
    }
  ],
  conclusion: 'Modern web systems demand predictable performance. By combining Next.js 16 on the edge with Strapi 5 headless CMS, engineering teams achieve sub-second TTFB, optimal Core Web Vitals, and effortless internationalized content delivery.',
  content: `## The Modern Landscape of Next.js 16 Architecture

Scaling high-traffic web applications requires more than simple static generation. As enterprise web applications evolve, finding the equilibrium between dynamic personalization and static edge performance is the ultimate engineering challenge. Next.js 16 introduces foundational architectural paradigms designed to address this balance head-on.

In this deep architectural guide, we dissect the core mechanics of Next.js 16 performance optimization, analyzing how decoupling content management via Strapi 5 with edge-rendered Next.js creates unmatched velocity for modern engineering organizations.

## Core Architectural Pillars in Next.js 16

### 1. Partial Prerendering (PPR)

Partial Prerendering combines the speed of static edge caching with the versatility of dynamic server rendering in a single HTTP request. Rather than choosing between static site generation (SSG) and server-side rendering (SSR) on a per-route basis, PPR enables static and dynamic boundaries within the same layout.

\`\`\`typescript
// Example: Dynamic boundary inside a static layout
import { Suspense } from 'react';
import { StaticHeader } from '@/components/layout/Header';
import { DynamicPersonalizedFeed } from '@/components/feed/PersonalizedFeed';
import { FeedSkeleton } from '@/components/ui/Skeletons';

export default function FeedPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Instant static shell from CDN */}
      <StaticHeader title="Developer Dispatch" />

      {/* Dynamic streaming component */}
      <Suspense fallback={<FeedSkeleton />}>
        <DynamicPersonalizedFeed />
      </Suspense>
    </main>
  );
}
\`\`\`

By isolating the slow data dependencies into React Suspense boundaries, edge servers immediately stream the pre-rendered HTML shell to the browser, yielding near-zero First Contentful Paint (FCP) metrics.

### 2. Fine-Grained Edge Caching and Revalidation

Edge caching strategies are paramount when connecting headless CMS solutions like Strapi 5 with Next.js. Utilizing on-demand incremental static regeneration (ISR) via tag-based revalidation ensures that editorial updates made in Strapi are propagated to global edge points without full site rebuilds.

When a post document is published in Strapi, a cryptographic HMAC-signed revalidation ping is dispatched to the Next.js revalidation endpoint. This invalidates the cached route path on the fly:

\`\`\`typescript
// Next.js Route Handler for On-Demand Invalidation
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const { path, locale, slug } = await request.json();
  
  if (locale && slug) {
    revalidatePath(\`/\${locale}/blog/\${slug}\`);
    revalidatePath(\`/\${locale}/blog\`);
  }
  
  return NextResponse.json({ revalidated: true, timestamp: Date.now() });
}
\`\`\`

### 3. Image Optimization with Next-Gen Formats

Images frequently constitute over 60% of total page weight on content-rich publications. Incorporating automatic WebP and AVIF conversions at build and runtime prevents layout shift (CLS) and dramatically decreases total byte transfer over constrained networks.

When combined with Strapi's media upload providers and Sharp processing, high-resolution photography is converted to modern WebP assets before ever reaching the client device.

## Trade-offs and Engineering Considerations

| Optimization Strategy | Advantage | Trade-off / Complexity |
| :--- | :--- | :--- |
| **Partial Prerendering** | Sub-50ms TTFB, instant visual feedback | Requires structured Suspense boundaries |
| **On-Demand ISR** | Fresh content with static speeds | Requires cache revalidation webhooks |
| **Edge Server Components** | Zero client bundle overhead | Cannot use browser APIs in server components |

## Practical Implementation Blueprint

To optimize an enterprise Next.js publication connected to Strapi:

1. **Audit Bundle Sizes**: Use \`@next/bundle-analyzer\` to strip unused client packages.
2. **Implement Stale-While-Revalidate**: Configure upstream CDN headers to deliver immediate responses while asynchronously fetching fresh data in the background.
3. **Establish Cryptographic Webhooks**: Ensure all CMS invalidation calls are signed with HMAC-SHA256 to prevent unauthorized cache purging attacks.

## Summary and Key Takeaways

Modern web architecture is no longer about choosing between speed and dynamism. By harnessing Next.js 16 App Router capabilities alongside Strapi 5's decoupled document service, teams achieve the elusive combination of authoring ergonomics and blistering front-end speed.`
};

async function testPublish() {
  console.log('🧪 Starting test publish to Strapi endpoint:', `${STRAPI_URL}/api/ai-blog/publish`);

  const bodyString = JSON.stringify(sampleBlogPayload);
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const stringToSign = `${timestamp}:${nonce}:${bodyString}`;
  const signature = crypto.createHmac('sha256', SHARED_SECRET).update(stringToSign).digest('hex');

  try {
    const res = await fetch(`${STRAPI_URL}/api/ai-blog/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-mcp-signature': signature,
        'x-mcp-timestamp': timestamp,
        'x-mcp-nonce': nonce,
        Authorization: `Bearer ${SHARED_SECRET}`,
      },
      body: bodyString,
    });

    const data = await res.json();
    console.log(`[Status ${res.status}] Response:`, JSON.stringify(data, null, 2));

    if (res.ok && data.success) {
      console.log('🎉 PUBLISH TEST PASSED!');
      console.log('Live URL:', data.liveUrl);
    } else {
      console.warn('⚠️ Publish responded with:', data.error || data);
    }
  } catch (err) {
    console.error('❌ Test request failed:', err.message);
  }
}

testPublish();
