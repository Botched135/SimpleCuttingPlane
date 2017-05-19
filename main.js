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
    this.backgroundColor = [0,0,0];
    this.showShadowMap = false;
    this.rotateCamera = true;
    this.modelColor = [ 127 , 127 , 127 ];
    this.ambientlightColor = [ 255 , 255 , 255 ];
    this.ambientlightIntensity = 0.2;
    this.diffuselightColor = [ 255 , 255 , 255 ];
    this.diffuselightIntensity = 0.6;
    this.activePlane = true;
    this.visualizePlane = false;
    this.lightDir =
        {
            x: 0.0,
            y: -1.0,
            z: 0.0
        };
    this.lightPos =
        {
            x: 1.0,
            y: 1.0,
            z: 1.0

        };
    this.cameraPos =
        {
            x: 0.0,
            y: 0.0,
            z: 4.0

        };
    //Cutting Plane
    this.cuttingPlaneTrans =
        {
            x: 0.0,
            y: 1.0,
            z: 0.0
        };
    this.cuttingPlaneRot =
        {
            rotX : 0.0,
            rotY : 0.0,
            rotZ : 0.0

        };
    //Ground plane
    this.groundHeight = -1.0;
};

var canvas;
var gl;

//Config
var config = new Config();

//Resources
var numberOfResourcesToLoad = 4;

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

//Model buffers
var vertexBufferId = 0;
var normalBufferId = 0;
var elementIndexBufferId = 0;
var elementCount;

//Light Model
var lightArrow;

//Mouse events
var isDragging = false;
var mouseX;
var mouseY;

//Camera
var cameraRotX = 45;
var cameraRotY = 45;

//ShadowMap
var shadowMapSize = 1024;
var framebuffer;
var shadowMapTex;


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
//For light
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
function InitFramebufferObject(width, height)
{
    var depthBuffer;
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
    depthBuffer = gl.createRenderbuffer();
    if(!depthBuffer)
    {
        console.log('Failed to create depthBuffer');
        return error();
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width,height);

    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D, shadowMapTex,0);
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
    var arrowHeight = 1.5;

    var arrowDirection = [0,1,0];
    if(config.lightDir.x != 0 || config.lightDir.y !=0 || config.lightDir.z != 0)
        arrowDirection = normalize([config.lightDir.x,config.lightDir.y,config.lightDir.z]);

    var arrowRotMat = transpose(lookAt([0,0,0],arrowDirection,[1,0,0]));

    var arrowModelMat = mult(translate([config.lightPos.x,config.lightPos.y,config.lightPos.z]),arrowRotMat);

    gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"model"),false,flatten(arrowModelMat));

    gl.drawElements(gl.LINES,arrow.elementCount,gl.UNSIGNED_SHORT,0);

}

function scaleLight(intensity, color)
{
    var a = scale(intensity,hexToRgb(color));
    a[3] = 1;
    return new Float32Array(a);
}

