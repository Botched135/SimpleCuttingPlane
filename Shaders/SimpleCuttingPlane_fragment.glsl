#version 300 es
precision highp float;

uniform int  lightType;
uniform int  isPlane;
uniform int  activePlane;

uniform vec3 attenuation;

uniform vec4 modelColor;
uniform vec4 ambientColor;
uniform vec4 diffuseColor;
uniform vec4 specularColor;
uniform float specularExponent;

//Matrix for plane intersection
uniform mat4 view;
uniform vec3 lightPos;

//Shadow Map
//TODO: Implement a smart way of having both directional and omnidirectional shadowmapping
//uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;
uniform float shadowBias;

//Cutting Plane
uniform float pDist;
uniform vec3 pNormal;

in vec3 vViewDir;
in vec3 vWorldSpace;
in vec3 vNormalEyeSpace;
in vec3 vLightDirEyeSpace;
in vec3 vIncidentLight;
in vec3 vVertexES;
in vec4 vPositionFromLight;
in vec3 pNormalView;
in vec3 vEyePos;


out vec4 colour_Out;
float unpackDepth(const in vec4 rgba_depth)
{
    const vec4 bit_shift = vec4(1.0/(256.0*256.0*256.0), 1.0/(256.0*256.0), 1.0/256.0, 1.0);
    float depth = dot(rgba_depth, bit_shift);
    return depth;
}
float VectorToDepthValue(vec3 vector)
{
    vec3 AbsVec= abs(vector);
    float LocalZcomp = max(AbsVec.x,max(AbsVec.y,AbsVec.z));

    const float f = 2048.0;
    const float n = 1.0;
    float NormZCom = (f+n)/(f-n)-(2.0*f*n)/(f-n)/LocalZcomp;
    return (NormZCom+1.0)*0.5;
}
float ComputeShadowFactor(vec3 lightToFrag, float darkness)
{
    float ShadowVec = unpackDepth(texture(shadowCube, lightToFrag));
    return (ShadowVec+0.001) > VectorToDepthValue(lightToFrag) ? 1.0 : darkness;
}
vec3 intersectionPoint(vec3 FragmentPos, vec3 VectorToEye)
{
    vec3 res;
    float A = FragmentPos.x+FragmentPos.y+FragmentPos.z;
    float B = VectorToEye.x+VectorToEye.x+VectorToEye.x+A;
    /*
    float NormFrag = pNormal.x*FragmentPos.x + pNormal.y*FragmentPos.y + pNormal.z*FragmentPos.z;
    float NormEye = pNormal.x * VectorToEye.x + pNormal.y * VectorToEye.y + pNormal.z * VectorToEye.z;
    */
    float t = ((pDist-A)/B);
    res = vec3(FragmentPos.x+(t*VectorToEye.x),FragmentPos.y+(t*VectorToEye.y),FragmentPos.z+(t*VectorToEye.z));

    return res;
}

