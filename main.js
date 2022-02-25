let context;

function main() {
  //create and initialize the program context
  context = new ProgramContext();
  init();
}

function init() {
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

  context.projectionMatrix = perspective(
    60,
    context.canvas.width / context.canvas.height,
    0.1,
    100
  );
  console.log(context.gl);

  //stores the locations of the vertex and normal attributes
  context.setAttributeLocations();
  context.setUniformLocations();
  console.log(context.aLoc);
  console.log(context.uLoc);

  //can now begin to load data asynchronously
  loadData(context);
}

function render() {
  context.clear();

  //draw car
  context.car.rotateY(0.5);
  context.car.rotateX(0.25);
  context.car.draw(context.gl, context.aLoc, context.uLoc);

  //draw bunny
  //   context.bunny.rotateY(0.5);
  //   context.bunny.rotateX(0.25);
  //   context.bunny.draw(context.gl, context.aLoc, context.uLoc);
  requestAnimationFrame(render);
}

async function loadData() {
  console.log("loading data");
  //   load the car
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.obj",
    "OBJ"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/car.mtl",
    "MTL"
  );
  let car = new Object3D(faceVertices, normals);
  context.car = car;
  context.car.initBuffers(context.gl);
  context.car.setBuffers(context.gl);
  context.car.scale(0.1, 0.1, 0.1);
  console.log("car loaded");

  faceVertices = [];
  verticies = [];
  normals = [];

  //load the bunny
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/bunny.obj",
    "OBJ"
  );
  await loadFile(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3_1/bunny.mtl",
    "MTL"
  );
  let bunny = new Object3D(faceVertices, normals);
  context.bunny = bunny;
  context.bunny.initBuffers(context.gl);
  context.bunny.setBuffers(context.gl);
  //   context.bunny.scale(0.1, 0.1, 0.1);
  //translate bunny to the right
  //   context.bunny.move(0.5, 0, 0);
  console.log("bunny loaded");

  console.log("done loading");
  render(context);
}
