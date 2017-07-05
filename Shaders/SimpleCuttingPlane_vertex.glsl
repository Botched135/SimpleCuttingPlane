#version 300 es
precision highp float;

in vec4 vertex;
in vec3 normal;

uniform vec3 lightDir;
uniform vec3 lightPos;
uniform vec3 EyePos;
uniform vec3 pNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 normalTrans;
uniform mat4 lightVP;



out vec3 vWorldSpace;
out vec3 vNormalEyeSpace;
out vec3 vLightDirEyeSpace;
out vec3 vIncidentLight;
out vec4 vPositionFromLight;
out vec3 vVertexES;
out vec3 vViewDir;
out vec3 vEyePos;


void main()
{
    vPositionFromLight = lightVP * model * vertex;
    vPositionFromLight.xyz = vPositionFromLight.xyz*0.5+vec3(0.5,0.5,0.5);

    vVertexES = -(view*model*vertex).xyz;
    gl_Position = projection*view*model*vertex;

    vWorldSpace = (model*vertex).xyz;
    vNormalEyeSpace = (normalTrans*vec4(normal,0.0)).xyz;

    vEyePos = EyePos;
    vViewDir = (view*model*vertex).xyz;
    vIncidentLight = (view*(vec4(lightPos,1.0)-model*vertex)).xyz;
    vLightDirEyeSpace = (view*-(vec4(lightDir,0.0))).xyz;
}