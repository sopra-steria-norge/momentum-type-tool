precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_falloff;

uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_color5;

//
// Description : Array and textureless GLSL 2D simplex noise function.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

//
// 3D Simplex Noise - for smooth Z-axis animation
// (reusing existing mod289 functions, adding new overloads)
//
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
  }

// Fractal Brownian Motion (FBM) using 3D simplex noise
float fbm3d(vec3 st) {
    float value = 0.0;
    float amplitude = 0.5;
    
    // Loop of octaves
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Fractal Brownian Motion (FBM) using 2D simplex noise (keep for compatibility)
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    // Loop of octaves
    for (int i = 0; i < 4; i++) {
        value += amplitude * snoise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = uv;
    st.x *= u_resolution.x / u_resolution.y; // Correct aspect ratio
    
    // Scale the space to see the noise pattern
    // u_falloff controls the scale/zoom of the noise
    st *= u_falloff * .01;
    
    // Animate through 3D noise by moving along Z-axis (much smoother than translation)
    float timeZ = u_time * 0.1; // Z-axis animation speed
    
    // === STAGE 1: Generate 2D Color Noise (RG channels) for Domain Warping ===
    // Use large scale for big, smooth features that will warp the domain
    vec3 domainWarpScale = vec3(st * 0.3, timeZ); // Large features with Z animation
    
    // Generate RG noise values using 3D noise - these will be our domain warp coordinates
    float warpR = snoise(domainWarpScale);
    float warpG = snoise(domainWarpScale + vec3(100.0, 200.0, 50.0)); // Different 3D seed
    
    // Add some 3D FBM complexity to the domain warp (but keep it subtle)
    warpR += fbm3d(domainWarpScale * 0.5) * 0.3;
    warpG += fbm3d(domainWarpScale * 0.5 + vec3(300.0, 400.0, 150.0)) * 0.3;
    
    // Scale the warp amount - this controls how much distortion we apply
    float warpStrength = 0.8;
    vec2 domainWarp = vec2(warpR, warpG) * warpStrength;
    
    // === STAGE 2: Apply Domain Warp and Generate Final Monochromatic Noise ===
    // Use the RG values as XY offsets for the second noise pass
    vec2 warpedCoords = st + domainWarp;
    
    // Generate monochromatic 3D noise at the warped coordinates
    // Use a different scale for more detailed features
    vec3 detailCoords = vec3(warpedCoords * .05, timeZ * 1.5); // More detailed scale with Z animation
    float finalNoise = snoise(detailCoords);
    
    // Add some 3D FBM for extra complexity in the final noise
    finalNoise += fbm3d(vec3(warpedCoords * 1.5, timeZ * 2.0)) * 0.5;
    finalNoise += fbm3d(vec3(warpedCoords * 4.0, timeZ * 3.0)) * 0.25; // High frequency details
    
    // Normalize the final noise from [-1, 1] to [0, 1] for gradient lookup
    finalNoise = finalNoise * 0.5 + 0.5;
    
    // === STAGE 3: Sample the 5-Color Gradient Using Final Noise ===
    // We can use the noise value in different ways to sample the gradient
    
    // Option A: Use noise as both X and Y coordinates (circular patterns)
    // float gradientX = finalNoise;
    // float gradientY = finalNoise;
    
    // Option B: Use noise + perpendicular 3D noise for more variation
    float gradientX = finalNoise;
    float gradientY = snoise(vec3(warpedCoords * 2.0, timeZ * 2.5) + vec3(500.0, 600.0, 250.0)) * 0.5 + 0.5;
    
    // Sample the 5-color gradient using radial interpolation
    // Colors arranged: color1, color2, color3, color4, color5 (center)
    // Create a radial gradient where color5 is at the center
    float radialDist = length(vec2(gradientX - 0.5, gradientY - 0.5)) * 2.0; // 0 to 1.414
    
    // Map radial distance to 5 colors
    vec3 finalColor;
    if (radialDist < 0.25) {
        // Center: mostly color5
        float t = radialDist / 0.25;
        finalColor = mix(u_color5, mix(u_color1, u_color2, gradientX), t);
    } else if (radialDist < 0.5) {
        // Inner ring: blend between corner colors
        float t = (radialDist - 0.25) / 0.25;
        vec3 innerColor = mix(u_color1, u_color2, gradientX);
        vec3 outerColor = mix(u_color4, u_color3, gradientX);
        finalColor = mix(innerColor, outerColor, t);
    } else if (radialDist < 0.75) {
        // Middle ring: corner colors
        float t = (radialDist - 0.5) / 0.25;
        vec3 topColor = mix(u_color1, u_color2, gradientX);
        vec3 bottomColor = mix(u_color4, u_color3, gradientX);
        finalColor = mix(topColor, bottomColor, gradientY);
    } else {
        // Outer ring: corner colors with color5 influence
        float t = (radialDist - 0.75) / 0.664; // Normalize to 0-1 for remaining range
        vec3 topColor = mix(u_color1, u_color2, gradientX);
        vec3 bottomColor = mix(u_color4, u_color3, gradientX);
        vec3 cornerColor = mix(topColor, bottomColor, gradientY);
        finalColor = mix(cornerColor, u_color5, t * 0.3); // Subtle color5 influence
    }
    
    // Add some dynamic color shifting based on time
    
    // Add subtle grain effect (reduced since we have complex noise)
    float grain = fract(sin(dot(uv + u_time * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
    grain = (grain - 0.5) * 0.02;
    finalColor += grain;
    
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}