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
    .replace(/[î]/g, "i") // replace i circonflex with i
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
