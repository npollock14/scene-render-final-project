class Camera {
  constructor(x = 1, y = 4, z = 8) {
    const initPos = [x, y, z];
    this.eyeRel = [x, y, z];
    this.eyeActual = [];
    this.at = [0, 0, 0];
    this.up = [0, 1, 0];
    this.rotation = 0;

    this.parent = null;

    //if eyeRel matches atRel, subtract 1 from atRel's z to avoid divide by zero
    if (
      this.eyeRel[0] == this.at[0] &&
      this.eyeRel[1] == this.at[1] &&
      this.eyeRel[2] == this.at[2]
    ) {
      this.at[2] -= 1;
      //warn  user
      console.warn("Eye and at were the same. Subtracted 1 from at's z.");
    }
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }
  resetCameraPos() {
    this.eyeRel = initPos;
  }
  setParent(object) {
    this.parent = object;
  }

  setPosition(x, y, z) {
    this.eyeRel = [x, y, z];
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }
  setRotationY(degrees) {
    //set AT to a rotation about the cameras position
  }
  addVector(x, y, z) {
    this.eyeRel[0] += x;
    this.eyeRel[1] += y;
    this.eyeRel[2] += z;
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }
  setAt(x, y, z) {
    this.at = [x, y, z];
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }

  log() {
    console.log("Camera:");
    console.log("eye: " + this.eyeRel);
    console.log("at: " + this.at);
    console.log("up: " + this.up);
  }
}

class Object3D {
  constructor(vertices, normals, diffuse, specular) {
    this.vertices = vertices;
    this.normals = normals;
    this.modelMatrix = mat4();

    this.parent = null;

    this.scaleMatrix = mat4();
    this.translateMatrix = mat4();
    this.position = [0, 0, 0];
    this.rotateMatrix = mat4();
    this.buffers = {
      v: null,
      n: null,
      diffuse: diffuse,
      specular: specular,
      uv: null,
    };

    this.diffuse = diffuse;
    this.specular = specular;

    this.hasTexture = false;

    this.texture = {
      image: null,
      uv: [],
    };
    this.frameCount = 0;

    this.worldPosition = null;
  }

  getTransformMatrix() {
    if (this.parent == null) return this.modelMatrix;
    return mult(this.parent.getTransformMatrix(), this.modelMatrix);
  }

  getWorldPosition() {
    let transMatrix = this.getTransformMatrix();
    let worldPos = mult(transMatrix, vec4(0, 0, 0, 1));
    return worldPos;
  }

  setParent(parentObject) {
    this.parent = parentObject;
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
    if (this.hasTexture) {
      this.buffers.uv = gl.createBuffer();
    }
  }

  addTexture(image, uvs, gl, program) {
    this.hasTexture = true;
    this.texture.image = image;
    this.texture.uv = uvs;

    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      this.texture.image
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
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

    if (this.hasTexture) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texture.uv), gl.STATIC_DRAW);
    }
  }

  //OBJECT DRAW CALL
  draw(gl, aLocs, uLocs, context) {
    let resultantModelMatrix = this.modelMatrix;
    let activeCam = context.cameras[context.activeCam];

    if (this.parent != null) {
      resultantModelMatrix = this.getTransformMatrix();
    }

    context.linkCameraMatrix();

    gl.uniformMatrix4fv(uLocs.mm, false, flatten(resultantModelMatrix));

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
    gl.vertexAttribPointer(aLocs.v, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLocs.v);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.n);
    gl.vertexAttribPointer(aLocs.n, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aLocs.n);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.diffuse);
    gl.enableVertexAttribArray(aLocs.diffuse);
    gl.vertexAttribPointer(aLocs.diffuse, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.specular);
    gl.enableVertexAttribArray(aLocs.specular);
    gl.vertexAttribPointer(aLocs.specular, 4, gl.FLOAT, false, 0, 0);

    if (this.hasTexture) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
      gl.enableVertexAttribArray(aLocs.uv);
      gl.vertexAttribPointer(aLocs.uv, 2, gl.FLOAT, false, 0, 0);

      context.shaderFlags.drawingTexture = true;
    } else {
      context.shaderFlags.drawingTexture = false;
    }

    context.linkDrawingTexture();

    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);

    this.frameCount++;
  }
}

class ProgramContext {
  constructor() {
    this.canvas;
    this.gl;
    this.program;
    this.activeCam = 1;
    this.cameras = [new Camera(0, 4, -10), new Camera()];

    //Scene objects
    this.car;
    this.carAnimator;
    this.bunny;
    this.lamp;
    this.street;

    this.carAnimationEnabled = true;

    this.projectionMatrix;
    this.lightPosition = [0, 3, 0, 1];

    //attribute locations
    this.aLoc = {
      v: null,
      n: null,
      diffuse: null,
      specular: null,
      uv: null,
    };
    //uniform locations
    this.uLoc = {
      mm: null,
      pm: null,
      cm: null,
      lightPosition: null,
      lightingEnabled: null,
      drawingTexture: null,
      camPosition: null,
    };
    this.shaderFlags = {
      lightingEnabled: true,
      drawingTexture: false,
    };
  }
  clearCanvas() {
    let gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  setAttributeLocations() {
    let gl = this.gl;
    this.aLoc.v = gl.getAttribLocation(this.program, "vPosition");
    this.aLoc.n = gl.getAttribLocation(this.program, "vNormal");
    this.aLoc.diffuse = gl.getAttribLocation(this.program, "diffuseColor");
    this.aLoc.specular = gl.getAttribLocation(this.program, "specularColor");
    this.aLoc.uv = gl.getAttribLocation(this.program, "texCoord");
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
    this.uLoc.drawingTexture = this.gl.getUniformLocation(
      this.program,
      "drawingTexture"
    );
    this.uLoc.camPosition = this.gl.getUniformLocation(
      this.program,
      "cameraPosition"
    );
    //give drawingTexture a default value of 0.0
    this.gl.uniform1f(this.uLoc.drawingTexture, 0.0);
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
    let camMatrix = this.cameras[this.activeCam].matrixRel;
    let camEyePos = this.cameras[this.activeCam].eyeRel;

    this.gl.uniformMatrix4fv(this.uLoc.cm, false, flatten(camMatrix));
    this.gl.uniform3fv(this.uLoc.camPosition, flatten(camEyePos));
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
  linkDrawingTexture() {
    this.gl.uniform1f(
      this.uLoc.drawingTexture,
      this.shaderFlags.drawingTexture ? 1.0 : 0.0
    );
  }

  setLightPosition(x, y, z) {
    this.lightPosition = vec4(x, y, z, 1);
    this.linkLightPosition();
  }
}
