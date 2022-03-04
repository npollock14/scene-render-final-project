//camera class that stores related attributes
class Camera {
  constructor(x = 1, y = 4, z = 8) {
    this.initPos = [x, y, z];
    this.eyeRel = [x, y, z];
    this.at = [0, 0, 0];
    this.up = [0, 1, 0];
    this.rotation = 0;

    //if the camera has a parent object, it is stored here
    this.parent = null;

    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }

  //gets the camera's transformation matrix (relative to the parent)
  getTransformMatrix() {
    if (this.parent != null) {
      return mult(this.parent.getTransformMatrix(), this.matrixRel);
    } else {
      return this.matrixRel;
    }
  }

  //gets the camera's parent position in world space
  getWorldPosition() {
    let resPos = mult(this.getTransformMatrix(), vec4(0, 0, 0, 1));
    return [resPos[0], resPos[1], resPos[2]];
  }

  //resets the camera position to the initial set position
  resetCameraPos() {
    this.eyeRel = this.initPos;
  }

  //sets the camera's parent to the given object
  setParent(object) {
    this.parent = object;
  }

  //gets where the camera is actually positioned in world space
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

  //sets the camera's position relative to the parent
  setRelToObject(object) {
    let worldPos = object.getWorldPosition();

    this.at = [worldPos[0], worldPos[1], worldPos[2]];
    this.up = [0, 1, 0];
    this.matrixRel = lookAt(this.getActualEye(), this.at, this.up);
  }

  //sets the camera's relative position
  setPosition(x, y, z) {
    this.eyeRel = [x, y, z];
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }

  // adds a vector to the camera's relative position
  addVector(x, y, z) {
    this.eyeRel[0] += x;
    this.eyeRel[1] += y;
    this.eyeRel[2] += z;
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }

  //sets the cameras at vector
  setAt(x, y, z) {
    this.at = [x, y, z];
    this.matrixRel = lookAt(this.eyeRel, this.at, this.up);
  }

  //logs camera data
  log() {
    console.log("Camera:");
    console.log("eye: " + this.eyeRel);
    console.log("at: " + this.at);
    console.log("up: " + this.up);
  }
}

//object class that stores object variables and useful methods
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

    //stores a list of the buffers that each object needs
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

    //if there is a texture, the texture info is stored here
    this.texture = {
      image: null,
      uv: [],
      textureNumber: null,
    };

    //if animation, the animation info is stored here
    this.frameCount = 0;
    this.animationEnabled = false;

    this.worldPosition = null;
    this.drawShadows = false;
    this.objectNumber = null;
  }

  //gets the transformation matrix of the object relative to its parent
  getTransformMatrix() {
    if (this.parent == null) return this.modelMatrix;
    return mult(this.parent.getTransformMatrix(), this.modelMatrix);
  }

  //gets the world position of the object
  getWorldPosition() {
    let transMatrix = this.getTransformMatrix();
    let worldPos = mult(transMatrix, vec4(0, 0, 0, 1));
    return [worldPos[0], worldPos[1], worldPos[2]];
  }

  //sets the object to be relative to the given object
  setParent(parentObject) {
    this.parent = parentObject;
  }

  //sets the object's model matrix based on its translate rotation and scale matrices
  setModelMatrix() {
    this.modelMatrix = mult(
      this.translateMatrix,
      mult(this.rotateMatrix, this.scaleMatrix)
    );
  }

  //scales the object by the given vector
  scale(x, y, z) {
    this.scaleMatrix = mult(this.scaleMatrix, scalem(x, y, z));
    this.setModelMatrix();
  }

  //sets the objects scale to the given vector
  setScale(x, y, z) {
    this.scaleMatrix = scalem(x, y, z);
    this.setModelMatrix();
  }

  //moves the object by the given vector
  move(x, y, z) {
    this.translateMatrix = mult(this.translateMatrix, translate(x, y, z));
    this.position = [
      this.position[0] + x,
      this.position[1] + y,
      this.position[2] + z,
    ];
    this.setModelMatrix();
  }

  //sets the objects position to the given vector
  setPosition(x, y, z) {
    this.translateMatrix = translate(x, y, z);
    this.position = [x, y, z];
    this.setModelMatrix();
  }

  //rotates the object by the given angle
  rotateX(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateX(angle));
    this.setModelMatrix();
  }

  //rotates the object by the given angle
  rotateY(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateY(angle));
    this.setModelMatrix();
  }

  //rotates the object by the given angle
  rotateZ(angle) {
    this.rotateMatrix = mult(this.rotateMatrix, rotateZ(angle));
    this.setModelMatrix();
  }

  //resets the objects rotation
  resetRotation() {
    this.rotateMatrix = mat4();
    this.setModelMatrix();
  }

  //initializes the buffers for the object
  initBuffers(gl, context) {
    this.buffers.v = gl.createBuffer();
    this.buffers.n = gl.createBuffer();
    this.buffers.diffuse = gl.createBuffer();
    this.buffers.specular = gl.createBuffer();

    //if there is a texture for the object, create the texture buffer
    if (this.hasTexture) {
      this.buffers.uv = gl.createBuffer();
    }
    this.objectNumber = context.totalObjects;
    context.totalObjects++;
  }

  //adds a texture to the object including uvs
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

  //pushes data to the objects buffers
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

  //main draw method for the object
  draw(gl, aLocs, uLocs, context) {
    //gets the transformation matrix of the object relative to its parent
    let resultantModelMatrix = this.getTransformMatrix();

    gl.uniformMatrix4fv(uLocs.mm, false, flatten(resultantModelMatrix));

    //bind buffers
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

    //if there is a texture, bind it
    if (this.hasTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.buffers.tex);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.uv);
      gl.enableVertexAttribArray(aLocs.uv);
      gl.vertexAttribPointer(aLocs.uv, 2, gl.FLOAT, false, 0, 0);

      //set the current texture flag
      context.shaderFlags.drawingTexture = true;
    } else {
      context.shaderFlags.drawingTexture = false;
    }

    //link the shader flags to the shader
    context.linkDrawingTexture();

    //handle shadows
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
  }
}

