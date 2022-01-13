import { config } from 'dotenv';
import { Client } from '@notionhq/client';

config();

const { NOTION_KEY } = process.env;

export const notion = new Client({ auth: NOTION_KEY });
