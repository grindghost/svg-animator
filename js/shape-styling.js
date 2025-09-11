// Shape styling controls for fill color, stroke color, stroke width, and opacity
// SVG Animator Pro - Shape Styling Module

// Helper function to get the actual shape element (not the wrapping group)
function getActualShapeElement(element) {
    // If the element is a wrapping-group, get the first child (the actual shape)
    if (element.classList && element.classList.contains('wrapping-group')) {
        const actualShape = element.firstElementChild || element;
        return actualShape;
    }
    // If it's not a wrapping-group, return the element itself
    return element;
}

// Initialize shape styling controls
function initializeShapeStyling() {
    // Get all the styling control elements
    const fillColorPicker = document.getElementById('fill-color');
    const fillOpacitySlider = document.getElementById('fill-opacity');
    const fillOpacityDisplay = document.getElementById('fill-opacity-display');
    const strokeColorPicker = document.getElementById('stroke-color');
    const strokeOpacitySlider = document.getElementById('stroke-opacity');
    const strokeOpacityDisplay = document.getElementById('stroke-opacity-display');
    const strokeWidthSlider = document.getElementById('stroke-width');
    const strokeWidthDisplay = document.getElementById('stroke-width-display');

    // Add event listeners for fill color controls
    fillColorPicker.addEventListener('input', updateFillColor);
    fillOpacitySlider.addEventListener('input', updateFillOpacity);

    // Add event listeners for stroke color controls
    strokeColorPicker.addEventListener('input', updateStrokeColor);
    strokeOpacitySlider.addEventListener('input', updateStrokeOpacity);

    // Add event listener for stroke width control
    strokeWidthSlider.addEventListener('input', updateStrokeWidth);

    // Initialize opacity displays
    fillOpacityDisplay.textContent = `${fillOpacitySlider.value}%`;
    strokeOpacityDisplay.textContent = `${strokeOpacitySlider.value}%`;
    strokeWidthDisplay.textContent = `${strokeWidthSlider.value}px`;
}

// Update fill color of selected element
function updateFillColor() {
    if (!selectedElement) return;
    
    const actualShape = getActualShapeElement(selectedElement);
    const color = this.value;
    const opacity = document.getElementById('fill-opacity').value / 100;
    
    // Convert hex to rgba
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    if (opacity === 0) {
        actualShape.style.fill = 'none';
        // Show no-fill indicator
        showNoFillIndicator('fill');
    } else {
        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        actualShape.style.fill = rgbaColor;
        // Show normal color indicator
        showNormalColorIndicator('fill', color);
    }
    
    // Update the opacity slider to reflect the new color
    document.getElementById('fill-opacity').value = Math.round(opacity * 100);
    document.getElementById('fill-opacity-display').textContent = `${Math.round(opacity * 100)}%`;
}

// Update fill opacity of selected element
function updateFillOpacity() {
    if (!selectedElement) return;
    
    const actualShape = getActualShapeElement(selectedElement);
    const opacity = this.value / 100;
    const colorPicker = document.getElementById('fill-color');
    const currentColor = colorPicker.value;
    
    // Convert hex to rgba
    const r = parseInt(currentColor.substr(1, 2), 16);
    const g = parseInt(currentColor.substr(3, 2), 16);
    const b = parseInt(currentColor.substr(5, 2), 16);
    
    if (opacity === 0) {
        actualShape.style.fill = 'none';
        // Show no-fill indicator
        showNoFillIndicator('fill');
    } else {
        actualShape.style.fill = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        // Show normal color indicator
        showNormalColorIndicator('fill', currentColor);
    }
    
    // Update display
    this.nextElementSibling.textContent = `${this.value}%`;
}

// Update stroke color of selected element
function updateStrokeColor() {
    if (!selectedElement) return;
    
    const actualShape = getActualShapeElement(selectedElement);
    const color = this.value;
    const opacity = document.getElementById('stroke-opacity').value / 100;
    
    // Convert hex to rgba
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    if (opacity === 0) {
        actualShape.style.stroke = 'none';
        // Show no-fill indicator
        showNoFillIndicator('stroke');
    } else {
        actualShape.style.stroke = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        // Show normal color indicator
        showNormalColorIndicator('stroke', color);
    }
    
    // Update the opacity slider to reflect the new color
    document.getElementById('stroke-opacity').value = Math.round(opacity * 100);
    document.getElementById('stroke-opacity-display').textContent = `${Math.round(opacity * 100)}%`;
}

