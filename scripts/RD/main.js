let canvas

let camera, simCamera, scene, simScene, renderer, aspectRatio

let simTextureA, simTextureB

let displayMaterial, drawMaterial, simMaterial, blackMaterial, copyMaterial

let domain, simDomain

let options, uniforms

let gui, pauseButton, clearButton, brushRadiusController, fColour

let isRunning, isDrawing

let inTex, outTex

let nXDisc, nYDisc, domainWidth, domainHeight

import { discShader, vLineShader, hLineShader } from "../drawing_shaders.js";
import { copyShader } from "../copy_shader.js";
import { RDShaderTop, RDShaderBot } from "./simulation_shaders.js"
import { greyscaleDisplay, fiveColourDisplay, viridisDisplay } from "../display_shaders.js"
import { genericVertexShader } from "../generic_shaders.js"

// Setup some configurable options.
options = {
    squareCanvas: false,
    domainScale: 1,
    spatialStep: 1 / 100,
    renderSize: 2000,
    numTimestepsPerFrame: 100,
    typeOfBrush: "circle",
    colourmap: "fiveColourDisplay",
    whatToPlot: 'v',
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
canvas = document.getElementById('simCanvas');

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
    displayMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: genericVertexShader(),
    })
    // This material allows for drawing via a number of fragment shaders, which will be swapped in before use.
    drawMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: genericVertexShader(),
    })
    // This material performs the timestepping.
    simMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: genericVertexShader(),
    })
    copyMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: genericVertexShader(),
        fragmentShader: copyShader(),
    })

    // A black material for initialisation.
    blackMaterial = new THREE.MeshBasicMaterial( {color: 0x000000} );

    const plane = new THREE.PlaneGeometry(1.0,1.0);
    domain = new THREE.Mesh(plane, displayMaterial);
    domain.position.z = 0;
    scene.add(domain);

    const simPlane = new THREE.PlaneGeometry(1.0,1.0);
    simDomain = new THREE.Mesh(simPlane, simMaterial);
    simDomain.position.z = 0;
    simScene.add(simDomain);

    // Add shaders to the textures.
    setShaders();

    // Render black onto the sim textures.
    clearTextures();

    // Create a GUI.
    initGUI();

    // Set the brush type.
    setBrushType();

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
    // Set the shape of the canvas.
    setCanvasShape();
    // Set the resolution of the simulation domain and the renderer.
    setSizes();
    // Assign sizes to textures.
    resizeTextures();
    // Update any uniforms.
    updateUniforms();
    // Update any parts of the GUI that depend on the domain size (ie brush).
    brushRadiusController.max(options.domainScale / 10);
    brushRadiusController.step(options.spatialStep);
    uniforms.brushRadius.value = Math.round(uniforms.brushRadius.value / options.spatialStep) * options.spatialStep;
    brushRadiusController.updateDisplay();
}

function updateUniforms() {
    uniforms.dx.value = domainWidth / nXDisc;
    uniforms.dy.value = domainHeight / nYDisc;
    uniforms.aspectRatio = aspectRatio;
    uniforms.domainWidth.value = domainWidth;
    uniforms.domainHeight.value = domainHeight;
}

function setSizes() {
    aspectRatio = canvas.getBoundingClientRect().height / canvas.getBoundingClientRect().width;
    // Set the domain size, setting the largest side to be of size options.domainScale.
    if (aspectRatio >= 1) {
				domainHeight = options.domainScale;
				domainWidth = domainHeight / aspectRatio;
    }
		else {
				domainWidth = options.domainScale;
				domainHeight = domainWidth * aspectRatio;
		}
    // Using the user-specified spatial step size, compute as close a discretisation as possible that 
    // doesn't reduce the step size below the user's choice.
    nXDisc = Math.floor(domainWidth / options.spatialStep);
    nYDisc = Math.floor(domainHeight / options.spatialStep);
    // Set the size of the renderer, which will interpolate from the textures.
    renderer.setSize(options.renderSize, options.renderSize, false);
    // Update uniforms.
    updateUniforms();
}

