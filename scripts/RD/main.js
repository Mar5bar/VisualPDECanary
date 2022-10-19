let camera, simCamera, scene, simScene, renderer

let simTextureA, simTextureB

let material, drawMaterial, simMaterial, blackMaterial

let domain, simDomain

let options, uniforms

let gui, pauseButton, clearButton

let stats

let clock, delta

let inTex, outTex

import { discShader, vLineShader, hLineShader } from "../drawing_shaders.js";

// Setup some configurable options.
options = {
    displayResX: 500,
    displayResY: 500,
    nXDisc: 256,
    nYDisc: 256,
    numTimestepsPerFrame: 100,
    isRunning: true,
    isDrawing: false,
    typeOfBrush: "circle",
    pause: function() { 
        if (this.isRunning) {
            pauseSim();
        }
        else {
            playSim();
        }
    },
    clear: function() { 
        clearTextures();
        pauseSim();
    },
};

// Get the canvas to draw on, as specified by the html.
const canvas = document.getElementById('myCanvas');

var readFromTextureB = true;
init();
animate();

function init() {

    camera = new THREE.OrthographicCamera(-0.5,0.5,0.5,-0.5, -10000, 10000);
    camera.position.z = 100;

    simCamera = new THREE.OrthographicCamera(-0.5,0.5,0.5,-0.5, -10000, 10000);
    simCamera.position.z = 100;

    // Create two scenes: one for simulation, another for drawing.
    scene = new THREE.Scene();
    simScene = new THREE.Scene();

    scene.add(camera);

    simTextureA = new THREE.WebGLRenderTarget(options.nXDisc, options.nYDisc,
            {format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,});
    simTextureB = new THREE.WebGLRenderTarget(options.nXDisc, options.nYDisc,
            {format: THREE.RGBAFormat,
            type: THREE.FloatType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter});

    // Periodic boundary conditions (for now).
    simTextureA.texture.wrapS = THREE.RepeatWrapping;
    simTextureA.texture.wrapT = THREE.RepeatWrapping;
    simTextureB.texture.wrapS = THREE.RepeatWrapping;
    simTextureB.texture.wrapT = THREE.RepeatWrapping;

    // Define uniforms to be sent to the shaders.
    uniforms = {
        textureSource: {value: simTextureA.texture},
        brushCoords: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
        brushRadius: {type: "f", value: 1},
        brushValue: {type: "f", value: 1.0},
        dt: {type: "f", value: 0.25},

        color1: {type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0)},
        color2: {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2)},
        color3: {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21)},
        color4: {type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4)},
        color5: {type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6)}
        
    };

    // Eventually, both of these will be ShaderMaterial, with material taking simTextureA/B.texture
    // and extracting out the needed component and colouring it.
    material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'genericVertexShader' ).innerHTML,
        fragmentShader: document.getElementById( 'displayFragShader' ).innerHTML,
    })
    // This material allows for drawing via a number of fragment shaders, which will be swapped in before use.
    drawMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'genericVertexShader' ).innerHTML,
        fragmentShader: discShader(),
    })
    // These shaders perform the timestepping.
    simMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'genericVertexShader' ).innerHTML,
        fragmentShader: document.getElementById( 'simulationFragShader' ).innerHTML,
    })
    // A black material for initialisation.
    blackMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );

    const plane = new THREE.PlaneGeometry(1.0,1.0);
    domain = new THREE.Mesh(plane, material);
    domain.position.z = 0;
    scene.add(domain);

    const simPlane = new THREE.PlaneGeometry(1.0,1.0);
    simDomain = new THREE.Mesh(simPlane, simMaterial);
    simDomain.position.z = 0;
    simScene.add(simDomain);

    // Create a renderer.
    renderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(options.displayResX, options.displayResY, false);
    renderer.autoClear = false;

    // Render black onto the sim textures.
    clearTextures();

    // Create a GUI.
    gui = new dat.GUI({closeOnTop: true})
    pauseButton = gui.add(options,'pause');
    if (options.isRunning) {
        pauseButton.name('Pause');
    }
    else {
        pauseButton.name('Play');
    }
    clearButton = gui.add(options,'clear').name('Clear');
    gui.add(options, 'numTimestepsPerFrame', 1, 200, 1).name('TPF');
    gui.add(uniforms.dt, 'value', 0, 1).name('Timestep');
    const fBrush = gui.addFolder('Brush');
    fBrush.add(options, 'typeOfBrush', {'Circle': 'circle', 'Horizontal line': 'hline', 'Vertical line': 'vline'}).name('Brush type');
    fBrush.add(uniforms.brushValue, 'value', 0, 1).name('Brush value');
    // Brush value has units of pixels (relative to the computational domain).
    fBrush.add(uniforms.brushRadius, 'value', 1, 10, 1).name('Brush size');
    fBrush.open();

    // Create a clock for recording framerate etc.
    clock = new THREE.Clock();
    delta = 0;

    // Listen for pointer events.
    document.addEventListener( 'pointerdown', onDocumentMouseDown, false);
    document.addEventListener( 'pointerup', onDocumentMouseUp, false);
    document.addEventListener( 'pointermove', onDocumentMouseMove, false);

    // FPS.
    stats = Stats();
    document.body.appendChild(stats.dom);
}

