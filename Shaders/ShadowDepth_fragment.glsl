#version 300 es
precision mediump float;


uniform int isPlane;
uniform int activePlane;
uniform vec3 pNormal;
uniform float pDist;

in vec3 vWorldPos;

out vec4 colour_Out;
vec4 packDepth(const in float depth)
{
    const vec4 bitShift = vec4((256.0*256.0*256.0),(256.0*256.0),256,1.0);
    const vec4 bitMask = vec4(0.0, 1.0/256.0,1.0/256.0,1.0/256.0);
    vec4 res = fract(depth*bitShift);
    res -= res.xxyz*bitMask;
    return res;
}

void main()
{
    if(isPlane == 0 && activePlane ==1)
    {
        if(dot(pNormal,vWorldPos)+pDist >= 0.0)
            discard;
    }
        if(gl_FrontFacing)
            discard;

        colour_Out = packDepth(gl_FragCoord.z);
}
