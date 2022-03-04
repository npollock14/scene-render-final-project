class Camera {
  constructor(x = 1, y = 4, z = 8) {
    this.initPos = [x, y, z];
    this.eyeRel = [x, y, z];
    this.at = [0, 0, 0];
    this.up = [0, 1, 0];
    this.rotation = 0;

    this.parent = null;

    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }
  getTransformMatrix() {
    if (this.parent != null) {
      return mult(this.parent.getTransformMatrix(), this.matrixRel);
    } else {
      return this.matrixRel;
    }
  }
  getWorldPosition() {
    let resPos = mult(this.getTransformMatrix(), vec4(0, 0, 0, 1));
    return [resPos[0], resPos[1], resPos[2]];
  }
  resetCameraPos() {
    this.eyeRel = this.initPos;
  }
  setParent(object) {
    this.parent = object;
  }

  getActualEye() {
    if (this.parent != null) {
      let eyePos = mult(
        this.parent.getTransformMatrix(),
        vec4(this.eyeRel[0], this.eyeRel[1], this.eyeRel[2], 1)
      );
      return [eyePos[0], eyePos[1], eyePos[2]];
    } else {
      return this.eyeRel;
    }
  }

  setRelToObject(object) {
    let worldPos = object.getWorldPosition();

    this.at = [worldPos[0], worldPos[1], worldPos[2]];
    this.up = [0, 1, 0];
    this.matrixRel = lookAt(this.getActualEye(), this.at, this.up);
  }

  setPosition(x, y, z) {
    this.eyeRel = [x, y, z];
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
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
      tex: null,
    };

    this.diffuse = diffuse;
    this.specular = specular;

    this.hasTexture = false;

    this.texture = {
      image: null,
      uv: [],
      textureNumber: null,
    };
    this.frameCount = 0;
    this.worldPosition = null;

    this.drawShadows = false;
    this.objectNumber = null;
  }

  getTransformMatrix() {
    if (this.parent == null) return this.modelMatrix;
    return mult(this.parent.getTransformMatrix(), this.modelMatrix);
  }

  getWorldPosition() {
    let transMatrix = this.getTransformMatrix();
    let worldPos = mult(transMatrix, vec4(0, 0, 0, 1));
    return [worldPos[0], worldPos[1], worldPos[2]];
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

  initBuffers(gl, context) {
    this.buffers.v = gl.createBuffer();
    this.buffers.n = gl.createBuffer();
    this.buffers.diffuse = gl.createBuffer();
    this.buffers.specular = gl.createBuffer();
    if (this.hasTexture) {
      this.buffers.uv = gl.createBuffer();
    }
    this.objectNumber = context.totalObjects;
    context.totalObjects++;
  }

  addTexture(image, uvs, gl, context) {
    this.buffers.tex = gl.createTexture();
    this.hasTexture = true;
    this.texture.image = image;
    this.texture.uv = uvs;
    this.texture.textureNumber = context.activeTextures;

    gl.activeTexture(gl.TEXTURE0);

    gl.bindTexture(gl.TEXTURE_2D, this.buffers.tex);

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

    context.activeTextures++;
  }

  setBuffers(gl) {
    if (this.vertices) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.v);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
    }
    if (this.normals) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.n);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW);
    }

    if (this.diffuse) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.diffuse);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.diffuse), gl.STATIC_DRAW);
    }

    if (this.specular) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.specular);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.specular), gl.STATIC_DRAW);
    }

    if (this.hasTexture) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(this.texture.uv), gl.STATIC_DRAW);
    }
  }

  //MAIN-DRAW
  draw(gl, aLocs, uLocs, context) {
    let resultantModelMatrix = this.getTransformMatrix();

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

    //set the current object shader flag
    context.shaderFlags.currObject = this.objectNumber;
    context.setCurrObjectFlag();

    if (this.hasTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.buffers.tex);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
      gl.enableVertexAttribArray(aLocs.uv);
      gl.vertexAttribPointer(aLocs.uv, 2, gl.FLOAT, false, 0, 0);

      context.shaderFlags.drawingTexture = true;
    } else {
      context.shaderFlags.drawingTexture = false;
    }

    context.linkDrawingTexture();

    if (
      context.shaderFlags.drawingShadow &&
      this.drawShadows &&
      context.shaderFlags.lightingEnabled
    ) {
      context.setShadowFlag(1.0);
      context.linkShadowMatrix(context.getShadowMatrix());
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);
    }

    context.setShadowFlag(0.0);
    gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length);

    this.frameCount++;
  }
}

class BackgroundCube {
  constructor(images) {
    this.faces = [];

    //slot 1 = front
    //slot 2 = left
    //slot 3 = top
    //slot 4 = bottom
    //slot 5 = back
    //slot 6 = right

    resetConstants();
    quad(1, 0, 3, 2);
    // quad(0, 1, 3, 2);
    let face = makeFace(images[0]);
    face.rotateZ(180);
    this.faces.push(face);

    resetConstants();
    quad(2, 3, 7, 6);
    face = makeFace(images[1]);
    face.rotateX(180);
    this.faces.push(face);

    resetConstants();
    quad(3, 0, 4, 7);
    face = makeFace(images[2]);
    face.rotateY(90);
    this.faces.push(face);

    resetConstants();
    quad(6, 5, 1, 2);
    face = makeFace(images[3]);
    face.rotateY(270);
    this.faces.push(face);

    resetConstants();
    quad(5, 6, 7, 4);
    face = makeFace(images[4]);
    face.rotateZ(90);
    this.faces.push(face);

    resetConstants();
    quad(5, 4, 0, 1);
    face = makeFace(images[5]);
    face.rotateX(180);
    this.faces.push(face);

    resetConstants();
  }

