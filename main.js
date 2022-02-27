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
  context.gl.clearColor(1.0, 1.0, 1.0, 1.0);

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

  context.linkProjectionMatrix();
  context.linkCameraMatrix();

  //enable depth testing and back-face culling
  context.gl.enable(context.gl.DEPTH_TEST);
  context.gl.enable(context.gl.CULL_FACE);
  context.gl.cullFace(context.gl.BACK);

  //link event handlers
  document.onkeydown = (e) => {
    handleKeyDown(e);
  };
  //TODO implement mouse moving to change where the camera looks
  // document.onmousemove = (e) => {
  //   handleMouseMove(e);
  // };
  // document.onmousedown = (e) => {
  //   //if lmb is pressed, set mouseDown to true
  //   if (e.button === 0) {
  //     mouseDown = true;
  //   }
  // };
  // document.onmouseup = (e) => {
  //   //if lmb is released, set mouseDown to false
  //   if (e.button === 0) {
  //     mouseDown = false;
  //   }
  // };
  // //if mouse leaves the canvas, mouseDown is set to false
  // context.canvas.onmouseleave = () => {
  //   mouseDown = false;
  // };

  //can now begin to load data asynchronously

  loadData(context);
}

function render() {
  context.clear();

  //draw car
  // context.car.rotateY(0.25);
  // context.car.rotateX(0.05);

  context.car.draw(context.gl, context.aLoc, context.uLoc);

  //draw bunny
  //   console.log(context.bunny.vertices[context.bunny.vertices.length - 1]);
  // context.bunny.move(0, 0, -0.01);
  context.bunny.draw(context.gl, context.aLoc, context.uLoc);
  requestAnimationFrame(render);
}

async function loadData() {
  console.log("loading data");
  //   load the car
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.mtl",
    "MTL"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.obj",
    "OBJ"
  );

  let car = new Object3D(faceVertices, normals, diffuse, specular);
  car.initBuffers(context.gl);
  car.setBuffers(context.gl);
  car.move(0, -1, -5);
  car.rotateY(45);
  context.car = car;

  console.log("car loaded");

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

  let bunny = new Object3D(faceVertices, normals, diffuse, specular);
  bunny.initBuffers(context.gl);
  bunny.setBuffers(context.gl);
  context.bunny = bunny;
  context.bunny.move(0.5, 0, -3);
  console.log("bunny loaded");

  console.log("done loading");
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
