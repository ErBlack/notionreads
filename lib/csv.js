import { readFileSync } from 'fs';

const splitCsv = (row) => {
    let arr = [];
    let q = false;

    let str = '';
    for (const letter of row) {
        switch (letter) {
            case ',':
                if (!q) {
                    arr.push(str.trim());
                    str = '';
                } else {
                    str += letter;
                }
                break;
            case '"':
                q = !q;
                break;
            default:
                str += letter;
        }
    }

    arr.push(str.trim());

    return arr;
}

export const readCsv = (path) => {
    const content = readFileSync(path, 'UTF-8');

    const [h, ...rows] = content.split('\n');
    const header = h.split(',').map(s => s.trim());

    return rows.reduce((acc, row) => {
        acc.push(splitCsv(row).reduce((row, cell, i) => {
            row[header[i]] = cell;

            return row;
        }, {}));

        return acc;
    }, []);
}