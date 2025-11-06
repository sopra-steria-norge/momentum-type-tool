// Render Pipeline - Coordinates all rendering operations

class RenderPipeline {
    constructor() {
        this.textRenderer = null;
        this.backgroundRenderer = null;
        this.isInitialized = false;
    }

    // Initialize the render pipeline
    init() {
        this.textRenderer = window.TextRenderer;
        this.backgroundRenderer = window.BackgroundRenderer;
        this.isInitialized = true;
        console.log('[RenderPipeline] Render pipeline initialized');
    }

    // Render a complete frame
    render(words, userHasTyped, animationTime, canvasWidth, canvasHeight, backgroundColor, fillColor) {
        if (!this.isInitialized) {
            console.warn('[RenderPipeline] Not initialized');
            return;
        }

        // Get internal canvases for fixed resolution rendering (1920x1080)
        const internalCtx = window.CanvasManager.getInternalContext();
        const internalShaderCtx = window.CanvasManager.getInternalShaderContext();
        const fixedDims = window.CanvasManager.getFixedDimensions();

        // Get display canvases for scaling
        const displayCtx = window.CanvasManager.getDisplayContext();
        const shaderCtx = window.CanvasManager.getShaderContext();
        const displayDims = window.CanvasManager.getDimensions();

        // Clear internal canvases
        internalCtx.clearRect(0, 0, fixedDims.width, fixedDims.height);
        if (internalShaderCtx) {
            internalShaderCtx.clear(internalShaderCtx.COLOR_BUFFER_BIT);
        }

        // Render everything at fixed 1920x1080 resolution
        this.backgroundRenderer.renderForExport(internalCtx, fixedDims.width, fixedDims.height, backgroundColor, animationTime);
        this.textRenderer.renderForExport(internalCtx, words, userHasTyped, animationTime, fixedDims.width, fixedDims.height, fillColor);

        // Clear display canvases
        displayCtx.clearRect(0, 0, displayDims.width, displayDims.height);
        if (shaderCtx) {
            shaderCtx.clear(shaderCtx.COLOR_BUFFER_BIT);
        }

        // Scale internal canvas to display canvas like a bitmap image
        displayCtx.drawImage(
            window.CanvasManager.getInternalCanvas(),
            0, 0, fixedDims.width, fixedDims.height,
            0, 0, displayDims.width, displayDims.height
        );

        // For shader mode, render shader directly to display shader canvas
        if (this.backgroundRenderer.getShaderMode() && shaderCtx) {
            // Temporarily switch shader manager to display canvas for rendering
            const originalCanvas = window.ShaderManager.canvas;
            const originalGl = window.ShaderManager.gl;

            window.ShaderManager.canvas = window.CanvasManager.getShaderCanvas();
            window.ShaderManager.gl = shaderCtx;

            // Render shader at display resolution
            window.ShaderManager.render(animationTime);

            // Switch back to internal canvas
            window.ShaderManager.canvas = originalCanvas;
            window.ShaderManager.gl = originalGl;
        }
    }

    // Render for export at fixed resolution (1920x1080)
    renderForExport(ctx, exportWidth, exportHeight, animationTime) {
        if (!this.isInitialized) {
            console.warn('[RenderPipeline] Not initialized for export');
            return;
        }

        // Clear export canvas
        ctx.clearRect(0, 0, exportWidth, exportHeight);

        // Get current UI state
        const backgroundColor = window.UIController.getBackgroundColor();
        const fillColor = window.UIController.getFillColor();
        const currentText = this.getText();
        const isPlaceholder = this.getIsPlaceholder();

        // Don't export placeholder content
        if (isPlaceholder) {
            return;
        }

        // Get internal canvas (already at fixed resolution)
        const internalCanvas = window.CanvasManager.getInternalCanvas();
        const internalCtx = window.CanvasManager.getInternalContext();
        const fixedDims = window.CanvasManager.getFixedDimensions();

        // Clear internal canvas
        internalCtx.clearRect(0, 0, fixedDims.width, fixedDims.height);

        // Render background at fixed resolution
        this.backgroundRenderer.renderForExport(internalCtx, fixedDims.width, fixedDims.height, backgroundColor, animationTime);

        // Render text at fixed resolution
        this.textRenderer.renderForExport(internalCtx, currentText, true, animationTime, fixedDims.width, fixedDims.height, fillColor);

        // Copy internal canvas to export canvas
        ctx.drawImage(internalCanvas, 0, 0, fixedDims.width, fixedDims.height, 0, 0, exportWidth, exportHeight);
    }

    // Set shader mode
    setShaderMode(enabled) {
        this.backgroundRenderer.setShaderMode(enabled);
        window.ShaderManager.setMode(enabled);
    }

    // Get shader mode
    getShaderMode() {
        return this.backgroundRenderer.getShaderMode();
    }

    // Set text content and placeholder state
    setText(text, isPlaceholder = false) {
        this.currentText = text;
        this.isPlaceholder = isPlaceholder;
        if (this.textRenderer) {
            this.textRenderer.setPlaceholderState(isPlaceholder);
        }
    }

    // Get current text
    getText() {
        return this.currentText || '';
    }

    // Check if current text is placeholder
    getIsPlaceholder() {
        return this.isPlaceholder || false;
    }

    // Set text alignment
    setTextAlignment(isLeftAligned) {
        this.textRenderer.setAlignment(isLeftAligned);
    }

    // Get text alignment
    getTextAlignment() {
        return this.textRenderer.getAlignment();
    }

    // Get render pipeline status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            shaderMode: this.getShaderMode(),
            textAlignment: this.getTextAlignment()
        };
    }
}

// Export singleton instance
window.RenderPipeline = new RenderPipeline();
