/**
 * Created by Bons on 05/05/2017.
 */
var Model = function()
{
    this.vertexBufferId = 0;
    this.normalBufferId = 0;
    this.elementIndexBufferId = 0;
    this.elementCount;
};

var Config = function()
{
    this.lightType = 0;
    this.backgroundColor = [0,0,0];
    this.showShadowMap = false;
    this.rotateCamera = true;
    this.modelColor = [ 127 , 127 , 127 ];
    this.ambientlightColor = [ 255 , 255 , 255 ];
    this.ambientlightIntensity = 0.01;
    this.diffuselightColor = [ 255 , 255 , 255 ];
    this.diffuselightIntensity = 0.6;
    this.specularlightColor = [255, 255, 255];
    this.specularlightIntensity = 1.0;
    this.specularlightExponent = 60.0;
    this.activePlane = true;
    this.visualizePlane = false;
    this.shadowBias = 0.02;
    this.attenuation =
        {
            constant : 1.0,
            linear: 0.05,
            quadratic: 0.05
        };
    this.lightDir =
        {
            x: 0.0,
            y: -1.0,
            z: 0.1
        };
    this.lightPos =
        {
            x: -0.3,
            y: 0.4,
            z: 2.5

        };
    this.cameraPos =
        {
            x: 0.0,
            y: 0.0,
            z: 5.0

        };
    //Cutting Plane
    this.cuttingPlaneTrans =
        {
            x: 0.0,
            y: 0.0,
            z: -0.5
        };
    this.cuttingPlaneRot =
        {
            rotX : 0.0,
            rotY : 0.0,
            rotZ : 0.0

        };
    //Ground plane
    this.groundHeight = -2.0;
};

var canvas;
var gl;

//Config
var config = new Config();

//Resources
var numberOfResourcesToLoad = 5;

//Shaders
var shaderId;
var depthShaderId;
var lightModelShaderId;

//Cutting Plane;
var cuttingPlane;
var simpleCutPlane;
var planeModel;

//Ground planes
var groundPlane;

//Wall
var backWallPlane;

//Model buffers
var vertexBufferId = 0;
var normalBufferId = 0;
var elementIndexBufferId = 0;
var elementCount;
var monkeyVertexBufferId= 0;
var monkeyNormalBufferId= 0;
var monkeyElementIndexBufferId=0;
var monkeyElementCount;

//Light Model
var lightArrow;
var lightStar;

//Mouse events
var isDragging = false;
var mouseX;
var mouseY;

//Camera
var cameraRotX = 45;
var cameraRotY = 45;

//ShadowMap
var cubeProjection;
var cubeVP;
var dirVP;
var shadowMapSize = 1024;
var framebuffer;
var cubeFramebufferArray = [];
var prevLightPos = [];
var prevLightDir = [];
var shadowMapTex;
var shadowCubemapTex;
var shadowCubeMapFaces;
var shadowCubemapDirections =
    [
        vec3(1.0,0.0,0.0),
        vec3(-1.0,0.0,0.0),
        vec3(0.0,1.0,0.0),
        vec3(0.0,-1.0,0.0),
        vec3(0.0,0.0,1.0),
        vec3(0.0,0.0,-1.0)
    ];
var shadowCubemapUpDirection =
    [
        vec3(0.0,-1.0,0.0),
        vec3(0.0,-1.0,0.0),
        vec3(0.0,0.0,1.0),
        vec3(0.0,0.0,-1.0),
        vec3(0.0,-1.0,0.0),
        vec3(0.0,-1.0,0.0)
    ];


function ResourceLoaded()
{
    numberOfResourcesToLoad--;
    if (numberOfResourcesToLoad==0){
        // start rendering
        Draw();
    }
    if (numberOfResourcesToLoad < 0){
        alert("Invalid number of resources");
    }
}
function ResourceLoadError(error)
{
    console.log(error);
    alert(error);
}

