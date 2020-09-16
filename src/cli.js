import minimist from 'minimist';
import {convertToGltf} from "./convertToGltf";

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
    console.log(`
mixamo-cli 1.0.0
Batch convert a directory containing fbx mixamo animations to gltf

USAGE:
    mixamo-cli ./path/to/my/dir
    
OPTIONS:
    -s, --scale         Divide the export scale by an integer factor. Default is 100, which will export the model at 
                        1/100 of its size.
    -i, --includeMain   Include the main mesh animations (usually T-Pose and empty anim). Default is false.

dir must be a directory containing a bunch of fbx (animations) files and one mixamo character (as a fbx file).
dir will not be recursively traversed, just one level deep.
`)
}