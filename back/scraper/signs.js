import { DOMParser } from 'xmldom';
import { getContent, getFinalUrl, silencedDOMParserOptions } from './utils.js';
import xpath from 'xpath';
import { pool } from './db.js';
import { saveImage } from './image.js';
import { getOpenAIResponse } from './openai.js';


const OUTPUT_DIR = process.env.TRAFFIC_SIGNS_IMAGES_DIR;

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

/**
 * retrieve the DOM nodes containing information about sign categories
 * 
 * @param {*} content 
 * @returns the parsed dom nodes
 */
const getSignCategoryNodes = (content) => {
    let doc = silencedDOMParser.parseFromString(content);
    const nodes = xpath.select(
        "//*[contains(@class, 'semne-de-circulatie')]//*[contains(@class, 'card-link')]",
        doc
    );

    return nodes;
};

/**
 * Process the given DOM nodes, to retrieve the sign data links
 * 
 * @param {*} nodes 
 * @returns an array of links to the signs
 */
const processNodes = async (nodes) => {
    let linkData = [];

    for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        const link = node.getAttribute('href');
        const categoryImage = node.childNodes[1].getAttribute('src');

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
                image: categoryImage,
                ...data,
            };
        };
        try {
            const data = await fetch();
            linkData.push(data);
        }
        catch(e) {

        }
    }

    console.log('processed all links');
    return linkData;
};

/**
 * Handle processing for every sign link
 * 
 * @param {*} link a sign link
 * @returns the scraped data
 */
const processLink = async (link) => {
    console.log('processing link ' + link);
    const data = await getContent(link);
    const signCategoryData = await getSignCategoryData(data);
    console.log('processed link ' + link);
    return signCategoryData;
};

/**
 * Retrieve information about the current sign category
 * from the given sign category page content
 * 
 * @param {*} content 
 * @returns an object containing the title of the category and all related signs
 */
const getSignCategoryData = async (content) => {
    let doc = silencedDOMParser.parseFromString(content);

    const signNodes = xpath.select("//div[contains(@class, 'card-link')]", doc);

    // get category
    const signCategoryTitleNode = xpath.select(
        "//span[contains(@class, 'text-cod-red')]",
        doc
    );

    const signCategoryTitle = signCategoryTitleNode[0].childNodes[0].nodeValue;

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
    }

    return {
        title: signCategoryTitle,
        signs: signs.filter(Boolean),
    };
};

/**
 * Execute scraping of signs
 * 
 * @returns the list of objects of category data
 */
export const scrapeSigns = async () => {
    try {
        const url = 'https://www.codrutier.ro/semne-de-circulatie';

        const indexData = await getContent(url);
        const signCategoryNodes = getSignCategoryNodes(indexData);
        return await processNodes(signCategoryNodes);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

/**
 * Populate the database with the sign category objects.
 * Calls to openAi api in order to generate adequate sign category information
 */
export const populateSigns = async () => {

    const aiSystemMessage = `Esti responsabil de descriererea unor categorii de semne de circulatie din Romania`;
    const aiQuery = `Scrie-mi despre categoria de semne de circulatie de tip '{TYPE}'. 
        Da-mi cat mai mult detaliu. Incearca sa nu te repeti.
        Descrie urmatoarele aspecte: Aspectul categoriei de semne, rolul categoriei de semne, si sugestii la intalnirea unui semn din categorie.
        Raspunsul trebuie sa fie sub forma de JSON in formatul {"design": "string", "purpose": "string", "suggestion": "string"}.
        Construieste string-urile precum propozit precum propozitii, cu prima litera mare, si macar 20 de cuvinte.`


    const scrapedCategories = await scrapeSigns();
    const client = await pool.connect();

    for (const scrapedCategory of scrapedCategories) {
        process.stdout.write(
            `Adding new sign category: ${scrapedCategory.title}...`
        );
        try {
            let scrapedCategoryWithImageIds = scrapedCategory;
            // create new object, identical to old one, but with different image id
            try {
                const imageId = await saveImage(
                    scrapedCategory.image,
                    OUTPUT_DIR
                );

                scrapedCategoryWithImageIds.image = imageId;

                await Promise.all(
                    scrapedCategoryWithImageIds.signs.map(async (sign) => {
                        try {
                            const imageId = await saveImage(
                                sign.image,
                                OUTPUT_DIR
                            );
                            sign.image = imageId;
                        } catch (e) {
                            sign.image = null;
                        }
                    })
                );
            } catch (e) {
                console.log(e);
                scrapedCategory.image = null;
            }
            const completion = await getOpenAIResponse(aiSystemMessage, aiQuery.replace(/{TYPE}/g, scrapedCategory.title));
            console.log(completion);
            let parsedCompletion;
            try {
                const completionJson = completion.match(/({(?:.|\n)*?})/)[1];
                parsedCompletion = JSON.parse(completionJson);
            }
            catch (err) {
                console.log(err);
                parsedCompletion = {design: "", purpose: "", suggestion: ""};
            }
            const fullCategoryData = Object.assign(scrapedCategoryWithImageIds, parsedCompletion);

            await client.query('call insert_sign_category($1::jsonb)', [
                JSON.stringify(fullCategoryData),
            ]);
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }
    client.release();
    console.log('Done populating signs');
};
