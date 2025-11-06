// UI Controller - Handles all UI interactions and state management

// UI elements
let phaseSlider, ampSlider, verticalOffsetSlider, marginDropdown, falloffSlider;
let playPauseBtn, alignmentCheckbox, shaderModeCheckbox, textInput, fontUploadBtn, fontFile, fontSelect, exportSVGBtn;
let phaseValue, ampValue, verticalOffsetValue, marginValue, falloffValue;
let typingInfo;

// Color picker elements
let bgColorPicker, textColorPicker, swapColorsBtn;
let bgPickr, textPickr, colorValue1Picker, colorValue2Picker, colorValue3Picker, colorValue4Picker;

// Color state
let backgroundColor = '#000000';
let textColor = '#ffffff';
let color1 = '#261546';
let color2 = '#481560';
let color3 = '#422276';
let color4 = '#7E287E';
let color5 = '#694F93';

// Text history variables
let textHistory = [];
let saveTextTimeout = null;
const TEXT_SAVE_DELAY = 2000; // 2 seconds delay
const MAX_HISTORY_ITEMS = 20;

// State variables (managed by main.js)
// These are initialized by main.js and passed to initUI()

// Initialize UI elements
function initUI(initialWords, initialUserHasTyped, initialWdt) {
    // Initialize state variables
    words = initialWords;
    userHasTyped = initialUserHasTyped;
    wdt = initialWdt;

    // Get UI elements
    phaseSlider = document.getElementById('phaseSlider');
    ampSlider = document.getElementById('ampSlider');
    verticalOffsetSlider = document.getElementById('verticalOffsetSlider');
    marginDropdown = document.getElementById('marginDropdown');
    falloffSlider = document.getElementById('falloffSlider');
    playPauseBtn = document.getElementById('playPauseBtn');
    alignmentCheckbox = document.getElementById('alignmentCheckbox');
    shaderModeCheckbox = document.getElementById('shaderModeCheckbox');
    textInput = document.getElementById('textInput');
    fontUploadBtn = document.getElementById('fontUploadBtn');
    fontFile = document.getElementById('fontFile');
    fontSelect = document.getElementById('fontSelect');
    exportSVGBtn = document.getElementById('exportSVGBtn');

    // Get value display elements
    phaseValue = document.getElementById('phaseValue');
    ampValue = document.getElementById('ampValue');
    verticalOffsetValue = document.getElementById('verticalOffsetValue');
    marginValue = document.getElementById('marginValue');
    falloffValue = document.getElementById('falloffValue');

    // Get typing info element
    typingInfo = document.querySelector('.typing-info');

    // Get color picker elements
    bgColorPicker = document.getElementById('bgColorPicker');
    textColorPicker = document.getElementById('textColorPicker');
    swapColorsBtn = document.getElementById('swapColorsBtn');

    colorValue1Picker = document.getElementById('colorValue1Picker');
    colorValue2Picker = document.getElementById('colorValue2Picker');
    colorValue3Picker = document.getElementById('colorValue3Picker');
    colorValue4Picker = document.getElementById('colorValue4Picker');

    // Don't set initial value - let HTML placeholder show
    textInput.value = '';

    // Initialize alignment state from checkbox
    window.RenderPipeline.setTextAlignment(alignmentCheckbox.checked);

    // Initialize shader mode state from checkbox
    window.RenderPipeline.setShaderMode(shaderModeCheckbox.checked);

    // Initialize color pickers
    initColorPickers();

    // Set initial state of gradient color pickers based on shader mode
    toggleGradientColorPickers(shaderModeCheckbox.checked);

    // Set initial state of Background/Typography color pickers (opposite of gradient mode)
    toggleBackgroundColorPickers(!shaderModeCheckbox.checked);
}