  draw() {
    this.faces.forEach((face) => {
      face.draw(context.gl, context.aLoc, context.uLoc, context);
    });
  }
}
function makeFace(image) {
  let face = new Object3D(faceVertices, null, null, null);
  face.addTexture(image, faceUVs, context.gl, context);
  console.log(faceUVs);
  face.initBuffers(context.gl, context);
  face.setBuffers(context.gl);
  face.scale(-75, -75, -75);
  console.log(face.objectNumber);
  return face;
}

class ProgramContext {
  constructor() {
    this.canvas;
    this.gl;
    this.program;
    this.activeCam = 0;
    this.cameras = [];

    //Scene objects
    this.car;
    this.carAnimator;
    this.bunny;
    this.lamp;
    this.street;
    this.stopSign;
    this.stopSign2;
    this.stopSign3;

    this.skybox;

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
      drawingShadow: null,
      drawingTexture: null,
      camPosition: null,
      shadowMatrix: null,
      currObject: null,
      reflectionsEnabled: null,
      refractionsEnabled: null,
    };
    this.activeTextures = 0;
    this.shaderFlags = {
      lightingEnabled: true,
      drawingTexture: false,
      drawingShadow: true,
      currObject: null,
      reflectionsEnabled: false,
      refractionsEnabled: false,
    };
    this.shadowMatrix = mat4();
    this.shadowMatrix[3][3] = 0;
    this.shadowMatrix[3][1] = -1 / this.lightPosition[1];

    this.cubeMap;
    this.totalObjects = 0;
  }

  setCurrObjectFlag() {
    this.gl.uniform1f(this.uLoc.currObject, this.shaderFlags.currObject);
  }

  setCubeMap(images) {
    let gl = this.gl;
    let program = this.program;
    this.cubeMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE31);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubeMap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[0]
    );
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[1]
    );
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[2]
    );
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[3]
    );
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[4]
    );
    gl.texImage2D(
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      0,
      gl.RGB,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      images[5]
    );

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 31);
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
    this.uLoc.refractionsEnabled = this.gl.getUniformLocation(
      this.program,
      "refractionsEnabled"
    );
    this.uLoc.reflectionsEnabled = this.gl.getUniformLocation(
      this.program,
      "reflectionsEnabled"
    );

    this.uLoc.currObject = this.gl.getUniformLocation(
      this.program,
      "currObject"
    );

    this.uLoc.shadowMatrix = this.gl.getUniformLocation(
      this.program,
      "shadowMatrix"
    );
    this.uLoc.lightPosition = this.gl.getUniformLocation(
      this.program,
      "lightPosition"
    );
    this.uLoc.lightingEnabled = this.gl.getUniformLocation(
      this.program,
      "lightingEnabled"
    );
    this.uLoc.drawingShadow = this.gl.getUniformLocation(
      this.program,
      "drawingShadow"
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
    this.gl.uniform1f(this.uLoc.drawingTexture, 1.0);
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
    //update the shadow matrix
    this.shadowMatrix[3][1] = -1 / this.lightPosition[1];
  }
  linkCameraMatrix() {
    let activeCam = this.cameras[this.activeCam];

    this.gl.uniformMatrix4fv(this.uLoc.cm, false, flatten(activeCam.matrixRel));
    this.gl.uniform3fv(
      this.uLoc.camPosition,
      flatten(activeCam.getActualEye())
    );
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

  linkReflectionToggle() {
    this.gl.uniform1f(
      this.uLoc.reflectionsEnabled,
      this.shaderFlags.reflectionsEnabled ? 1.0 : 0.0
    );
  }

  linkRefractionToggle() {
    this.gl.uniform1f(
      this.uLoc.refractionsEnabled,
      this.shaderFlags.refractionsEnabled ? 1.0 : 0.0
    );
  }

  toggleShadows() {
    this.shaderFlags.drawingShadow = !this.shaderFlags.drawingShadow;
  }

  getShadowMatrix() {
    let resultantMatrix = translate(
      this.lightPosition[0],
      this.lightPosition[1],
      this.lightPosition[2]
    );
    resultantMatrix = mult(resultantMatrix, this.shadowMatrix);
    resultantMatrix = mult(
      resultantMatrix,
      translate(
        -this.lightPosition[0],
        -this.lightPosition[1],
        -this.lightPosition[2]
      )
    );
    return resultantMatrix;
  }

  linkShadowMatrix(resShadowMat) {
    this.gl.uniformMatrix4fv(
      this.uLoc.shadowMatrix,
      false,
      flatten(resShadowMat)
    );
  }

  setShadowFlag(flag) {
    this.gl.uniform1f(this.uLoc.drawingShadow, flag);
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
