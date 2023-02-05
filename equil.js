const fs = require("fs");
const path = require("path");
const process = require('process');
require("emulators");
var AdmZip = require("adm-zip");

const emulators = global.emulators;
emulators.pathPrefix = path.join(process.cwd(), "node_modules/emulators/dist/");

// sleep in ms between sent keystrokes. Should be more than frame interval (?)
const KEY_DELAY = 50;
const keycode = require("keycode");
keycode.codes["."] = 46; // patches for dosbox keycodes
keycode.codes[" "] = 32;

async function press_Str(ci, input){
    if(typeof input !== 'string') {
        const input = String(input);
    }
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

function parse_input(data){
    const NUMBERS_REGEX = /m\s*=\s*\d+\s+s\s*=\s*\d+/;  // m = 3  s =12
    const PRIMARY_REGEX = /m\s*=\s*\d+/; // m = 3
    const COMPS_REGEX = /s\s*=\s*\d+/; // s =12

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
        const str_line = table[line].trim().replace(/\s+/g, " ").split(" ")
        comps[line+1] = str_line.slice(0, -1).map(x => Number(x));
        logk[line+1] = Number(str_line.slice(-1)[0]);
    }


    let result = {
        "title": title,     
        "primary_comps_number": primary_comps_number,     
        "comps_number": comps_number,     
        "primary_names": primary_names,     
        "comps": comps,    // TODO rename to consts everywhere, mistype
        "logk": logk,
    };

    return result;
}

function render_input(data){
    let res = data.title + '\n';
    res += `m=${data.primary_comps_number} s=${data.comps_number} \n`
    for (let i=0; i<data.primary_names.length; i++){
        res += `${data.primary_names[i]} `;
    }
    res += 'LOG(BET)\n';

    for (const [key, comps_line] of Object.entries(data.comps)) {
        for (let j=0; j<comps_line.length; j++) {
            res += `${comps_line[j]} `;
        }
        res += `${data.logk[key]}\n`;
    }

    return res;
}

function build_bundle(data){
    const fdata = render_input(data);
    var bundle = new AdmZip();
    bundle.addLocalFolder('bundle/.jsdos', '.jsdos');
    bundle.addLocalFile('equil/eq1_1.exe');
    bundle.addFile('data.txt', fdata);
    return bundle.toBuffer();
}

function parse_answers(data){
    const CONC_REGEX = /c\[\s*\d*\]=\d\.\d{3}e-?\d{2}/g; // c[ 4]=6.387e-02
    const BUFFER_REGEX = /p\s*=\s*\d\.\d{3}e-?\d{2}/; // p = 6.493e-02

    const buffer = Number(data.match(BUFFER_REGEX)[0].split('=')[1]);
    const concs_str = data.match(CONC_REGEX);

    let concs = {};
    for (let i=0;i<concs_str.length;i++){
        let comp_str, conc_str;
        [comp_str, conc_str] = concs_str[i].split('=');
        concs[Number(comp_str.match(/\d+/)[0])] = Number(conc_str);
    }

    return {'buffer': buffer, 'concs': concs};
}

async function run_equil(concs, bundle, fname='data.txt'){
    const ci = await emulators.dosDirect(bundle);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await ci.simulateKeyPress(32);  // pause before eq run
    await new Promise(resolve => setTimeout(resolve, 2000));
    await press_Str(ci, fname);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const rendered_concs = concs.map(x => String(x)).join(" ");
    await press_Str(ci, rendered_concs);
    await new Promise(resolve => setTimeout(resolve, 2000));
    var eq_output = '';
    await ci.events().onStdout((message) => {
        eq_output += message;
        });
    await ci.exit();
    return parse_answers(eq_output);
}

if (process.argv.length >= 3) {
    var input_txt = process.argv[2]
    var input_concs = process.argv.slice(3).map(x => Number(x));
}
else {
    console.log('Please provide filename as positional parameter')
    process.exit(1)
}

// console.log('Input filename: %s', input_txt)
// console.log('Input concentrations: %s', input_concs)

const input_data = fs.readFileSync(input_txt, "ascii");
let ans = parse_input(input_data);
if (input_concs.length != ans.primary_comps_number) {
    console.log('%d concentrations passed, but %d required', 
        input_concs.length, ans.primary_comps_number);
    process.exit(1);
}

const bundle = build_bundle(ans);
run_equil(input_concs, bundle).then(async (output) => {
    ans['equil'] = await output;
    ans['equil']['primary_concs'] = input_concs;
    console.log(JSON.stringify(ans));
})
.catch(err => console.log('Error: %s', err));