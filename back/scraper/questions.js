import { DOMParser } from 'xmldom';
import { getContent, silencedDOMParserOptions } from './utils.js';
import xpath from 'xpath';
import { pool } from './db.js';
import { saveImage } from './image.js';

const OUTPUT_DIR = process.env.EXERCISES_IMAGES_DIR;

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const getQuestionData = (content) => {
    let doc = silencedDOMParser.parseFromString(content);

    let questionData = {};

    const questionNodes = xpath.select(
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' question-title ')]",
        doc
    );

    questionData.question = questionNodes[0].textContent;

    // check for image, if it's the case
    const imageLink = xpath.select(
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' fancybox ')]/@href",
        doc
    );

    if (imageLink.length > 0) {
        questionData.image = imageLink[0].nodeValue;
    }

    questionData.answerNodes = [];

    const answerNodes = xpath.select(
        "//*[contains(concat(' ', normalize-space(@class), ' '), ' answer ')]",
        doc
    );

    answerNodes.forEach((node, index) => {
        const dataCorrectValue = node.getAttribute('data-correct');
        const firstChildText = node.childNodes[1].nodeValue.trim();

        questionData.answerNodes[index] = {
            isCorrect: dataCorrectValue,
            text: firstChildText,
        };
    });

    return questionData;
};

const getNextQuestionLink = (content) => {
    try {
        let doc = silencedDOMParser.parseFromString(content);
        return xpath.select(
            "//*[contains(concat(' ', normalize-space(@class), ' '), ' next_url ')]/@href",
            doc
        )[0].nodeValue;
    } catch (error) {
        // default to regex. regex is bound to work :)
        const regex = /<a [^>]*class="[^"]*next_url[^"]*"[^>]*>/gimu;
        const firstMatch = content.match(regex);
        if (!firstMatch) {
            return undefined;
        }
        const hrefRegex = /href="([^"]+?)"/gm;
        const hrefMatch = hrefRegex.exec(firstMatch[0]);
        if (!hrefMatch) {
            return undefined;
        }
        return hrefMatch[1];
    }
};

const getFirstQuestionLink = (content) => {
    let doc = silencedDOMParser.parseFromString(content);
    return xpath.select(
        "//a[contains(text(), 'Începe acest mediu')]/@href",
        doc
    )[0].value;
};

const getCategoryLinks = (content) => {
    let doc = silencedDOMParser.parseFromString(content);
    const xCategories = xpath.select(
        "//a[contains(concat(' ', normalize-space(@class), ' '), ' progress-bar ')]/@href",
        doc
    );

    return xCategories.slice(1).map((category) => category.value);
};

const processCategoryLink = async (link) => {
    const splitLink = link.split('/');
    const categoryId = splitLink[splitLink.length - 2];
    let content = await getContent(link);

    const titleRegex = /<meta name="keywords" content="([^"]+?)">/gimu;
    let categoryTitle = undefined;
    try {
        categoryTitle = titleRegex.exec(content.slice(0, 1000))[1];
    } catch (e) {
        if (!categoryTitle) {
            categoryTitle = categoryId;
        }
    }

    let questionLink = getFirstQuestionLink(content);
    let questions = [];

    while (questionLink !== undefined) {
        content = await getContent(questionLink);
        let questionData = getQuestionData(content);
        questionData.categoryId = categoryTitle;
        questions.push(questionData);
        questionLink = getNextQuestionLink(content);
    }
    return {
        id: categoryTitle,
        questions: questions,
    };
};

const insertQuestionCategoryToDb = async (categoryData) => {};

export const scrapeQuestions = async () => {
    try {
        let url =
            'https://www.scoalarutiera.ro/intrebari-posibile-drpciv-categoria-b/';
        let data = await getContent(url);

        const links = getCategoryLinks(data);
        return await Promise.all(
            links.map((link) => processCategoryLink(link))
        );
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};

export const populateQuestions = async () => {
    console.log('Scraping questions');
    const questionCategories = await scrapeQuestions();
    const client = await pool.connect();

    console.log('Populating question db');
    for (const questionCategory of questionCategories) {
        process.stdout.write(
            `Adding new question category: ${questionCategory.id}...`
        );
        try {
            // create new object, identical to old one, but with different images
            let questionCategoryWithImageIds = questionCategory;

            await Promise.all(
                questionCategoryWithImageIds.questions.map(async (question) => {
                    try {
                        if (question.image) {
                            const imageId = await saveImage(
                                question.image,
                                OUTPUT_DIR
                            );
                            question.image = imageId;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                })
            );

            await client.query('call insert_question_category($1::jsonb)', [
                JSON.stringify(questionCategoryWithImageIds),
            ]);
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }

    client.release();
    console.log('Finished adding question categories');
};
