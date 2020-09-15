import minimist from 'minimist';
import {convertToGltf} from "./fbx2three";

export async function cli(argsArray) {
    const args = minimist(argsArray.slice(2));
    const file = args._[0];

    if (args.help || args.h || args._.length !== 1) {
        help();
    } else {
        const scale = parseInt(args.scale || args.s || 100);
        convertToGltf(file, scale);
    }
}

function help() {
    console.log(`
mixamo-cli 1.0.0
Batch convert a directory containing fbx mixamo animations to gltf

USAGE:
    mixamo-cli ./path/to/my/dir
    
OPTIONS:
    -s, --scale     Divide the export scale by an integer factor. Default is 100, which will export the model at 1/100
                    of its size.

dir must be a directory containing a bunch of fbx files and one mixamo character (as a fbx file).
dir will not be recursively traversed, just one level deep.
`)
}