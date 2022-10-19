let camera, simCamera, scene, simScene, renderer, aspectRatio

let simTextureA, simTextureB

let material, drawMaterial, simMaterial, blackMaterial, copyMaterial

let domain, simDomain

let options, uniforms

let gui, pauseButton, clearButton, brushRadiusController

let isRunning, isDrawing

let inTex, outTex

let nXDisc, nYDisc

import { discShader, vLineShader, hLineShader } from "../drawing_shaders.js";
import { copyShader } from "../copy_shader.js";
import { RDShaderTop, RDShaderBot } from "./simulation_shaders.js"

// Setup some configurable options.
options = {
    domainWidth: 1,
    domainHeight: 1,
    renderSize: 2000,
    maxDisc: 512,
    numTimestepsPerFrame: 100,
    typeOfBrush: "circle",
    shaderStr: {
        F: "-u*v^2 + 0.037*(1.0 - u)",
        G: "u*v^2 - (0.037+0.06)*v",
    },
    pause: function() { 
        if (isRunning) {
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
const canvas = document.getElementById('simCanvas');

var readFromTextureB = true;
init();
resize();
animate();

function init() {

    isRunning = true;
    isDrawing = false;

    // Create a renderer.
    renderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.autoClear = false;

    // Configure textures with placeholder sizes.
    simTextureA = new THREE.WebGLRenderTarget(options.maxDisc, options.maxDisc,
        {format: THREE.RGBAFormat,
        type: THREE.FloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,}
        );
    simTextureB = simTextureA.clone();
        
    // Periodic boundary conditions (for now).
    simTextureA.texture.wrapS = THREE.RepeatWrapping;
    simTextureA.texture.wrapT = THREE.RepeatWrapping;
    simTextureB.texture.wrapS = THREE.RepeatWrapping;
    simTextureB.texture.wrapT = THREE.RepeatWrapping;

    // Create cameras for the simulation domain and the final output.
    camera = new THREE.OrthographicCamera(-0.5,0.5,0.5,-0.5, -10000, 10000);
    camera.position.z = 100;

    simCamera = new THREE.OrthographicCamera(-0.5,0.5,0.5,-0.5, -10000, 10000);
    simCamera.position.z = 100;

    // Create two scenes: one for simulation, another for drawing.
    scene = new THREE.Scene();
    simScene = new THREE.Scene();

    scene.add(camera);

    // Define uniforms to be sent to the shaders.
    initUniforms();

    // This material will display the output of the simulation.
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
        fragmentShader: [RDShaderTop(), parseShaderStrings(), RDShaderBot()].join(' '),
    })
    copyMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById( 'genericVertexShader' ).innerHTML,
        fragmentShader: copyShader(),
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

    // Render black onto the sim textures.
    clearTextures();

    // Create a GUI.
    initGUI();

    // Listen for pointer events.
    canvas.addEventListener( 'pointerdown', onDocumentPointerDown);
    canvas.addEventListener( 'pointerup', onDocumentPointerUp);
    canvas.addEventListener( 'pointermove', onDocumentPointerMove);

    document.addEventListener("keypress", function onEvent(event) {
        if (event.key === "c") {
            clearTextures();
        }
        if (event.key === "p") {
            if (isRunning) {
                pauseSim();
            }
            else {
                playSim();
            }
        }
    })

    window.addEventListener("resize", resize, false);

}

function resize() {
    // Set the resolution of the simulation domain and the renderer.
    setSizes();
    // Assign sizes to textures.
    resizeTextures();
    // Update any uniforms.
    updateUniforms();
    // Update any parts of the GUI that depend on the domain size (ie brush).
    brushRadiusController.max = Math.round(options.maxDisc / 10);
}

function updateUniforms() {
    uniforms.dx.value = options.domainWidth / nXDisc;
    uniforms.dy.value = options.domainHeight / nYDisc;
    uniforms.aspectRatio = aspectRatio;
}

function setSizes() {
    aspectRatio = canvas.getBoundingClientRect().height / canvas.getBoundingClientRect().width;
    // We discretise the largest dimension by the maximum allowed amount (as set by the user), 
    // and downsample the other dimension. This means that the maximum discretisation parameter will 
    // govern numerical stability, not the aspect ratio.
    if (aspectRatio >= 1) {
        nYDisc = options.maxDisc;
        nXDisc = Math.round(nYDisc / aspectRatio);
    }
    else {
        nXDisc = options.maxDisc;
        nYDisc = Math.round(nXDisc * aspectRatio);
    }
    // Set the size of the renderer, which will interpolate from the textures.
    renderer.setSize(options.renderSize, options.renderSize, false);
    // Update uniforms.
    updateUniforms();
}

function resizeTextures() {
    // Resize the computational domain by interpolating the existing domain onto the new discretisation.
    simDomain.material = copyMaterial;

    if (!readFromTextureB) {
        uniforms.textureSource.value = simTextureA.texture;
        simTextureB.setSize(nXDisc, nYDisc);
        renderer.setRenderTarget(simTextureB);
        renderer.render( simScene, simCamera );
        simTextureA = simTextureB.clone();
    }
    else {
        uniforms.textureSource.value = simTextureB.texture;
        simTextureA.setSize(nXDisc, nYDisc);
        renderer.setRenderTarget(simTextureA);
        renderer.render( simScene, simCamera );
        simTextureB = simTextureA.clone();
    }
    readFromTextureB = !readFromTextureB;
    render();
}

function initUniforms() {
    uniforms = {
        textureSource: {type: "t"},
        brushCoords: {type: "v2", value: new THREE.Vector2(0.5,0.5)},
        brushRadius: {type: "f", value: options.maxDisc / 50},
        brushValue: {type: "f", value: 1.0},
        dt: {type: "f", value: 0.01},

        color1: {type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0)},
        color2: {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2)},
        color3: {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21)},
        color4: {type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4)},
        color5: {type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6)},

        // Discrete step sizes in the texture, which will be set later.
        dx: {type: "f"},
        dy: {type: "f"},
        aspectRatio: {type: "f"},

        // Diffusion coefficients.
        Du: {type: "f", value: 0.000004},
        Dv: {type: "f", value: 0.000002},
        
    };
}