function Setup()
{
    canvas = document.getElementById('webgl-canvas');

    gl = canvas.getContext("webgl")|| canvas.getContext("experimental-webgl");

    gl = WebGLDebugUtils.makeDebugContext(gl);

    gl.enable(gl.DEPTH_TEST);

    //init shaders
    initShaders(gl,"Shaders/SimpleCuttingPlane_vertex.glsl","Shaders/SimpleCuttingPlane_fragment.glsl",ShaderLoaded, ResourceLoadError);
    initShaders(gl,"Shaders/LightModel_vertex.glsl","Shaders/LightModel_fragment.glsl",LightShaderLoaded,ResourceLoadError);
    initShaders(gl,"Shaders/ShadowDepth_vertex.glsl","Shaders/ShadowDepth_fragment.glsl",DepthShaderLoaded, ResourceLoadError);
    //Load sphere
    loadFileAJAX("Objects/Sphere/sphere.obj",ModelLoad,ResourceLoadError);

    InitFramebufferObject(shadowMapSize,shadowMapSize);
    //Create light Direction model
    lightArrow = CreateArrow();

    //Create plane Model
    cuttingPlane = CreateCuttingPlane();
    planeModel = CreateSquare(5);
    groundPlane = CreateSquare(6);
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
    var planeModelMat = translate(0,config.groundHeight,0);

    //Model & view matrices
    var model = mat4();

    var eye = mult(mult(rotateY(cameraRotY),rotateX(cameraRotX)), [config.cameraPos.x,config.cameraPos.y,config.cameraPos.z,1.0]);
    eye = eye.slice(0,3); // transform to vector3
    var view = lookAt(eye,[0,0,0],[0,1,0]);


    //SHADOWMAP
    if(!config.showShadowMap)
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    }

    gl.clearColor(0.0,0.0,0.0,0.0);
    gl.viewport(0,0,shadowMapSize,shadowMapSize);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.useProgram(depthShaderId);

    gl.uniform1i(gl.getUniformLocation(depthShaderId, "activePlane"), config.activePlane ? 1 : 0);
    if (config.activePlane)
    {
        gl.uniform1f(gl.getUniformLocation(depthShaderId, "pDist"), simpleCutPlane.distN);
        gl.uniform3fv(gl.getUniformLocation(depthShaderId, "pNormal"), new Float32Array([simpleCutPlane.normal[0], simpleCutPlane.normal[1], simpleCutPlane.normal[2]]));
    }

    var lightDir = vec3(config.lightDir.x,config.lightDir.y,config.lightDir.z);
    var lightView = lookAt(vec3(),lightDir,[1,0,0]);
    var lightProjection = ortho(-3,4,-3,3,-3,3);
    var lightVP = mult(lightProjection,lightView);

    gl.uniformMatrix4fv(gl.getUniformLocation(depthShaderId,"lightVP"), false, flatten(lightVP));
    gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 1);
    DrawPlane(groundPlane,depthShaderId,planeModelMat);
    gl.uniform1i(gl.getUniformLocation(depthShaderId, "isPlane"), 0);
    DrawSphere(depthShaderId,model,view);



    //NORMAL RENDERING
    if(!config.showShadowMap) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        Resize(gl);
        var bgColor = hexToRgb(config.backgroundColor);
        gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(shaderId);


        gl.uniform1i(gl.getUniformLocation(shaderId, "activePlane"), config.activePlane ? 1 : 0);


        var projection = perspective(60, gl.canvas.width / gl.canvas.height, 0.1, 1000);
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "projection"), false, flatten(projection));
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId, "normalTrans"), false, flatten(inverse(transpose(mult(view, model)))));


        gl.uniform3fv(gl.getUniformLocation(shaderId, "lightDir"), new Float32Array([config.lightDir.x, config.lightDir.y, config.lightDir.z]));

        var mColor = hexToRgb(config.modelColor);
        gl.uniform4fv(gl.getUniformLocation(shaderId, "modelColor"), new Float32Array([mColor[0], mColor[1], mColor[2], 1.0]));
        gl.uniform4fv(gl.getUniformLocation(shaderId, "diffuseColor"), scaleLight(config.diffuselightIntensity, config.diffuselightColor));
        gl.uniform4fv(gl.getUniformLocation(shaderId, "ambientColor"), scaleLight(config.ambientlightIntensity, config.ambientlightColor));

        if (config.activePlane) {
            gl.uniform1f(gl.getUniformLocation(shaderId, "pDist"), simpleCutPlane.distN);
            gl.uniform3fv(gl.getUniformLocation(shaderId, "pNormal"), new Float32Array([simpleCutPlane.normal[0], simpleCutPlane.normal[1], simpleCutPlane.normal[2]]));

        }

        gl.uniformMatrix4fv(gl.getUniformLocation(shaderId,"lightVP"), false, flatten(lightVP));

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, shadowMapTex);
        gl.uniform1i(gl.getUniformLocation(shaderId, "shadowMapTexture"), 0);
        gl.uniform1i(gl.getUniformLocation(shaderId, "isPlane"), 1);

        if (config.visualizePlane)
            DrawPlane(planeModel, shaderId, cPModel);

        //Bottom plane,
        DrawPlane(groundPlane, shaderId, planeModelMat);

        gl.uniform1i(gl.getUniformLocation(shaderId, "isPlane"), 0);
        DrawSphere(shaderId, model, view);


        gl.useProgram(lightModelShaderId);
        gl.uniformMatrix4fv(gl.getUniformLocation(lightModelShaderId, "view"), false, flatten(view));
        gl.uniformMatrix4fv(gl.getUniformLocation(lightModelShaderId, "projection"), false, flatten(projection));

        DrawArrow(lightModelShaderId, lightArrow);

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
    var ambientFolder = gui.addFolder('Ambient Light');
    ambientFolder.addColor(config, 'ambientlightColor');
    ambientFolder.add(config, 'ambientlightIntensity');
    var lightFolder = gui.addFolder('Directional Light');
    var lightPosFolder = lightFolder.addFolder('Light Position');
    lightPosFolder.add(config.lightPos,'x');
    lightPosFolder.add(config.lightPos,'y');
    lightPosFolder.add(config.lightPos,'z');
    var lightDirFolder = lightFolder.addFolder('Light Direction');
    lightDirFolder.add(config.lightDir,'x').step(0.1);
    lightDirFolder.add(config.lightDir,'y').step(0.1);
    lightDirFolder.add(config.lightDir,'z').step(0.1);
    lightFolder.addColor(config,'diffuselightColor');
    lightFolder.add(config,'diffuselightIntensity');
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