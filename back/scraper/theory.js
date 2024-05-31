import {DOMParser} from "xmldom";
import {getContent, romanNumeralToInt, silencedDOMParserOptions} from "./utils.js";
import xpath from "xpath";
import {pool} from "./db.js";

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const getChapterLinks = (content) => {
    let doc = silencedDOMParser.parseFromString(content);
    const chapterNodes = xpath.select(
        "//*[contains(@class, 'codul-rutier')]//*[contains(@class, 'card-link')]/@href",
        // "//*",
        doc
    );

    return [...chapterNodes.map((node) => node.nodeValue)];
};

const processLinks = async (links) => {
    return await Promise.all(
        links.map(async (link) => {
            const linkParts = link.split("/");
            const chapterId = linkParts[linkParts.length - 1];
            const data = await processLink(link);
            return {
                id: chapterId,
                ...data,
            };
        })
    );
};

const processLink = async (link) => {
    const data = await getContent(link);
    return getChapterData(data);
};

const getChapterData = (content) => {
    // use XML to get the text of the chapter, or whatever
    let doc = silencedDOMParser.parseFromString(content);

    const chapterContentNode = xpath.select(
        "//*[@id='content']",
        // "//*",
        doc
    );

    const chapterContent = chapterContentNode[0].toString();

    const chapterTitleNode = xpath
        .select(
            "//div[contains(@class, 'title')]//span[contains(@class, 'text-cod-red')]",
            doc
        )[0]
        .textContent.trim();

    return {
        title: chapterTitleNode,
        content: chapterContent,
    };
};

export const scrapeTheory = async () => {
    try {
        const url = "https://www.codrutier.ro/codul-rutier";
        const indexData = await getContent(url);
        return processLinks(getChapterLinks(indexData));
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export const populateTheory = async () => {
    const re = /Cap\. (M{0,3}(CM|CD|D?C{0,3})?(XC|XL|L?X{0,3})?(IX|IV|V?I{0,3})?).*/;
    const scrapedTheoryChapters = await scrapeTheory();
    const client = await pool.connect();

    console.log('Populating theory');
    for (const chapter of scrapedTheoryChapters) {
        process.stdout.write(`Adding new theory chapter: ${chapter.title}...`);
        const chapterRomanNumber = chapter.title.match(re)[1];
        try {
            await client.query(
                'insert into chapter values(default, $1::int, $2::varchar, $3::text)',
                [romanNumeralToInt(chapterRomanNumber), chapter.title, chapter.content],
            );
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }

    client.release();
    console.log('Done populating theory');
}