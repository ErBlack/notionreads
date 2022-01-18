import { getShelf } from './lib/goodreads.js';
import { processBooks } from './lib/notion.js';

const user = 79813048;

async function getCurrentlyReading() {
    const books = await getShelf(user, 'currently-reading');

    processBooks(books);
}

getCurrentlyReading();
