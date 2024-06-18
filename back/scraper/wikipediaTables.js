import { DOMParser } from 'xmldom';
import { getContent, silencedDOMParserOptions } from './utils.js';
import xpath from 'xpath';
import { pool } from './db.js';
import { saveWikiImages } from './image.js';

const OUTPUT_DIR = '../modules/traffic-signs/images';

const silencedDOMParser = new DOMParser(silencedDOMParserOptions);

const processTableTitleNode = (tableTitleNode) => {
    if (tableTitleNode.nodeName === 'h3') {
        const children = Object.keys(tableTitleNode.childNodes)
            .filter((key) => key !== 'length')
            .map((key) => tableTitleNode.childNodes[key])
            .filter((node) => {
                const classAttribute = node.getAttribute('class');
                return classAttribute && classAttribute.includes('mw-headline');
            });
        return children[0].textContent.trim();
    } else {
        return tableTitleNode.textContent.trim();
    }
};

const getChildNodes = (node) => {
    return Object.keys(node.childNodes)
        .filter((key) => key !== 'length')
        .map((key) => node.childNodes[key])
        .filter((node) => node.toString());
};

const processSignRow = (signRow) => {
    let signRowData = {};

    const valuableItems = getChildNodes(signRow).filter(
        (node) => node.nodeName === 'td'
    );

    let startingIndex = 1;

    const signName = valuableItems[0].textContent.trim();
    if (signName === '') {
        startingIndex = 0;
    } else {
        signRowData.signName = signName;
    }

    signRowData.nodes = valuableItems.slice(startingIndex).map((tdNode) => {
        let tdData = {};

        let tdNodeString = tdNode.toString();
        let tdNodeDoc = silencedDOMParser.parseFromString(tdNodeString);

        const xImageNodes =
            "//a[contains(@class, 'mw-file-description')]//img/@src"; // get node.value

        const imageNodes = xpath.select(xImageNodes, tdNodeDoc);

        const sau = tdNode.textContent.trim();

        let images;
        if (sau === 'sau') {
            images = [imageNodes[0].value];
        } else {
            images = imageNodes.map((node) => node.value);
        }

        tdData.images = images.map((image) => 'https:' + image);

        let rowspan = tdNode.getAttribute('rowspan');
        if (rowspan === '') {
            rowspan = '1';
        }
        tdData.rowspan = parseInt(rowspan);

        return tdData;
    });
    // console.log(signImageNodes);

    return signRowData;
};

const processTableNode = (tableNode) => {
    const tableNodeDoc = silencedDOMParser.parseFromString(
        tableNode.toString()
    );
    const xPathRows = '//tr[not(.//small) and not(th)]';
    const xPathHeader =
        '//tr[(td[not(.//a) and not(.//img) and .//small]) or (th[not(.//a) and not(.//img) and .//small])]';

    const signRows = xpath.select(xPathRows, tableNodeDoc);
    const signHeaders = xpath.select(xPathHeader, tableNodeDoc);
    const signHeader = signHeaders[signHeaders.length - 1];

    let countryNodes = [];

    try {
        countryNodes = getChildNodes(signHeader).filter(
            (node) => node.nodeName === 'th' || node.nodeName === 'td'
        );
    } catch (error) {
        return null;
    }

    const countries = countryNodes
        .map((node) => node.textContent.trim())
        .filter(Boolean);

    // create matrix of arrays of images
    let infoMatrix = signRows.map((_) => []);

    let signRowData = signRows.map(processSignRow);

    for (let i = 0; i < infoMatrix.length; ++i) {
        const cellsOnCurrentRow = signRowData[i].nodes;
        let dataIndex = 0;

        for (let j = 0; j < countries.length; ++j) {
            if (infoMatrix[i][j] !== undefined) {
                continue;
            }
            const cellData = cellsOnCurrentRow[dataIndex];
            ++dataIndex;
            infoMatrix[i][j] = cellData.images;
            if (cellData.rowspan === 2) {
                infoMatrix[i + 1][j] = cellData.images;
            }
        }
    }

    // console.log("finishing up signRowData sign names...");
    // process signRowData to fill in missing names
    signRowData.forEach((rowData, index) => {
        if (index === signRowData.length - 1) {
            return;
        }

        if (rowData.signName === undefined) {
            rowData.signName = 'Indicator fără titlu';
            return;
        }
        if (signRowData[index + 1].signName === undefined) {
            signRowData[index + 1].signName = rowData.signName;
        }
    });

    // link infoMatrix data to signs and all
    return signRowData.map((rowData, rowIndex) => ({
        name: rowData.signName,
        // array of objects of type {country: "Belgia", images: <array of images>}
        variants: infoMatrix[rowIndex].map((cell, columnIndex) => ({
            country: countries[columnIndex],
            images: cell,
        })),
    }));
};

const processCategory = (tableNode) => {
    const tableTitleNode = tableNode.previousSibling.previousSibling;
    const tableTitle = processTableTitleNode(tableTitleNode);
    const tableData = processTableNode(tableNode);
    if (tableData === null) {
        return null;
    }
    return {
        category: tableTitle,
        signs: tableData,
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
            'https://ro.wikipedia.org/wiki/Compara%C8%9Bie_%C3%AEntre_indicatoarele_rutiere_din_Europa';
        const data = await getContent(url);
        return processWikiPage(data);
    } catch (error) {
        console.error(`[Wiki Tables] Error: ${error.message}`);
    }
};

export const populateComparisonTables = async () => {
    const comparisonTables = await scrapeWikiTables();
    const client = await pool.connect();
    for (const comparisonTable of comparisonTables) {
        process.stdout.write(
            `Adding new comparison category: ${comparisonTable.category}...\n`
        );
        try {
            let comparisonTableWithImageIds = comparisonTable;

            // iterative because otherwise Wikipedia gets scared of me
            for (
                let i = 0;
                i < comparisonTableWithImageIds?.signs?.length;
                ++i
            ) {
                let sign = comparisonTableWithImageIds?.signs[i];
                for (let j = 0; j < sign?.variants?.length; ++j) {
                    let variant = sign?.variants[j];
                    try {
                        if (variant.images.length === 0) {
                            continue;
                        }
                        const imageId = await saveWikiImages(
                            variant.images,
                            OUTPUT_DIR
                        );
                        variant.images = [imageId];
                    } catch (e) {
                        console.error('At ' + variant.images + '...');
                        console.error(e);
                        variant.images = [];
                    }
                }
            }

            await client.query('call insert_comparison_category($1::jsonb)', [
                JSON.stringify(comparisonTableWithImageIds),
            ]);
        } catch (e) {
            console.error(e);
        }
        process.stdout.write('Done\n');
    }
    client.release();
    console.log('Done populating comparison tables');
};