function ShaderLoaded(id)
{
    shaderId = id;
    ResourceLoaded();
}
function LightShaderLoaded(id)
{
    lightModelShaderId = id;
    ResourceLoaded();
}
function DepthShaderLoaded(id){
    depthShaderId = id;
    ResourceLoaded();
}
//For lightType
function CreateArrow()
{
    var arrowObj = {};
    arrowObj.vertexBufferId = CreateArrayBuffer([
        0,0,0,
        0,0,-1,
        0,0,-1,
        0,0.25,-.75,
        0,0,-1,
        0,-0.25,-.75,
        0,0,-1,
        0.25,0,-.75,
        0,0,-1,
        -0.25,0,-.75
    ]);

    arrowObj.normalBufferId = CreateArrayBuffer([
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
    ]);

    arrowObj.elementIndexBufferId = CreateElementArrayBuffer([
        0,1,
        2,3,
        4,5,
        6,7,
        8,9
    ]);


    arrowObj.elementCount = 10;
    return arrowObj;
}
function CreateStar()
{
    var starObj = {};
    starObj.vertexBufferId = CreateArrayBuffer([
        -.5,-.5, .5,
        .5, .5,-.5,
        -.5, .5, .5,
        .5,-.5,-.5,

        .5,-.5, .5,
        -.5, .5,-.5,
        .5, .5, .5,
        -.5,-.5,-.5
    ]);

    starObj.normalBufferId = CreateArrayBuffer([
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0
    ]);

    starObj.elementIndexBufferId = CreateElementArrayBuffer([
        0,1,
        2,3,
        4,5,
        6,7
    ]);


    starObj.elementCount = 8;
    return starObj;
}
function ModelLoad(input)
{
    var model = OBJParser(input)[0];

    var errorCount = 0;

    if(vertexBufferId)
    {
        gl.deleteBuffer(vertexBufferId);
        gl.deleteBuffer(normalBufferId);
        gl.deleteBuffer(elementIndexBufferId);
    }
    vertexBufferId = CreateArrayBuffer(flatten(model.vertices));
    normalBufferId = CreateArrayBuffer(flatten(model.normals));
    elementIndexBufferId = CreateElementArrayBuffer(model.indices);
    elementCount = model.indices.length;
    ResourceLoaded();
}
function MonkeyModelLoad(input)
{
    var model = OBJParser(input)[0];

    var errorCount = 0;

    if(monkeyVertexBufferId)
    {
        gl.deleteBuffer(monkeyVertexBufferId);
        gl.deleteBuffer(monkeyNormalBufferId);
        gl.deleteBuffer(monkeyElementIndexBufferId);
    }
    monkeyVertexBufferId = CreateArrayBuffer(flatten(model.vertices));
    monkeyNormalBufferId = CreateArrayBuffer(flatten(model.normals));
    monkeyElementIndexBufferId = CreateElementArrayBuffer(model.indices);
    monkeyElementCount = model.indices.length;
    ResourceLoaded();
}
function CreateSquare(size)
{
    var squareObj = {};
    squareObj.vertexBufferId = CreateArrayBuffer
    ([
            -size/2,0,size/2,
            size/2,0,size/2,
            size/2,0,-size/2,
            -size/2,0,-size/2

    ]);
    squareObj.normalBufferId = CreateArrayBuffer
    ([
        0,1,0,
        0,1,0,
        0,1,0,
        0,1,0
    ]);
    squareObj.elementIndexBufferId = CreateElementArrayBuffer
    ([
        0,1,2,
        0,2,3
    ]);
    squareObj.elementCount = 6;
    return squareObj;

}
function CreateCuttingPlane()
{
    var planeVariable = {};

    planeVariable.pOne =  vec3(1.0,0.0,0.0);
    planeVariable.pTwo =  vec3(-1.0,0.0,0.0);
    planeVariable.pThree =  vec3(0.0,0.0,1.0);
    planeVariable.normal = vec3(0.0,1.0,0.0);

    return planeVariable

}
function CreateSimpleCutPlane(pOne, pTwo, pThree)
{
    var plane = {};
    var CrossP = cross(vec3(pTwo[0]-pOne[0],pTwo[1]-pOne[1],pTwo[2]-pOne[2]),
                       vec3(pThree[0]-pOne[0],pThree[1]-pOne[1],pThree[2]-pOne[2]));
    plane.normal = normalize(CrossP);
    plane.distN = -dot(plane.normal,vec3(pOne));
    return plane;
}
function InitCubeFramebufferObject(width,height)
{
    var error = function() {
        for(var i = 0; i < cubeFramebufferArray.length;i++)
        {
            if (cubeFramebufferArray[i]) gl.deleteFramebuffer(cubeFramebufferArray[i]);
        }
        cubeFramebufferArray.length = 0;
        if (shadowCubemapTex) gl.deleteTexture(shadowCubemapTex);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    };

    //Create Cube shadowMap
    shadowCubemapTex = gl.createTexture();

    if(!shadowCubemapTex)
    {
        console.log('Failed to create shadowCubemapTexture');
        return error();
    }
    shadowCubeMapFaces =
        [
            gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
        ];

    gl.bindTexture(gl.TEXTURE_CUBE_MAP,shadowCubemapTex);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    for(var i = 0; i<6;i++)
    {
        gl.texImage2D(shadowCubeMapFaces[i],0,gl.RGBA, width,height,0, gl.RGBA, gl.UNSIGNED_BYTE,null);
    }
    var depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,width,height);
    for(var i = 0; i<6;i++)
    {
        var frameBufferOBJ =  gl.createFramebuffer();

        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferOBJ);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,shadowCubeMapFaces[i],shadowCubemapTex,0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER, depthBuffer);


        var configure = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(gl.FRAMEBUFFER_COMPLETE !== configure)
        {
            console.log('FBO incomplete. Missing: '+configure.toString());
            return error();
        }
        cubeFramebufferArray.push(frameBufferOBJ);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,null);

    return cubeFramebufferArray;

}
function InitFramebufferObject(width, height)
{

    var error = function() {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (shadowMapTex) gl.deleteTexture(shadowMapTex);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    };

    //Create FBO
    framebuffer = gl.createFramebuffer();
    if(!framebuffer)
    {
        console.log('Failed to create FBO');
        return error();
    }

    //Create texture object
    shadowMapTex = gl.createTexture();
    if(!shadowMapTex)
    {
        console.log('Failed to create shadowMapTexture');
        return error();

    }
    //Sets size for an empty texture
    gl.bindTexture(gl.TEXTURE_2D, shadowMapTex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);


    //Create depthBuffer
    var depthBuffer = gl.createRenderbuffer();
    if(!depthBuffer)
    {
        console.log('Failed to create depthBuffer');
        return error();
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width,height);

    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMapTex,0);


    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER, depthBuffer);

    //Check framebuffer
    var configure = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if(gl.FRAMEBUFFER_COMPLETE !== configure)
    {
        console.log('FBO incomplete. Missing: '+configure.toString());
        return error();
    }

    framebuffer.texture = shadowMapTex;

    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindRenderbuffer(gl.RENDERBUFFER,null);

    return framebuffer;
}
function DrawPlane(planeModel,shaderId, modelMat)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, planeModel.vertexBufferId);
    var vertexAttributeLocation = gl.getAttribLocation(shaderId,"vertex");
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER, planeModel.normalBufferId);
    var normalAttributeLocation=gl.getAttribLocation(shaderId, "normal");
    if(normalAttributeLocation !=-1)
    {
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,planeModel.elementIndexBufferId);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"model"), false, flatten(modelMat));

    gl.drawElements(gl.TRIANGLES, planeModel.elementCount,gl.UNSIGNED_SHORT,0);
}
function DrawSphere(shaderId, modelMat, viewMat)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferId);
    var vertexSize = 3;
    var vertexAttributeLocation = gl.getAttribLocation(shaderId, "vertex");
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation, vertexSize, gl.FLOAT, false,0,0); //can be optimized

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferId);
    var normalAttributeLocation = gl.getAttribLocation(shaderId, "normal");
    if(normalAttributeLocation !=-1)
    {
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndexBufferId);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"model"),false,flatten(modelMat));
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"view"),false, flatten(viewMat));

    gl.drawElements(gl.TRIANGLES,elementCount,gl.UNSIGNED_SHORT, 0);
}
function DrawMonkey(shaderId, modelMat, viewMat)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, monkeyVertexBufferId);
    var vertexSize = 3;
    var vertexAttributeLocation = gl.getAttribLocation(shaderId, "vertex");
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation, vertexSize, gl.FLOAT, false,0,0); //can be optimized

    gl.bindBuffer(gl.ARRAY_BUFFER, monkeyNormalBufferId);
    var normalAttributeLocation = gl.getAttribLocation(shaderId, "normal");
    if(normalAttributeLocation !=-1)
    {
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, monkeyElementIndexBufferId);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"model"),false,flatten(modelMat));
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"view"),false, flatten(viewMat));

    gl.drawElements(gl.TRIANGLES,monkeyElementCount,gl.UNSIGNED_SHORT, 0);
}
function DrawArrow(shaderId, arrow)
{
    gl.bindBuffer(gl.ARRAY_BUFFER,arrow.vertexBufferId);
    var vertexAttributeLocation = gl.getAttribLocation(shaderId,"vertex");
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation,3,gl.FLOAT,false,0,0);

    gl.bindBuffer(gl.ARRAY_BUFFER,arrow.normalBufferId);
    var normalAttributeLocation = gl.getAttribLocation(shaderId,"normal");
    if(normalAttributeLocation !=-1)
    {
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation,3,gl.FLOAT,false,0,0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, arrow.elementIndexBufferId);

    var arrowDirection = [0,1,0];
    if(config.lightDir.x != 0 || config.lightDir.y !=0 || config.lightDir.z != 0)
        arrowDirection = normalize([config.lightDir.x,config.lightDir.y,config.lightDir.z]);

    var arrowRotMat = transpose(lookAt([0,0,0],arrowDirection,[1,0,0]));

    var arrowModelMat = mult(translate([config.lightPos.x,config.lightPos.y,config.lightPos.z]),arrowRotMat);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"model"),false,flatten(arrowModelMat));

    gl.drawElements(gl.LINES,arrow.elementCount,gl.UNSIGNED_SHORT,0);

}
function DrawStar(shaderId, star)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, star.vertexBufferId);
    var vertexSize = 3;
    var vertexAttributeLocation = gl.getAttribLocation(shaderId, "vertex");
    gl.enableVertexAttribArray(vertexAttributeLocation);
    gl.vertexAttribPointer(vertexAttributeLocation, vertexSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, star.normalBufferId);

    var normalAttributeLocation = gl.getAttribLocation(shaderId, "normal");
    if(normalAttributeLocation !=-1)
    {
        gl.enableVertexAttribArray(normalAttributeLocation);
        gl.vertexAttribPointer(normalAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, star.elementIndexBufferId);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "model"), false, flatten(translate(config.lightPos.x,config.lightPos.y,config.lightPos.z)));

    gl.drawElements(gl.LINES, star.elementCount, gl.UNSIGNED_SHORT, 0);
}

