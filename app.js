//import * as THREE from '../libThree/three.module.js';
import * as THREE from './three/build/three.module.js'
// central export for all other modules
export * as THREE from './three/build/three.module.js'
import { GLTFLoader } from './three/build/GLTFLoader.js';
import * as SkeletonUtils from './three/build/SkeletonUtils.js'
import { keyboard, mouse } from './keyboard_mouse.js';
import { create_scene, create_geometry, create_projectile, create_Intro, factory, create_Loading_screen, create_Win, create_Loss } from './scene.js'
import { create_laser, create_stretch_line } from './laser.js'
import { createImmersiveButton } from './vr.js'
import { add_audio } from './audio.js'
import { billboard } from './billboard.js'
//import { linepattern, pluspattern } from './canvas.js'
window.onload = function () {

  /////////////////////////////////////////////////
  /// Scene
  let { scene, camera, renderer } = create_scene();
  let { cursor, world } = create_geometry(scene);

  let canvas_plane = factory(scene, "plane", "gray", true);
  canvas_plane.position.set(0, 0, -3);
  canvas_plane.rotation.x = -Math.PI / 2;
  canvas_plane.receiveShadow = true;
  canvas_plane.castShadow = true;

  // add billboard as head-up-display - attached to the camera
  let bill = billboard(camera);

  // SOUND_FX
  let sound = add_audio(camera, world, './sounds/sfx_ping_pong.mp3', false);
  let gethit_sfx = add_audio(camera, world, './sounds/sfx_player_hit.mp3', false);
  let enemyhit_sfx = add_audio(camera, world, './sounds/sfx_enemy_hit.mp3', false);
  let gunshot_sfx = add_audio(camera, world, './sounds/sfx_gunshot.mp3', false);
  let empty_mag = add_audio(camera, world, './sounds/sfx_empty_mag.mp3', false);
  let reload_sfx = add_audio(camera, world, './sounds/sfx_reload.mp3', false);
  let win_sfx = add_audio(camera, world, './sounds/sfx_win.mp3', false);
  let lose_sfx = add_audio(camera, world, './sounds/sfx_lose.mp3', false);
  let headshot_sfx = add_audio(camera, world, './sounds/sfx_headshot.mp3', false);
  let ingame_music = add_audio(camera, world, './sounds/music_ingame.mp3', true);
  let menu_music = add_audio(camera, world, './sounds/music_menu.mp3', true);

  /// Interaction
  let grabbed = false,
    shooting = false;

  let add_keyboard_function = keyboard();
    add_keyboard_function(" ", (down) => {
      console.log("Space is", down);
      grabbed = down;
  });


  add_keyboard_function("c", (down) => {
    console.log("shooting is", down);
    shooting = down;
  });

  mouse(cursor);

  /// VR-Integration
  function onEnter(currentSession) {
    // cursor.matrix is set in update
    cursor.matrixAutoUpdate = false;
    menu_music.play()
  }
  function onLeave() {
    // cursor.position/rotation is set in Mouse
    cursor.matrixAutoUpdate = true;
  }
  //create VR Button and add it to the scene
  let { button, updateXR } = createImmersiveButton(renderer, onEnter, onLeave);
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(button);

  /////////////////////////////////////////////////
  /// Grabbing
  let inverse = new THREE.Matrix4(),
    inverseWorld = new THREE.Matrix4(),
    direction = new THREE.Vector3(),
    currentMatrix,
    initialGrabbed,
    validGrabMatrix = false,
    validFlyInverse = false,
    validNavInverse = false;

  // for matrix de-composition
  let position = new THREE.Vector3();
  let quaternion = new THREE.Quaternion();
  let delta = new THREE.Quaternion();
  let scale = new THREE.Vector3();

  //variables we need for the game
  let hitObject;
  let lifes;
  let difficulty;
  let pause = false;
  let play = false;
  let gameisOver = false;
  let win = false;
  let lose = false;
  let winmsg;
  let losemsg;
  let projectileArray = [];
  let bullets = [];
  let enemies = []; 
  let magazin = 0;
  let timeCounter;
  let buffertime=0;

  //create playbutton and Intro text
  let { playButton, textGroup } = create_Intro(scene);
  var startbutton = new THREE.Box3().setFromObject(playButton);
  menu_music.play()

  /// Selection
  let line = create_stretch_line(scene);
  let laser = create_laser(cursor, line, [playButton]);
  /// Rendering
  function render(time) {
    cursor.updateMatrix();
    
    // update the cursor and get the button states
    // updateXR returns null, if there is no VR session
    let vr = updateXR();
    if (vr !== null) {
      cursor.matrix.copy(vr.controller.matrix);
      shooting = vr.grabbed;
      // Quest or Go?
      if (vr.no_devices > 1) {
        grabbed = vr.fired;
      } else {
        grabbed = vr.touching;
      }
    }


    if (shooting) {
      if (validFlyInverse) {
        currentMatrix = inverse.clone();
        currentMatrix.premultiply(cursor.matrix);
        currentMatrix.decompose(position, quaternion, scale);
        delta.identity();
        delta.rotateTowards(quaternion, -0.001);
        laser.ray();
        if (vr !== null) {
          cursor.matrix.decompose(position, quaternion, scale);
          direction.set(0, 0, 1);
          direction.applyQuaternion(quaternion);
          position = direction.multiplyScalar(0.01);
        } else {
          position = position.multiplyScalar(-0.01);
        }
        currentMatrix.compose(position, delta, scale);
        world.matrix.premultiply(currentMatrix);
      } else {
        inverse.copy(cursor.matrix).invert();
        validFlyInverse = true;
      }
    } else {
      validFlyInverse = false;
      if(!grabbed){
        hitObject = laser.update();
      } else {
          laser.ray();
      }
    }


    if (hitObject && grabbed) {
      if (validGrabMatrix) {
        currentMatrix = initialGrabbed.clone(); //
        currentMatrix.premultiply(cursor.matrix); // Cn
        currentMatrix.premultiply(inverseWorld); // W-1
        hitObject.matrix.copy(currentMatrix); // On LKS des zu bewegenden Obj.
      } else {
        inverseWorld.copy(world.matrix).invert();
        inverse.copy(cursor.matrix).invert(); // Ci-1
        initialGrabbed = hitObject.matrix.clone(); // Oi
        initialGrabbed.premultiply(world.matrix); // W
        initialGrabbed.premultiply(inverse); // Ci-1 * Oi
        validGrabMatrix = true;

        if (hitObject.name == "projectile") {
          laser.removeFromArray(hitObject);
          scene.remove(hitObject);
          const index = projectileArray.indexOf(hitObject);
          projectileArray.splice(index, 1);
          magazin += 1;
          bill.addLine(`Ammo: ${magazin}    Lifes: ${lifes}`)
          reload_sfx.play();
        } else if (hitObject.name == "button") {
          //when grabbed object is button we have to start/restart the game, so we remove all objects from the scene and start music and load Loading_Enemies_Screen
          laser.removeFromArray(hitObject);
          scene.remove(hitObject);
          scene.remove(textGroup);
          if(winmsg){scene.remove(winmsg)}
          if(losemsg){scene.remove(losemsg)}
          menu_music.stop();
          console.log("Button pressed")
          Loading_Enemies_Screen();
        }
      }
    } else {
      if (validGrabMatrix) {
          validGrabMatrix = false;
      }
    }

    if (grabbed && !hitObject) {
      if (validNavInverse) {
        currentMatrix = initialGrabbed.clone();
        currentMatrix.premultiply(cursor.matrix);
        world.matrix.copy(currentMatrix);
      } 
    } else {
      validNavInverse = false;
    }

    //check if playing is true
    if (play) {
      bill.draw_canvas(lifes);

      //create shootable Boxes with random pos and add it to scene and array

      if (timeCounter % difficulty == 0 && lifes > 0) {
        createprojectile();
      }
      if (timeCounter % difficulty == 100 && lifes > 0) {
        createprojectile();
      }

    // shoot a bullet
    if(shooting && magazin>0 && buffertime<=0){
      gunshot_sfx.play();

      createBullet(scene)
    }
    else if (shooting && magazin<=0)
    {
      empty_mag.play()
    }

      //when lifes equal 0 game is over
      if (lifes <= 0) {
        gameisOver = true;
        play = false;
        lose = true
      }
      else if (enemies.length ==0){
        gameisOver = true;
        play = false;
        win = true
      }

      //handle movemenent of all boxes
      handleprojectiles();
      handleBullets();
      handleEnemies();

      console.log(bullets.length)
      //logic for wave system
      if (timeCounter == 500) {
        timeCounter = 0;
      } else {
        timeCounter += 1;
      }

      if (gameisOver) {
      //when gamme is over we stop the music and play 1 time the game over sound and draw play Button
      clearAllObjects();
      console.log("over")
      console.log(bullets)
      ingame_music.stop()
      menu_music.play()
      laser.addToArray(playButton)
      scene.add(playButton)
        if(win){
          winmsg=create_Win(lifes)
          scene.add(winmsg)
          win_sfx.play()
          console.log("you won")
        }
          else{
            lose_sfx.play()
            console.log("you lost")
            losemsg=create_Loss();
            scene.add(losemsg)
        }
      }
  }

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);

  function createBullet(scene){
    	// creates a bullet as a Mesh object
		var bullet = new THREE.Mesh(
			new THREE.SphereGeometry(0.05, 50, 50, 0, Math.PI * 4, 0, Math.PI * 4),
			new THREE.MeshStandardMaterial({
        color: 0x37aefc, 
        roughness: 0.7,
        metalness: 0.8,})
		);
    bullet.castShadow = true;

    // position the bullet to come from the player's weapon
    bullet.position.set(
      cursor.matrix.elements[12],
      cursor.matrix.elements[13],
      cursor.matrix.elements[14]
    );

    // set the velocity of the bullet
      
    let euler = new THREE.Euler();
    euler.setFromRotationMatrix(cursor.matrix)

		bullet.velocity = new THREE.Vector3(
			-Math.sin(euler._y)*0.03,
			Math.tan(euler._x)*0.03,
			-Math.cos(euler._y)*0.03
		);

		// after 1000ms, set alive to false and remove from scene
		// setting alive to false flags our update code to remove

		// the bullet from the bullets array
		bullet.alive = true;
		setTimeout(function(){
			bullet.alive = false;
			scene.remove(bullet);
		}, 10000);
		
		// add to scene, array, and set the delay to 10 frames
		bullets.push(bullet);
		scene.add(bullet);
    buffertime = 120
  }


  function handleBullets(){
   
    	//bullets
      //subtract from buffertime for each frame/tick
      if(buffertime == 120){ 
        magazin -=1;
        bill.addLine(`Ammo: ${magazin}    Lifes: ${lifes}`)}  
      if(buffertime > 0) {buffertime -= 1;}
      //remove a bullet from magazine 
   
      for(var index=0; index<bullets.length; index+=1){
        if( bullets[index] === undefined ) continue;
        if( bullets[index].alive == false ){
          bullets.splice(index,1);
          continue;
        }
        bullets[index].position.add(bullets[index].velocity);

	    }
    
  }

  //function to load the game
  const loadingManager = new THREE.LoadingManager()

  function Loading_Enemies_Screen() {
    clearAllObjects();
  
    let loading_msg;
    let progress = 0;
    console.log("Loading Enemyscreen")
    loadingManager.onProgress = function(url, loaded, total){
      progress = Math.floor((loaded/total)*100)
      if(loading_msg){scene.remove(loading_msg)}
      loading_msg = create_Loading_screen(progress)
      scene.add(loading_msg)

    }
    loadingManager.onLoad = function()
    {
      console.log("remove msg")
      scene.remove(loading_msg)
      createEnemies()
      init()

    }    
    load_Enemy_model()
    ingame_music.play();
  }

  function init(){
    timeCounter = 0;
    lifes = 5;
    difficulty = 300;
    magazin = 0;
    projectileArray = [];
    gameisOver = false;
    play = true;
    win = false;
    lose = false;
    bill.addLine(`Ammo: ${magazin}  Life: ${lifes}`)
  }

let enemy_model;

  function load_Enemy_model(){
    THREE.Cache.enabled = true;
    const loader = new GLTFLoader(loadingManager);
    let glbscene = new THREE.Object3D();

    loader.load('assets/anderson.glb', function(glb){
        glbscene = glb.scene;
        glb.scene.traverse( function (node){
          if (node.isMesh) { node.castShadow = true;} 
      })
        glbscene.scale.set(0.5, 0.5, 0.5);   
          enemy_model = glbscene
    }, undefined, function ( error ) {
        console.error( error );
    } );
  }

  function createEnemy(x,y,z,rx,ry,rz){

      const clone = SkeletonUtils.clone(enemy_model);
        clone.position.x = x;
        clone.position.y = y ;
        clone.position.z = z;
        clone.rotation.x = rx;
        clone.rotation.y = ry;
        clone.rotation.z = rz;
        scene.add(clone)
        enemies.push(clone)
  }


  function createEnemies() {
      createEnemy(0,0,-8,0,0,0)
      createEnemy(2,0,-7,0,-0.2,0)
      createEnemy(-2,0,-8,0,0.2,0)
    }

  //function to create a shootable box, add it to the scene and also to the laser
  function createprojectile() {

    let { projectile } = create_projectile();

    //create at X position of one of the three Enemys
    let randomX = Math.floor(Math.random() * 3)+1; //create random x between 1 and 3

    if(randomX==3 && enemies[randomX-1]){
      projectile.position.x = enemies[randomX-1].position.x
      projectile.position.y = enemies[randomX-1].position.y+1.5;
      projectile.position.z = enemies[randomX-1].position.z;
    } 
    else if( randomX==3 && !enemies[randomX-1] ) { randomX = randomX -1}


    if(randomX==2 && enemies[randomX-1]){
      projectile.position.x = enemies[randomX-1].position.x
      projectile.position.y = enemies[randomX-1].position.y+1.5;
      projectile.position.z = enemies[randomX-1].position.z;
    } 
    else if( randomX==2 && !enemies[randomX-1] ){ randomX = randomX -1}

    if(randomX==1 && enemies[randomX-1]){
      projectile.position.x=enemies[randomX-1].position.x
      projectile.position.y = enemies[randomX-1].position.y+1.5;
      projectile.position.z = enemies[randomX-1].position.z;
  }
    projectile.lookAt(camera.position)

    scene.add(projectile);
    laser.addToArray(projectile);
    projectileArray.push(projectile);

    
  }




  function handleprojectiles() {

    //iterate over all shootable boxes
    for (let i = 0; i < projectileArray.length; i++) {
      if( projectileArray[i] === undefined ) continue;
      if( projectileArray[i].alive == false ){
        projectileArray[i].splice(index,1);
        continue;
      }

      //move projectile by 0.05 foward and update matrix
      projectileArray[i].translateZ(0.03)
      projectileArray[i].updateMatrix()
      
      //HITBOX OF CAMERA
      if (
        projectileArray[i].position.x >= camera.matrix.elements[12]-0.2 && 
        projectileArray[i].position.x <= camera.matrix.elements[12]+0.2 &&

        projectileArray[i].position.y <= camera.matrix.elements[13]+0.1 && 

        projectileArray[i].position.z >= camera.matrix.elements[14]-0.05 && 
        projectileArray[i].position.z <= camera.matrix.elements[14]+0.05
        ) 
        //when box hits user camera, delete it from scene and also from array and play sound
        {
          laser.removeFromArray(projectileArray[i]);
          scene.remove(projectileArray[i]);
          lifes -= 1;
          bill.addLine(`Ammo: ${magazin}  Lifes: ${lifes}`)
          projectileArray.splice(i, 1);
          gethit_sfx.play()
      }
      //remove the bullet once it passes the player
      else if(projectileArray[i].position.z > camera.matrix.elements[14]+1){
        if( projectileArray[i] === undefined ) continue;
        if( projectileArray[i].alive == false ){
          projectileArray[i].splice(index,1);
          continue;
        }
        laser.removeFromArray(projectileArray[i]);
        scene.remove(projectileArray[i]);
        projectileArray.splice(i, 1);
      }
    }
    
  }

  function handleEnemies(){

    if(bullets){
      for (let j = 0; j < bullets.length; j++) {

        for (let i = 0; i < enemies.length; i++) {
          if( enemies[i] === undefined ) continue;
          if( enemies[i].alive == false ){
            enemies[i].splice(index,1);
            continue;
          }
          //HITBOX OF ENEMIES
          if (
            bullets[j].position.x >= enemies[i].position.x-0.15 && 
            bullets[j].position.x <= enemies[i].position.x+0.15 &&
    
            bullets[j].position.y >= enemies[i].position.y && 
            bullets[j].position.y <= enemies[i].position.y+1.8 &&
    
            bullets[j].position.z >= enemies[i].position.z-0.15 && 
            bullets[j].position.z <= enemies[i].position.z+0.15   
            )
            {
              if(
                bullets[j].position.y >= enemies[i].position.y+1.6 && 
                bullets[j].position.y <= enemies[i].position.y+1.8)
                {
                  headshot_sfx.play()
                }
                else{ 
                  enemyhit_sfx.play()
                }
            scene.remove(bullets[j])
            scene.remove(enemies[i])
            enemies.splice(i,1);
            

          }
        }
    }}
  }
  

  //function to remove all objects from the szene
  function clearAllObjects() {
    console.log(bullets.length)
    //iterate over all shootable boxes
    for (let i = 0; i < projectileArray.length; i++) {
      laser.removeFromArray(projectileArray[i]);
      scene.remove(projectileArray[i]);
    }
    projectileArray=[]

    for (let i = 0; i <= enemies.length; i++) {
      scene.remove(enemies[i]);
    }
    enemies = []


    for (let i = 0; i < 7; i++) {
      scene.remove(bullets[i]);
    }

    bullets=[]

    console.log(bullets.length)
}
};
