class Camera {
  constructor(x = 0, y = 0, z = 0) {
    this.eye = [x, y, z];
    this.at = [0, 0, -1];
    this.up = [0, 1, 0];
    this.matrix = lookAt(this.eye, this.at, this.up);
    this.log();
  }

  setPosition(x, y, z) {
    this.eye = [x, y, z];
    this.matrix = lookAt(this.eye, this.at, this.up);
  }
  addVector(x, y, z) {
    this.eye[0] += x;
    this.eye[1] += y;
    this.eye[2] += z;
    this.matrix = lookAt(this.eye, this.at, this.up);
  }
  setAt(x, y, z) {
    this.at = [x, y, z];
    this.matrix = lookAt(this.eye, this.at, this.up);
  }

  log() {
    console.log("Camera:");
    console.log("eye: " + this.eye);
    console.log("at: " + this.at);
    console.log("up: " + this.up);
  }
}

class Object3D {
  constructor(vertices, normals) {
    this.vertices = vertices;
    this.normals = normals;
    this.modelMatrix = mat4();
    this.buffers = {
      v: null,
      n: null,
    };
  }
  scale(x, y, z) {
    this.modelMatrix = mult(this.modelMatrix, scalem(x, y, z));
  }
  move(x, y, z) {
    this.modelMatrix = mult(this.modelMatrix, translate(x, y, z));
  }
  rotateX(angle) {
    this.modelMatrix = mult(this.modelMatrix, rotateX(angle));
  }
  rotateY(angle) {
    this.modelMatrix = mult(this.modelMatrix, rotateY(angle));
  }
  rotateZ(angle) {
    this.modelMatrix = mult(this.modelMatrix, rotateZ(angle));
  }
  initBuffers(gl) {
    this.buffers.v = gl.createBuffer();
    this.buffers.n = gl.createBuffer();
  }
  setBuffers(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.n);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);
  }
  draw(gl, aLocs, uLocs) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
    gl.vertexAttribPointer(aLocs.v, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLocs.v);
    gl.uniformMatrix4fv(uLocs.m, false, flatten(this.modelMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
  }
}

class ProgramContext {
  constructor() {
    this.canvas;
    this.gl;
    this.program;
    this.cam = new Camera();
    this.car;
    this.bunny;
    this.projectionMatrix;
    this.aLoc = {
      v: null,
      n: null,
    };
    this.uLoc = {
      m: null,
    };
  }
  clear() {
    let gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  setAttributeLocations() {
    let gl = this.gl;
    this.aLoc.v = gl.getAttribLocation(this.program, "vPosition");
    this.aLoc.n = gl.getAttribLocation(this.program, "vNormal");
  }
  setUniformLocations() {
    let gl = this.gl;
    this.uLoc.m = gl.getUniformLocation(this.program, "modelMatrix");
  }
}