function animate() {
    requestAnimationFrame(animate);

    // Draw on any input from the user, which can happen even if timestepping is not running.
    if (options.isDrawing){
       draw();
    }

    // Only timestep if the simulation is running.
    if (options.isRunning) {

        // Perform a number of timesteps per frame.
        for (let i = 0; i < options.numTimestepsPerFrame; i++){
            timestep();
        }

    }

    // Always render, in case the user has drawn.
    render();
    stats.update();
}

function draw() {
    // Assign the selected drawing shader to the material.
    if (options.typeOfBrush == 'circle') {
        drawMaterial.fragmentShader = discShader();
    }
    else if (options.typeOfBrush == 'hline') {
        drawMaterial.fragmentShader = hLineShader();
    }
    else if (options.typeOfBrush == 'vline') {
        drawMaterial.fragmentShader = vLineShader();
    }
    drawMaterial.needsUpdate = true;

    // Toggle texture input/output.
    if (readFromTextureB) {
        inTex = simTextureB;
        outTex = simTextureA;
    }
    else {
        inTex = simTextureA;
        outTex = simTextureB;
    }
    readFromTextureB = !readFromTextureB;

    simDomain.material = drawMaterial;
    uniforms.textureSource.value = inTex.texture;
    renderer.setRenderTarget( outTex );
    renderer.render( simScene, simCamera );
    uniforms.textureSource.value = outTex.texture;
}

function timestep() {
    // We timestep by updating a texture that stores the solutions. We can't overwrite
    // the texture in the loop, so we'll use two textures and swap between them. These
    // textures are already defined above, and their resolution defines the resolution
    // of solution.

    if (readFromTextureB) {
        inTex = simTextureB;
        outTex = simTextureA;
    }
    else {
        inTex = simTextureA;
        outTex = simTextureB;
    }
    readFromTextureB = !readFromTextureB;

    simDomain.material = simMaterial;
    uniforms.textureSource.value = inTex.texture;
    renderer.setRenderTarget( outTex );
    renderer.render( simScene, simCamera );
    uniforms.textureSource.value = outTex.texture;
}

function render() {

    // Render the output to the screen.
    renderer.setRenderTarget( null );
    renderer.render( scene, camera );
}

function onDocumentMouseDown( event ){
    if (isWithinBoundingBox(event.clientX, event.clientY, canvas) &
        !isWithinBoundingBox(event.clientX, event.clientY, gui.domElement)) {
        options.isDrawing = true;
    }
}

function onDocumentMouseUp( event ){
    options.isDrawing = false;
}

function onDocumentMouseMove( event ){
    var cRect = canvas.getBoundingClientRect();
    let x = (event.clientX - cRect.x) / cRect.width;
    let y = 1 - (event.clientY - cRect.y) / cRect.height;
    uniforms.brushCoords.value = new THREE.Vector2(x,y);
}

function isWithinBoundingBox( x, y, target ){
    var rect = target.getBoundingClientRect();
    return (rect.x <= x &
            x <= rect.x+rect.width &
            rect.y <= y &
            y <= rect.y+rect.height);
}

function clearTextures() {
    simDomain.material = blackMaterial;
    renderer.setRenderTarget( simTextureA );
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget( simTextureB );
    renderer.render(simScene, simCamera);
}

function pauseSim() {
    clock.stop();
    pauseButton.name('Play');
    options.isRunning = false;
}

function playSim() {
    clock.start();
    pauseButton.name('Pause');
    options.isRunning = true;
}