// Update stroke opacity of selected element
function updateStrokeOpacity() {
    if (!selectedElement) return;
    
    const actualShape = getActualShapeElement(selectedElement);
    const opacity = this.value / 100;
    const colorPicker = document.getElementById('stroke-color');
    const currentColor = colorPicker.value;
    
    // Convert hex to rgba
    const r = parseInt(currentColor.substr(1, 2), 16);
    const g = parseInt(currentColor.substr(3, 2), 16);
    const b = parseInt(currentColor.substr(5, 2), 16);
    
    if (opacity === 0) {
        actualShape.style.stroke = 'none';
        // Show no-fill indicator
        showNoFillIndicator('stroke');
    } else {
        actualShape.style.stroke = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        // Show normal color indicator
        showNormalColorIndicator('stroke', currentColor);
    }
    
    // Update display
    this.nextElementSibling.textContent = `${this.value}%`;
}

// Update stroke width of selected element
function updateStrokeWidth() {
    if (!selectedElement) return;
    
    const actualShape = getActualShapeElement(selectedElement);
    const width = parseFloat(this.value);

    if (width === 0) {
        actualShape.style.stroke = 'none';
    } else {
        actualShape.style.strokeWidth = `${width}px`;
        actualShape.setAttribute("vector-effect", "non-scaling-stroke"); 
        actualShape.setAttribute("overflow", "visible"); // ✅ allow stroke to extend outside
    }

    // ✅ Detect filter (either as attribute OR inline style)
    let filterRef = actualShape.getAttribute("filter");
    if (!filterRef) {
        const styleFilter = actualShape.style.filter || actualShape.getAttribute("style") || "";
        const match = styleFilter.match(/url\(["']?#([^"')]+)["']?\)/);
        if (match) filterRef = `#${match[1]}`;
    }

    if (filterRef) {
        const filterId = filterRef.replace(/^#/, ""); // remove leading #
        const bbox = actualShape.getBBox();
        expandFilterRegionForStroke(filterId, width, bbox);
    }

    // Update display
    this.nextElementSibling.textContent = `${width}px`;
}

function expandFilterRegionForStroke(filterId, strokeWidth, bbox) {
    const filter = document.querySelector(`filter#${filterId}`);
    if (!filter) return;

    // Compute padding based on stroke width
    const padX = (strokeWidth / bbox.width) || 0.05;
    const padY = (strokeWidth / bbox.height) || 0.05;

    // Expand the region
    filter.setAttribute("filterUnits", "objectBoundingBox");
    filter.setAttribute("x", -padX);
    filter.setAttribute("y", -padY);
    filter.setAttribute("width", 1 + padX * 2);
    filter.setAttribute("height", 1 + padY * 2);
}


// Show shape styling controls when an element is selected
function showShapeStylingControls() {
    const stylingPanel = document.getElementById('shape-styling-panel');
    if (stylingPanel) {
        stylingPanel.style.display = 'block';
    }
}

// Hide shape styling controls when no element is selected
function hideShapeStylingControls() {
    const stylingPanel = document.getElementById('shape-styling-panel');
    if (stylingPanel) {
        stylingPanel.style.display = 'none';
    }
}

// Update styling controls to reflect the current element's properties
function updateStylingControlsFromElement(element) {
    if (!element) return;
    
    const actualShape = getActualShapeElement(element);
    const fillColorPicker = document.getElementById('fill-color');
    const fillOpacitySlider = document.getElementById('fill-opacity');
    const strokeColorPicker = document.getElementById('stroke-color');
    const strokeOpacitySlider = document.getElementById('stroke-opacity');
    const strokeWidthSlider = document.getElementById('stroke-width');
    
    // Clear any previous visual indicators
    clearVisualIndicators();
    clearUnsupportedFillMessage();
    
    // Ensure hover effects are cleared before reading styles
    // This prevents reading hover state styles instead of base styles
    const hadHoverEffect = actualShape.classList.contains('hover-effect');
    if (hadHoverEffect) {
        actualShape.classList.remove('hover-effect');
        // Force a reflow to ensure the hover effect is fully removed
        actualShape.offsetHeight;
    }
    
    // Check if this is an image element - disable styling controls
    if (actualShape.tagName === 'image') {
        disableStylingControls();
        showUnsupportedFillIndicator('image');
        showUnsupportedFillMessage('Image elements cannot be styled');
        return;
    }
    
    // Enable styling controls for non-image elements
    enableStylingControls();
    
    // Helper function to get computed style value using proper computed style API
    function getComputedStyleValue(element, property) {
        // Use the browser's computed style API which handles all styling sources
        const computedStyle = window.getComputedStyle(element);
        const value = computedStyle.getPropertyValue(property);
        
        // If computed style returns empty, check for direct attribute
        if (!value || value === '') {
            return element.getAttribute(property);
        }
        
        return value;
    }
    
    // Helper function to detect if a fill/stroke is a gradient, pattern, or other unsupported type
    function isUnsupportedFill(value) {
        if (!value || value === 'none') return false;
        return value.includes('url(') || value.includes('gradient') || value.includes('pattern');
    }
    
    // Helper function to convert any color format to hex
    function colorToHex(colorValue) {
        if (!colorValue || colorValue === 'none') return null;
        
        // If it's already a hex color
        if (colorValue.startsWith('#')) {
            return colorValue;
        }
        
        // If it's rgb/rgba
        if (colorValue.startsWith('rgb')) {
            const rgbaMatch = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            }
        }
        
        // If it's a named color, create a temporary element to get computed value
        if (/^[a-zA-Z]+$/.test(colorValue)) {
            const tempDiv = document.createElement('div');
            tempDiv.style.color = colorValue;
            document.body.appendChild(tempDiv);
            const computedColor = window.getComputedStyle(tempDiv).color;
            document.body.removeChild(tempDiv);
            
            if (computedColor && computedColor !== 'rgb(0, 0, 0)') {
                const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    const r = parseInt(rgbMatch[1]);
                    const g = parseInt(rgbMatch[2]);
                    const b = parseInt(rgbMatch[3]);
                    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                }
            }
        }
        
        return null;
    }
    
    // Get current fill properties
    const fill = getComputedStyleValue(actualShape, 'fill');
    console.log('Detected fill value:', fill, 'for element:', actualShape.tagName, actualShape.id);
    
    // Check if fill is unsupported (gradient, pattern, etc.)
    if (isUnsupportedFill(fill)) {
        showUnsupportedFillIndicator('gradient');
        showUnsupportedFillMessage('Fill uses gradient or pattern - not editable');
        fillOpacitySlider.value = 100;
        document.getElementById('fill-opacity-display').textContent = '100%';
    } else if (fill && fill !== 'none') {
        // Try to convert to hex color
        const hexColor = colorToHex(fill);
        if (hexColor) {
            showNormalColorIndicator('fill', hexColor);
            
            // Extract opacity from rgba if present
            if (fill.startsWith('rgba')) {
                const rgbaMatch = fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                if (rgbaMatch) {
                    const a = parseFloat(rgbaMatch[4]);
                    fillOpacitySlider.value = Math.round(a * 100);
                    document.getElementById('fill-opacity-display').textContent = `${Math.round(a * 100)}%`;
                } else {
                    fillOpacitySlider.value = 100;
                    document.getElementById('fill-opacity-display').textContent = '100%';
                }
            } else {
                fillOpacitySlider.value = 100;
                document.getElementById('fill-opacity-display').textContent = '100%';
            }
        } else {
            // Fallback for unknown color formats
            showNormalColorIndicator('fill', '#000000');
            fillOpacitySlider.value = 100;
            document.getElementById('fill-opacity-display').textContent = '100%';
        }
    } else {
        // Handle no fill or transparent fill
        showNoFillIndicator('fill');
        fillOpacitySlider.value = 0;
        document.getElementById('fill-opacity-display').textContent = '0%';
    }
    
    // Get current stroke properties
    const stroke = getComputedStyleValue(actualShape, 'stroke');
    console.log('Detected stroke value:', stroke, 'for element:', actualShape.tagName, actualShape.id);
    
    // Check if stroke is unsupported (gradient, pattern, etc.)
    if (isUnsupportedFill(stroke)) {
        showUnsupportedFillIndicator('gradient');
        showUnsupportedFillMessage('Stroke uses gradient or pattern - not editable');
        strokeOpacitySlider.value = 100;
        document.getElementById('stroke-opacity-display').textContent = '100%';
    } else if (stroke && stroke !== 'none' && stroke !== 'null') {
        // Try to convert to hex color
        const hexColor = colorToHex(stroke);
        if (hexColor) {
            showNormalColorIndicator('stroke', hexColor);
            
            // Extract opacity from rgba if present
            if (stroke.startsWith('rgba')) {
                const rgbaMatch = stroke.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                if (rgbaMatch) {
                    const a = parseFloat(rgbaMatch[4]);
                    strokeOpacitySlider.value = Math.round(a * 100);
                    document.getElementById('stroke-opacity-display').textContent = `${Math.round(a * 100)}%`;
                } else {
                    strokeOpacitySlider.value = 100;
                    document.getElementById('stroke-opacity-display').textContent = '100%';
                }
            } else {
                strokeOpacitySlider.value = 100;
                document.getElementById('stroke-opacity-display').textContent = '100%';
            }
        } else {
            // Fallback for unknown color formats
            showNormalColorIndicator('stroke', '#000000');
            strokeOpacitySlider.value = 100;
            document.getElementById('stroke-opacity-display').textContent = '100%';
        }
    } else {
        // Handle no stroke or transparent stroke
        showNoFillIndicator('stroke');
        strokeOpacitySlider.value = 0;
        document.getElementById('stroke-opacity-display').textContent = '0%';
    }
    
    // Get current stroke width
    const strokeWidth = getComputedStyleValue(actualShape, 'stroke-width');
    console.log('Detected stroke-width value:', strokeWidth, 'for element:', actualShape.tagName, actualShape.id);
    if (strokeWidth && strokeWidth !== 'none' && strokeWidth !== 'null') {
        const width = parseFloat(strokeWidth);
        if (!isNaN(width)) {
            strokeWidthSlider.value = width;
            document.getElementById('stroke-width-display').textContent = `${width}px`;
        }
    } else {
        // Handle no stroke width
        strokeWidthSlider.value = 0;
        document.getElementById('stroke-width-display').textContent = '0px';
    }
    
    // Restore hover effect if it was present
    if (hadHoverEffect) {
        actualShape.classList.add('hover-effect');
    }
}

