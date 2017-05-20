#version 300 es
precision highp float;

uniform int  lightType;
uniform int  isPlane;
uniform int  activePlane;

uniform vec3 attenutaion;

uniform vec4 modelColor;
uniform vec4 ambientColor;
uniform vec4 diffuseColor;

//Shadow Map
uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;


//Cutting Plane
uniform float pDist;
uniform vec3 pNormal;

in vec3 vWorldSpace;
in vec3 vNormalEyeSpace;
in vec3 vLightDirEyeSpace;
in vec3 vIncidentLight;
in vec4 vPositionFromLight;


out vec4 colour_Out;
float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}

void main()
{

    vec4 color;
    vec3 halfWayVec;
    vec3 normalES = normalize(vNormalEyeSpace);
    vec3 lightDir = normalize(vLightDirEyeSpace);
    float diffuse, att, distance;
    if(lightType ==0)
    {
        att = 1.0;

        diffuse = max(dot(normalES,lightDir),0.0);
    }
    else
    {
        distance = length(vIncidentLight);

        att = 1.0/(attenutaion.x+(attenutaion.y*distance)+(attenutaion.z*distance*distance));
        if(att > 1.0)
            att = 1.0;
        else if(att < 0.0)
            att = 0.0;

        diffuse = max(dot(normalize(vIncidentLight),normalES),0.0);
    }


    vec4 diffuseColorOut = diffuseColor*diffuse*att;

    //Shadows
    vec3 shadowCoord = (vPositionFromLight.xyz/vPositionFromLight.w);
    vec4 depthShadow = texture(shadowMapTexture,shadowCoord.xy);
    float depth = unpackDepth(depthShadow);
    float visibility = 1.0;

    if(shadowCoord.z > depth+0.1)
    {
        visibility = 0.7;
    }
    if(isPlane == 1)
    {
           color = (vec4(0.5,0.5,0.5,1.0)*(ambientColor+diffuseColorOut));
           colour_Out = vec4(color.xyz*visibility,color.w);
    }

    else
    {
        if(activePlane ==1)
        {
            color =modelColor*(ambientColor+diffuseColorOut);

        if(dot(pNormal,vWorldSpace)+pDist >= 0.0)
            discard;

        if(!gl_FrontFacing)
            color = vec4(1.0,0.0,0.0,1.0);


        colour_Out = vec4(color.xyz*visibility,color.w);
        }
        else
        {
            color =modelColor*(ambientColor+diffuseColorOut);

            colour_Out = vec4(color.xyz*visibility,color.w);
        }
    }
   // colour_Out = vec4(distance,0.0,0.0,1.0);

}