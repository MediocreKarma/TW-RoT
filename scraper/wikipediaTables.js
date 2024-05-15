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

  let startingIndex = 1;

  const signName = valuableItems[0].textContent.trim();
  if (signName === "") {
    startingIndex = 0;
  } else {
    signRowData.signName = signName;
  }

  const signImageNodes = valuableItems.slice(startingIndex).map((tdNode) => {
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
  // console.log(signImageNodes);

  return signRowData;
};

const processTableNode = (tableNode, index) => {
  console.log("Processing table node");

  let timesWhenDifferent = 0;
  const tableNodeDoc = silencedDOMParser.parseFromString(tableNode.toString());

  const xPathRows = "//tr[not(.//small) and not(th)]";
  const xPathHeader =
    "//tr[(td[not(.//a) and not(.//img) and .//small]) or (th[not(.//a) and not(.//img) and .//small])]";

  const signRows = xpath.select(xPathRows, tableNodeDoc);
  const signHeaders = xpath.select(xPathHeader, tableNodeDoc);
  const signHeader = signHeaders[signHeaders.length - 1];
  // console.log(signHeader.toString());

  let countryNodes = [];

  try {
    countryNodes = getChildNodes(signHeader).filter(
      (node) => node.nodeName === "th" || node.nodeName === "td"
    );
  } catch (error) {
    return null;
  }

  const countries = countryNodes
    .map((node) => node.textContent.trim())
    .filter(Boolean);

  console.log(countries);

  let infoMatrix = signRows.map((_) => []);

  const signRowData = signRows.map(processSignRow);

  for (let i = 0; i < infoMatrix.length; ++i) {
    // console.log("------------------- " + i);
    const cellsOnCurrentRow = signRowData[i].nodes;
    // console.log(signRowData[i].signName);
    let dataIndex = 0;
    // console.log("countries length " + countries.length);
    // console.log("nodes on row length " + nodesOnCurrentRow.length);

    for (let j = 0; j < countries.length; ++j) {
      // console.log("J " + j);
      if (infoMatrix[i][j] !== undefined) {
        // se afla deja ceva aici. skip
        // console.log("SKIPPING");
        continue;
      }
      // console.log("data index " + dataIndex);
      const cellData = cellsOnCurrentRow[dataIndex];
      ++dataIndex;
      if (cellData === undefined) {
        console.log(
          "table index : " +
            index +
            "; i j = " +
            i +
            " " +
            j +
            "; dataIndex: " +
            dataIndex +
            "; countries length: " +
            countries.length +
            "; rowData len " +
            cellsOnCurrentRow.length
        );
      }
      infoMatrix[i][j] = cellData.images;
      if (cellData.rowspan == 2) {
        // nu putem avea 3. Nu cred anyway. te rog eu sa inlocuiesti cu un loop daca gresesc ca eu nu mai pot cu spaghetti code ul istav
        infoMatrix[i + 1][j] = cellData.images;
      }
    }
    if (cellsOnCurrentRow.length != dataIndex) {
      // console.log(
      //   nodesOnCurrentRow.length +
      //     " <- rowdata length; dataIndex -> " +
      //     dataIndex
      // );
      timesWhenDifferent++;
    }
  }

  console.log(timesWhenDifferent);
  // console.log(signRowData[0]);

  return infoMatrix;
};

const processCategory = (tableNode, index) => {
  const tableTitleNode = tableNode.previousSibling.previousSibling;
  const tableTitle = processTableTitleNode(tableTitleNode);
  const tableData = processTableNode(tableNode, index);
  if (tableData === null) {
    return null;
  }
  return {
    category: tableTitle,
    data: tableData,
  };
};

const processWikiPage = (content) => {
  let doc = silencedDOMParser.parseFromString(content);

  const tableNodes = xpath.select(
    "//h3[span]/following-sibling::table[contains(@class, 'wikitable')]",
    doc
  );

  return tableNodes.map(processCategory).filter(Boolean);
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
