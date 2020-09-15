
import {pending} from "./mockWebStuff.js";
import path from 'path';
import {gltfExport, parseFbxs} from "./utils";

export function convertToGltf(directory, scale) {
    const {mainMesh, animations} = parseFbxs(directory);
    const {name: dirName} = path.parse(directory);

    console.log(`Animations: ${animations.map(a => a.name).join(",")}`);

    console.log(`Applying scaling factor ${1 / scale}`)
    mainMesh.scale.multiplyScalar(1 / scale);

    Promise.all(pending).then(() => {
        const path = `${dirName}-${new Date().getTime()}.gltf`;
        gltfExport(mainMesh, animations, path);
        console.log(`Successfully exported ${path}!`)
    });
}

