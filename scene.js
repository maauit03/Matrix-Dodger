import { THREE } from './app.js'
import { GLTFLoader } from './three/build/GLTFLoader.js';

/////////////////////////////////////////////////
/// BASIC SETUP: scene, camera, renderer
const path = 'assets/skybox/';
const format = ".jpg";
const urls = [path + "posx" + format, path + "negx" + format, path + "posy" + format, path + "negy" + format, path + "posz" + format, path + "negz" + format];
const reflectionCube = new THREE.CubeTextureLoader().load(urls);
const refractionCube = new THREE.CubeTextureLoader().load(urls);
refractionCube.mapping = THREE.CubeRefractionMapping;

export function create_scene() {
    let scene = new THREE.Scene();

    //Light
    scene.add(new THREE.HemisphereLight(0x202020, 0x606060));
    let light = new THREE.DirectionalLight(0xffffff, .4);
    light.position.set(0, 6, -8);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add(light);

    let light2 = new THREE.DirectionalLight(0xffffff, .4);
    light2.position.set(0, 6, 8);
    light2.castShadow = true;
    light2.shadow.mapSize.width = 1024;
    light2.shadow.mapSize.height = 1024;
    scene.add(light2);
    //Background cubemap
    scene.background = reflectionCube;
    scene.receiveShadow = true;

    //Camera
    let camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1, 3);
    scene.add(camera);


    //Action 
    let renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    return { scene, camera, renderer };
}

/////////////////////////////////////////////////
/// GEOMETRY OBJECTS

export function create_geometry(scene) {

    // navigation 
    let world = new THREE.Group();
    world.matrixAutoUpdate = false;
    scene.add(world);

    const loader = new GLTFLoader();
    //load CURSOR GUN
    let cursorMesh = loader.load('assets/handgun.glb', function(glb){
        glb.scene.traverse( function (node){
            if (node.isMesh) { node.castShadow = true;} 
        })

        const handgun = glb.scene;
        handgun.position.y  = -0.065
        handgun.rotation.y = Math.PI / 2
        handgun.scale.set(0.2, 0.2, 0.2);

        cursor.add(handgun);
        return handgun


    }, undefined, function ( error ) {
        console.error( error );
    } );
    console.log("handgun " + cursorMesh)
    let cursor = new THREE.Group();
    cursor.position.y = 1;
    scene.add(cursor);

    return { cursor, world };
}



//create Bullets
export function create_projectile(world) {
    //create Projectile Box
    const material = new THREE.MeshStandardMaterial({
      color:  0xf04a3c  ,
      roughness: 0.7,
      metalness: 0.8,
    });
    let projectile = new THREE.Mesh(new THREE.SphereGeometry(0.05, 50, 50, 0, Math.PI * 4, 0, Math.PI * 4), material);
    projectile.castShadow = true;
    projectile.name = "projectile";
  
    return { projectile };
  }


let geometries = {
    box: new THREE.BoxBufferGeometry(0.25, 0.25, 0.25),
    knot: new THREE.TorusKnotBufferGeometry(10, 3, 100, 16),
    cone: new THREE.ConeBufferGeometry(0.2, 0.4, 64),
    cylinder: new THREE.CylinderBufferGeometry(0.2, 0.2, 0.2, 64),
    plane: new THREE.PlaneGeometry(100, 100, 1),
    sphere: new THREE.IcosahedronBufferGeometry(0.2, 3),
    torus: new THREE.TorusBufferGeometry(0.2, 0.04, 64, 32)
};

let colors = {
    red: 0xff0000,
    orange: 0xff4700,
    yellow: 0xffff00,
    green: 0x84ff00,
    darkgreen: 0x286940,
    blue: 0x00FFF9,
    darkblue: 0x0006FF,
    purple: 0x8800ff,
    darkred: 0xCD111F,
    white: 0xffffff,
    black: 0x000000,
    gray: 0x808080
}

export function factory(parent, type, colorName, doAutoUpdaten = false) {
    let color = colorName in colors ? colors[colorName] : colors["white"];
    let geo = type in geometries ? geometries[type] : geometries["box"];
    let material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.0,
    });

    let mesh = new THREE.Mesh(geo, material);
    mesh.matrixAutoUpdate = (doAutoUpdaten === true);
    parent.add(mesh);
    return mesh;
}

