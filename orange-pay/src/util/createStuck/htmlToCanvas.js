import * as htmlToImage from "html-to-image";

export async function htmlToCanvas(element) {
  return htmlToImage.toCanvas(element, {
    pixelRatio: 2,
    cacheBust: true,
  });
}