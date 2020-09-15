
import {pending} from "./mockWebStuff.js";
import path from 'path';
import {gltfExport, parseFbxs} from "./utils";

export function convertToGltf(directory) {
    const {mainMesh, animations} = parseFbxs(directory);
    const {name: dirName} = path.parse(directory);

    console.log(`Animations: ${animations.map(a => a.name).join(",")}`);

    mainMesh.scale.multiplyScalar(1 / 100);

    Promise.all(pending).then(() => {
        const path = `${dirName}-${new Date().getTime()}.gltf`;
        gltfExport(mainMesh, animations, path)
    });
}

