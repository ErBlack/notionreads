import { readCsv } from './lib/csv.js';
import { notion } from './lib/notion.js';
import { config } from 'dotenv';
import { getBookProps, getUrl } from './lib/goodreads.js';

config();

const { DATABASE_ID } = process.env;

const books = readCsv('goodreads_library_export.csv')
    .filter((b) => b['Read Count'] !== '0')
    .filter((b) => !Boolean(b['Date Read']))
    .filter((b) => b['Exclusive Shelf'] === 'read')
    .filter((b) => b['Book Id'] !== '672963')
    .map(({ Title: title, 'Book Id': id, 'Date Read': dateRead }) => ({
        id,
        title,
        readYear: dateRead ? String(new Date(dateRead).getFullYear()) : undefined,
    }));

async function createPage({ id, title, readYear }) {
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
        console.error(' ', error.body);

        return false;
    }
}

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

async function processBook(book) {
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

async function processBooks(books) {
    for (const book of books) {
        await processBook(book);
    }
}

processBooks(books);
