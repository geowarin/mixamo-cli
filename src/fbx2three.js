import fs from 'fs';

import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFExporter} from "three/examples/jsm/exporters/GLTFExporter";
import {ImageLoader, LoaderUtils} from 'three/build/three.module.js';
import {Canvas, loadImage} from "canvas";

import {Blob, FileReader} from "../lib/vblob.js";

global.Blob = Blob;

const PRECISION = 6;
function parseNumber(key, value) {
    return typeof value === 'number' ? parseFloat(value.toFixed(PRECISION)) : value;
}

const pending = [];
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
global.document = {
    createElement: (nodeName) => {
        if (nodeName !== 'canvas') throw new Error(`Cannot create node ${nodeName}`);
        return new Canvas(256, 256);
    }
};


// HTML Images are not available, so use a Buffer instead.
ImageLoader.prototype.load = function (url, onLoad) {
    pending.push(
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

const file = "resource/Abe-Loco/Ch39_nonPBR.fbx";
const resourceDirectory = LoaderUtils.extractUrlBase(file);
const loader = new FBXLoader();
const exporter = new GLTFExporter();

const arraybuffer = fs.readFileSync(file).buffer;
const object = loader.parse(arraybuffer, resourceDirectory);

Promise.all(pending).then(() => {
    exporter.parse(
        object,
        (result) => {
            const content = (typeof result === 'object') ? JSON.stringify(result) : result;
            fs.writeFileSync(`mixamo-${new Date().getTime()}.gltf`, content);
        },
        {trs: true, binary: false, animations: object.animations}
    );
});