// Helper function to disable styling controls (for image elements)
function disableStylingControls() {
    const fillColorPicker = document.getElementById('fill-color');
    const fillOpacitySlider = document.getElementById('fill-opacity');
    const strokeColorPicker = document.getElementById('stroke-color');
    const strokeOpacitySlider = document.getElementById('stroke-opacity');
    const strokeWidthSlider = document.getElementById('stroke-width');
    
    [fillColorPicker, fillOpacitySlider, strokeColorPicker, strokeOpacitySlider, strokeWidthSlider].forEach(control => {
        if (control) {
            control.disabled = true;
            control.style.opacity = '0.5';
        }
    });
}

// Helper function to enable styling controls
function enableStylingControls() {
    const fillColorPicker = document.getElementById('fill-color');
    const fillOpacitySlider = document.getElementById('fill-opacity');
    const strokeColorPicker = document.getElementById('stroke-color');
    const strokeOpacitySlider = document.getElementById('stroke-opacity');
    const strokeWidthSlider = document.getElementById('stroke-width');
    
    [fillColorPicker, fillOpacitySlider, strokeColorPicker, strokeOpacitySlider, strokeWidthSlider].forEach(control => {
        if (control) {
            control.disabled = false;
            control.style.opacity = '1';
        }
    });
}