void main()
{
    if(dot(pNormal,vWorldSpace)+pDist >= 0.0 && isPlane == 0 && activePlane ==1)
        discard;

    float visibility = 1.0;
    vec3 towardEye = normalize(vEyePos-vWorldSpace);
    //Shadows
   /* if(lightType == 0)
    {
        vec3 shadowCoord = (vPositionFromLight.xyz/vPositionFromLight.w);
        vec4 depthShadow = texture(shadowMapTexture,shadowCoord.xy);
        float depth = unpackDepth(depthShadow);

        if(shadowCoord.z > depth+0.1)
        {
            visibility = 0.7;
        }
    }
    else if(lightType ==1)
    {*/
        //currently error here.
       // visibility = CubeMapShadow(0.1,0.6);
      visibility = ComputeShadowFactor(vWorldSpace-lightPos,0.6);
   // }
    vec4 color;

    vec3 halfWayVec;
    vec3 normalES = normalize(vNormalEyeSpace);
    vec3 lightDir = normalize(vLightDirEyeSpace);
    float diffuse, specular, att, distance;
    vec4 diffuseColorOut;
    vec4 specularColorOut;
    vec3 pNormView = normalize(pNormalView);


    if(gl_FrontFacing)
    {
        if(lightType ==0)
        {
            att = 1.0;

            diffuse = max(dot(normalES,lightDir),0.0);

            //Specular
            halfWayVec = normalize(normalize(vVertexES)+lightDir);
            specular = dot(halfWayVec,normalES);
            if(specular > 0.0)
                specularColorOut = pow(specular,specularExponent) * specularColor*att;
            else
                specularColorOut = vec4(0.0,0.0,0.0,0.0);

        }
        else
        {
            distance = length(vIncidentLight);

            att = 1.0/(attenuation.x+attenuation.y*distance+attenuation.z*distance*distance);
            if(att > 1.0)
                att = 1.0;


            diffuse = max(dot(normalize(vIncidentLight),normalES),0.0);

            //Specular
            halfWayVec = normalize(normalize(vIncidentLight)+normalize(vVertexES));
            specular = dot(halfWayVec,normalES);
            if(specular > 0.0)
                specularColorOut = pow(specular,specularExponent) * specularColor*att;
            else
                specularColorOut = vec4(0.0,0.0,0.0,1.0);
        }

        diffuseColorOut = diffuseColor*diffuse*att;

        if(isPlane == 1)
        {
            color = (vec4(0.5,0.5,0.5,1.0)*(ambientColor+diffuseColorOut/*+specularColorOut*/));
            color.w = 1.0;
            colour_Out = vec4(color.xyz*visibility,color.w);
        }
        else
        {
            color =modelColor*(ambientColor+diffuseColorOut+specularColorOut);
            color.w = 1.0;
            colour_Out = vec4(color.xyz*visibility,color.w);
        }
    }
    else
    {
        visibility = 1.0;
        vec3 insecPoint;
        vec3 planeIncidentLight;
        if(lightType ==0)
        {
            vec3 halfWayPoint = (view*vec4(intersectionPoint(vWorldSpace,towardEye),1.0)).xyz;
            att = 1.0;
            diffuse = max(dot(pNormal,lightDir),0.0);

            //Specular
            halfWayVec = normalize(normalize(halfWayPoint)+lightDir);
            specular = dot(halfWayVec,pNormalView);
            if(specular > 0.0)
                specularColorOut = pow(specular,specularExponent) * specularColor*att;
            else
                specularColorOut = vec4(0.0,0.0,0.0,0.0);
        }
        else
        {
            float dotProd = dot(pNormal,towardEye);

            if(dotProd > 0.0)
            {

                insecPoint = intersectionPoint(vWorldSpace,pNormal);
                planeIncidentLight = (view*(vec4(lightPos-insecPoint,0.0))).xyz;

                distance = length(planeIncidentLight);

                att = 1.0/(attenuation.x+attenuation.y*distance+attenuation.z*distance*distance);
                if(att > 1.0)
                    att = 1.0;

                att = 1.0;

                //TODO: Acts weird when light gets low Y value..
                diffuse = max(dot(normalize(planeIncidentLight),pNormalView),0.0);

                halfWayVec = normalize(normalize(planeIncidentLight)+normalize(-insecPoint));

                specular = dot(halfWayVec,pNormView);
                if(specular > 0.0)
                    specularColorOut = pow(specular,specularExponent) * specularColor*att;
                else
                    specularColorOut = vec4(0.0,0.0,0.0,0.0);
            }
        }

        diffuseColorOut = diffuseColor*diffuse*att;

        if(isPlane == 1)
        {
            color = (vec4(0.5,0.5,0.5,1.0)*(ambientColor+diffuseColorOut+specularColorOut));
            color.w = 1.0;
            colour_Out = vec4(color.xyz*visibility,color.w);
        }
        else
        {
            color =modelColor*(ambientColor+diffuseColorOut+specularColorOut);
            color.w = 1.0;
            colour_Out = vec4(color.xyz*visibility,color.w);
           // colour_Out = vec4(diffuse,0.0,0.0,1.0);

        }
    }
}