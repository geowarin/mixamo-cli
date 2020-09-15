import * as THREE from 'three';

global.THREE = THREE;

import { GLTFLoader } from "three/examples/js/loaders/GLTFLoader";
import { GLTFExporter } from "three/examples/js/exporters/GLTFExporter";
import * as fs from "fs";

// const mainModel = fs.readFileSync("resources/default.glb");
const loader = new GLTFLoader();
const exporter = new GLTFExporter();

loader.load("resources/default.glb", (mainModel) => {
  exporter.parse(
      mainModel.scene,
      (result: any) => {
        console.log(result);
        fs.writeFileSync(`mixamo-${new Date().getTime()}.glb`, result);
      },
      { trs: true, binary: true, animations: mainModel.animations }
  );
});