function setCanvasShape() {
    if (options.squareCanvas) {
        document.getElementById("simCanvas").className = "squareCanvas";
    }
    else {
        document.getElementById("simCanvas").className = "fullCanvas";
    }
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
        brushRadius: {type: "f", value: options.domainScale / 100},
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
        domainWidth: {type: "f"},
        domainHeight: {type: "f"},

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

    // Brush folder.
    const fBrush = gui.addFolder('Brush');
    fBrush.add(options, 'typeOfBrush', {'Circle': 'circle', 'Horizontal line': 'hline', 'Vertical line': 'vline'}).name('Brush type').onChange(setBrushType);
    fBrush.add(uniforms.brushValue, 'value', 0, 1).name('Brush value');
    brushRadiusController = fBrush.add(uniforms.brushRadius, 'value', 0, options.domainScale/10).name('Brush radius');
    fBrush.open();

    // Domain folder.
    const fDomain = gui.addFolder('Domain');
    fDomain.add(options, 'domainScale', 0.001, 10).name('Largest side').onChange(resize);
    fDomain.add(options, 'spatialStep', 0.0001, options.domainScale / 50).name('Space step').onChange(resize);
    
    // Timestepping folder.
    const fTimestepping = gui.addFolder('Timestepping');
    fTimestepping.add(options, 'numTimestepsPerFrame', 1, 200, 1).name('TPF');
    fTimestepping.add(uniforms.dt, 'value', 0, 1, 0.0001).name('Timestep');

    // Equations folder.
    const fEquations = gui.addFolder('Equations');
    // Du and Dv.
    const DuController = fEquations.add(uniforms.Du,'value').name("Du");
    DuController.__precision = 12;
    DuController.updateDisplay();
    const DvController = fEquations.add(uniforms.Dv,'value').name("Dv");
    DvController.__precision = 12;
    DvController.updateDisplay();
    // Custom f(u,v) and g(u,v).
    fEquations.add(options.shaderStr,'F').name("f(u,v)").onFinishChange(setRDEquations);
    fEquations.add(options.shaderStr,'G').name("g(u,v)").onFinishChange(setRDEquations);
    fEquations.open();

    // Rendering folder.
    const fRendering = gui.addFolder('Rendering');
    fRendering.add(options, 'squareCanvas').name("Square display").onFinishChange(resize);
    fRendering.add(options, 'renderSize', 1, 4096, 1).name("Render res").onChange(setSizes);

    // Colour folder.
    fColour = gui.addFolder('Colour');
    fColour.add(options, 'whatToPlot', {'u': 'u', 'v': 'v'}).name('Colour by: ').onChange(setDisplayColourAndType);
    fColour.add(options, 'colourmap', {'Greyscale': 'greyscale', 'Viridis': 'viridis', 'RedYellowGreen': 'fiveColourDisplay'}).onChange(setDisplayColourAndType);

    console.log(gui)
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

function setShaders() {
    // Configure the display material.
    setDisplayColourAndType();

    // Configure the drawing material.
    setBrushType();

    // Configure the simulation material.
    setRDEquations();
}

function setBrushType() {
    // Assign the selected drawing shader to the material.
    if (options.typeOfBrush == 'circle') {
        drawMaterial.fragmentShader = selectColourspecInShaderStr(discShader());
    }
    else if (options.typeOfBrush == 'hline') {
        drawMaterial.fragmentShader = selectColourspecInShaderStr(hLineShader());
    }
    else if (options.typeOfBrush == 'vline') {
        drawMaterial.fragmentShader = selectColourspecInShaderStr(vLineShader());
    }
    drawMaterial.needsUpdate = true;
}

function setDisplayColourAndType() {
    if (options.colourmap == 'greyscale') {
        displayMaterial.fragmentShader = selectColourspecInShaderStr(greyscaleDisplay());
    }
    else if (options.colourmap == 'fiveColourDisplay') {
        displayMaterial.fragmentShader = selectColourspecInShaderStr(fiveColourDisplay());
    }
    else if (options.colourmap == 'viridis') {
        displayMaterial.fragmentShader = selectColourspecInShaderStr(viridisDisplay());
    }
    displayMaterial.needsUpdate = true;
}

function selectColourspecInShaderStr( shaderStr ) {
    if (options.whatToPlot == 'u') {
        shaderStr = shaderStr.replace(/COLOURSPEC/g,'r');
    }
    else if (options.whatToPlot == 'v') {
        shaderStr = shaderStr.replace(/(COLOURSPEC)/g,'g');
    }
    return shaderStr
}

function draw() {
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
    // Round to the centre of a pixel.
    x = (Math.floor(x * nXDisc) + 0.5) / nXDisc;
    y = (Math.floor(y * nYDisc) + 0.5) / nYDisc;
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
    pauseButton.name('Play (p)');
    isRunning = false;
}

function playSim() {
    pauseButton.name('Pause (p)');
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

function setRDEquations() {
    simMaterial.fragmentShader = [RDShaderTop(), parseShaderStrings(), RDShaderBot()].join(' ');
    simMaterial.needsUpdate = true;
}