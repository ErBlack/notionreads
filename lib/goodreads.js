import { got } from 'got';

export const getUrl = (id) => `https://www.goodreads.com/book/show/${id}`;

const COVER_REGEX = /<img id="coverImage" alt=".*" src="([^"]+)"/;
const TITLE_REGEX = /<h1 id="bookTitle"[^\n]+\n([^\n]+)\n/;

export async function getBookProps(id) {
    const { body } = await got(getUrl(id), {
        retry: {
            limit: 10,
            statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524, 403],
            errorCodes: [
                'ETIMEDOUT',
                'ECONNRESET',
                'EADDRINUSE',
                'ECONNREFUSED',
                'EPIPE',
                'ENOTFOUND',
                'ENETUNREACH',
                'EAI_AGAIN',
                'FORBIDDEN',
            ],
        },
    });

    const [, cover] = body.match(COVER_REGEX) || [];
    const [, title = ''] = body.match(TITLE_REGEX) || [];

    return {
        cover,
        title: title.trim(),
    };
}
