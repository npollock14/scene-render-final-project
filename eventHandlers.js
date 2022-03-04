//maps keys to functions
const keyMap = {
  " ": translateCamera.bind(null, 0, 0.2, 0),
  Control: translateCamera.bind(null, 0, -0.2, 0),
  l: toggleLight,
  ArrowUp: moveLight.bind(null, 0, 0.1, 0),
  ArrowDown: moveLight.bind(null, 0, -0.1, 0),
  ArrowLeft: moveLight.bind(null, -0.1, 0, 0),
  ArrowRight: moveLight.bind(null, 0.1, 0, 0),
  ",": moveLight.bind(null, 0, 0, 0.1),
  ".": moveLight.bind(null, 0, 0, -0.1),
  m: toggleCarAnimation,
  d: toggleCamera,
  s: toggleShadows,
  r: toggleReflections,
  f: toggleRefractions,
  e: toggleSkybox,
  c: toggleMainCameraAnimation,
};

//when the key is pressed, call the function
function handleKeyDown(e) {
  //if the key is mapped to a function, call it
  if (keyMap[e.key]) {
    keyMap[e.key]();
  }
}

let mouseDown = false;

//swap between all active cameras
function toggleCamera() {
  context.activeCam = (context.activeCam + 1) % context.cameras.length;
  context.linkCameraMatrix();
}

//toggle the main camera animation
function toggleMainCameraAnimation() {
  context.cameraAnimator.animationEnabled =
    !context.cameraAnimator.animationEnabled;
}

//toggle skybox
function toggleSkybox() {
  context.shaderFlags.skyboxEnabled = !context.shaderFlags.skyboxEnabled;
}

//toggle refraction
function toggleRefractions() {
  context.shaderFlags.refractionsEnabled =
    !context.shaderFlags.refractionsEnabled;
  context.linkRefractionToggle();
}

//toggle reflections
function toggleReflections() {
  context.shaderFlags.reflectionsEnabled =
    !context.shaderFlags.reflectionsEnabled;
  context.linkReflectionToggle();
}

//toggle shadows
function toggleShadows() {
  context.toggleShadows();
}

//translate the camera
function translateCamera(x, y, z) {
  context.cameras[context.activeCam].addVector(x, y, z);
  context.linkCameraMatrix();
}

//toggle light
function toggleLight() {
  context.toggleLighting();
}

//move light to the right/left/up/down
function moveLight(x, y, z) {
  context.lightPosition[0] += x;
  context.lightPosition[1] += y;
  context.lightPosition[2] += z;
  console.log(context.lightPosition);
  context.linkLightPosition();
}

//toggle car animation
function toggleCarAnimation() {
  context.carAnimator.animationEnabled = !context.carAnimator.animationEnabled;
}
