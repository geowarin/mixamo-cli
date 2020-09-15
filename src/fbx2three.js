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

function cleanAnimations(animations, fileName) {
    return animations.map((animation, index) => {
        if (animation.name === "Take 001") {
            animation.name = "T-Pose (No Animation)";
        } else if (fileName != null) {
            let cleanName = fileName.split(".")[0].replace(/\s/g, "");
            cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            if (animations.length > 1) {
                cleanName += " " + index;
             }
            animation.name = cleanName;
        }
    })
}

const directory = "resource/Abe-Loco";
const files = fs.readdirSync(directory).filter(dir => dir.endsWith(".fbx"));

const loader = new FBXLoader();
let animations = [];
let mainMesh = null;

for (const file of files) {
    const mesh = loader.parse(fs.readFileSync(directory + "/" + file).buffer, LoaderUtils.extractUrlBase(file));
    const isMainMesh = mesh.children.some(c => c.type === "SkinnedMesh");
    if (isMainMesh) {
        mainMesh = mesh;
        const mainAnimations = mesh.animations.filter(anim => anim.name === "Take 001");
        animations = [...mainAnimations, ...animations]
    } else {
        animations = [...animations, ...mesh.animations]
    }
}

if (mainMesh == null)
    throw new Error("Could not find main mesh")

mainMesh.scale.multiplyScalar(1 / 100);

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