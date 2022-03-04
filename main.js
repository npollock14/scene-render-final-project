const context = new ProgramContext();

function main() {
  // Retrieve <canvas> element
  context.canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  context.gl = WebGLUtils.setupWebGL(context.canvas);

  //Check that the return value is not null.
  if (!context.gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Set viewport
  context.gl.viewport(0, 0, context.canvas.width, context.canvas.height);

  // Set clear color
  context.gl.clearColor(1, 0.6, 1, 1.0);

  // Initialize shaders
  context.program = initShaders(context.gl, "vshader", "fshader");
  context.gl.useProgram(context.program);

  //stores the locations of the vertex and normal attributes
  context.setAttributeLocations();
  context.setUniformLocations();
  context.projectionMatrix = perspective(
    45,
    context.canvas.width / context.canvas.height,
    0.1,
    1000
  );

  context.cameras.push(new Camera(0, 4, 10));
  context.cameras.push(new Camera(-1, 0.5, -1));

  context.linkProjectionMatrix();
  context.linkCameraMatrix();
  context.linkLightPosition();
  context.linkLightingToggle();

  //enable depth testing and back-face culling
  context.gl.enable(context.gl.DEPTH_TEST);
  context.gl.enable(context.gl.CULL_FACE);
  context.gl.cullFace(context.gl.BACK);

  //link event handlers
  document.onkeydown = (e) => {
    handleKeyDown(e);
  };

  //can now begin to load data asynchronously

  loadData(context);
}

function render() {
  context.clearCanvas();

  //DRAW SCENE OBJECTS
  if (context.carAnimationEnabled) {
    context.carAnimator.rotateY(-0.3);
  }

  if (context.cameras[context.activeCam].parent != null) {
    context.cameras[context.activeCam].setRelToObject(
      context.cameras[context.activeCam].parent
    );
    context.linkCameraMatrix();
  }

  //draw car
  context.car.draw(context.gl, context.aLoc, context.uLoc, context);

  // //draw bunny
  context.bunny.draw(context.gl, context.aLoc, context.uLoc, context);

  // //draw lamp
  context.lamp.draw(context.gl, context.aLoc, context.uLoc, context);

  // //draw street
  context.street.draw(context.gl, context.aLoc, context.uLoc, context);

  // //draw stop sign
  context.stopSign.draw(context.gl, context.aLoc, context.uLoc, context);

  //draw the skybox
  context.skybox.draw();

  requestAnimationFrame(render);
}

//redo this using move and rotate
// function carAnimation(car, context, frameCount) {
//   let rotateSpeed = -0.5;
//   return rotateY(rotateSpeed);
//   // car.move(0, 0, 0.01);
//   // car.rotateY(rotateSpeed);
// }

async function loadData() {
  console.log("LOADING DATA");

  //   load the car
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.obj",
    "OBJ"
  );

  let car = new Object3D(faceVertices, faceNormals, diffuse, specular);
  car.initBuffers(context.gl, context);
  car.setBuffers(context.gl);
  car.move(3, -0.2, 0);

  //car.move(0, 1, 5);
  car.rotateY(0);
  context.car = car;

  console.log("car LOADED");

  resetConstants();

  //load the bunny
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/bunny.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/bunny.obj",
    "OBJ"
  );

  let bunny = new Object3D(faceVertices, faceNormals, diffuse, specular);
  bunny.initBuffers(context.gl, context);
  bunny.setBuffers(context.gl);
  context.bunny = bunny;
  context.bunny.move(0, 0.7, 1.5);

  console.log("bunny LOADED");

  resetConstants();

  // load a lamp
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/lamp.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/lamp.obj",
    "OBJ"
  );
  let lamp = new Object3D(faceVertices, faceNormals, diffuse, specular);
  lamp.initBuffers(context.gl, context);
  lamp.setBuffers(context.gl);
  context.lamp = lamp;
  context.lamp.move(0, 0, 0);
  //move the context.light to the lamp's position plus an offset of (0,3,0)
  // context.setLightPosition(0, 3, 0);

  console.log("lamp LOADED");

  resetConstants();

  //load the street
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/street.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/street.obj",
    "OBJ"
  );
  let street = new Object3D(faceVertices, faceNormals, diffuse, specular);
  street.initBuffers(context.gl, context);
  street.setBuffers(context.gl);
  context.street = street;
  context.street.move(0, 0, 0);
  console.log("street LOADED");

  resetConstants();

  // load the stop sign
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/stopsign.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/stopsign.obj",
    "OBJ"
  );
  let stopSign = new Object3D(faceVertices, faceNormals, diffuse, specular);
  stopSign.addTexture(textureImage, faceUVs, context.gl, context);
  stopSign.initBuffers(context.gl, context);
  stopSign.setBuffers(context.gl);
  context.stopSign = stopSign;
  context.stopSign.move(4.5, 0, -2);
  context.stopSign.rotateY(-90);
  console.log("stop sign LOADED");

  let cubeMapImages = [];
  let posx = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_posx.png"
  );
  cubeMapImages.push(posx);
  let negx = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_negx.png"
  );
  cubeMapImages.push(negx);
  let posy = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_posy.png"
  );
  cubeMapImages.push(posy);
  let negy = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_negy.png"
  );
  cubeMapImages.push(negy);
  let posz = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_posz.png"
  );
  cubeMapImages.push(posz);
  let negz = await getTextureFromURL(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_negz.png"
  );
  cubeMapImages.push(negz);
  context.setCubeMap(cubeMapImages);

  resetConstants();

  //load the skybox
  let tempImage = await getTextureFromURL(
    "data:image/png;base64,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"
  );
  //                            front,  left,  top,   bottom,   back,   right
  let cube = new BackgroundCube([posz, negx, posy, negy, negz, posx]);
  //slot 1 = front
  //slot 2 = left
  //slot 3 = top
  //slot 4 = bottom
  //slot 5 = back
  //slot 6 = right
  context.skybox = cube;

  resetConstants();

  console.log("DONE LOADING");

  context.bunny.setParent(context.car);
  let carAnimator = new Object3D();
  context.carAnimator = carAnimator;
  context.car.setParent(context.carAnimator);
  context.car.drawShadows = true;
  context.stopSign.drawShadows = true;

  context.cameras[1].setParent(context.bunny);

  render(context);
}

//TODO REMOVE - this code sucks
function resetConstants() {
  vertices = []; // List of vertex definitions from OBJ
  normals = []; // List of normal definitions from OBJ
  uvs = []; // List of UV definitions from OBJ
  faceVertices = []; // Non-indexed final vertex definitions
  faceNormals = []; // Non-indexed final normal definitions
  faceUVs = []; // Non-indexed final UV definitions

  textureImage = null; // Image object for texture

  diffuse = []; // List of diffuse colors per vertex
  specular = []; // List of specular colors per vertex

  faceVerts = []; // Indices into vertices array for this face
  faceNorms = []; // Indices into normal array for this face
  faceTexs = []; // Indices into UVs array for this face

  currMaterial = null; // Current material in use
  textureURL = null; // URL of texture file to use

  // Mapping of material name to diffuse / specular colors
  diffuseMap = new Map();
  specularMap = new Map();
}
