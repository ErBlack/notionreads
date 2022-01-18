import { got } from 'got';

export const getUrl = (id) => `https://www.goodreads.com/book/show/${id}`;
const getShelfUrl = (userId, shelfName) => `https://www.goodreads.com/review/list/${userId}?shelf=${shelfName}`;

const COVER_REGEX = /<img id="coverImage" alt=".*" src="([^"]+)"/;
const TITLE_REGEX = /<h1 id="bookTitle"[^\n]+\n([^\n]+)\n/;
const SHELF_RECORD_REGEX = /<a title="([^"]+)" href="\/book\/show\/(\d+)/g;

const params = {
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
};

export async function getBookProps(id) {
    const { body } = await got(getUrl(id), params);

    const [, cover] = body.match(COVER_REGEX) || [];
    const [, title = ''] = body.match(TITLE_REGEX) || [];

    return {
        cover,
        title: title.trim(),
    };
}

export async function getShelf(userId, shelfName) {
    const { body } = await got(getShelfUrl(userId, shelfName), params);

    return [...body.matchAll(SHELF_RECORD_REGEX)].map(([, title, id]) => ({
        title,
        id,
        readYear: String(new Date().getFullYear()),
    }));
}
