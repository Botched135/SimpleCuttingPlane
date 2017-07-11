#version 300 es
precision highp float;


uniform int isPlane;
uniform int activePlane;
uniform int lightType;


uniform vec3 pNormalView;
uniform vec3 pNormal;
uniform float pDist;
uniform mat4 lightVP;

in vec3 vWorldPos;
in vec3 vLightDir;
in vec3 vLightPos;

out vec4 colour_Out;
vec4 packDepth(const in float depth)
{
    const vec4 bitShift = vec4(16777216.0, 65536.0, 256.0, 1.0);
    const vec4 bitMask = vec4(0.0, 1.0/256.0,1.0/256.0,1.0/256.0);
    vec4 res = fract(depth*bitShift);
    res -= res.xxyz*bitMask;
    return res;
}
vec3 intersectionPoint(vec3 FragmentPos, vec3 VectorToEye)
{
    vec3 res;
        float A = pNormal.x * FragmentPos.x + pNormal.y * FragmentPos.y + pNormal.z * FragmentPos.z;
        float B = pNormal.x * VectorToEye.x + pNormal.y * VectorToEye.y + pNormal.z * VectorToEye.z;


        float t = (-(pDist+A)/B);
        res = vec3(FragmentPos.x+(t*VectorToEye.x),FragmentPos.y+(t*VectorToEye.y),FragmentPos.z+(t*VectorToEye.z));

        return res;
}

void main()
{
    if(isPlane == 0 && activePlane ==1)
    {
        if(dot(pNormal,vWorldPos)+pDist >= 0.0)
            discard;
    }

    if(gl_FrontFacing || isPlane == 1)
        colour_Out = packDepth(gl_FragCoord.z);

    else if(isPlane ==0)
    {
        if(lightType == 1)
            colour_Out = packDepth((lightVP*vec4(intersectionPoint(vWorldPos,vLightPos-vWorldPos),0.0)).z);
        else
            colour_Out = packDepth((lightVP*vec4(intersectionPoint(vWorldPos, vec3(0.0,0.0,1.0)),1.0)).z);
    }


}
