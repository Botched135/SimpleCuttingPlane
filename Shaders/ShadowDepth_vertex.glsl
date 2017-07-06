#version 300 es
precision highp float;

in vec4 vertex;

uniform mat4 model;
uniform mat4 lightVP;
uniform vec3 lightPos;
uniform vec3 lightDir;

out vec3 vLightPos;
out vec3 vLightDir;
out vec3 vWorldPos;

void main() {
    gl_Position = lightVP * model* vertex;
    vWorldPos = (model*vertex).xyz;
    vLightPos = lightPos;
    vLightDir = lightDir;
}
