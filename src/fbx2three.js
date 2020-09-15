import {pending} from "./mockWebStuff";
import path from 'path';
import {gltfExport, parseFbxs} from "./utils";

const directory = "resource/Abe-Loco";

const {mainMesh, animations} = parseFbxs(directory);
const {name: dirName} = path.parse(directory);

console.log(`Animations: ${animations.map(a => a.name).join(",")}`);

mainMesh.scale.multiplyScalar(1 / 100);

Promise.all(pending).then(() => {
    const path = `${dirName}-${new Date().getTime()}.gltf`;
    gltfExport(mainMesh, animations, path)
});