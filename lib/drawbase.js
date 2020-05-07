let MAINLOOP = 0; //id of the mainloop interval
let FPS = 60; //the per second interval set for mainloop
let LOOPING = false; //loop is running or not
let LOCAL = true;
let width = window.innerWidth;
let height = window.innerHeight;
let LAST_TIME = 0;
let alphabet = "abcdefghijklmnopqrstuvwxyz";
async function loadFileFromServer(name, url, callback) {
    let localhost = "http://localhost:3000";
    if (!LOCAL) {
        localhost = "";
    }
    let response = await fetch(url || localhost + "/test/" + name);
    console.log("file " + name + " recieved");
    callback();
    let blob = await response.blob();
    callback();
    let r = new FileReader();
    return new Promise(resolve => {
        r.onload = x => {
            console.log("file " + name + " processed");
            resolve(r.result);
        };
        r.readAsText(blob);
    });
}

function id(string) {
    return document.getElementById(string);
}
function jlog(obj) {
    console.log(JSON.stringify(obj));
}
function clog(obj) {
    console.log(JSON.parse(JSON.stringify(obj)));
}
function l(thing) {
    console.log(thing);
}
function loop(){
    console.log('loop function not defined');
    stop();
}
function dloop(fn, n) {
    for (let i = 0; i < n; i++) {
        requestAnimationFrame(() => requestAnimationFrame(() => fn()));
    }
}

function setup() {}

function start_old() {
    MAINLOOP = setInterval(loop, 1000 / FPS);
    LOOPING = true;
}
function start() {
   // MAINLOOP = setInterval(loop, 1000 / FPS);
    LAST_TIME = window.performance.now();
    LOOPING = true;
    requestAnimationFrame(loop);
}
function stop() {
    clearInterval(MAINLOOP);
    LOOPING = false;
}
function restart() {
    stop();
    setup();
    start();
}

//creates a download popup of a text file with the json put into content
function download(content, fileName) {
    let data = JSON.stringify(content);
    let url = URL.createObjectURL(new Blob([data], { type: "text/json" }));
    let dlAnchorElem = document.createElement("a");
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.setAttribute("href", url);
    dlAnchorElem.setAttribute("download", fileName);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
}
function drawImage(ctx, data, w, h, pixelsize, isRGBA) {
    let upscale = pixelsize || 4;
    let width = (w || 28) * upscale;
    let height = (h || 28) * upscale;
    let pixels = ctx.createImageData(width, height);
    let count = 0 - width * 4 * (upscale - 1);
    if (!isRGBA) {
        data.forEach((pixel, i) => {
            if (i % (width / upscale) === 0) count += width * 4 * (upscale - 1);
            let pixel_index_array = [];
            for (let k = 0; k < upscale; k++) {
                pixel_index_array.push(width * 4 * k + i * 4 * upscale + count);
            }
            for (let j = 0; j < 4 * upscale; j++) {
                pixel_index_array.forEach(index => {
                    pixels.data[index + j] = pixel;
                    if ((j + 1) % 4 === 0) {
                        pixels.data[index + j] = 255;
                    }
                });
            }
        });
    } else {
        data.forEach((pixel, i) => {
            if (i % width === 0) count += width * 4 * (upscale - 1);
            let pixel_index_array = [];
            for (let k = 0; k < upscale; k++) {
                pixel_index_array.push(width * 4 * k + i * upscale + count);
            }
            for (let j = 0; j < upscale; j++) {
                pixel_index_array.forEach(index => {
                    pixels.data[index + j * upscale] = pixel;
                });
            }
        });
    }

    ctx.putImageData(pixels, 0, 0);
}
function drawImageRGB(ctx, r, g, b, w, h, pixelsize) {
    let upscale = pixelsize || 4;
    let width = (w || 28) * upscale;
    let height = (h || 28) * upscale;
    let pixels = ctx.createImageData(width, height);
    let count = 0 - width * 4 * (upscale - 1);

    r.forEach((pixel, i) => {
        if (i % (width / upscale) === 0) count += width * 4 * (upscale - 1);
        let pixel_index_array = [];
        for (let k = 0; k < upscale; k++) {
            pixel_index_array.push(width * 4 * k + i * 4 * upscale + count);
        }
        for (let j = 0; j < upscale; j++) {
            pixel_index_array.forEach(index => {
                pixels.data[index + j * 4] = r[i];
                pixels.data[index + 1 + j * 4] = g[i];
                pixels.data[index + 2 + j * 4] = b[i];
                pixels.data[index + 3 + j * 4] = 255;
            });
        }
    });

    ctx.putImageData(pixels, 0, 0);
}
function loadCSV(csv) {
    let lines = csv.split("\n");
    let arrays = lines.map(x => {
        return x.split(",");
    });
    let nums = [];
    arrays.forEach(arr => {
        let n = {};
        n.label = arr.splice(0, 1)[0];
        n.pixels = arr;
        nums.push(n);
    });
    return nums;
}
// returns an array with ${max} values, all 0, with value n being 1
// used for machine learning, aka one-hot vector
function enumerate(n, max) {
    n = parseInt(n);
    if (n < 0 || n > max - 1) {
        return 0;
    }
    return Array(max)
        .fill(0)
        .map((x, i) => {
            if (n === i) {
                return 1;
            } else {
                return 0;
            }
        });
}


//does the opposite of enumerate
function denumerate(arr) {
    if (arr instanceof Array) {
        return argMax(arr);
    }
}

//returns the index of the largest value in an array
function argMax(arr) {
    return arr.indexOf(arr.reduce((a, b) => Math.max(a, b)));
}

function getRandom(item){
    if(arguments.length===1) {
        if (item instanceof Array) {
            return item[Math.random() * item.length | 0]
        }
        if (typeof item === 'number') {
            return Math.random() * item | 0
        }
    }else if(arguments.length === 2){
        return Math.random()*(arguments[1] - arguments[0]) + arguments[0];
    }
}

function shuffle(input){
    let array = Array.from(input);
    let ind = array.length;
    while(ind !==0){
        let rand = Math.random()*ind |0;
        ind--;
        let temp = array[ind];
        array[ind] = array[rand];
        array[rand] = temp;
    }
    return array;
}

function diff2word(num){
   switch(num){
       case 0:
       return 'easy'
       case 1:
       return 'med'
       case 2: 
       return 'hard'
       case 3:
       return 'crazy'
       default:
       return 'ezpz'
   
   }

}

class ErrorHandler {
    constructor(error) {
        this.err = [];
        if(arguments.length>1){
            for(let arg of arguments){
                this.err.push(arg);
            }
        }else{
            this.err = [error];
        }
        this.error = this.err;
        this.log();
        this.stopLoop();
    }
    log() {
        console.error(...this.err);
    }
    stopLoop() {
        stop();
    }
}