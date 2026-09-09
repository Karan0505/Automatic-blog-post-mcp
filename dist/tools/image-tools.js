import { z } from 'zod';
export const searchTopicImageSchema = {
    query: z.string().min(2).describe('Search query for the topic (e.g., "Artificial Intelligence", "Docker Containers", "Kubernetes", "Next.js 15").'),
    category: z.string().optional().describe('Optional category name (e.g., "AI & Machine Learning", "DevOps", "Web Development").'),
};
export const SEARCH_TOPIC_IMAGE_TOOL_DEFINITION = {
    name: 'search_topic_image',
    description: 'Search topic-specific cover images and generate an editorial image prompt tailored for a blog post topic. ' +
        'Returns curated high-definition technical image options, recommended image prompt, and direct image URLs that can be passed to publish_blog_to_strapi.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Topic search query (e.g. "Artificial Intelligence", "Docker", "Cybersecurity")',
            },
            category: {
                type: 'string',
                description: 'Optional category (e.g. "DevOps", "AI")',
            },
        },
        required: ['query'],
    },
};
export async function handleSearchTopicImage(args) {
    try {
        const parsed = z.object(searchTopicImageSchema).parse(args);
        const query = parsed.query.trim();
        const lower = query.toLowerCase();
        // 1. Determine tailored AI image generation prompt
        const cleanTopic = query.replace(/[^\w\s-]/g, ' ').trim();
        const recommendedPrompt = `Modern editorial 3D digital tech illustration of ${cleanTopic}, vibrant neon accents, volumetric lighting, dark aesthetic, clean minimalist 4k render`;
        // 2. Select curated topic-matched high-definition images
        let topicCategory = 'General Technology';
        let suggestedUrls = [];
        const isAi = /(?:^|\W)(ai|genai|agi)(?:\W|$)/i.test(lower) ||
            lower.includes('artificial') ||
            lower.includes('machine learning') ||
            lower.includes('neural') ||
            lower.includes('llm') ||
            lower.includes('deep learning') ||
            lower.includes('intelligence');
        if (isAi) {
            topicCategory = 'Artificial Intelligence & Neural Systems';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&q=80', // Glowing AI brain
                'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&q=80', // Neural network pathways
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&q=80', // Abstract futuristic AI
            ];
        }
        else if (lower.includes('docker') ||
            lower.includes('container') ||
            lower.includes('kubernetes') ||
            lower.includes('k8s') ||
            lower.includes('devops') ||
            lower.includes('cloud') ||
            lower.includes('aws')) {
            topicCategory = 'Cloud Infrastructure & Containerization';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1280&q=80', // Cloud server racks
                'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=1280&q=80', // Container network
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80', // Global interconnected cloud
            ];
        }
        else if (lower.includes('security') ||
            lower.includes('cyber') ||
            lower.includes('hack') ||
            lower.includes('auth') ||
            lower.includes('firewall')) {
            topicCategory = 'Cybersecurity & Protection';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1280&q=80', // Digital security padlock
                'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1280&q=80', // Cyber warfare matrix
            ];
        }
        else if (lower.includes('data') ||
            lower.includes('sql') ||
            lower.includes('database') ||
            lower.includes('postgres') ||
            lower.includes('mongo')) {
            topicCategory = 'Data Engineering & Databases';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1280&q=80', // Data storage racks
            ];
        }
        else if (lower.includes('react') ||
            lower.includes('next') ||
            lower.includes('vue') ||
            lower.includes('front') ||
            lower.includes('ui')) {
            topicCategory = 'Frontend & Web Architecture';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1280&q=80', // React 3D glow
                'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1280&q=80', // Modern UI workstation
            ];
        }
        else {
            topicCategory = 'Software Architecture & Engineering';
            suggestedUrls = [
                'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&q=80', // Digital matrix cyber tech
                'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&q=80', // Network architecture
            ];
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        query,
                        category: topicCategory,
                        recommendedImagePrompt: recommendedPrompt,
                        suggestedCoverImageUrls: suggestedUrls,
                        instructions: 'Pass `imageUrl: suggestedCoverImageUrls[0]` or `imagePrompt: recommendedImagePrompt` into `publish_blog_to_strapi` to apply this topic-specific image to your blog post.',
                    }, null, 2),
                },
            ],
        };
    }
    catch (err) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        error: err.message,
                    }),
                },
            ],
            isError: true,
        };
    }
}
