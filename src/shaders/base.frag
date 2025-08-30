precision highp float;

#include "../../lygia/color/blend/hardLight.glsl"

uniform vec2 resolution;
uniform float time;
uniform sampler2D uvMap;
uniform sampler2D lightingTexture;
uniform sampler2D userImage;
varying vec2 vUv;

void main() {
    vec4 uv = texture2D(uvMap, vUv);
    vec4 refraction = texture2D(userImage, vec2(uv.r * 1.5, uv.g * 1.5));
    vec4 gloss = texture2D(lightingTexture, vUv);
    gl_FragColor = vec4(blendHardLight(refraction.rgb, gloss.rgb) * gloss.a, gloss.a);
}
