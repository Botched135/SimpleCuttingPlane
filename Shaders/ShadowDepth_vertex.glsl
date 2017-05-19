
attribute vec4 vertex;

uniform mat4 model;
uniform mat4 lightVP;

varying vec3 vWorldPos;

void main() {
    gl_Position = lightVP * model* vertex;
    vWorldPos = (model*vertex).xyz;
}
