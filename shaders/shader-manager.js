// Shader Manager - Handles WebGL shader compilation, loading, and rendering

class ShaderManager {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.programs = new Map();
        this.uniforms = new Map();
        this.isEnabled = false;
        this.isReady = false;
        this.noise = null;
        this.points = [
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 0 }
        ];
        this.timeOffset = 0;
    }

    // Initialize WebGL context and load shaders
    async init() {
        // Use display shader canvas for rendering (we'll switch contexts as needed)
        this.canvas = window.CanvasManager.getShaderCanvas();
        this.gl = window.CanvasManager.getShaderContext();

        if (!this.gl) {
            console.error('[ShaderManager] WebGL not supported');
            return false;
        }

        try {
            await this.loadShaders();
            this.isReady = true;
            console.log('[ShaderManager] Shader system initialized successfully');
            return true;
        } catch (error) {
            console.error('[ShaderManager] Failed to initialize shaders:', error);
            return false;
        }
    }

    // Load and compile shaders
    async loadShaders() {
        const [vertSrc, meshFragSrc, baryFragSrc] = await Promise.all([
            this.loadShaderFile('shaders/main.vert'),
            this.loadShaderFile('shaders/mesh-gradient.frag'),
            this.loadShaderFile('shaders/distorted-noise.frag')
        ]);

        // Create both shader programs
        const meshProgram = this.createShaderProgram(vertSrc, meshFragSrc);
        const baryProgram = this.createShaderProgram(vertSrc, baryFragSrc);

        this.programs.set('mesh', meshProgram);
        this.programs.set('barycentric', baryProgram);

        // Set up uniforms for both programs
        this.setupUniforms('mesh', meshProgram);
        this.setupUniforms('barycentric', baryProgram);

        // Set up vertex buffer
        this.setupVertexBuffer();

        // Initialize noise-based points
        this.initNoisePoints();
    }

    // Set up uniforms for a specific program
    setupUniforms(programName, program) {
        const uniforms = new Map();
        uniforms.set('u_resolution', this.gl.getUniformLocation(program, 'u_resolution'));
        uniforms.set('u_time', this.gl.getUniformLocation(program, 'u_time'));
        uniforms.set('u_point1', this.gl.getUniformLocation(program, 'u_point1'));
        uniforms.set('u_point2', this.gl.getUniformLocation(program, 'u_point2'));
        uniforms.set('u_point3', this.gl.getUniformLocation(program, 'u_point3'));
        uniforms.set('u_point4', this.gl.getUniformLocation(program, 'u_point4'));
        uniforms.set('u_color1', this.gl.getUniformLocation(program, 'u_color1'));
        uniforms.set('u_color2', this.gl.getUniformLocation(program, 'u_color2'));
        uniforms.set('u_color3', this.gl.getUniformLocation(program, 'u_color3'));
        uniforms.set('u_color4', this.gl.getUniformLocation(program, 'u_color4'));
        uniforms.set('u_color5', this.gl.getUniformLocation(program, 'u_color5'));
        uniforms.set('u_falloff', this.gl.getUniformLocation(program, 'u_falloff'));

        this.uniforms.set(programName, uniforms);
    }

    // Load shader source from file
    async loadShaderFile(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.warn(`[ShaderManager] Failed to load ${url}, using fallback:`, error);
            return this.getFallbackShader(url);
        }
    }

    // Get fallback shader source
    getFallbackShader(url) {
        if (url.includes('vert')) {
            return `
                attribute vec2 a_position;
                void main() {
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }
            `;
        } else {
            return `
                precision mediump float;
                uniform vec2 u_resolution;
                uniform float u_time;
                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
                }
            `;
        }
    }

    // Create and compile shader program
    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;

        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const log = gl.getProgramInfoLog(program);
            gl.deleteProgram(program);
            throw new Error(`Program link error: ${log}`);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    // Create and compile individual shader
    createShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const log = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compile error: ${log}`);
        }

        return shader;
    }

    // Set up vertex buffer for full-screen quad
    setupVertexBuffer() {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1, -1,
                1, -1,
                -1, 1,
                1, 1
            ]),
            gl.STATIC_DRAW
        );
        this.vertexBuffer = buffer;
    }

    // Initialize noise-based points
    initNoisePoints() {
        // Initialize noise function
        if (typeof SimplexNoise !== 'undefined') {
            try {
                this.noise = new SimplexNoise();
                console.log('[ShaderManager] SimplexNoise loaded successfully');
            } catch (e) {
                console.warn('[ShaderManager] SimplexNoise constructor failed, using fallback');
                this.initFallbackNoise();
            }
        } else {
            console.warn('[ShaderManager] SimplexNoise not available, using fallback');
            this.initFallbackNoise();
        }

        // Initialize points at corners
        this.points = [
            { x: -0.5, y: 0.5 },   // Top Left
            { x: 0.5, y: 0.5 },    // Top Right  
            { x: -0.5, y: -0.5 },  // Bottom Left
            { x: 0.5, y: -0.5 },   // Bottom Right
            { x: 0.0, y: 0.0 }     // Center (for 5th color)
        ];
    }

    // Initialize fallback noise function
    initFallbackNoise() {
        this.noise = {
            noise2D: (x, y) => {
                // Improved pseudo-random noise function
                const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
                return (n - Math.floor(n)) * 2.0 - 1.0;
            }
        };
        console.log('[ShaderManager] Using fallback noise function');
    }

    // Update noise-based points
    updateNoisePoints(time) {
        if (!this.noise) return;

        this.timeOffset = time * 0.01; // Slow movement

        // Update each point with noise
        for (let i = 0; i < this.points.length; i++) {
            const baseX = i * 10.0; // Different starting positions
            const baseY = i * 15.0;

            // Generate noise-based offset
            const noiseX = this.noise.noise2D(baseX + this.timeOffset, baseY);
            const noiseY = this.noise.noise2D(baseX + this.timeOffset + 100, baseY + 100);

            // Apply offset with range -1 to 1 (can go outside canvas)
            this.points[i].x = noiseX * .5; // Range: -1.5 to 1.5
            this.points[i].y = noiseY * .5; // Range: -1.5 to 1.5
        }
    }

    // Render shader background
    render(time) {
        if (!this.isReady || !this.isEnabled) return;

        const gl = this.gl;

        // Check if barycentric mode is enabled
        const barycentricCheckbox = document.getElementById('barycentricModeCheckbox');
        const useBarycentricMode = barycentricCheckbox && barycentricCheckbox.checked;

        const programName = useBarycentricMode ? 'barycentric' : 'mesh';
        const program = this.programs.get(programName);
        const uniforms = this.uniforms.get(programName);


        const color1 = window.UIController.getColor1Value();
        const color2 = window.UIController.getColor2Value();
        const color3 = window.UIController.getColor3Value();
        const color4 = window.UIController.getColor4Value();
        const color5 = window.UIController.getColor5Value();

        // Check if colors are valid before normalizing
        let normalizedColor1, normalizedColor2, normalizedColor3, normalizedColor4, normalizedColor5;

        if (!color1 || !color2 || !color3 || !color4 || !color5) {
            console.warn('Some colors are null, using defaults:', { color1, color2, color3, color4, color5 });
            // Use default colors if any are null
            const defaultColor1 = color1 || { r: 38, g: 21, b: 70 };   // #261546
            const defaultColor2 = color2 || { r: 72, g: 21, b: 96 };   // #481560
            const defaultColor3 = color3 || { r: 66, g: 34, b: 118 };   // #422276
            const defaultColor4 = color4 || { r: 126, g: 40, b: 126 }; // #7E287E
            const defaultColor5 = color5 || { r: 105, g: 79, b: 147 }; // #694F93

            // Normalize colors from 0-255 to 0-1 range for WebGL
            normalizedColor1 = { r: defaultColor1.r / 255.0, g: defaultColor1.g / 255.0, b: defaultColor1.b / 255.0 };
            normalizedColor2 = { r: defaultColor2.r / 255.0, g: defaultColor2.g / 255.0, b: defaultColor2.b / 255.0 };
            normalizedColor3 = { r: defaultColor3.r / 255.0, g: defaultColor3.g / 255.0, b: defaultColor3.b / 255.0 };
            normalizedColor4 = { r: defaultColor4.r / 255.0, g: defaultColor4.g / 255.0, b: defaultColor4.b / 255.0 };
            normalizedColor5 = { r: defaultColor5.r / 255.0, g: defaultColor5.g / 255.0, b: defaultColor5.b / 255.0 };
        } else {
            // Normalize colors from 0-255 to 0-1 range for WebGL
            normalizedColor1 = { r: color1.r / 255.0, g: color1.g / 255.0, b: color1.b / 255.0 };
            normalizedColor2 = { r: color2.r / 255.0, g: color2.g / 255.0, b: color2.b / 255.0 };
            normalizedColor3 = { r: color3.r / 255.0, g: color3.g / 255.0, b: color3.b / 255.0 };
            normalizedColor4 = { r: color4.r / 255.0, g: color4.g / 255.0, b: color4.b / 255.0 };
            normalizedColor5 = { r: color5.r / 255.0, g: color5.g / 255.0, b: color5.b / 255.0 };
        }

        // console.log('Original colors (0-255):', color1, color2, color3, color4);
        // console.log('Normalized colors (0-1):', normalizedColor1, normalizedColor2, normalizedColor3, normalizedColor4);
        if (!program) return;

        // Update noise-based points
        this.updateNoisePoints(time);

        // Set viewport
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // Clear canvas
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use shader program
        gl.useProgram(program);

        // Set uniforms
        gl.uniform2f(uniforms.get('u_resolution'), this.canvas.width, this.canvas.height);
        gl.uniform1f(uniforms.get('u_time'), time);

        // Set point uniforms (only for mesh mode, barycentric creates its own points)
        if (!useBarycentricMode) {
            gl.uniform2f(uniforms.get('u_point1'), this.points[0].x, this.points[0].y);
            gl.uniform2f(uniforms.get('u_point2'), this.points[1].x, this.points[1].y);
            gl.uniform2f(uniforms.get('u_point3'), this.points[2].x, this.points[2].y);
            gl.uniform2f(uniforms.get('u_point4'), this.points[3].x, this.points[3].y);
        }

        // Set color uniforms
        gl.uniform3f(uniforms.get('u_color1'), normalizedColor1.r, normalizedColor1.g, normalizedColor1.b);
        gl.uniform3f(uniforms.get('u_color2'), normalizedColor2.r, normalizedColor2.g, normalizedColor2.b);
        gl.uniform3f(uniforms.get('u_color3'), normalizedColor3.r, normalizedColor3.g, normalizedColor3.b);
        gl.uniform3f(uniforms.get('u_color4'), normalizedColor4.r, normalizedColor4.g, normalizedColor4.b);
        gl.uniform3f(uniforms.get('u_color5'), normalizedColor5.r, normalizedColor5.g, normalizedColor5.b);

        // Set falloff uniform
        const falloffValue = window.UIController.getFalloffValue();
        gl.uniform1f(uniforms.get('u_falloff'), falloffValue);

        // Set up vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // Enable/disable shader mode
    setMode(enabled) {
        this.isEnabled = enabled;
        if (this.canvas) {
            this.canvas.style.display = enabled ? 'block' : 'none';
        }
    }

    // Render shader to a specific canvas at any resolution
    renderToCanvas(targetCanvas, time) {
        if (!this.isReady || !this.isEnabled) {
            console.warn('[ShaderManager] Shader not ready or not enabled');
            return;
        }

        // Render shader to the current shader canvas first
        this.render(time);

        // Get the current shader canvas
        const currentCanvas = this.canvas;
        if (!currentCanvas) {
            console.warn('[ShaderManager] No shader canvas available');
            return;
        }

        // Get 2D context for the target canvas and draw the shader scaled
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
            // Draw the current shader canvas scaled to the target resolution
            ctx.drawImage(currentCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
            console.log(`[ShaderManager] Rendered shader to export canvas: ${targetCanvas.width}x${targetCanvas.height}`);
        } else {
            console.warn('[ShaderManager] Could not get 2D context for target canvas');
        }
    }

    // Get shader status
    getStatus() {
        return {
            isReady: this.isReady,
            isEnabled: this.isEnabled,
            hasWebGL: !!this.gl
        };
    }
}

// Export singleton instance
window.ShaderManager = new ShaderManager();
