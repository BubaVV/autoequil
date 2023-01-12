#!/usr/bin/env ts-node

const fs = require("fs");
const path = require("path");
const jimp = require("jimp");
require("emulators");

const emulators = global.emulators;
emulators.pathPrefix = path.join(process.cwd(), "node_modules/emulators/dist/");

if (process.argv.length >= 3) {
    var input_txt = process.argv[2]
}
else {
    console.log('Please provide filename as positional parameter')
    process.exit(1)
}

console.log('Input filename: %s', input_txt)

const bundle = fs.readFileSync("static/equil.jsdos");
emulators
    .dosDirect(bundle)
    .then(async (ci) => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.simulateKeyPress(32);  // pause before eq run
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.simulateKeyPress(340, 65);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(76);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(340, 79);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(88);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(46);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(84);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(88);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(84);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(257);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.simulateKeyPress(48);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(46);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(49);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(32);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(48);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(46);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(49);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(32);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(48);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(46);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(49);
        await new Promise(resolve => setTimeout(resolve, 50));
        await ci.simulateKeyPress(257);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.events().onStdout((message) => { console.log(message) });
        let rgba = new Uint8Array(0);
        ci.events().onFrame((_rgb, _rgba) => {
            rgba = _rgba;
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
        const width = ci.width();
        const height = ci.height();

        for (let next = 3; next < width * height * 4; next = next + 4) {
            rgba[next] = 255;
        }           

        console.log(rgba);

        new jimp({ data: rgba, width: width, height: height }, (err, image) => {
            image.write("./screenshot.png", () => {
                ci.exit();
            });
        });
    })
    .catch(console.error);