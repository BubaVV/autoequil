#!/usr/bin/env ts-node

const fs = require("fs");
const path = require("path");
require("emulators");

const emulators = global.emulators;
emulators.pathPrefix = path.join(process.cwd(), "node_modules/emulators/dist/");

const KEY_DELAY = 50; // sleep between sent keystrokes. Should be more than frame interval (?)
const keycode = require("keycode");
const { resourceLimits } = require("worker_threads");
keycode.codes["."] = 46; // patches for dosbox keycodes
keycode.codes[" "] = 32;

async function press_Str(ci, input){
    if(typeof input !== 'string') {
        const input = String(input);
    }
    console.log(input)
    for (var i = 0; i < input.length; i++) {
        const character = input[i];
        if (character == character.toUpperCase() && !(character in keycode.codes)) {
            await ci.simulateKeyPress(340, keycode.codes[character.toLowerCase()]);
        }
        else {
            await ci.simulateKeyPress(keycode.codes[character]);
        }
        await new Promise(resolve => setTimeout(resolve, KEY_DELAY));
    }
    await ci.simulateKeyPress(257); // Enter to submit
    await new Promise(resolve => setTimeout(resolve, KEY_DELAY));
    
}

function is_parenthesis(input) {
    // Al -> Al
    // PO4 -> (PO4)
    if (/\d/.test(input)) {
        return true;
    }
    const caps = input.match(/[A-Z]/);
    if (caps && caps[0] >=2) {
        return true;
    }
    return false;
}

function parse_input(fname){
    const NUMBERS_REGEX = /m\s*\=\s*\d+\s+s\s*\=\s*\d+/;  // m = 3  s =12
    const PRIMARY_REGEX = /m\s*\=\s*\d+/; // m = 3
    const COMPS_REGEX = /s\s*\=\s*\d+/; // s =12

    const data = fs.readFileSync(fname, "ascii");
    const pre_parsed = data.split(NUMBERS_REGEX);
    const title = pre_parsed[0].trim();

    const numbers = data.match(NUMBERS_REGEX)[0];
    const primary_comps_number = Number(numbers.match(PRIMARY_REGEX)[0].split("=")[1]);
    const comps_number = Number(numbers.match(COMPS_REGEX)[0].split("=")[1]);

    const primary_names = pre_parsed[1].trim().split("\n")[0].trim().replace(/\s+/g, " ").split(" ").slice(0, -1);

    const table = pre_parsed[1].trim().split("\n").slice(1);

    let comps = {};
    let logk = {};
    for (let line=0; line<table.length; line++) {
        console.log(table[line]);
        const str_line = table[line].trim().replace(/\s+/g, " ").split(" ")
        comps[line+1] = str_line.slice(0, -1);
        logk[line+1] = str_line.slice(-1)[0];
    }


    let result = {
        "title": title,     
        "primary_comps_number": primary_comps_number,     
        "comps_number": comps_number,     
        "primary_names": primary_names,     
        "comps": comps,    
        "logk": logk,
    };

    return result;
}

const ans = parse_input('equil/AlOx.txt');
console.log(ans);
// console.log(is_parenthesis('Al'))
// console.log(is_parenthesis('Fe2O3'))
// console.log(is_parenthesis('H'))
// console.log(is_parenthesis('C2O4'))
// console.log(is_parenthesis('PO4'))
process.exit(1);

if (process.argv.length >= 3) {
    var input_txt = process.argv[2]
}
else {
    console.log('Please provide filename as positional parameter')
    process.exit(1)
}

console.log('Input filename: %s', input_txt)

const data = fs.readFileSync('equil/AlOx.txt', 'utf8');
process.exit(1);

const bundle = fs.readFileSync("static/equil.jsdos");
emulators
    .dosDirect(bundle)
    .then(async (ci) => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.simulateKeyPress(32);  // pause before eq run
        await new Promise(resolve => setTimeout(resolve, 5000));
        await press_Str(ci, 'AlOx.txt');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await press_Str(ci, String(0.1) + " " + String(0.1) + " " + String(0.1));
        await new Promise(resolve => setTimeout(resolve, 5000));
        await ci.events().onStdout((message) => { console.log(message) });
        await ci.exit();

    })
    .catch(console.error);