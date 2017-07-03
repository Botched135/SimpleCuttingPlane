#version 300 es
precision mediump float;

in vec4 vertex;

uniform mat4 model;
uniform mat4 lightVP;
uniform mat4 normalTrans;
uniform vec3 pNormal;

out vec3 pNormalView;
out vec3 vWorldPos;

void main() {
    gl_Position = lightVP * model* vertex;
    vWorldPos = (model*vertex).xyz;
    pNormalView = (normalTrans*vec4(pNormal,0.0)).xyz;
}
