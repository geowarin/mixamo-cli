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

const mainFile = "resource/Abe-Loco/Ch39_nonPBR.fbx";
const resourceDirectory = LoaderUtils.extractUrlBase(mainFile);
const loader = new FBXLoader();

const mainMesh = loader.parse(fs.readFileSync(mainFile).buffer, resourceDirectory);

let animations = [...mainMesh.animations];

["Breathing Idle.fbx", "Running.fbx", "Walking.fbx"].forEach(animationFileName => {
    const mesh = loader.parse(fs.readFileSync("resource/Abe-Loco/" + animationFileName).buffer, resourceDirectory);
    animations = [...animations, ...mesh.animations.map(animation => {
        animation.name = animationFileName;
        return animation;
    })];
})

Promise.all(pending).then(() => {
    const exporter = new GLTFExporter();
    exporter.parse(
        mainMesh,
        (result) => {
            const output = JSON.stringify(result, null, 2);
            fs.writeFileSync(`mixamo-${new Date().getTime()}.gltf`, output);
        },
        {trs: true, binary: false, animations: animations}
    );
});