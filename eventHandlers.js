const keyMap = {
  w: foward,
  s: backwards,
  " ": up,
  Control: down,
  a: left,
  d: right,
  l: toggleLight,
  ArrowUp: moveLight.bind(null, 0, 0.1, 0),
  ArrowDown: moveLight.bind(null, 0, -0.1, 0),
  ArrowLeft: moveLight.bind(null, -0.1, 0, 0),
  ArrowRight: moveLight.bind(null, 0.1, 0, 0),
  ",": moveLight.bind(null, 0, 0, 0.1),
  ".": moveLight.bind(null, 0, 0, -0.1),
};

let mouseDown = false;

function handleKeyDown(e) {
  //if the key is mapped to a function, call it
  if (keyMap[e.key]) {
    keyMap[e.key]();
  }
}

//translate the camera forward
function foward() {
  context.cam.addVector(0, 0, -0.1);
  context.linkCameraMatrix();
}
//translate the camera backward
function backwards() {
  context.cam.addVector(0, 0, 0.1);
  context.linkCameraMatrix();
}
function up() {
  context.cam.addVector(0, 0.1, 0);
  context.linkCameraMatrix();
}
function down() {
  context.cam.addVector(0, -0.1, 0);
  context.linkCameraMatrix();
}
function left() {
  context.cam.addVector(-0.1, 0, 0);
  context.linkCameraMatrix();
}
function right() {
  context.cam.addVector(0.1, 0, 0);
  context.linkCameraMatrix();
}
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
