import {ImageLoader} from 'three/build/three.module.js';
import {Canvas, loadImage} from "canvas";

import {Blob, FileReader} from "../lib/vblob.js";

global.Blob = Blob;

const PRECISION = 6;
function parseNumber(key, value) {
    return typeof value === 'number' ? parseFloat(value.toFixed(PRECISION)) : value;
}

export const pendingImagesLoading = [];
const texturesMap = {};
global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    URL: {
        createObjectURL: function (blob) {
            const uuid = Math.random().toString(36).slice(2);
            const path = `${uuid}.png`;
            texturesMap[path] = blob;
            return path;
        }
    },
    FileReader: FileReader
};
// noinspection JSConstantReassignment
global.document = {
    createElement: (nodeName) => {
        if (nodeName !== 'canvas') throw new Error(`Cannot create node ${nodeName}`);
        return new Canvas(256, 256);
    }
};

ImageLoader.prototype.load = function (url, onLoad) {
    pendingImagesLoading.push(
        readAsArrayBuffer(texturesMap[url])
            .then(data => loadImage(Buffer.from(data)))
            .then(image => onLoad(image))
    );
};

function readAsArrayBuffer(blob) {
    return new Promise(resolve => {
        const fileReader = new FileReader();
        fileReader.addEventListener("load", e => {
            resolve(e.target.result);
        });
        fileReader.readAsArrayBuffer(blob);
    })
}
