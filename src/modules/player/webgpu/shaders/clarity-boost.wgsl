struct Params {
    filterId: f32,
    sharpness: f32,
    brightness: f32,
    contrast: f32,
    saturation: f32,
};


struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};


@group(0) @binding(0) var ourSampler: sampler;
@group(0) @binding(1) var ourTexture: texture_external;
@group(0) @binding(2) var<uniform> ourParams: Params;


const FILTER_UNSHARP_MASKING: f32 = 1.0;
const CAS_CONTRAST_PEAK: f32 = 0.8 * -3.0 + 8.0;
// Luminosity factor: https://www.w3.org/TR/AERT/#color-contrast
const LUMINOSITY_FACTOR = vec3(0.299, 0.587, 0.114);

@vertex
fn vsMain(@location(0) pos: vec2<f32>) -> VertexOutput {
    var out: VertexOutput;
    out.position = vec4(pos, 0.0, 1.0);
    // Flip the Y-coordinate of UVs
    out.uv = (vec2(pos.x, 1.0 - (pos.y + 1.0)) + vec2(1.0, 1.0)) * 0.5;
    return out;
}


fn pxeGradientDither(pixelPos: vec2<f32>) -> f32 {
    return fract(52.9829189 * fract(dot(pixelPos, vec2(0.06711056, 0.00583715)))) - 0.5;
}

fn clarityBoost(coord: vec2<f32>, texSize: vec2<f32>, pixelPos: vec2<f32>, rawCenter: vec3<f32>) -> vec3<f32> {
    let texelSize = 1.0 / texSize;

    // Wide-radius bilateral debanding across 8x8/16x16 H.264 macroblocks (+/- 2.5 and +/- 5.5 texels)
    let stepNear = texelSize * 2.5;
    let stepFar  = texelSize * 5.5;

    let n1 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2( stepNear.x,  stepNear.y)).rgb;
    let n2 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(-stepNear.x, -stepNear.y)).rgb;
    let n3 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(-stepNear.x,  stepNear.y)).rgb;
    let n4 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2( stepNear.x, -stepNear.y)).rgb;

    let f1 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2( stepFar.x,  0.0)).rgb;
    let f2 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2(-stepFar.x,  0.0)).rgb;
    let f3 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2( 0.0,  stepFar.y)).rgb;
    let f4 = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + vec2( 0.0, -stepFar.y)).rgb;

    let avgNear = (n1 + n2 + n3 + n4) * 0.25;
    let avgFar  = (f1 + f2 + f3 + f4) * 0.25;
    let avgWide = mix(avgNear, avgFar, 0.45);

    let diffNear = abs(rawCenter - avgNear);
    let diffFar  = abs(rawCenter - avgFar);
    let maxDiff = max(
        max(diffNear.r, max(diffNear.g, diffNear.b)),
        max(diffFar.r,  max(diffFar.g,  diffFar.b))
    );

    let luma = dot(rawCenter, LUMINOSITY_FACTOR);
    let darkBoost = mix(1.45, 0.85, smoothstep(0.05, 0.55, luma));
    let threshold = 0.026 * darkBoost;
    let bandMask = 1.0 - smoothstep(threshold * 0.35, threshold, maxDiff);

    var cleanedCenter = mix(rawCenter, avgWide, bandMask * 0.68);
    let dither = pxeGradientDither(pixelPos) + pxeGradientDither(pixelPos + vec2(17.3, 31.7)) * 0.5;
    cleanedCenter = clamp(cleanedCenter + dither * (1.1 / 255.0) * (0.35 + 0.65 * bandMask), vec3(0.0), vec3(1.0));

    let effectiveSharpen = ourParams.sharpness * (1.0 - bandMask * 0.78);
    if effectiveSharpen <= 0.001 {
        return cleanedCenter;
    }

    // Load 3x3 neighborhood samples for sharpening
    let a = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0,  1.0)).rgb;
    let b = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 0.0,  1.0)).rgb;
    let c = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0,  1.0)).rgb;

    let d = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0,  0.0)).rgb;
    let f = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0,  0.0)).rgb;

    let g = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2(-1.0, -1.0)).rgb;
    let h = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 0.0, -1.0)).rgb;
    let i = textureSampleBaseClampToEdge(ourTexture, ourSampler, coord + texelSize * vec2( 1.0, -1.0)).rgb;

    // Unsharp Masking (USM)
    if ourParams.filterId == FILTER_UNSHARP_MASKING {
        let gaussianBlur = (a + c + g + i) * 1.0 + (b + d + f + h) * 2.0 + cleanedCenter * 4.0;
        let blurred = gaussianBlur / 16.0;
        return cleanedCenter + (cleanedCenter - blurred) * (effectiveSharpen / 3.0);
    }

    // Contrast Adaptive Sharpening (CAS)
    let crossMin = min(min(min(d, cleanedCenter), min(f, b)), h);
    let crossMax = max(max(max(d, cleanedCenter), max(f, b)), h);
    let minRgb = crossMin + min(min(a, c), min(g, i));
    let maxRgb = crossMax + max(max(a, c), max(g, i));

    let reciprocalMaxRgb = 1.0 / max(maxRgb, vec3(0.0001));
    var amplifyRgb = clamp(min(minRgb, 2.0 - maxRgb) * reciprocalMaxRgb, vec3(0.0), vec3(1.0));
    amplifyRgb = 1.0 / sqrt(amplifyRgb);

    let weightRgb = -(1.0 / (amplifyRgb * CAS_CONTRAST_PEAK));
    let reciprocalWeightRgb = 1.0 / (4.0 * weightRgb + 1.0);

    let window = b + d + f + h;
    let outColor = clamp((window * weightRgb + cleanedCenter) * reciprocalWeightRgb, vec3(0.0), vec3(1.0));

    return mix(cleanedCenter, outColor, effectiveSharpen / 2.0);
}


@fragment
fn fsMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let texSize = vec2<f32>(textureDimensions(ourTexture));
    let center = textureSampleBaseClampToEdge(ourTexture, ourSampler, input.uv);
    var adjustedRgb = clarityBoost(input.uv, texSize, input.position.xy, center.rgb);

    // Compute grayscale intensity
    let gray = dot(adjustedRgb, LUMINOSITY_FACTOR);
    // Interpolate between grayscale and color
    adjustedRgb = mix(vec3(gray), adjustedRgb, ourParams.saturation);

    // Adjust contrast
    adjustedRgb = (adjustedRgb - 0.5) * ourParams.contrast + 0.5;

    // Adjust brightness
    adjustedRgb *= ourParams.brightness;
    return vec4(adjustedRgb, 1.0);
}