// Setup all event listeners
function setupEventListeners() {
    // Slider events
    phaseSlider.addEventListener('input', () => {
        updateSliderValues();
    });

    ampSlider.addEventListener('input', () => {
        updateSliderValues();
    });

    verticalOffsetSlider.addEventListener('input', () => {
        updateSliderValues();
    });

    marginDropdown.addEventListener('change', () => {
        updateSliderValues();
    });

    falloffSlider.addEventListener('input', () => {
        updateSliderValues();
    });


    // Button events
    playPauseBtn.addEventListener('click', () => {
        window.AnimationEngine.togglePlayback();
        updatePlayPauseButton();
    });

    // Initialize play/pause button icon
    updatePlayPauseButton();

    alignmentCheckbox.addEventListener('change', () => {
        window.RenderPipeline.setTextAlignment(alignmentCheckbox.checked);
        // Trigger re-render if paused
        triggerRenderIfPaused();
    });

    shaderModeCheckbox.addEventListener('change', () => {
        const isShaderMode = shaderModeCheckbox.checked;
        window.RenderPipeline.setShaderMode(isShaderMode);

        // Enable/disable gradient color pickers based on shader mode
        toggleGradientColorPickers(isShaderMode);

        // Disable/enable Background/Typography color pickers (opposite of gradient mode)
        toggleBackgroundColorPickers(!isShaderMode);

        // Trigger re-render if paused
        triggerRenderIfPaused();
    });

    fontUploadBtn.addEventListener('click', () => fontFile.click());

    // Font file upload
    fontFile.addEventListener('change', FontManager.handleFontUpload);

    // Font selection
    fontSelect.addEventListener('change', FontManager.handleFontChange);

    // Export functionality
    exportSVGBtn.addEventListener('click', ExportManager.exportToSVG);
    document.getElementById('exportPNGBtn').addEventListener('click', ExportManager.exportToPNG);
    document.getElementById('exportVideoBtn').addEventListener('click', handleVideoExport);

    // Text input events
    textInput.addEventListener('input', handleTextInput);
    textInput.addEventListener('focus', handleTextFocus);
    textInput.addEventListener('blur', handleTextBlur);

    // Text history events
    document.getElementById('historyBtn').addEventListener('click', toggleHistoryDropdown);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearTextHistory);

    // Close history dropdown when clicking outside
    document.addEventListener('click', handleDocumentClick);

    // Initialize placeholder state
    handleTextInput(); // Set initial state

    // Focus text input for immediate use
    textInput.focus();

    // Color picker events
    swapColorsBtn.addEventListener('click', swapColors);
}

