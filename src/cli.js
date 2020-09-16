import minimist from 'minimist';
import {convertToGltf} from "./convertToGltf";
import {readFileSync} from "fs";

export async function cli(argsArray) {
    const args = minimist(argsArray.slice(2));
    const file = args._[0];

    if (args.help || args.h || args._.length !== 1) {
        help();
    } else {
        const scale = parseInt(args.scale || args.s || 100);
        const includeMainMeshAnimations = args.includeMain || args.i || false;

        convertToGltf(file, {scale, includeMainMeshAnimations});
    }
}

function help() {
    console.log(__dirname);
    console.log(readFileSync(__dirname + "/help.txt").toString());
}