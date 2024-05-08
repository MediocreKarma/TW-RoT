import { DOMParser } from "xmldom";
import { getContent, silencedDOMParserOptions } from "./utils.js";
import xpath from "xpath";

// each module has its own DOM parser
const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const getChapterLinks = (content) => {
  let doc = silencedDOMParser.parseFromString(content);
  const chapterNodes = xpath.select(
    "//*[contains(@class, 'codul-rutier')]//*[contains(@class, 'card-link')]/@href",
    // "//*",
    doc
  );

  const links = [...chapterNodes.map((node) => node.nodeValue)];
  return links;
};

const processLinks = async (links) => {
  const processedData = await Promise.all(
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
  return processedData;
};

const processLink = async (link) => {
  const data = await getContent(link);
  const chapterData = getChapterData(data);
  return chapterData;
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
    const chapterLinks = getChapterLinks(indexData);
    console.log(await processLinks(chapterLinks));
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};
