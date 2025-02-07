import { THREE } from './app.js'

// pad numbers
function pad(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

// useful to show floats
function padf(num, size) {
    let s = num.toFixed(1);
    while (s.length < size) s = " " + s;
    return s;
}

const canvasSize = 128; // Resolution of Texture
const canvasWidth = 2;
const canvashHeight = 0.1;   // small height - change here if you want to see more


export function billboard(parent) {
    let that = {};
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");
    canvas.width = canvasSize * canvasWidth;
    canvas.height = canvasSize * canvashHeight;

    // a plane with a canvas texture
    let material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    material.map = new THREE.CanvasTexture(canvas);
    let mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvasWidth, canvashHeight, 1, 1), material);

    // position relative to parent! <-- adjusted for camera as head-up-display
    mesh.position.set(0, 0.2, -1.5);
    parent.add(mesh);

    // font parameters
    const fontSize = 6;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.font = fontSize + "pt Monospace";
    context.strokeStyle = "white";
    let needsUpdate = false;
    let lines = [];

    // calc max number of text lines
    const MAXLEN = Math.floor(canvas.height / (fontSize));

    // add a line of text
    that.addLine = function (text) {
        needsUpdate = true;
        lines.unshift(text); // store in front
        if (lines.length > MAXLEN) {
            lines.pop(); // remove from back
        }
    };

    that.addLine(``);

    that.clear = function () {
        lines = [];
        needsUpdate = true;
    };

    let touchX = 0, touchY = 0;
    that.touchpad = function (x, y) {
        if (x !== touchX) {
            touchX = x;
            needsUpdate = true;
        }
        if (y !== touchY) {
            touchY = y;
            needsUpdate = true;
        }
    }


    // draw the canvas, only if necessary -> then update the material, too!
    that.draw_canvas = function () {
        if (needsUpdate) {
            needsUpdate = false;
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < lines.length; ++i) {
                let txt = lines[i];
                context.fillStyle = "white";
                context.globalAlpha = 0.5; // semi-transparent
                context.fillRect(0, i * (fontSize + 4), context.measureText(txt).width + 5, fontSize + 4);

                context.globalAlpha = 1.0;  // no transparency
                context.fillStyle = "blue";
                context.fillText(txt, 5, (i + 1) * (fontSize + 4) - 5);
            }
            material.map.needsUpdate = true;
            material.needsUpdate = true;
        }
    };
    return that;
}
