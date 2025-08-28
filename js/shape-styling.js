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
    } else {
        const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        actualShape.style.fill = rgbaColor;
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
    } else {
        actualShape.style.fill = `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
    } else {
        actualShape.style.stroke = `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
    } else {
        actualShape.style.stroke = `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
    
    // Helper function to get computed style value
    function getComputedStyleValue(element, property) {
        // First check if there's an inline style
        const inlineStyle = element.style[property];
        if (inlineStyle && inlineStyle !== '') {
            return inlineStyle;
        }
        
        // Then check the style attribute
        const styleAttr = element.getAttribute('style');
        if (styleAttr) {
            const styleMatch = styleAttr.match(new RegExp(`${property}:\\s*([^;]+)`));
            if (styleMatch) {
                return styleMatch[1].trim();
            }
        }
        
        // Finally check the attribute directly
        return element.getAttribute(property);
    }
    
    // Get current fill properties
    const fill = getComputedStyleValue(actualShape, 'fill');
    console.log('Detected fill value:', fill, 'for element:', actualShape.tagName, actualShape.id);
    if (fill && fill !== 'none') {
        if (fill.startsWith('rgba') || fill.startsWith('rgb')) {
            // Parse rgba/rgb values
            const rgbaMatch = fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
                
                // Convert to hex
                const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                fillColorPicker.value = hex;
                fillOpacitySlider.value = Math.round(a * 100);
                document.getElementById('fill-opacity-display').textContent = `${Math.round(a * 100)}%`;
            }
        } else if (fill.startsWith('#')) {
            fillColorPicker.value = fill;
            fillOpacitySlider.value = 100;
            document.getElementById('fill-opacity-display').textContent = '100%';
        }
    } else if (fill === 'none') {
        // Handle transparent fill
        fillColorPicker.value = '#000000';
        fillOpacitySlider.value = 0;
        document.getElementById('fill-opacity-display').textContent = '0%';
    }
    
    // Get current stroke properties
    const stroke = getComputedStyleValue(actualShape, 'stroke');
    console.log('Detected stroke value:', stroke, 'for element:', actualShape.tagName, actualShape.id);
    if (stroke && stroke !== 'none' && stroke !== 'null') {
        if (stroke.startsWith('rgba') || stroke.startsWith('rgb')) {
            // Parse rgba/rgb values
            const rgbaMatch = stroke.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
                
                // Convert to hex
                const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                strokeColorPicker.value = hex;
                strokeOpacitySlider.value = Math.round(a * 100);
                document.getElementById('stroke-opacity-display').textContent = `${Math.round(a * 100)}%`;
            }
        } else if (stroke.startsWith('#')) {
            strokeColorPicker.value = stroke;
            strokeOpacitySlider.value = 100;
            document.getElementById('stroke-opacity-display').textContent = '100%';
        }
    } else {
        // Handle no stroke or transparent stroke
        strokeColorPicker.value = '#000000';
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
}

// Export functions for use in other modules
window.initializeShapeStyling = initializeShapeStyling;
window.showShapeStylingControls = showShapeStylingControls;
window.hideShapeStylingControls = hideShapeStylingControls;
window.updateStylingControlsFromElement = updateStylingControlsFromElement;
window.getActualShapeElement = getActualShapeElement;