// Helper function to show "no fill" indicator
function showNoFillIndicator(type) {
    const colorPicker = document.getElementById(`${type}-color`);
    const indicator = document.getElementById(`${type}-color-indicator`);
    
    if (colorPicker && indicator) {
        // Position the color picker behind the indicator but keep it functional
        colorPicker.style.position = 'absolute';
        colorPicker.style.top = '0';
        colorPicker.style.left = '0';
        colorPicker.style.width = '100%';
        colorPicker.style.height = '100%';
        colorPicker.style.opacity = '0';
        colorPicker.style.pointerEvents = 'auto';
        
        // Show the custom indicator
        indicator.style.display = 'block';
        indicator.className = 'color-indicator no-fill';
        indicator.title = `No ${type} color`;
        
        // Add click handler to open color picker
        indicator.style.pointerEvents = 'auto';
        indicator.onclick = () => {
            colorPicker.click();
        };
    }
}

// Helper function to show unsupported fill indicator
function showUnsupportedFillIndicator(type) {
    if (type === 'image') {
        // For image elements, show gray with ? for both fill and stroke
        showUnsupportedIndicator('fill');
        showUnsupportedIndicator('stroke');
    } else {
        // For gradients/patterns, show gray with ? for the specific type
        const targetType = type === 'gradient' ? 'fill' : 'stroke';
        showUnsupportedIndicator(targetType);
    }
}

