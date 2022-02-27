let vertices = []; // List of vertex definitions from OBJ
let normals = []; // List of normal definitions from OBJ
let uvs = []; // List of UV definitions from OBJ
let faceVertices = []; // Non-indexed final vertex definitions
let faceNormals = []; // Non-indexed final normal definitions
let faceUVs = []; // Non-indexed final UV definitions
let faceIndices = [];

let diffuse = [];
let specular = [];

let faceVerts = []; // Indices into vertices array for this face
let faceNorms = []; // Indices into normal array for this face
let faceTexs = []; // Indices into UVs array for this face

let currMaterial = null; // Current material in use
let textureURL = null; // URL of texture file to use

// Mapping of material name to diffuse / specular colors
let diffuseMap = new Map();
let specularMap = new Map();

/**
 * Loads a text file into the local program from a URL.
 *
 * @param fileURL The URL of the file to load.
 * @param fileType The type (OBJ or MTL) of the file being loaded.
 */
async function loadFile(fileURL, fileType) {
  // Asynchronously load file
  res = await fetch(fileURL);
  let objFile = await res.text();
  switch (fileType) {
    case "OBJ":
      parseObjFile(objFile);
      break;
    case "MTL":
      parseMtlFile(objFile);
      break;
    default:
      break;
  }
}

/**
 * Parses the vertex, normal, texture, face, and material information from an OBJ file
 * and stores the values in various global arrays for access elsewhere.
 *
 * @param objFile The file to parse.
 */
function parseObjFile(objFile) {
  // Split and sanitize OBJ file input
  let objLines = objFile.split("\n");
  objLines = objLines.filter((line) => {
    return line.search(/\S/) !== -1;
  });
  objLines = objLines.map((line) => {
    return line.trim();
  });

  for (let currLine = 0; currLine < objLines.length; currLine++) {
    let line = objLines[currLine];

    if (line.startsWith("vn")) {
      // Vertex normal definition
      let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      normals.push(vec4(coords[0], coords[1], coords[2], 0.0));
    } else if (line.startsWith("vt")) {
      // Vertex UV definition
      let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      uvs.push(vec2(coords[0], 1.0 - coords[1]));
    } else if (line.charAt(0) === "v") {
      // Vertex position definition
      let coords = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      vertices.push(vec4(coords[0], coords[1], coords[2], 1.0));
    } else if (line.startsWith("usemtl")) {
      // Material use definition
      currMaterial = line.substr(line.indexOf(" ") + 1);
    } else if (line.charAt(0) === "f") {
      parseFaces(line);
    }

    // Triangulate convex polygon using fan triangulation
    let mat = getMat(currMaterial);
    let index = 0;
    for (let i = 1; i < faceVerts.length - 1; i++) {
      diffuse.push(mat["diffuse"], mat["diffuse"], mat["diffuse"]);
      specular.push(mat["specular"], mat["specular"], mat["specular"]);
      faceVertices.push(faceVerts[0], faceVerts[i], faceVerts[i + 1]);
      faceNormals.push(faceNorms[0], faceNorms[i], faceNorms[i + 1]);
      faceUVs.push(faceTexs[0], faceTexs[i], faceTexs[i + 1]);
      index += 3;
    }
    faceIndices.push(index);
    index = 0;
    faceVerts = []; // Indices into vertices array for this face
    faceNorms = []; // Indices into normal array for this face
    faceTexs = []; // Indices into UVs array for this face
  }
}

/**
 * Parse a face line (a line beginning with "f") in an obj file and puts the
 * related vertex, normal, and texture information for a face together into
 * global arrays for access elsewhere. Serves as a helper for parseObjFile.
 *
 * @param line The face line to parse.
 */
function parseFaces(line) {
  // Extract the v/vt/vn statements into an array
  let indices = line.match(/[0-9\/]+/g);
  // push currMaterial into faceMats array n times where n = indices.length

  // We have to account for how vt/vn can be omitted
  let types = indices[0].match(/[\/]/g).length;

  if (types === 0) {
    // Only v provided
    indices.forEach((value) => {
      faceVerts.push(vertices[parseInt(value) - 1]);
    });
  } else if (types === 1) {
    // v and vt provided
    indices.forEach((value) => {
      faceVerts.push(
        vertices[parseInt(value.substr(0, value.indexOf("/"))) - 1]
      );
      faceTexs.push(uvs[parseInt(value.substr(value.indexOf("/") + 1)) - 1]);
    });
  } else if (types === 2) {
    // v, maybe vt, and vn provided
    let firstSlashIndex = indices[0].indexOf("/");
    if (indices[0].charAt(firstSlashIndex + 1) === "/") {
      // vt omitted
      indices.forEach((value) => {
        faceVerts.push(
          vertices[parseInt(value.substr(0, value.indexOf("/"))) - 1]
        );
        faceNorms.push(
          normals[parseInt(value.substr(value.indexOf("/") + 2)) - 1]
        );
      });
    } else {
      // vt provided
      indices.forEach((value) => {
        let firstSlashIndex = value.indexOf("/");
        let secondSlashIndex = value.indexOf("/", firstSlashIndex + 1);
        faceVerts.push(
          vertices[parseInt(value.substr(0, firstSlashIndex)) - 1]
        );
        faceTexs.push(
          uvs[parseInt(value.substr(firstSlashIndex + 1, secondSlashIndex)) - 1]
        );
        faceNorms.push(
          normals[parseInt(value.substr(secondSlashIndex + 1)) - 1]
        );
      });
    }
  }
}

/**
 * Parses the material information from an MTL file
 * and stores the values in various global arrays for access elsewhere.
 *
 * @param mtlFile The file to parse.
 */
function parseMtlFile(mtlFile) {
  // Sanitize the MTL file
  let mtlLines = mtlFile.split("\n");
  mtlLines = mtlLines.filter((line) => {
    return line.search(/\S/) !== -1;
  });
  mtlLines = mtlLines.map((line) => {
    return line.trim();
  });

  for (let currLine = 0; currLine < mtlLines.length; currLine++) {
    let line = mtlLines[currLine];

    if (line.startsWith("newmtl")) {
      // Hit a new material
      currMaterial = line.substr(line.indexOf(" ") + 1);
    } else if (line.startsWith("Kd")) {
      // Material diffuse definition
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      diffuseMap.set(currMaterial, [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ]);
    } else if (line.startsWith("Ks")) {
      // Material specular definition
      let values = line.match(/[+-]?([0-9]+[.])?[0-9]+/g);
      specularMap.set(currMaterial, [
        parseFloat(values[0]),
        parseFloat(values[1]),
        parseFloat(values[2]),
        1.0,
      ]);
    } else if (line.startsWith("map_Kd")) {
      // Material diffuse texture definition
      textureURL =
        "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/" +
        line.substr(line.indexOf(" ") + 1);
    }
  }
}

//takes the matName and returns the diffuse color and specular colors in an array
//uses the global diffuseMap and specularMap
//if the mapping does not exist, warn the user and return the default values of (.5,.5,.5,1)
function getMat(matName) {
  let mat = {};
  mat["diffuse"] = [0.5, 0.5, 0.5, 1];
  mat["specular"] = [0.5, 0.5, 0.5, 1];
  if (diffuseMap.has(matName)) {
    mat["diffuse"] = diffuseMap.get(matName);
  } else {
    console.warn("Warning: " + matName + " has no diffuse color");
  }
  if (specularMap.has(matName)) {
    mat["specular"] = specularMap.get(matName);
  } else {
    console.warn("Warning: " + matName + " has no specular color");
  }

  return mat;
}
