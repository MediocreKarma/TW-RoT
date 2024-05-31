import { DOMParser } from "xmldom";
import https from "https";

export const silencedDOMParserOptions = {
  locator: {},
  errorHandler: {
    warning: function (w) {},
    error: function (e) {},
    fatalError: function (e) {
      console.error(e);
    },
  },
};

export const getContent = async (url) => {
  let data = "";
  await new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(res);
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });

  return data;
};

export const stringToKebabCase = (string) =>
  string
    .toLowerCase()
    .replace(/[ăâ]/g, "a") // replace ă and â with a
    .replace(/[șş]/g, "s") // replace s-comma and s-cedilla with s
    .replace(/[ţț]/g, "t") // replace t-comma and t-cedilla with t
    .replace(/[î]/g, "i") // replace i circumflex with i
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

export const romanNumeralToInt = (numeral) => {
  const ROMAN_HASH = {
    M: 1000,
    D: 500,
    C: 100,
    L: 50,
    X: 10,
    V: 5,
    I: 1,
  };
  let number = 0;
  for (let i = 0; i < numeral.length - 1; i++) {
    if (ROMAN_HASH[numeral[i]] < ROMAN_HASH[numeral[i + 1]]) {
      number -= ROMAN_HASH[numeral[i]];
    }
    else {
      number += ROMAN_HASH[numeral[i]];
    }
  }
  return number + ROMAN_HASH[numeral[numeral.length - 1]];
};