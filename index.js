import { readCsv } from './lib/csv.js';
import { createPage, notion, processBooks } from './lib/notion.js';
import { config } from 'dotenv';

config();

const books = readCsv('goodreads_library_export.csv')
    .filter((b) => Boolean(b['Date Read']))
    .filter((b) => b['Exclusive Shelf'] === 'read')
    .map(({ Title: title, 'Book Id': id, 'Date Read': dateRead }) => ({
        id,
        title,
        readYear: dateRead ? String(new Date(dateRead).getFullYear()) : undefined,
    }));

processBooks(books);
