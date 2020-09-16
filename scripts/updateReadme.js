import format from "string-template";
import * as fs from "fs";
import {exec} from "child_process";

const readme = format(fs.readFileSync("readme.tpl.md").toString(), {
    usage: fs.readFileSync("src/help.txt").toString()
})

fs.writeFileSync("readme.md", readme);

exec("git add readme.md")