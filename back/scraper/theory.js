import { DOMParser, XMLSerializer } from 'xmldom';
import {
    getContent,
    romanNumeralToInt,
    silencedDOMParserOptions,
} from './utils.js';
import xpath from 'xpath';
import { pool } from './db.js';

const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const processChapterPage = (content) => {
    let doc = silencedDOMParser.parseFromString(content);

    const buttonXPath = "//button[contains(@class, 'btn-wrap-text')]";
    const contentXPath =
        "//button[contains(@class, 'btn-wrap-text')]/following-sibling::div[1]";

    const buttons = xpath.select(buttonXPath, doc);
    const chapters = xpath.select(contentXPath, doc);

    const serializer = new XMLSerializer();
    const chapterData = buttons.map((button, index) => {
        const innerChapterContent = Array.from(chapters[index].childNodes)
            .map((child) => serializer.serializeToString(child))
            .join('');

        const isAddendum = button.getAttribute('data-target') === '#anexa';

        return {
            title: button.childNodes[1].textContent
                .replace(/&raquo;/g, '')
                .trim(),
            content: innerChapterContent,
            isAddendum,
        };
    });
    return chapterData;
};

export const scrapeTheory = async () => {
    try {
        const url =
            'https://www.drpciv-romania.ro/Code/Applications/web/index.cgi?action=codulrutier';
        const content = await getContent(url);

        const result = processChapterPage(content);
        return result;
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export const populateTheory = async () => {
    const chapterRegex =
        /CAPITOLUL (M{0,3}(?:CM|CD|D?C{0,3})?(?:XC|XL|L?X{0,3})?(?:IX|IV|V?I{0,3})?): (.*)/;
    const addendumRegex = /ANEXA ([0-9]+?) - (.*)/;

    const scrapedTheoryChapters = await scrapeTheory();
    const client = await pool.connect();

    console.log('Populating theory');
    for (const chapter of scrapedTheoryChapters) {
        process.stdout.write(`Adding new theory chapter: ${chapter.title}...`);

        const chapterRegexMatch = chapter.title.match(chapterRegex);
        const addendumRegexMatch = chapter.title.match(addendumRegex);

        const chapterNumber = chapter.isAddendum
            ? parseInt(addendumRegexMatch[1])
            : romanNumeralToInt(chapterRegexMatch[1]);

        const chapterTitle = chapter.isAddendum
            ? addendumRegexMatch[2]
            : chapterRegexMatch[2];

        try {
            await client.query(
                'insert into chapter values(default, $1::int, $2::varchar, $3::text, $4::bool)',
                [chapterNumber, chapterTitle, chapter.content, chapter.isAddendum],
            );
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }

    client.release();
    console.log('Done populating theory');
};
