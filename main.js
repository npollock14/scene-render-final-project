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
  context.gl.clearColor(0, 0, 0, 1.0);

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
    100
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
    context.carAnimator.rotateY(-0.5);
  }

  if (context.cameras[context.activeCam].parent != null) {
    context.cameras[context.activeCam].setRelToObject(
      context.cameras[context.activeCam].parent
    );
    context.linkCameraMatrix();
  }
  
  //draw car
  context.car.draw(context.gl, context.aLoc, context.uLoc, context);

  //draw bunny
  context.bunny.draw(context.gl, context.aLoc, context.uLoc, context);

  //draw lamp
  context.lamp.draw(context.gl, context.aLoc, context.uLoc, context);

  //draw street
  context.street.draw(context.gl, context.aLoc, context.uLoc, context);

  //draw stop sign
  context.stopSign.draw(context.gl, context.aLoc, context.uLoc, context);

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
  car.initBuffers(context.gl);
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
  bunny.initBuffers(context.gl);
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
  lamp.initBuffers(context.gl);
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
  street.initBuffers(context.gl);
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
  stopSign.addTexture(textureImage, faceUVs, context.gl, context.program);
  stopSign.initBuffers(context.gl);
  stopSign.setBuffers(context.gl);
  context.stopSign = stopSign;
  context.stopSign.move(4.5, 0, -2);
  context.stopSign.rotateY(-90);
  console.log("stop sign LOADED");

  resetConstants();

  //load the skybox
  // genCube();
  // let skybox = new Object3D(faceVertices, null, null, null);
  // let skyTex = await getTextureFromURL("https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/skybox_negx.png");
  // skybox.addTexture(skyTex, faceUVs, context.gl, context.program);
  // skybox.scale(10,10,10);
  // context.skybox = skybox;

  console.log("skybox loaded");

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
