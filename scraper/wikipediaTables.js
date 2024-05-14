import { DOMParser } from "xmldom";
import { getContent, silencedDOMParserOptions } from "./utils.js";
import xpath from "xpath";

const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const processTableTitleNode = (tableTitleNode) => {
  if (tableTitleNode.nodeName === "h3") {
    const children = Object.keys(tableTitleNode.childNodes)
      .filter((key) => key !== "length")
      .map((key) => tableTitleNode.childNodes[key])
      .filter((node) => {
        const classAttribute = node.getAttribute("class");
        return classAttribute && classAttribute.includes("mw-headline");
      });
    return children[0].textContent.trim();
  } else {
    return tableTitleNode.textContent.trim();
  }
};

const getChildNodes = (node) => {
  return Object.keys(node.childNodes)
    .filter((key) => key !== "length")
    .map((key) => node.childNodes[key])
    .filter((node) => node.toString());
};

const processSignRow = (signRow) => {
  let signRowData = {};

  const valuableItems = getChildNodes(signRow).filter(
    (node) => node.nodeName === "td"
  );

  signRowData.signTitle = valuableItems[0].textContent.trim();

  const signImageNodes = valuableItems.slice(1).map((tdNode) => {
    let tdData = {};

    let tdNodeString = tdNode.toString();
    let tdNodeDoc = silencedDOMParser.parseFromString(tdNodeString);

    const xImageNodes = "//a[contains(@class, 'mw-file-description')]/@href"; // get node.value

    const imageNodes = xpath.select(xImageNodes, tdNodeDoc);

    const sau = tdNode.textContent.trim();

    let images = [];
    if (sau === "sau") {
      images = [imageNodes[0].value];
    } else {
      images = imageNodes.map((node) => node.value);
    }

    tdData.images = images;

    let rowspan = tdNode.getAttribute("rowspan");
    if (rowspan === "") {
      rowspan = "1";
    }
    tdData.rowspan = parseInt(rowspan);

    return tdData;
  });

  signRowData.nodes = signImageNodes;
  console.log(signImageNodes);

  return signRowData;
};

const processTableNode = (tableNode) => {
  const tableNodeDoc = silencedDOMParser.parseFromString(tableNode.toString());

  const xPathRows = "//tr[not(th)]";
  const xPathHeader = "//tr[th[not(descendant::img)]]";

  const signRows = xpath.select(xPathRows, tableNodeDoc);
  const signHeader = xpath.select(xPathHeader, tableNodeDoc)[0];

  const countryNodes = Object.keys(signHeader.childNodes)
    .filter((key) => key !== "length")
    .map((key) => signHeader.childNodes[key])
    .filter((node) => node.nodeName === "th");

  const countries = countryNodes
    .map((node) => node.textContent.trim())
    .filter(Boolean);

  let infoMatrix = signRows.map((_) => []);

  const signRowData = signRows.map(processSignRow);
  // console.log(signRowData[0]);
};

const processCategory = (tableNode) => {
  const tableTitleNode = tableNode.previousSibling.previousSibling;
  const tableTitle = processTableTitleNode(tableTitleNode);
  const tableData = processTableNode(tableNode);
  return {
    category: tableTitle,
  };
};

const processWikiPage = (content) => {
  let doc = silencedDOMParser.parseFromString(content);

  const tableNodes = xpath.select(
    "//h3[span]/following-sibling::table[contains(@class, 'wikitable')]",
    doc
  );

  return [tableNodes[1]].map(processCategory);
};

export const scrapeWikiTables = async () => {
  try {
    const url =
      "https://ro.wikipedia.org/wiki/Compara%C8%9Bie_%C3%AEntre_indicatoarele_rutiere_din_Europa";
    const data = await getContent(url);
    const result = processWikiPage(data);
    console.log(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};
