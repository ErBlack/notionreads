import { notion } from './lib/notion.js';
import { config } from 'dotenv';
import { got } from 'got';

const COVER_REGEX = /<img id="coverImage" alt=".*" src="([^"]+)"/;

const { DATABASE_ID } = process.env;

config();

async function getCover(link) {
    const { body } = await got(link, {
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

    const [, src] = body.match(COVER_REGEX) || [];

    return src;
}
//5291430c-7e9a-49a3-995a-c02affa45c58
async function getAllPages() {
    try {
        const pages = [];
        let load = true;
        let start_cursor;

        while (load) {
            const { results, next_cursor, has_more } = await notion.databases.query({
                database_id: DATABASE_ID,
                page_size: 100,
                start_cursor,
            });

            pages.push(...results);

            load = has_more;
            start_cursor = next_cursor;
        }

        return pages;
    } catch (error) {
        console.error(error.body);
    }
}

async function addIcon(page_id, url) {
    try {
        await notion.pages.update({
            page_id,
            icon: {
                external: {
                    url,
                },
            },
        });

        return true;
    } catch (error) {
        console.error(' ', error.body);

        return false;
    }
}

async function updateCovers() {
    const pages = await getAllPages();

    for (const page of pages) {
        const {
            id,
            icon,
            properties: {
                Link: { url },
            },
        } = page;

        process.stdout.write(`Processing page #${id}.`);

        if (icon !== null) {
            process.stdout.write(' Has icon.\n');
            continue;
        }

        const cover = await getCover(url);

        if (cover) {
            process.stdout.write(' Cover found.');

            if (await addIcon(id, cover)) {
                process.stdout.write(' Icon set.');
            } else {
                process.stdout.write(' Fail.');
            }
        } else {
            process.stdout.write(' No cover.');
        }

        process.stdout.write('\n');
    }
}

updateCovers();
