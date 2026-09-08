export const CHECK_CONNECTION_TOOL_DEFINITION = {
    name: 'check_strapi_connection',
    description: 'Test connectivity to the Strapi 5 backend to ensure the CMS is reachable before starting a publishing session.',
    inputSchema: {
        type: 'object',
        properties: {},
    },
};
export const CHECK_DUPLICATE_TOOL_DEFINITION = {
    name: 'check_blog_duplicate',
    description: 'Check if a proposed blog topic or slug already exists in Strapi before writing the full article.',
    inputSchema: {
        type: 'object',
        properties: {
            title: { type: 'string', description: 'Proposed article title to check' },
            slug: { type: 'string', description: 'Optional proposed slug' },
            locale: { type: 'string', default: 'en', description: 'Language locale (defaults to "en")' },
        },
        required: ['title'],
    },
};
export const GET_CATEGORIES_TOOL_DEFINITION = {
    name: 'get_blog_categories',
    description: 'Retrieve the list of active blog categories from Strapi to help categorize the article appropriately.',
    inputSchema: {
        type: 'object',
        properties: {
            locale: { type: 'string', default: 'en', description: 'Language locale (defaults to "en")' },
        },
    },
};
export async function handleCheckConnection(client) {
    const result = await client.checkConnection();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
export async function handleCheckDuplicate(client, args) {
    const result = await client.checkDuplicate(args.title, args.slug, args.locale || 'en');
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
export async function handleGetCategories(client, args) {
    const result = await client.getCategories(args?.locale || 'en');
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(result, null, 2),
            },
        ],
    };
}
