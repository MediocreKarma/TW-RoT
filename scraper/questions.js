import { getContent, silencedDomParser } from "./utils.js";
import xpath from "xpath";

const getQuestionData = (content) => {
  let doc = silencedDomParser.parseFromString(content);

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
    let doc = silencedDomParser.parseFromString(content);
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

// get the "incepe intrebari" tag
const getFirstQuestionLink = (content) => {
  let doc = silencedDomParser.parseFromString(content);
  return xpath.select(
    "//span[contains(text(), 'mediul GENERAL')]/parent::*/@href",
    doc
  )[0].nodeValue;
};

export const scrapeQuestions = async (url) => {
  try {
    let data = await getContent(url);

    let dataUrl = getFirstQuestionLink(data);
    while (dataUrl !== undefined) {
      //   writeStream.write(dataUrl + "\n");
      // URL of question on scoalarutiera.ro
      console.log(dataUrl);

      data = await getContent(dataUrl);
      // question data, as scraped from scoalarutiera.ro. can be then added to a database or whatever
      // (as long as the image content is also saved, because getContent only returns the image url)
      console.log(getQuestionData(data));

      dataUrl = getNextQuestionLink(data);
    }

    // writeStream.end();
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};
