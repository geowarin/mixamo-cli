# Mixamo-cli

## Install

not published. Git clone and use npm link to install as a cli on your machine.

## Usage

```
mixamo-cli 1.0.0
Batch convert a directory containing fbx mixamo animations to gltf

USAGE:
    mixamo-cli ./path/to/my/dir

OPTIONS:
    -s, --scale         Divide the export scale by an integer factor. Default is 100, which will export the model at
                        1/100 of its size.
    -i, --includeMain   Include the main mesh animations (usually T-Pose and empty anim). Default is false.
    -o, --output        Define the output path of the gltf. If omitted, the output will be generated in the current
                        directory and its name will be based on the input path.
    -b, --binary        Convert to glb instead of gltf

dir must be a directory containing a bunch of fbx (animations) files and one mixamo character (as a fbx file).
dir will not be recursively traversed, just one level deep.

```