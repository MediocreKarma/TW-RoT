import jimp from 'jimp';
import http from 'http';
import https from 'https';
import fs from 'fs';
import { headers } from './utils.js';
import { v4 as uuid4 } from 'uuid';
import { sleep } from '../common/utils.js';

/**
 * Download the image content from the given url
 * 
 * @param {*} url 
 * @returns the image buffer
 */
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const chunks = [];
        protocol
            .get(url, { headers }, (response) => {

                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

/**
 * Merge multiple images into one single image, vertically
 * 
 * @param {*} imageBuffers the merging images
 * @param {*} transparent wether the background should be treated as transparent or not
 * @returns the merged image
 */
async function mergeImages(imageBuffers, transparent = true) {
    let images = await Promise.all(
        imageBuffers.map((image) => jimp.read(image))
    );
    if (images.length === 0) {
        return;
    }

    let widestImage = images[0];
    let biggestWidth = widestImage.getWidth();

    images.forEach((image) => {
        if (image.getWidth() > biggestWidth) {
            widestImage = image;
            biggestWidth = image.getWidth();
        }
    });

    images.forEach((image) => {
        if (image.getWidth() < biggestWidth) {
            image.resize(biggestWidth, jimp.AUTO);
        }
    });

    const mergedImage = new jimp(
        widestImage.getWidth(),
        images.reduce((acc, image) => acc + image.getHeight(), 0),
        transparent ? 0xffffff00 : 0xffffffff
    );

    let totalHeight = 0;

    images.forEach((image) => {
        mergedImage.composite(
            image,
            image === widestImage
                ? 0
                : Math.floor((biggestWidth - image.getWidth()) / 2),
            totalHeight
        );
        totalHeight += image.getHeight();
    });

    const pngBuffer = await mergedImage.getBufferAsync(jimp.MIME_PNG);
    return pngBuffer;
}

/**
 * Save an image to a given directory with a given image filename
 * 
 * @param {*} imageBuffer
 * @param {*} imageId represents the filename of the image, without the extension
 * @param {*} outputDirectory the directory to save the image to
 */
async function saveImageBuffer(imageBuffer, imageId, outputDirectory) {
    try {
        fs.accessSync(outputDirectory);
    } catch (error) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }
    const outputFilePath = `${outputDirectory}/${imageId}.png`;
    fs.writeFileSync(outputFilePath, imageBuffer);
}

/**
 * Function to merge a list of imageUrls and save them as one image
 * to the given output directory
 * 
 * @param {*} imageUrls 
 * @param {*} outputDirectory 
 * @returns the filename of the saved image, without the extension
 */
export async function saveWikiImages(imageUrls, outputDirectory) {
    const imageBuffers = await Promise.all(
        imageUrls.map(async (url) => {
            let attempts = 8;
            let latest_error;
            while (attempts--) {
                try {
                    const data = await downloadImage(url);
                    return data;
                } 
                catch (e) {
                    latest_error = e;
                }
                await sleep(1000);
            }
            throw latest_error;
        })
    );

    const buffer = await mergeImages(imageBuffers, true);

    const id = uuid4();
    saveImageBuffer(buffer, id, outputDirectory);

    return id;
}

/**
 * Save a given image by url to the given output directory
 * 
 * @param {*} imageUrl 
 * @param {*} outputDirectory 
 * @returns the image filename, without the extension 
 */
export async function saveImage(imageUrl, outputDirectory) {
    const imageBuffer = await downloadImage(imageUrl);

    const id = uuid4();
    saveImageBuffer(imageBuffer, id, outputDirectory);

    return id;
}
