precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_falloff;

uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_color5;



// Alternative function using individual RGB components
vec3 rgb(float r, float g, float b) {
    return vec3(r, g, b) / 255.0;
}

// Distance function for smooth blending
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 st = uv * 2.0 - 1.0;
    st.x *= u_resolution.x / u_resolution.y;
    
    // Colors are now passed as uniforms from JavaScript:
    // u_color1, u_color2, u_color3, u_color4, u_color5
    
    // Create animated mesh points
    float time = u_time * 0.3;
    
    // Define 5 mesh control points with animation
    vec2 point1 = vec2(sin(time * 0.7) * 0.6, cos(time * 0.5) * 0.4);
    vec2 point2 = vec2(cos(time * 0.8 + 1.5) * 0.5, sin(time * 0.6 + 2.0) * 0.6);
    vec2 point3 = vec2(sin(time * 0.9 + 3.0) * 0.4, cos(time * 0.7 + 1.0) * 0.5);
    vec2 point4 = vec2(cos(time * 0.6 + 4.0) * 0.6, sin(time * 0.8 + 3.5) * 0.4);
    vec2 point5 = vec2(sin(time * 0.5 + 5.0) * 0.3, cos(time * 0.4 + 2.5) * 0.3); // Center point
    
    // Calculate distances to each point
    float dist1 = length(st - point1);
    float dist2 = length(st - point2);
    float dist3 = length(st - point3);
    float dist4 = length(st - point4);
    float dist5 = length(st - point5);
    
    // Create smooth falloff for each point (inverse squared distance weighting)
    // Use the dynamic falloff value from the UI slider
    float weight1 = 1.0 / (1.0 + dist1 * dist1 * u_falloff);
    float weight2 = 1.0 / (1.0 + dist2 * dist2 * u_falloff);
    float weight3 = 1.0 / (1.0 + dist3 * dist3 * u_falloff);
    float weight4 = 1.0 / (1.0 + dist4 * dist4 * u_falloff);
    float weight5 = 1.0 / (1.0 + dist5 * dist5 * u_falloff);
    
    // Normalize weights
    float totalWeight = weight1 + weight2 + weight3 + weight4 + weight5;
    weight1 /= totalWeight;
    weight2 /= totalWeight;
    weight3 /= totalWeight;
    weight4 /= totalWeight;
    weight5 /= totalWeight;
     vec3 finalColor = vec3(0.0, 0.0, 0.0);
    // Blend colors based on weights
    finalColor = u_color1 * weight1 + 
                     u_color2 * weight2 + 
                     u_color3 * weight3 + 
                     u_color4 * weight4 +
                     u_color5 * weight5;
    
    // Add animated grain effect (matching your main shader)
    float grain = fract(sin(dot(uv + u_time * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
    grain = (grain - 0.5) * 0.01; // Subtle grain
    finalColor += grain;
    
    // Add color variation based on position
    float colorShift = sin(uv.x * 3.14159 + time) * sin(uv.y * 3.14159 + time * 1.3) * 0.1;
    finalColor += colorShift * u_color1;
    
    // Enhance contrast and saturation
    finalColor = pow(finalColor, vec3(0.9)); // Slight gamma adjustment
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