// Initialize color pickers
function initColorPickers() {
    // Initialize background color picker
    bgPickr = Pickr.create({
        el: '#bgColorPicker',
        theme: 'nano',
        default: backgroundColor,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });




    // Initialize text color picker
    textPickr = Pickr.create({
        el: '#textColorPicker',
        theme: 'nano',
        default: textColor,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Initialize color 1 picker

    colorValue1Picker = Pickr.create({
        el: '#colorValue1Picker',
        theme: 'nano',
        default: color1,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });
    // Initialize color 2 picker

    colorValue2Picker = Pickr.create({
        el: '#colorValue2Picker',
        theme: 'nano',
        default: color2,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Initialize color 3 picker

    colorValue3Picker = Pickr.create({
        el: '#colorValue3Picker',
        theme: 'nano',
        default: color3,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Initialize color 4 picker

    colorValue4Picker = Pickr.create({
        el: '#colorValue4Picker',
        theme: 'nano',
        default: color4,
        components: {
            preview: true,
            hue: true,
            interaction: {
                input: true,
                clear: true,
                save: true
            }
        }
    });

    // Set initial colors
    bgPickr.setColor(backgroundColor);
    textPickr.setColor(textColor);
    colorValue1Picker.setColor(color1);
    colorValue2Picker.setColor(color2);
    colorValue3Picker.setColor(color3);
    colorValue4Picker.setColor(color4);
    // Add event listeners
    bgPickr.on('change', (color) => {
        try {
            backgroundColor = color.toHEXA().toString();
            bgPickr.setColor(backgroundColor);
            console.log('Background color changed to:', backgroundColor);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting background color:', error);
        }
    });

    textPickr.on('change', (color) => {
        try {
            textColor = color.toHEXA().toString();
            textPickr.setColor(textColor);
            console.log('Text color changed to:', textColor);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting text color:', error);
        }
    });

    colorValue1Picker.on('change', (color) => {
        try {
            color1 = color.toHEXA().toString();
            colorValue1Picker.setColor(color1);
            console.log('Color1 changed to:', color1);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting color1:', error);
        }
    });

    colorValue2Picker.on('change', (color) => {
        try {
            color2 = color.toHEXA().toString();
            colorValue2Picker.setColor(color2);
            console.log('Color2 changed to:', color2);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting color2:', error);
        }
    });

    colorValue3Picker.on('change', (color) => {
        try {
            color3 = color.toHEXA().toString();
            colorValue3Picker.setColor(color3);
            console.log('Color3 changed to:', color3);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting color3:', error);
        }
    });

    colorValue4Picker.on('change', (color) => {
        try {
            color4 = color.toHEXA().toString();
            colorValue4Picker.setColor(color4);
            console.log('Color4 changed to:', color4);
            // Trigger re-render if paused
            triggerRenderIfPaused();
        } catch (error) {
            console.error('Error setting color4:', error);
        }
    });
}

// Toggle gradient color pickers and falloff slider based on shader mode
function toggleGradientColorPickers(enabled) {
    const gradientSwatches = document.querySelector('.gradient-swatches');
    const falloffSlider = document.getElementById('falloffSlider');
    if (!gradientSwatches) return;

    // Get all gradient color picker elements
    const colorPickers = [
        colorValue1Picker,
        colorValue2Picker,
        colorValue3Picker,
        colorValue4Picker
    ];

    if (enabled) {
        // Enable gradient color pickers
        gradientSwatches.style.opacity = '1';
        gradientSwatches.style.pointerEvents = 'auto';
        gradientSwatches.classList.remove('disabled');

        // Enable falloff slider
        if (falloffSlider) {
            falloffSlider.disabled = false;
            falloffSlider.style.opacity = '1';
        }

        // Re-enable Pickr instances
        colorPickers.forEach(picker => {
            if (picker) {
                picker.enable();
            }
        });
    } else {
        // Disable gradient color pickers
        gradientSwatches.style.opacity = '0.3';
        gradientSwatches.style.pointerEvents = 'none';
        gradientSwatches.classList.add('disabled');

        // Disable falloff slider
        if (falloffSlider) {
            falloffSlider.disabled = true;
            falloffSlider.style.opacity = '0.3';
        }

        // Disable Pickr instances
        colorPickers.forEach(picker => {
            if (picker) {
                picker.disable();
            }
        });
    }
}

// Toggle Background/Typography color pickers based on shader mode
function toggleBackgroundColorPickers(enabled) {
    const colorRow = document.querySelector('.color-row');
    if (!colorRow) return;

    // Get Background and Typography color pickers
    const backgroundPickers = [bgPickr, textPickr];
    const swapBtn = document.getElementById('swapColorsBtn');

    if (enabled) {
        // Enable Background/Typography color pickers
        colorRow.style.opacity = '1';
        colorRow.style.pointerEvents = 'auto';
        colorRow.classList.remove('disabled');

        // Enable Pickr instances
        backgroundPickers.forEach(picker => {
            if (picker) {
                picker.enable();
            }
        });

        // Enable swap button
        if (swapBtn) {
            swapBtn.disabled = false;
            swapBtn.style.opacity = '1';
            swapBtn.style.pointerEvents = 'auto';
        }
    } else {
        // Disable Background/Typography color pickers
        colorRow.style.opacity = '0.3';
        colorRow.style.pointerEvents = 'none';
        colorRow.classList.add('disabled');

        // Disable Pickr instances
        backgroundPickers.forEach(picker => {
            if (picker) {
                picker.disable();
            }
        });

        // Disable swap button
        if (swapBtn) {
            swapBtn.disabled = true;
            swapBtn.style.opacity = '0.3';
            swapBtn.style.pointerEvents = 'none';
        }
    }
}

// Swap colors function
function swapColors() {
    const tempColor = backgroundColor;
    backgroundColor = textColor;
    textColor = tempColor;

    // Update pickers
    bgPickr.setColor(backgroundColor);
    textPickr.setColor(textColor);
    colorValue1Picker.setColor(color1);
    colorValue2Picker.setColor(color2);
    colorValue3Picker.setColor(color3);
    colorValue4Picker.setColor(color4);

    // Trigger re-render if paused
    triggerRenderIfPaused();
}

// Update play/pause button icon based on state
function updatePlayPauseButton() {
    if (!playPauseBtn) return;
    const iconElement = playPauseBtn.querySelector('i');
    if (!iconElement) return;

    const isPlaying = window.AnimationEngine.getIsPlaying();
    if (isPlaying) {
        iconElement.className = 'ph ph-pause';
    } else {
        iconElement.className = 'ph ph-play';
    }
}

// Update slider value displays
function updateSliderValues() {
    phaseValue.textContent = getPhaseValue().toFixed(2);
    ampValue.textContent = Math.round(getAmplitudeValue());
    verticalOffsetValue.textContent = getVerticalOffsetValue().toFixed(2);
    marginValue.textContent = getMarginValue().toFixed(0);
    falloffValue.textContent = getFalloffValue().toFixed(1);

    // If animation is paused, trigger a single frame render to show changes
    triggerRenderIfPaused();
}

// Handle text input changes
function handleTextInput() {
    const inputText = textInput.value;
    const hasActualContent = inputText.trim() !== '';

    if (hasActualContent) {
        // User has typed actual content
        words = inputText;
        userHasTyped = true;
        if (typingInfo) {
            typingInfo.classList.add('fade-out');
        }

        // Enable export buttons
        enableExportButtons(true);
        hideExportHint();
    } else {
        // No actual content - show placeholder
        words = "Start typing your title"; // This will be rendered with low opacity
        userHasTyped = false;
        if (typingInfo) {
            typingInfo.classList.remove('fade-out');
        }

        // Disable export buttons and show hint
        enableExportButtons(false);
        showExportHint();
    }

    // Pass both text and placeholder flag to render pipeline
    window.RenderPipeline.setText(words, !hasActualContent);

    // Debounced text history saving
    if (hasActualContent) {
        // Clear previous timeout
        if (saveTextTimeout) {
            clearTimeout(saveTextTimeout);
        }

        // Set new timeout to save text after delay
        saveTextTimeout = setTimeout(() => {
            saveTextToHistory(inputText.trim());
        }, TEXT_SAVE_DELAY);
    }
}

// Handle text input focus - clear placeholder behavior
function handleTextFocus() {
    // The HTML placeholder will be handled by the browser
    // We just need to ensure our state is correct
    if (textInput.value.trim() === '') {
        // If there's no actual content, we're still in placeholder mode
        // The browser will hide the HTML placeholder automatically
    }
}

// Handle text input blur - restore placeholder if empty
function handleTextBlur() {
    // Trigger input handler to check if we need to show placeholder
    handleTextInput();
}

// Enable/disable export buttons based on content
function enableExportButtons(enabled) {
    const exportSVGBtn = document.getElementById('exportSVGBtn');
    const exportPNGBtn = document.getElementById('exportPNGBtn');
    const exportVideoBtn = document.getElementById('exportVideoBtn');
    const buttons = [exportSVGBtn, exportPNGBtn, exportVideoBtn].filter(btn => btn);

    buttons.forEach(btn => {
        btn.disabled = !enabled;
        btn.style.opacity = enabled ? '1' : '0.5';
        btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    });
}

// Show export hint message
function showExportHint() {
    let hintElement = document.getElementById('exportHint');
    if (!hintElement) {
        // Create hint element if it doesn't exist
        hintElement = document.createElement('div');
        hintElement.id = 'exportHint';
        hintElement.textContent = 'Type something to enable export';
        hintElement.style.cssText = `
            color: #666;
            font-size: 12px;
            text-align: center;
            margin: 10px 0;
            font-style: italic;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Insert after the export buttons
        const exportContainer = document.querySelector('.export-buttons') || document.body;
        exportContainer.appendChild(hintElement);
    }

    // Fade in the hint
    setTimeout(() => {
        hintElement.style.opacity = '1';
    }, 100);
}

// Hide export hint message
function hideExportHint() {
    const hintElement = document.getElementById('exportHint');
    if (hintElement) {
        hintElement.style.opacity = '0';
    }
}

// Canvas width management (handled by main.js)

// Helper functions to get scaled slider values
function getPhaseValue() {
    return parseFloat(phaseSlider.value) * 10;
}

function getAmplitudeValue() {
    return parseFloat(ampSlider.value) * 400;
}

function getVerticalOffsetValue() {
    return parseFloat(verticalOffsetSlider.value);
}

// Margin values mapping (arbitrary values for now)
const MARGIN_VALUES = {
    small: 120,
    medium: 200,
    large: 280
};

function getMarginValue() {
    const selectedValue = marginDropdown.value;
    return MARGIN_VALUES[selectedValue] || MARGIN_VALUES.medium;
}

// Get current state for other modules
function getCurrentState() {
    return {
        words,
        userHasTyped,
        wdt,
        phase: window.AnimationEngine.getFrameCount() * 0.05,
        additionalPhase: getPhaseValue(),
        amplitude: getAmplitudeValue(),
        rowOffset: getVerticalOffsetValue(),
        margin: getMarginValue(),
        isLeftAligned: window.RenderPipeline.getTextAlignment()
    };
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Get background color
function getBackgroundColor() {
    return backgroundColor;
}

// Get fill color
function getFillColor() {
    return textColor;
}

// Get speed value
function getSpeedValue() {
    return 1.0;
}

// Get factor value
function getFactorValue() {
    return 1.4;
}

// Get falloff value
function getFalloffValue() {
    return parseFloat(falloffSlider.value);
}


// Get color 1 value
function getColor1Value() {
    const color = hexToRgb(color1);
    if (!color) {
        console.warn('Invalid color1 hex value:', color1, 'using default');
        return hexToRgb('#261546'); // Default purple
    }
    return color;
}

// Get color 2 value
function getColor2Value() {
    const color = hexToRgb(color2);
    if (!color) {
        console.warn('Invalid color2 hex value:', color2, 'using default');
        return hexToRgb('#481560'); // Default dark purple
    }
    return color;
}

// Get color 3 value
function getColor3Value() {
    const color = hexToRgb(color3);
    if (!color) {
        console.warn('Invalid color3 hex value:', color3, 'using default');
        return hexToRgb('#422276'); // Default dark purple
    }
    return color;
}

// Get color 4 value
function getColor4Value() {
    const color = hexToRgb(color4);
    if (!color) {
        console.warn('Invalid color4 hex value:', color4, 'using default');
        return hexToRgb('#7E287E'); // Default blue
    }
    return color;
}

// Get color 5 value
function getColor5Value() {
    const color = hexToRgb(color5);
    if (!color) {
        console.warn('Invalid color5 hex value:', color5, 'using default');
        return hexToRgb('#694F93'); // Default purple
    }
    return color;
}

// Video export handlers
async function handleVideoExport() {
    const canvas = document.getElementById('canvas');
    if (!canvas) {
        alert('Canvas not found');
        return;
    }

    // Wait for VideoExport to be available
    if (!window.VideoExport || !window.VideoExport.exportCanvasToMP4) {
        alert('Video export module not loaded yet. Please try again in a moment.');
        return;
    }

    try {
        await window.VideoExport.exportCanvasToMP4({
            canvas: canvas,
            durationSec: 15,
            quality: 'ultra',
            onProgress: (progress) => {
                console.log(`Export progress: ${Math.round(progress * 100)}%`);
            }
        });
    } catch (error) {
        console.error('Video export failed:', error);
        alert(`Video export failed: ${error.message}`);
    }
}


// Export UI controller functions
window.UIController = {
    init: initUI,
    setupEventListeners,
    updateSliderValues,
    getCurrentState,
    getPhaseValue,
    getAmplitudeValue,
    getVerticalOffsetValue,
    getMarginValue,
    getFalloffValue,
    getBackgroundColor,
    getFillColor,
    getSpeedValue,
    getFactorValue,
    getColor1Value,
    getColor2Value,
    getColor3Value,
    getColor4Value,
    getColor5Value,
    getWords: () => words,
    getUserHasTyped: () => userHasTyped,
    getWdt: () => wdt,
    setWdt: (value) => { wdt = value; },
    triggerRenderIfPaused: triggerRenderIfPaused
};

// Utility function to trigger re-render when paused
function triggerRenderIfPaused() {
    if (window.AnimationEngine && !window.AnimationEngine.getIsPlaying()) {
        window.AnimationEngine.renderSingleFrame();
    }
}

// Text History Functions
function loadTextHistory() {
    try {
        const stored = localStorage.getItem('textHistory');
        if (stored) {
            textHistory = JSON.parse(stored);
        }
    } catch (error) {
        console.warn('Failed to load text history:', error);
        textHistory = [];
    }
}

function saveTextToHistory(text) {
    // Don't save empty or very short texts
    if (!text || text.length < 2) return;

    // Don't save if it's the same as the last entry
    if (textHistory.length > 0 && textHistory[0].text === text) return;

    // Create history entry
    const historyEntry = {
        text: text,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
    };

    // Remove any existing duplicate
    textHistory = textHistory.filter(item => item.text !== text);

    // Add to beginning of array
    textHistory.unshift(historyEntry);

    // Limit history size
    if (textHistory.length > MAX_HISTORY_ITEMS) {
        textHistory = textHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    // Save to localStorage
    try {
        localStorage.setItem('textHistory', JSON.stringify(textHistory));
    } catch (error) {
        console.warn('Failed to save text history:', error);
    }

    // Update UI if dropdown is open
    if (!document.getElementById('historyDropdown').classList.contains('hidden')) {
        updateHistoryDropdown();
    }
}

function toggleHistoryDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('historyDropdown');

    if (dropdown.classList.contains('hidden')) {
        // Show dropdown
        updateHistoryDropdown();
        dropdown.classList.remove('hidden');
    } else {
        // Hide dropdown
        dropdown.classList.add('hidden');
    }
}

function updateHistoryDropdown() {
    const historyList = document.getElementById('historyList');

    if (textHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No previous texts yet</div>';
        return;
    }

    historyList.innerHTML = textHistory.map(item => `
        <div class="history-item" data-text="${item.text.replace(/"/g, '&quot;')}">
            <span class="history-item-text">${item.text}</span>
            <span class="history-item-date">${item.date}</span>
        </div>
    `).join('');

    // Add click listeners to history items
    historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const text = item.dataset.text;
            selectHistoryText(text);
        });
    });
}

function selectHistoryText(text) {
    // Set the text input value
    textInput.value = text;

    // Trigger input handler to update state
    handleTextInput();

    // Hide dropdown
    document.getElementById('historyDropdown').classList.add('hidden');

    // Focus text input
    textInput.focus();
}

function clearTextHistory() {
    textHistory = [];

    try {
        localStorage.removeItem('textHistory');
    } catch (error) {
        console.warn('Failed to clear text history:', error);
    }

    // Update UI
    updateHistoryDropdown();
}

function handleDocumentClick(event) {
    const dropdown = document.getElementById('historyDropdown');
    const historyBtn = document.getElementById('historyBtn');

    // If clicking outside dropdown and button, close dropdown
    if (!dropdown.contains(event.target) && !historyBtn.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
}

// Initialize text history on load
document.addEventListener('DOMContentLoaded', () => {
    loadTextHistory();
});