function initGUI() {
    gui = new dat.GUI({closeOnTop: true});
    pauseButton = gui.add(options,'pause');
    if (isRunning) {
        pauseButton.name('Pause (p)');
    }
    else {
        pauseButton.name('Play (p)');
    }
    clearButton = gui.add(options,'clear').name('Clear (c)');
    const fBrush = gui.addFolder('Brush');
    fBrush.add(options, 'typeOfBrush', {'Circle': 'circle', 'Horizontal line': 'hline', 'Vertical line': 'vline'}).name('Brush type');
    fBrush.add(uniforms.brushValue, 'value', 0, 1).name('Brush value');
    // Brush value has units of pixels (relative to the computational domain).
    brushRadiusController = fBrush.add(uniforms.brushRadius, 'value', 1, Math.max(options.maxDisc)/10, 1).name('Brush size (px)');
    fBrush.open();
    const fDomain = gui.addFolder('Domain');
    fDomain.add(options, 'domainWidth', 0.001, 10).name('Width').onFinishChange(resize);
    fDomain.add(options, 'domainHeight', 0.001, 10).name('Height').onFinishChange(resize);
    fDomain.add(options, 'maxDisc', 1, 2048, 1).name('Disc. level').onFinishChange(resize);
    const fTimestepping = gui.addFolder('Timestepping');
    fTimestepping.add(options, 'numTimestepsPerFrame', 1, 200, 1).name('TPF');
    fTimestepping.add(uniforms.dt, 'value', 0, 1, 0.0001).name('Timestep');
    const fEquations = gui.addFolder('Equations');
    fEquations.add(options.shaderStr,'F').name("f(u,v)").onFinishChange(refreshEquations);
    fEquations.add(options.shaderStr,'G').name("g(u,v)").onFinishChange(refreshEquations);
    fEquations.open();
}

function animate() {
    requestAnimationFrame(animate);

    // Draw on any input from the user, which can happen even if timestepping is not running.
    if (isDrawing){
       draw();
    }

    // Only timestep if the simulation is running.
    if (isRunning) {

        // Perform a number of timesteps per frame.
        for (let i = 0; i < options.numTimestepsPerFrame; i++){
            timestep();
            // Make drawing more responsive by trying to draw every timestep.
            if (isDrawing){
                draw();
             }
        }

    }

    // Always render, in case the user has drawn.
    render();
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

function onDocumentPointerDown( event ){
    setBrushCoords( event, canvas )
    isDrawing = true;
}

function onDocumentPointerUp( event ){
    isDrawing = false;
}

function onDocumentPointerMove( event ){
    setBrushCoords( event, canvas );
}

function setBrushCoords( event, container ){
    var cRect = container.getBoundingClientRect();
    let x = (event.clientX - cRect.x) / cRect.width;
    let y = 1 - (event.clientY - cRect.y) / cRect.height;
    uniforms.brushCoords.value = new THREE.Vector2(x,y);
}

function clearTextures() {
    simDomain.material = blackMaterial;
    renderer.setRenderTarget( simTextureA );
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget( simTextureB );
    renderer.render(simScene, simCamera);
}

function pauseSim() {
    pauseButton.name('Play');
    isRunning = false;
}

function playSim() {
    pauseButton.name('Pause');
    isRunning = true;
}

// Parse the user-defined shader strings into valid GLSL and output their concatenation. We won't worry about code injection.
function parseShaderStrings() {
    let out = '';
    
    // Prepare the f string.
    out += 'float f = ' + parseShaderString(options.shaderStr.F) + ';\n';
    // Prepare the g string.
    out += 'float g = ' + parseShaderString(options.shaderStr.G) + ';\n';

    return out;
}

// Parse a string into valid GLSL, replacing
function parseShaderString( str ) {
    // Pad the string.
    str = ' ' + str + ' ';

    // Replace u and v with uv.r and uv.g via placeholders.
    str = str.replace(/u/g, 'U');
    str = str.replace(/v/g, 'V');
    str = str.replace(/U/g, 'uv.r');
    str = str.replace(/V/g, 'uv.g');

    // Replace integers with floats.
    str = str.replace(/([^.0-9])(\d+)([^.0-9])/g, '$1$2.$3');
    // Replace powers with pow.
    str = str.replace(/([a-z0-9.]*)\^([a-z0-9.]*)/g, 'pow($1, $2)');

    return str;
}

function refreshEquations() {
    simMaterial.fragmentShader = [RDShaderTop(), parseShaderStrings(), RDShaderBot()].join(' ');
    simMaterial.needsUpdate = true;
}