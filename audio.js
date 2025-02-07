import { THREE } from './app.js'


export function add_audio(camera, parent, url, looped) {
    const listener = new THREE.AudioListener();
    camera.add(listener);
    // create the PositionalAudio object (passing in the listener)


    const audioLoader = new THREE.AudioLoader();
    // load a sound and set it as the PositionalAudio object's buffer
    if(!looped){
        const sound = new THREE.PositionalAudio(listener);
        audioLoader.load(url, function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false)
            sound.setRefDistance(20);
        });
        sound.matrixAutoUpdate = false;
        parent.add(sound);
        return sound;
    }
    else{
        const music = new THREE.Audio(listener);
        audioLoader.load(url, function (buffer) {
            music.setBuffer(buffer);
            music.setLoop(true)
        });
        console.log("adding_music")
        parent.add(music);
        return music;
    }
}

