#version 300 es
precision highp float;

in vec4 vertex;
in vec3 normal;

uniform vec3 lightDir;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 normalTrans;
uniform mat4 lightVP;

out vec3 vWorldSpace;
out vec3 vNormalEyeSpace;
out vec3 vLightDirEyeSpace;
out vec4 vPositionFromLight;


void main()
{
    vPositionFromLight = lightVP * model * vertex;
    vPositionFromLight.xyz = vPositionFromLight.xyz*0.5+vec3(0.5,0.5,0.5);

    gl_Position = projection*view*model*vertex;

    vWorldSpace = (model*vertex).xyz;
    vNormalEyeSpace = (normalTrans*vec4(normal,1.0)).xyz;

    vLightDirEyeSpace = (view*-(vec4(lightDir,0.0))).xyz;
}