function Setup()
{
    canvas = document.getElementById('webgl-canvas');

    gl = canvas.getContext("webgl2");

    gl = WebGLDebugUtils.makeDebugContext(gl);

    gl.enable(gl.DEPTH_TEST);

    //init shaders
    initShaders(gl,"Shaders/SimpleCuttingPlane_vertex.glsl","Shaders/SimpleCuttingPlane_fragment.glsl",ShaderLoaded, ResourceLoadError);
    initShaders(gl,"Shaders/LightModel_vertex.glsl","Shaders/LightModel_fragment.glsl",LightShaderLoaded,ResourceLoadError);
    initShaders(gl,"Shaders/ShadowDepth_vertex.glsl","Shaders/ShadowDepth_fragment.glsl",DepthShaderLoaded, ResourceLoadError);
    //Load sphere
    loadFileAJAX("Objects/Sphere/sphere.obj",ModelLoad,ResourceLoadError);
    loadFileAJAX("Objects/Suzanne/monkey.obj",MonkeyModelLoad, ResourceLoadError);

    InitFramebufferObject(shadowMapSize,shadowMapSize);
    InitCubeFramebufferObject(shadowMapSize,shadowMapSize);
    //Create lightType Direction model
    lightArrow = CreateArrow();
    lightStar = CreateStar();

    //Create plane Model
    cuttingPlane = CreateCuttingPlane();
    planeModel = CreateSquare(5);
    backWallPlane = CreateSquare(8);
    groundPlane = CreateSquare(8);


    //Shadowmap and Light Check
    prevLightPos = [config.lightPos.x,config.lightPos.y,config.lightPos.z];
    prevLightPos[0] = prevLightPos[0]+1;
    cubeVP = mat4();
    cubeProjection = perspective(90, 1.0, 1.0, 250.0);
    dirVP = mat4();

    window.onmousemove =MouseMove;
    window.onmousedown = MouseDown;
    window.onmouseup = MouseUp;


}
function Draw()
{
    //Cutting Plane
    var cPTransMat = translate(config.cuttingPlaneTrans.x,config.cuttingPlaneTrans.y,config.cuttingPlaneTrans.z);
    var cPRotMat = mult(
        rotateX(config.cuttingPlaneRot.rotX),
        mult(rotateY(config.cuttingPlaneRot.rotY),
            rotateZ(config.cuttingPlaneRot.rotZ)));
    var cPModel= mult(cPTransMat,cPRotMat);
    if(config.activePlane)
    {
        var cP1 = mult(cPModel, vec4(cuttingPlane.pOne, 1.0));
        var cP2 = mult(cPModel, vec4(cuttingPlane.pTwo, 1.0));
        var cP3 = mult(cPModel, vec4(cuttingPlane.pThree, 1.0));
        simpleCutPlane = CreateSimpleCutPlane(cP1,cP2,cP3);
    }

    //Ground plane
    var groundPlaneModelMat = translate(0,config.groundHeight,0);

    //
    var wallPlaneModelMat =  rotateX(-90);
    wallPlaneModelMat = mult(translate(0,config.groundHeight+4,-4),wallPlaneModelMat);
    //Model & view matrices
    var model =translate(2,1,-2);
    var monkeyModel = mat4();

    var eye = mult(mult(rotateY(cameraRotY),rotateX(cameraRotX)), [config.cameraPos.x,config.cameraPos.y,config.cameraPos.z,1.0]);
    eye = eye.slice(0,3); // transform to vector3
    var view = lookAt(eye,[0,0,0],[0,1,0]);
    var pNormalView;

    //SHADOWS
    //SIMPLE SHADOW MAP
    gl.useProgram(depthShaderId);
    gl.uniform1i(gl.getUniformLocation(depthShaderId,"lightType"),config.lightType);
    gl.uniform3fv(gl.getUniformLocation(depthShaderId, "lightDir"), new Float32Array([config.lightDir.x, config.lightDir.y, config.lightDir.z]));
    gl.uniform3fv(gl.getUniformLocation(depthShaderId,"lightPos"), new Float32Array([config.lightPos.x,config.lightPos.y,config.lightPos.z]));
    if(config.lightType == 1)
    {
        for (var i = 0; i < 6; i++)
        {
            if(!config.showShadowMap)
                gl.bindFramebuffer(gl.FRAMEBUFFER, cubeFramebufferArray[i]);

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.viewport(0, 0, shadowMapSize, shadowMapSize);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniform1i(gl.getUniformLocation(depthShaderId, "activePlane"), config.activePlane ? 1 : 0);
            if (config.activePlane)
            {
                gl.uniform1f(gl.getUniformLocation(depthShaderId, "pDist"), simpleCutPlane.distN);
                gl.uniform3fv(gl.getUniformLocation(depthShaderId, "pNormal"), new Float32Array([simpleCutPlane.normal[0], simpleCutPlane.normal[1], simpleCutPlane.normal[2]]));
            }


            var CubeView = lookAt([config.lightPos.x, config.lightPos.y, config.lightPos.z], [config.lightPos.x + shadowCubemapDirections[i][0],
                                                                                              config.lightPos.y + shadowCubemapDirections[i][1],
                                                                                              config.lightPos.z + shadowCubemapDirections[i][2]],
                                                                                                shadowCubemapUpDirection[i]);


            cubeVP = mult(cubeProjection, CubeView);
            gl.uniformMatrix4fv(gl.getUniformLocation(depthShaderId, "lightVP"), false, flatten(cubeVP));
            gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 1);


            pNormalView = mult(transpose(inverse(CubeView)),vec4(simpleCutPlane.normal,0.0));
            gl.uniform3fv(gl.getUniformLocation(depthShaderId, "pNormalView"), new Float32Array([pNormalView[0],pNormalView[1],pNormalView[2]]));
            DrawPlane(groundPlane, depthShaderId, groundPlaneModelMat);
            DrawPlane(backWallPlane, depthShaderId, wallPlaneModelMat);

            gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 0);

            DrawSphere(depthShaderId, model, view);
            DrawMonkey(depthShaderId, monkeyModel, view);
        }
    }
    else
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if(!config.showShadowMap)
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        gl.clearColor(0.0,0.0,0.0,0.0);
        gl.viewport(0,0,shadowMapSize,shadowMapSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        gl.uniform1i(gl.getUniformLocation(depthShaderId, "activePlane"), config.activePlane ? 1 : 0);
        if (config.activePlane)
        {
            gl.uniform1f(gl.getUniformLocation(depthShaderId, "pDist"), simpleCutPlane.distN);
            gl.uniform3fv(gl.getUniformLocation(depthShaderId, "pNormal"), new Float32Array([simpleCutPlane.normal[0], simpleCutPlane.normal[1], simpleCutPlane.normal[2]]));
        }
        var lightDir = vec3(config.lightDir.x, config.lightDir.y, config.lightDir.z);
        var lightView = lookAt([0,0,0], lightDir, [1, 0, 0]);
        var lightProjection = ortho(-7, 7, -7, 7, -7, 7);
        dirVP = mult(lightProjection, lightView);


        gl.uniformMatrix4fv(gl.getUniformLocation(depthShaderId, "lightVP"), false, flatten(dirVP));

        pNormalView = mult(transpose(inverse(lightView)),vec4(simpleCutPlane.normal,0.0));
        gl.uniform3fv(gl.getUniformLocation(depthShaderId, "pNormalView"), new Float32Array([pNormalView[0],pNormalView[1],pNormalView[2]]));

        gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 1);
        DrawPlane(groundPlane, depthShaderId, groundPlaneModelMat);
        DrawPlane(backWallPlane, depthShaderId, wallPlaneModelMat);

        gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 0);
        DrawSphere(depthShaderId, model, view);
        DrawMonkey(depthShaderId, monkeyModel, view);
    }

    //NORMAL RENDERING
    if(!config.showShadowMap)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        Resize(gl);
        var bgColor = hexToRgb(config.backgroundColor);
        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shaderId);

        gl.uniform1i(gl.getUniformLocation(shaderId,"lightType"),config.lightType);
        gl.uniform3fv(gl.getUniformLocation(shaderId, "lightDir"), new Float32Array([config.lightDir.x, config.lightDir.y, config.lightDir.z]));
        gl.uniform3fv(gl.getUniformLocation(shaderId,"lightPos"), new Float32Array([config.lightPos.x,config.lightPos.y,config.lightPos.z]));

        gl.uniform3fv(gl.getUniformLocation(shaderId,"attenuation"),new Float32Array([config.attenuation.constant,config.attenuation.linear,config.attenuation.quadratic]));

        gl.uniform1i(gl.getUniformLocation(shaderId, "activePlane"), config.activePlane ? 1 : 0);
        pNormalView = mult(transpose(inverse(view,model)),vec4(simpleCutPlane.normal,0.0));
        gl.uniform3fv(gl.getUniformLocation(shaderId, "pNormalView"), new Float32Array([pNormalView[0],pNormalView[1],pNormalView[2]]));


        var projection = perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "projection"), false, flatten(projection));
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, model)))));

        gl.uniform3fv(gl.getUniformLocation(shaderId, "EyePos"), new Float32Array([eye[0]/*config.cameraPos.x*/,
                                                                                   eye[1] /*config.cameraPos.y*/,
                                                                                   eye[2]/*config.cameraPos.z*/]));


        //Colors
        var mColor = hexToRgb(config.modelColor);
        gl.uniform4fv(gl.getUniformLocation(shaderId, "modelColor"), new Float32Array([mColor[0], mColor[1], mColor[2], 1.0]));
        gl.uniform4fv(gl.getUniformLocation(shaderId, "diffuseColor"), ScaleLight(config.diffuselightIntensity, config.diffuselightColor));
        gl.uniform4fv(gl.getUniformLocation(shaderId, "ambientColor"), ScaleLight(config.ambientlightIntensity, config.ambientlightColor));
        gl.uniform4fv(gl.getUniformLocation(shaderId, "specularColor"),ScaleLight(config.specularlightIntensity,config.specularlightColor));
        gl.uniform1f(gl.getUniformLocation(shaderId, "specularExponent"),config.specularlightExponent);

        if (config.activePlane)
        {
            gl.uniform1f(gl.getUniformLocation(shaderId, "pDist"), simpleCutPlane.distN);
            gl.uniform3fv(gl.getUniformLocation(shaderId, "pNormal"), new Float32Array([simpleCutPlane.normal[0],
                                                                                        simpleCutPlane.normal[1],
                                                                                        simpleCutPlane.normal[2]]));
        }

        gl.uniform1f(gl.getUniformLocation(shaderId,"shadowBias"),config.shadowBias);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowCubemapTex);
        gl.uniform1i(gl.getUniformLocation(shaderId, "shadowCube"), 0);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "lightVP"), false, flatten(dirVP));
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, shadowMapTex);
        gl.uniform1i(gl.getUniformLocation(shaderId, "shadowMapTexture"),1);

        gl.uniform1i(gl.getUniformLocation(shaderId, "isPlane"), 1);

        if (config.visualizePlane)
            DrawPlane(planeModel, shaderId, cPModel);

        //Bottom plane,
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, groundPlaneModelMat)))));
        DrawPlane(groundPlane, shaderId, groundPlaneModelMat);

        //TODO:
        //Back Plane
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, wallPlaneModelMat)))));
        DrawPlane(backWallPlane,shaderId,wallPlaneModelMat);

        //Draw models
        gl.uniform1i(gl.getUniformLocation(shaderId, "isPlane"), 0);

        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, model)))));
        DrawSphere(shaderId, model, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, monkeyModel)))));
        DrawMonkey(shaderId,monkeyModel,view);

        gl.useProgram(lightModelShaderId);
        gl.uniformMatrix4fv(gl.getUniformLocation(lightModelShaderId, "view"), false, flatten(view));
        gl.uniformMatrix4fv(gl.getUniformLocation(lightModelShaderId, "projection"), false, flatten(projection));

        if(config.lightType == 0)
        {
            DrawArrow(lightModelShaderId, lightArrow);

        }
        else {
            DrawStar(lightModelShaderId, lightStar);

        }
        gl.bindTexture(gl.TEXTURE_CUBE_MAP,null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    requestAnimationFrame(Draw);
}
function Resize(gl)
{
    var realToCSSPixels = window.devicePixelRatio || 1;

    var displayW = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
    var displayH = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

    if(gl.canvas.width != displayW || gl.canvas.height != displayH)
    {
        gl.canvas.width = displayW;
        gl.canvas.height = displayH;


    }
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
}
window.onload = function()
{
    //GUI
    var gui = new dat.GUI();
    gui.addColor(config,'backgroundColor');
    gui.add(config,'rotateCamera');
    gui.add(config,'groundHeight');
    gui.add(config,'showShadowMap');
    //Model
    var modelFolder = gui.addFolder('Model');
    modelFolder.addColor(config,'modelColor');

    //Light

    var lightFolder = gui.addFolder('Light');
    lightFolder.add(config,'lightType', {Directional: 0, Point:1});
    var attFolder = lightFolder.addFolder('Attenuation');
    attFolder.add(config.attenuation, 'constant').step(0.01);
    attFolder.add(config.attenuation, 'linear').step(0.01);
    attFolder.add(config.attenuation, 'quadratic').step(0.01);
    var ambientFolder = lightFolder.addFolder('Ambient Light');
    ambientFolder.addColor(config, 'ambientlightColor');
    ambientFolder.add(config, 'ambientlightIntensity');
    var diffuseFolder = lightFolder.addFolder('Diffuse Light');
    diffuseFolder.addColor(config,'diffuselightColor');
    diffuseFolder.add(config,'diffuselightIntensity');
    var specularFolder = lightFolder.addFolder('Specular Highlight');
    specularFolder.addColor(config,'specularlightColor');
    specularFolder.add(config,'specularlightIntensity');
    specularFolder.add(config,'specularlightExponent');
    var DirLightFolder = lightFolder.addFolder('Light Direction');
    var lightPosFolder = lightFolder.addFolder('Light Position');
    lightPosFolder.add(config.lightPos,'x').step(0.1);
    lightPosFolder.add(config.lightPos,'y').step(0.1);
    lightPosFolder.add(config.lightPos,'z').step(0.1);

    DirLightFolder.add(config.lightDir,'x').step(0.1);
    DirLightFolder.add(config.lightDir,'y').step(0.1);
    DirLightFolder.add(config.lightDir,'z').step(0.1);

    //Shadow
    var shadowFolder = gui.addFolder("Shadows");
    shadowFolder.add(config,"shadowBias").step(0.001);

    //Camera
    var cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(config.cameraPos,'x');
    cameraFolder.add(config.cameraPos,'y');
    cameraFolder.add(config.cameraPos,'z');

    //Cutting Plane
    var cutPlaneFolder = gui.addFolder('Cutting Plane');
    cutPlaneFolder.add(config,'activePlane');
    cutPlaneFolder.add(config,'visualizePlane');
    var trans = cutPlaneFolder.addFolder('Translate');
    trans.add(config.cuttingPlaneTrans,'x').step(0.1);
    trans.add(config.cuttingPlaneTrans,'y').step(0.1);
    trans.add(config.cuttingPlaneTrans,'z').step(0.1);
    var rota = cutPlaneFolder.addFolder('Rotation');
    rota.add(config.cuttingPlaneRot,'rotX');
    rota.add(config.cuttingPlaneRot,'rotY');
    rota.add(config.cuttingPlaneRot,'rotZ');


    Setup();
};

function MouseDown(event)
{
    event = event || /* IE */ window.event;
    isDragging = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}
function MouseUp(event)
{
    isDragging = false;
}

function MouseMove(event)
{
    if(isDragging)
    {
        event = event || /* IE */ window.event;
        if(config.rotateCamera)
        {
            var rotationSpeed = 0.15;

            cameraRotY += (-mouseX+event.clientX)*rotationSpeed;
            cameraRotX += (-mouseY+event.clientY)*rotationSpeed;

            if (cameraRotX > 89.9)
            {
                cameraRotX = 89.9
            }
            else if (cameraRotX < -89.9)
            {
                cameraRotX = -89.9;
            }

            mouseX = event.clientX;
            mouseY = event.clientY;
        }
    }
}