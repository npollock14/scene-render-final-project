class Camera {
  constructor(x = 1, y = 4, z = 3) {
    this.eye = [x, y, z];
    this.at = [0, 0, -5];
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
  constructor(vertices, normals, diffuse, specular) {
    this.vertices = vertices;
    this.normals = normals;
    this.modelMatrix = mat4();

    this.scaleMatrix = mat4();
    this.translateMatrix = mat4();
    this.position = [0, 0, 0];
    this.rotateMatrix = mat4();
    this.buffers = {
      v: null,
      n: null,
      diffuse: diffuse,
      specular: specular,
    };

    this.diffuse = diffuse;
    this.specular = specular;

    console.log("normals len:" + normals.length);
    console.log("verts len: " + vertices.length);
  }
  setModelMatrix() {
    this.modelMatrix = mult(
      this.translateMatrix,
      mult(this.rotateMatrix, this.scaleMatrix)
    );
  }
  scale(x, y, z) {
    this.scaleMatrix = mult(this.scaleMatrix, scalem(x, y, z));
    this.setModelMatrix();
  }
  setScale(x, y, z) {
    this.scaleMatrix = scalem(x, y, z);
    this.setModelMatrix();
  }
  move(x, y, z) {
    this.translateMatrix = mult(this.translateMatrix, translate(x, y, z));
    this.position = [
      this.position[0] + x,
      this.position[1] + y,
      this.position[2] + z,
    ];
    this.setModelMatrix();
  }
  setPosition(x, y, z) {
    this.translateMatrix = translate(x, y, z);
    this.position = [x, y, z];
    this.setModelMatrix();
  }
  rotateX(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateX(angle));
    this.setModelMatrix();
  }
  rotateY(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateY(angle));
    this.setModelMatrix();
  }
  rotateZ(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateZ(angle));
    this.setModelMatrix();
  }
  resetRotation() {
    this.rotateMatrix = mat4();
    this.setModelMatrix();
  }

  initBuffers(gl) {
    this.buffers.v = gl.createBuffer();
    this.buffers.n = gl.createBuffer();
    this.buffers.diffuse = gl.createBuffer();
    this.buffers.specular = gl.createBuffer();
  }
  setBuffers(gl) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.n);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.diffuse);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.diffuse), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.specular);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.specular), gl.STATIC_DRAW);
  }
  draw(gl, aLocs, uLocs) {
    gl.uniformMatrix4fv(uLocs.mm, false, flatten(this.modelMatrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
    gl.vertexAttribPointer(aLocs.v, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLocs.v);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.n);
    gl.vertexAttribPointer(aLocs.n, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLocs.n);

    gl.enableVertexAttribArray(aLocs.diffuse);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.diffuse);
    gl.vertexAttribPointer(aLocs.diffuse, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(aLocs.specular);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.specular);
    gl.vertexAttribPointer(aLocs.specular, 4, gl.FLOAT, false, 0, 0);

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
    this.lamp;
    this.street;
    this.projectionMatrix;
    this.lightPosition = vec4(-2, 3, 0, 1);
    //attribute locations
    this.aLoc = {
      v: null,
      n: null,
      diffuse: null,
      specular: null,
    };
    //uniform locations
    this.uLoc = {
      mm: null,
      pm: null,
      cm: null,
      lightPosition: null,
      lightingEnabled: null,
    };
    this.shaderFlags = {
      lightingEnabled: true,
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
    this.aLoc.diffuse = gl.getAttribLocation(this.program, "diffuseColor");
    this.aLoc.specular = gl.getAttribLocation(this.program, "specularColor");
  }
  setUniformLocations() {
    this.uLoc.mm = this.gl.getUniformLocation(this.program, "modelMatrix");
    this.uLoc.pm = this.gl.getUniformLocation(this.program, "projectionMatrix");
    this.uLoc.cm = this.gl.getUniformLocation(this.program, "cameraMatrix");
    this.uLoc.lightPosition = this.gl.getUniformLocation(
      this.program,
      "lightPosition"
    );
    this.uLoc.lightingEnabled = this.gl.getUniformLocation(
      this.program,
      "lightingEnabled"
    );
  }
  linkProjectionMatrix() {
    this.gl.uniformMatrix4fv(
      this.uLoc.pm,
      false,
      flatten(this.projectionMatrix)
    );
  }
  linkLightPosition() {
    this.gl.uniform4fv(this.uLoc.lightPosition, flatten(this.lightPosition));
  }
  linkCameraMatrix() {
    this.gl.uniformMatrix4fv(this.uLoc.cm, false, flatten(this.cam.matrix));
  }
  toggleLighting() {
    this.shaderFlags.lightingEnabled = !this.shaderFlags.lightingEnabled;
    this.linkLightingToggle();
  }
  linkLightingToggle() {
    this.gl.uniform1f(
      this.uLoc.lightingEnabled,
      this.shaderFlags.lightingEnabled ? 1.0 : 0.0
    );
  }
  setLightPosition(x, y, z) {
    this.lightPosition = vec4(x, y, z, 1);
    this.linkLightPosition();
  }
}