// Helper function to show unsupported indicator for a specific type
function showUnsupportedIndicator(type) {
    const colorPicker = document.getElementById(`${type}-color`);
    const indicator = document.getElementById(`${type}-color-indicator`);
    
    if (colorPicker && indicator) {
        // Position the color picker behind the indicator but disable it
        colorPicker.style.position = 'absolute';
        colorPicker.style.top = '0';
        colorPicker.style.left = '0';
        colorPicker.style.width = '100%';
        colorPicker.style.height = '100%';
        colorPicker.style.opacity = '0';
        colorPicker.style.pointerEvents = 'none';
        
        // Show the custom indicator
        indicator.style.display = 'block';
        indicator.className = 'color-indicator unsupported';
        indicator.title = type === 'image' ? 'Image element - styling not supported' : `Unsupported ${type} - not editable`;
        
        // Disable click for unsupported types
        indicator.style.pointerEvents = 'none';
        indicator.onclick = null;
    }
}

// Helper function to show normal color indicator
function showNormalColorIndicator(type, color) {
    const colorPicker = document.getElementById(`${type}-color`);
    const indicator = document.getElementById(`${type}-color-indicator`);
    
    if (colorPicker && indicator) {
        // Reset color picker to normal state
        colorPicker.style.position = '';
        colorPicker.style.top = '';
        colorPicker.style.left = '';
        colorPicker.style.width = '';
        colorPicker.style.height = '';
        colorPicker.style.opacity = '1';
        colorPicker.style.pointerEvents = 'auto';
        
        // Hide the indicator
        indicator.style.display = 'none';
        indicator.className = 'color-indicator';
        indicator.style.pointerEvents = 'none';
        indicator.onclick = null;
        
        // Set the color value
        colorPicker.value = color;
        colorPicker.title = `Select ${type} color`;
    }
}

// Helper function to clear visual indicators
function clearVisualIndicators() {
    const fillColorPicker = document.getElementById('fill-color');
    const strokeColorPicker = document.getElementById('stroke-color');
    const fillIndicator = document.getElementById('fill-color-indicator');
    const strokeIndicator = document.getElementById('stroke-color-indicator');
    
    // Reset color pickers to normal state
    [fillColorPicker, strokeColorPicker].forEach(picker => {
        if (picker) {
            picker.style.position = '';
            picker.style.top = '';
            picker.style.left = '';
            picker.style.width = '';
            picker.style.height = '';
            picker.style.opacity = '1';
            picker.style.pointerEvents = 'auto';
            picker.title = picker.id.includes('fill') ? 'Select fill color' : 'Select stroke color';
        }
    });
    
    // Hide indicators
    [fillIndicator, strokeIndicator].forEach(indicator => {
        if (indicator) {
            indicator.style.display = 'none';
            indicator.className = 'color-indicator';
            indicator.style.pointerEvents = 'none';
            indicator.onclick = null;
        }
    });
}

// Helper function to show unsupported fill message
function showUnsupportedFillMessage(message) {
    // Remove any existing message
    clearUnsupportedFillMessage();
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.id = 'unsupported-fill-message';
    messageDiv.className = 'unsupported-fill-message';
    messageDiv.textContent = message;
    
    // Insert after the styling controls
    const stylingControls = document.querySelector('.styling-controls');
    if (stylingControls) {
        stylingControls.appendChild(messageDiv);
    }
}

// Helper function to clear unsupported fill message
function clearUnsupportedFillMessage() {
    const existingMessage = document.getElementById('unsupported-fill-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Export functions for use in other modules
window.initializeShapeStyling = initializeShapeStyling;
window.showShapeStylingControls = showShapeStylingControls;
window.hideShapeStylingControls = hideShapeStylingControls;
window.updateStylingControlsFromElement = updateStylingControlsFromElement;
window.getActualShapeElement = getActualShapeElement;
window.disableStylingControls = disableStylingControls;
window.enableStylingControls = enableStylingControls;
window.showNoFillIndicator = showNoFillIndicator;
window.showUnsupportedFillIndicator = showUnsupportedFillIndicator;
window.showUnsupportedIndicator = showUnsupportedIndicator;
window.showNormalColorIndicator = showNormalColorIndicator;
window.clearVisualIndicators = clearVisualIndicators;
window.showUnsupportedFillMessage = showUnsupportedFillMessage;
window.clearUnsupportedFillMessage = clearUnsupportedFillMessage;
