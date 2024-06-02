import { DOMParser } from 'xmldom';
import { getContent, getFinalUrl, silencedDOMParserOptions } from './utils.js';
import xpath from 'xpath';
import { pool } from './db.js';

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const getSignCategoryLinks = (content) => {
    let doc = silencedDOMParser.parseFromString(content);
    const nodes = xpath.select(
        "//*[contains(@class, 'semne-de-circulatie')]//*[contains(@class, 'card-link')]/@href",
        // "//*",
        doc
    );

    return [...nodes.map((node) => node.nodeValue)];
};

const processLinks = async (links) => {
    let linkData = [];

    for (let i = 0; i < links.length; ++i) {
        const link = links[i];

        const fetch = async () => {
            const linkParts = link.split('/');
            const categoryId = linkParts[linkParts.length - 1];
            let data = await processLink(link);

            // modify data.signs to include ID
            data.signs = data.signs.map((sign) => ({
                ...sign,
                categoryId: categoryId,
            }));

            return {
                id: categoryId,
                ...data,
            };
        };
        linkData.push(await fetch());

        // const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        // await delay(1000);
    }

    console.log('processed all links');
    return linkData;
};

const processLink = async (link) => {
    console.log('processing link ' + link);
    const data = await getContent(link);
    const signCategoryData = await getSignCategoryData(data);
    console.log('processed link ' + link);
    return signCategoryData;
};

const getSignCategoryData = async (content) => {
    let doc = silencedDOMParser.parseFromString(content);

    const signNodes = xpath.select(
        "//div[contains(@class, 'card-link')]",
        // "//*",
        doc
    );

    // get category
    const signCategoryTitleNode = xpath.select(
        "//span[contains(@class, 'text-cod-red')]",
        // "//*",
        doc
    );

    const signCategoryTitle = signCategoryTitleNode[0].childNodes[0].nodeValue;
    // signNode.childNodes

    const count = {};
    let signs = [];

    for (let i = 0; i < signNodes.length; ++i) {
        const signNode = signNodes[i];

        const fetch = async () => {
            let signData = {};

            signData.title =
                signNode.getElementsByTagName('h2')[0].childNodes[0].nodeValue;

            if (!signData.title) {
                return null;
            }

            if (count[signData.id] === undefined) {
                count[signData.id] = 1;
            } else {
                count[signData.id] += 1;
            }

            try {
                signData.image = await getFinalUrl(
                    signNode.getElementsByTagName('img')[0].getAttribute('src')
                );
            } catch (error) {
                console.error('Error while fetching image: ');
                console.error(error);
            }

            try {
                signData.description =
                    signNode.getElementsByTagName(
                        'p'
                    )[0].childNodes[0].nodeValue;
            } catch (error) {}

            return signData;
        };

        signs.push(await fetch());

        // const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        // await delay(2000);
    }

    return {
        title: signCategoryTitle,
        signs: signs.filter(Boolean),
    };
};

export const scrapeSigns = async () => {
    try {
        const url =
            'https://web.archive.org/web/20240220222115mp_/https://www.codrutier.ro/semne-de-circulatie';

        const indexData = await getContent(url);
        const signCategoryLinks = getSignCategoryLinks(indexData);
        return await processLinks(signCategoryLinks.slice(0, 1));
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export const populateSigns = async () => {
    const scrapedCategories = await scrapeSigns();
    const client = await pool.connect();

    for (const scrapedCategory of scrapedCategories) {
        console.log(JSON.stringify(scrapedCategory));
        process.stdout.write(
            `Adding new sign category: ${scrapedCategory.title}...`
        );
        try {
            // await client.query('call insert_sign_category($1::jsonb)', [
            //     JSON.stringify(scrapedCategory),
            // ]);
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }
    client.release();
    console.log('Done populating signs');
};