export function create_Intro(scene) {
    let lightgreen = "0x00FF41"
    var playButton = dcText("Starten", .3, .3, 50, 0x00FF41, "black");
    playButton.ctx.lineWidth = 2;
    playButton.ctx.strokeStyle = "#00FF41";
    playButton.ctx.strokeRect(3, 3, playButton.wPxAll - 6, playButton.hPxAll - 6);
    playButton.position.set(0, .5, -2);
    playButton.name = "button";
    scene.add(playButton);
  
    var textGroup = new THREE.Group();
    var text = dcText("Tutorial", 2, 2, 50, 0x00FF41, "black");
    text.position.set(0, 14, -50);
    textGroup.add(text);
    var text1 = dcText("Agent Smith schießt auf dich", 2, 2, 50, 0x00FF41, "black");
    text1.position.set(0, 10, -50);
    textGroup.add(text1);
    var text2 = dcText("Trifft dich eine Kugel verlierst du ein Leben.", 2, 2, 50, 0x00FF41, "black");
    text2.position.set(0, 8, -50);
    textGroup.add(text2);
    var text3 = dcText("Weiche aus oder fange die Kugel auf", 2, 2, 50, 0x00FF41, "black");
    text3.position.set(0, 6, -50);
    textGroup.add(text3);
    var text5 = dcText("Wenn du eine Kugel fängst, kannst du sie zurückschießen", 2, 2, 50, 0x00FF41, "black");
    text5.position.set(0, 2, -50);
    textGroup.add(text5);
    scene.add(textGroup);
  
    return { playButton, textGroup };
  }

  
  function dcText(txt, heightWorldTxt, heightWorldAll, heightPxTxt, fgcolor, bgcolor) {
    var geometry;
    var kPxToWorld = heightWorldTxt / heightPxTxt; // Px to World multplication factor
    var hPxAll = Math.ceil(heightWorldAll / kPxToWorld); // hPxAll: height of the whole texture canvas
    var txtcanvas = document.createElement("canvas"); // create the canvas for the texture
    var ctx = txtcanvas.getContext("2d");
    ctx.font = heightPxTxt + "px sans-serif";
    var wPxTxt = ctx.measureText(txt).width; // wPxTxt: width of the text in the texture canvas
    var wWorldTxt = wPxTxt * kPxToWorld; // wWorldTxt: world width of text in the plane
    var wWorldAll = wWorldTxt + (heightWorldAll - heightWorldTxt); // wWorldAll: world width of the whole plane
    var wPxAll = Math.ceil(wWorldAll / kPxToWorld); // wPxAll: width of the whole texture canvas
    // next, resize the texture canvas and fill the text
    txtcanvas.width = wPxAll;
    txtcanvas.height = hPxAll;
    if (bgcolor != undefined) {
      // fill background if desired (transparent if none)
      ctx.fillStyle = "#" + bgcolor.toString(16).padStart(6, "0");
      ctx.fillRect(0, 0, wPxAll, hPxAll);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#" + fgcolor.toString(16).padStart(6, "0"); // fgcolor
    ctx.font = heightPxTxt + "px sans-serif"; // needed after resize
    ctx.fillText(txt, wPxAll / 2, hPxAll / 2);
    //texture
    var texture = new THREE.Texture(txtcanvas);
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    geometry = new THREE.PlaneGeometry(wWorldAll, heightWorldAll);
    var material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture, transparent: true, opacity: 1.0 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.wWorldTxt = wWorldTxt; // return the width of the text in the plane
    mesh.wWorldAll = wWorldAll; //    and the width of the whole plane
    mesh.wPxTxt = wPxTxt; //    and the width of the text in the texture canvas
    mesh.wPxAll = wPxAll; //    and the width of the whole texture canvas
    mesh.hPxAll = hPxAll; //    and the height of the whole texture canvas
    mesh.ctx = ctx; //    and the 2d texture context, for any glitter
    return mesh;
  }

  export function create_Win(lifes){
    {
        var textGroup = new THREE.Group();
        var text1 = dcText("Simulation passed!", 2, 2, 50, 0x00FF41, "black");
        text1.position.set(0, 6, -50);
        textGroup.add(text1);
        var text2 = dcText(`lifes left: ${lifes}`, 2, 2, 50, 0x00FF41, "black");
        text2.position.set(0, 3, -50);
        textGroup.add(text2);
        return textGroup ;
      }
  }

  export function create_Loss(){
    {
        var textGroup = new THREE.Group();
        var text3 = dcText("Simulation failed!", 2, 2, 50, 0x00FF41, "black");
        text3.position.set(0, 6, -50);
        textGroup.add(text3);
        return textGroup ;
      }
  }

 export function create_Loading_screen(progress){
    var text = dcText(`Loading Simulation:${progress}%`, 2, 2, 50, 0x00FF41, "black");
        text.position.set(0, 14, -50);
        return text
  }