//class for a cube with different textures on each face
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

  //has its own draw function that just draws the faces
  draw() {
    this.faces.forEach((face) => {
      face.draw(context.gl, context.aLoc, context.uLoc, context);
    });
  }
}

//creates a face of a cube with the given image
function makeFace(image) {
  let face = new Object3D(faceVertices, null, null, null);
  face.addTexture(image, faceUVs, context.gl, context);
  face.initBuffers(context.gl, context);
  face.setBuffers(context.gl);
  face.scale(-75, -75, -75); //negative to keep backface culling working
  return face;
}

//stores program variables to not have to use global variables
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

    this.cameraAnimator;

    this.skybox;

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

    //shader flags
    this.shaderFlags = {
      lightingEnabled: true,
      drawingTexture: false,
      drawingShadow: true,
      currObject: null,
      reflectionsEnabled: false,
      refractionsEnabled: false,
      skyboxEnabled: false,
    };
    this.shadowMatrix = mat4();
    this.shadowMatrix[3][3] = 0;
    this.shadowMatrix[3][1] = -1 / this.lightPosition[1];

    this.cubeMap;
    this.totalObjects = 0;
  }

  //sets the flag for the current object
  setCurrObjectFlag() {
    this.gl.uniform1f(this.uLoc.currObject, this.shaderFlags.currObject);
  }

  //sets the cube map up taking in the required images
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

    //maps to slot 31 to not interfere with other textures
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 31);
  }

  //clears the canvas
  clearCanvas() {
    let gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  //sets up the locations for some of the shader attributes
  setAttributeLocations() {
    let gl = this.gl;
    this.aLoc.v = gl.getAttribLocation(this.program, "vPosition");
    this.aLoc.n = gl.getAttribLocation(this.program, "vNormal");
    this.aLoc.diffuse = gl.getAttribLocation(this.program, "diffuseColor");
    this.aLoc.specular = gl.getAttribLocation(this.program, "specularColor");
    this.aLoc.uv = gl.getAttribLocation(this.program, "texCoord");
  }

  //sets up the locations for some of the shader uniforms
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

  //links the projection matrix to the shader
  linkProjectionMatrix() {
    this.gl.uniformMatrix4fv(
      this.uLoc.pm,
      false,
      flatten(this.projectionMatrix)
    );
  }

  //linkes the light position to the shader
  linkLightPosition() {
    this.gl.uniform4fv(this.uLoc.lightPosition, flatten(this.lightPosition));
    //update the shadow matrix
    this.shadowMatrix[3][1] = -1 / this.lightPosition[1];
  }

  //links the camera matrix to the shader
  linkCameraMatrix() {
    let activeCam = this.cameras[this.activeCam];

    this.gl.uniformMatrix4fv(this.uLoc.cm, false, flatten(activeCam.matrixRel));
    this.gl.uniform3fv(
      this.uLoc.camPosition,
      flatten(activeCam.getActualEye())
    );
  }

  //toggles and links lighting to the shader
  toggleLighting() {
    this.shaderFlags.lightingEnabled = !this.shaderFlags.lightingEnabled;
    this.linkLightingToggle();
  }

  //links the lighting toggle to the shader
  linkLightingToggle() {
    this.gl.uniform1f(
      this.uLoc.lightingEnabled,
      this.shaderFlags.lightingEnabled ? 1.0 : 0.0
    );
  }

  //links the reflection toggle to the shader
  linkReflectionToggle() {
    this.gl.uniform1f(
      this.uLoc.reflectionsEnabled,
      this.shaderFlags.reflectionsEnabled ? 1.0 : 0.0
    );
  }

  //links refraction toggle to the shader
  linkRefractionToggle() {
    this.gl.uniform1f(
      this.uLoc.refractionsEnabled,
      this.shaderFlags.refractionsEnabled ? 1.0 : 0.0
    );
  }

  //toggles shadow flag
  toggleShadows() {
    this.shaderFlags.drawingShadow = !this.shaderFlags.drawingShadow;
  }

  //gets the shadow matrix as shown in class
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

  //links the shadow matrix to the shader
  linkShadowMatrix(resShadowMat) {
    this.gl.uniformMatrix4fv(
      this.uLoc.shadowMatrix,
      false,
      flatten(resShadowMat)
    );
  }

  //links the shadow flag to the shader
  setShadowFlag(flag) {
    this.gl.uniform1f(this.uLoc.drawingShadow, flag);
  }

  //links the drawing texture flag to the shader
  linkDrawingTexture() {
    this.gl.uniform1f(
      this.uLoc.drawingTexture,
      this.shaderFlags.drawingTexture ? 1.0 : 0.0
    );
  }

  //sets and links the light position to the shader
  setLightPosition(x, y, z) {
    this.lightPosition = vec4(x, y, z, 1);
    this.linkLightPosition();
  }
}
