precision highp float;

attribute vec4 vertex;
attribute vec3 normal;

uniform vec3 lightDir;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 normalTrans;
uniform mat4 lightVP;

varying vec3 vWorldSpace;
varying vec3 vNormalEyeSpace;
varying vec3 vLightDirEyeSpace;
varying vec4 vPositionFromLight;


void main()
{
    vPositionFromLight = lightVP * model * vertex;
    vPositionFromLight.xyz = vPositionFromLight.xyz*0.5+vec3(0.5,0.5,0.5);

    gl_Position = projection*view*model*vertex;

    vWorldSpace = (model*vertex).xyz;
    vNormalEyeSpace = (normalTrans*vec4(normal,1.0)).xyz;

    vLightDirEyeSpace = (view*-(vec4(lightDir,0.0))).xyz;
}