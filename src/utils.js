import fs from "fs";
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {GLTFExporter} from "three/examples/jsm/exporters/GLTFExporter";

import {LoaderUtils} from 'three/build/three.module.js';

export function cleanAnimationNames(animations, fileName) {
    return animations.map((animation, index) => {
        let cleanName = fileName.split(".")[0].replace(/\s/g, "");
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        if (animations.length > 1) {
            cleanName += " " + index;
        }
        animation.name = cleanName;
        return animation;
    })
}

const loader = new FBXLoader();

export function parseFbxs(directory, {includeMainMeshAnimations}) {
    const files = fs.readdirSync(directory).filter(file => file.endsWith(".fbx"));

    let animations = [];
    let mainMesh = null;
    for (const file of files) {
        console.log(`Parsing ${file}...`);
        const mesh = loader.parse(fs.readFileSync(directory + "/" + file).buffer, LoaderUtils.extractUrlBase(file));
        const isMainMesh = mesh.children.some(c => c.type === "SkinnedMesh");
        if (isMainMesh) {
            mainMesh = mesh;
            if (includeMainMeshAnimations) {
                animations = [...cleanAnimationNames(mesh.animations, file), ...animations]
            }
        } else {
            animations = [...animations, ...cleanAnimationNames(mesh.animations, file)]
        }
    }

    if (mainMesh == null)
        throw new Error("Could not find main mesh")

    return {mainMesh, animations};
}

const exporter = new GLTFExporter();

export function gltfExport(mainMesh, animations, path) {
    exporter.parse(
        mainMesh,
        (result) => {
            const output = JSON.stringify(result, null, 2);
            fs.writeFileSync(path, output);
        },
        {trs: true, binary: false, animations: animations}
    );
}