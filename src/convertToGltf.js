
import {pendingImagesLoading} from "./mockWebStuff.js";
import path from 'path';
import {gltfExport, parseFbxs} from "./utils";

export function convertToGltf(directory, {scale, includeMainMeshAnimations, outputPath, binary}) {
    const {mainMesh, animations} = parseFbxs(directory, {includeMainMeshAnimations});
    const {name: dirName} = path.parse(directory);

    console.log(`Animations: ${animations.map(a => a.name).join(",")}`);

    console.log(`Applying scaling factor ${1 / scale}`)
    mainMesh.scale.multiplyScalar(1 / scale);

    Promise.all(pendingImagesLoading).then(() => {
        const path = outputPath || (binary ? `${dirName}.glb` : `${dirName}.gltf`);
        gltfExport(mainMesh, animations, path, binary);
        console.log(`Successfully exported ${path}!`)
    });
}

