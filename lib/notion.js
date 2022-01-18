import { config } from 'dotenv';
import { Client } from '@notionhq/client';
import { getBookProps, getUrl } from './goodreads.js';

config();

const { NOTION_KEY } = process.env;
const { DATABASE_ID } = process.env;

export const notion = new Client({ auth: NOTION_KEY });

async function findPage({ id }) {
    try {
        const books = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: 'id',
                number: {
                    equals: Number(id),
                },
            },
        });

        return books.results[0];
    } catch (error) {
        console.error(error.body);
    }
}

async function updatePage(
    { readYear: newReadYear },
    {
        id,
        properties: {
            Read: { multi_select: prevRead },
        },
    },
) {
    if (!newReadYear) {
        return false;
    }

    const read = [...new Set([...prevRead.map(({ name }) => name), newReadYear])].map((name) => ({
        name,
    }));

    try {
        await notion.pages.update({
            page_id: id,
            properties: {
                Read: {
                    multi_select: read,
                },
            },
        });

        return true;
    } catch (error) {
        console.error(' ', error.body);

        return false;
    }
}

export async function createPage({ id, title, readYear }) {
    try {
        const { cover } = await getBookProps(id);

        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
            icon: cover
                ? {
                      external: {
                          url: cover,
                      },
                  }
                : undefined,
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: title,
                            },
                        },
                    ],
                },
                id: {
                    number: Number(id),
                },
                Link: {
                    url: getUrl(id),
                },
                Read: readYear
                    ? {
                          multi_select: [
                              {
                                  name: readYear,
                              },
                          ],
                      }
                    : undefined,
            },
        });

        return true;
    } catch (error) {
        console.error('Fail. ', error);

        return false;
    }
}

export async function processBook(book) {
    process.stdout.write(`Processing book #${book.id}. ${book.title}.`);

    const foundPage = await findPage(book);

    if (foundPage) {
        process.stdout.write(' Found.');

        if (await updatePage(book, foundPage)) {
            process.stdout.write(' Updated.');
        }
    } else {
        process.stdout.write(' New.');

        if (await createPage(book)) {
            process.stdout.write(' Created.');
        }
    }

    process.stdout.write('\n');
}

export async function processBooks(books) {
    for (const book of books) {
        await processBook(book);
    }
}
