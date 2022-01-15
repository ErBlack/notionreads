import { readCsv } from './lib/csv.js';
import { notion } from './lib/notion.js';
import { config } from 'dotenv';

config();

const { DATABASE_ID } = process.env;

const books = readCsv('goodreads_library_export.csv')
    .filter((b) => b['Read Count'] !== '0')
    .filter((b) => Boolean(b['Date Read']));

const getUrl = (id) => `https://www.goodreads.com/book/show/${id}`;
const getReadYear = (date) => String(new Date(date).getFullYear());

async function createPage({ Title: title, 'Book Id': id, 'My Rating': rating, 'Date Read': read }) {
    try {
        await notion.pages.create({
            parent: { database_id: DATABASE_ID },
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
                Rating: {
                    number: Number(rating),
                },
                Link: {
                    url: getUrl(id),
                },
                Read: {
                    multi_select: [
                        {
                            name: getReadYear(read),
                        },
                    ],
                },
            },
        });

        return true;
    } catch (error) {
        console.error(' ', error.body);

        return false;
    }
}

async function findPage({ 'Book Id': id }) {
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
    { 'Date Read': newRead },
    {
        id,
        properties: {
            Read: { multi_select: prevRead },
        },
    },
) {
    const read = [...new Set([...prevRead.map(({ name }) => name), getReadYear(newRead)])].map((name) => ({
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
    process.stdout.write(`Processing book #${book['Book Id']}.`);

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
