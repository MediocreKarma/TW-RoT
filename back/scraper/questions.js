import { DOMParser } from "xmldom";
import { getContent, silencedDOMParserOptions } from "./utils.js";
import xpath from "xpath";

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const getQuestionData = (content) => {
  let doc = silencedDOMParser.parseFromString(content);

  let questionData = {};

  const questionNodes = xpath.select(
    "//*[contains(concat(' ', normalize-space(@class), ' '), ' question-title ')]",
    doc
  );

  const question = questionNodes[0].textContent;
  questionData.question = question;

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
    const dataCorrectValue = node.getAttribute("data-correct");
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
    const xmlResult = xpath.select(
      "//*[contains(concat(' ', normalize-space(@class), ' '), ' next_url ')]/@href",
      doc
    )[0].nodeValue;
    return xmlResult;
  } catch (error) {
    // default to regex. regex is bound to work :)
    const regex = /<a [^>]*class="[^"]*next_url[^"]*"[^>]*>/gimu;
    const firstMatch = content.match(regex);
    if (!firstMatch) {
      return undefined;
    }
    const hrefRegex = /href="([^"]+)"/gm;
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
  const splitLink = link.split("/");
  const categoryId = splitLink[splitLink.length - 2];
  let content = await getContent(link);
  let questionLink = getFirstQuestionLink(content);

  let questions = [];

  while (questionLink !== undefined) {
    content = await getContent(questionLink);
    let questionData = getQuestionData(content);
    questionData.categoryId = categoryId;
    questions.push(questionData);

    questionLink = getNextQuestionLink(content);
  }

  return {
    id: categoryId,
    questions: questions,
  };
};

export const scrapeQuestions = async () => {
  try {
    let url =
      "https://www.scoalarutiera.ro/intrebari-posibile-drpciv-categoria-b/";
    let data = await getContent(url);

    const links = getCategoryLinks(data);
    const questionData = await Promise.all(
      links.map((link) => processCategoryLink(link))
    );
    console.log(questionData);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};
