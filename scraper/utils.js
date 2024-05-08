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
