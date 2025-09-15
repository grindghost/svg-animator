// SVG manipulation, handles, selection, and bounding box functionality
// SVG Animator Pro - SVG Handlers Module

// Helper function to check if an element is inside a clipPath
function isInsideClipPath(element) {
    let current = element.parentNode;
    while (current && current !== svgRoot) {
        if (current.tagName === 'clipPath') {
            return true;
        }
        current = current.parentNode;
    }
    return false;
}

// Remove handles to move and scale the selected elements
function removeHandles() {
    const existingHandles = document.querySelector(".handles");
    if (existingHandles) {
        existingHandles.parentNode.removeChild(existingHandles);
    }
}

function getElementScreenScale(element) {
    const ctm = element.getScreenCTM();
    if (!ctm) return 1;
    // Extract average scale factor from matrix (accounts for zoom/rotation)
    return Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b);
}

// Use only root CTM for consistent UI size
function getRootScreenScale() {
    const ctm = svgRoot.getScreenCTM();
    return ctm ? Math.sqrt(ctm.a * ctm.a + ctm.b * ctm.b) : 1;
}

function getTransformedBBox(element) {
    const bbox = element.getBoundingClientRect();
    const svgCTM = svgRoot.getScreenCTM().inverse();
    const svgPoint = svgRoot.createSVGPoint();

    function toSVG(x, y) {
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(svgCTM);
    }

    const topLeft     = toSVG(bbox.left, bbox.top);
    const topRight    = toSVG(bbox.right, bbox.top);
    const bottomLeft  = toSVG(bbox.left, bbox.bottom);
    const bottomRight = toSVG(bbox.right, bbox.bottom);

    const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}


function createHandlesForElement(svgElement) {
    removeHandles();

    // ✅ NEW: Special handling for clipPath shapes
    let bbox;
    if (isInsideClipPath(svgElement)) {
        // For clipPath shapes, calculate global coordinates accounting for parent transforms
        if (svgElement.tagName === 'rect') {
            const x = parseFloat(svgElement.getAttribute('x')) || 0;
            const y = parseFloat(svgElement.getAttribute('y')) || 0;
            const width = parseFloat(svgElement.getAttribute('width')) || 0;
            const height = parseFloat(svgElement.getAttribute('height')) || 0;
            
            // Calculate global position by accounting for parent transforms
            const globalPos = getGlobalPosition(svgElement, x, y);
            
            bbox = { 
                x: globalPos.x, 
                y: globalPos.y, 
                width: width, 
                height: height 
            };
        } else {
            // For other shapes, try the normal method
            bbox = getTransformedBBox(svgElement);
        }
    } else {
        bbox = getTransformedBBox(svgElement);
    }
    
    const scale = getRootScreenScale(); // ✅ root, not element

    // Screen-consistent handle sizes
    const handleSize = 8 / scale;
    const middleSize = 14 / scale;

    const positions = [
        { x: bbox.x,               y: bbox.y,                name: "top-left" },
        { x: bbox.x + bbox.width,  y: bbox.y,                name: "top-right" },
        { x: bbox.x,               y: bbox.y + bbox.height,  name: "bottom-left" },
        { x: bbox.x + bbox.width,  y: bbox.y + bbox.height,  name: "bottom-right" },
        { x: bbox.x + bbox.width/2,y: bbox.y + bbox.height/2,name: "middle" }
    ];

    const handlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    handlesGroup.setAttribute("class", "handles");

    positions.forEach(pos => {
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

        if (pos.name === "middle") {
            handle.setAttribute("x", pos.x - middleSize / 2);
            handle.setAttribute("y", pos.y - middleSize / 2);
            handle.setAttribute("width", middleSize);
            handle.setAttribute("height", middleSize);
            handle.setAttribute("fill", "white");
            handle.style.stroke = "rgb(99, 102, 241)";
        } else {
            handle.setAttribute("x", pos.x - handleSize / 2);
            handle.setAttribute("y", pos.y - handleSize / 2);
            handle.setAttribute("width", handleSize);
            handle.setAttribute("height", handleSize);
            handle.setAttribute("fill", "rgba(99, 102, 241, 0.8)");
            handle.style.stroke = "white";
        }

        handle.style.strokeWidth = "2px";
        handle.setAttribute("vector-effect", "non-scaling-stroke");
        handle.setAttribute("vector-effect", "non-scaling-size");
        handle.classList.add(`${pos.name}-handle`);

        if (pos.name === "middle") {
            handle.classList.add("middle-handle");
        }

        handlesGroup.appendChild(handle);
    });

    svgRoot.appendChild(handlesGroup);
    attachResizeListeners();
}



function _createHandlesForElement(svgElement) {
    // Clean previous handles
    removeHandles();

    // Get the bounding box in the screen coordinate space
    const bbox = svgElement.getBoundingClientRect();

    // Now, get the inverse matrix of the SVG to map screen coordinates to SVG coordinates
    const svgCTM = svgRoot.getScreenCTM().inverse();

    // Create a point that will hold the new coordinates
    const svgPoint = svgRoot.createSVGPoint();

    // Function to convert a screen coordinate to an SVG coordinate
    function toSVGCoord(x, y) {
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(svgCTM);
    }

    // Convert the corners of the bounding box to SVG coordinates
    const topLeft = toSVGCoord(bbox.left, bbox.top);
    const bottomRight = toSVGCoord(bbox.right, bbox.bottom);
    const topRight = toSVGCoord(bbox.right, bbox.top);
    const bottomLeft = toSVGCoord(bbox.left, bbox.bottom);
    const center = toSVGCoord(bbox.left + bbox.width / 2, bbox.top + bbox.height / 2);

    // Define handle positions based on transformed coordinates
    const positions = [
        { x: topLeft.x, y: topLeft.y, name: "corner" }, // Top-left
        { x: topRight.x, y: topRight.y, name: "corner" }, // Top-right
        { x: bottomLeft.x, y: bottomLeft.y, name: "corner" }, // Bottom-left
        { x: bottomRight.x, y: bottomRight.y, name: "corner" }, // Bottom-right
        { x: center.x, y: center.y, name: "middle" } // Center
    ];

    // Handles group
    const handlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    handlesGroup.setAttribute("class", "handles");

    // Create handles based on the positions
    positions.forEach(pos => {
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        handle.setAttribute("x", pos.x - 4); // Offset by half the size of the handle for centering
        handle.setAttribute("y", pos.y - 4);
        handle.setAttribute("width", 8);
        handle.setAttribute("height", 8);
        handle.setAttribute("fill", "rgba(99, 102, 241, 0.8)");
        handle.style.stroke = "white";
        handle.style.strokeWidth = "2";
        handle.classList.add(pos.name + '-handle');

        // Add specific attributes for the middle handle
        if (pos.name === "middle") {
            handle.setAttribute("x", pos.x - 7);
            handle.setAttribute("y", pos.y - 7);
            handle.setAttribute("width", 14);
            handle.setAttribute("height", 14);
            handle.setAttribute("fill", "white");
            handle.style.strokeWidth = "2";
            handle.style.stroke = "rgb(99, 102, 241)";
        }

        handlesGroup.appendChild(handle);
    });

    // Append the handles to the SVG root, not the element itself, to avoid nested transformations
    svgRoot.appendChild(handlesGroup);
    attachResizeListeners();
}

function _createHandlesForElement(svgElement) {
    // Clean previous handles
    removeHandles()

    const BBOX = svgElement.getBBox();
    const handlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    handlesGroup.setAttribute("class", "handles");
    const positions = [
        { x: BBOX.x, y: BBOX.y, name: "corner" }, // Top-left
        { x: BBOX.x + BBOX.width, y: BBOX.y, name: "corner" }, // Top-right
        { x: BBOX.x, y: BBOX.y + BBOX.height, name: "corner" }, // Bottom-left
        { x: BBOX.x + BBOX.width, y: BBOX.y + BBOX.height, name: "corner" }, // Bottom-right
        { x: BBOX.x + BBOX.width / 2, y: BBOX.y + BBOX.height / 2, name: "middle" } // Center
    ];

    positions.forEach(pos => {
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        handle.setAttribute("x", pos.x - 4); // Offset by half the size of the handle for centering
        handle.setAttribute("y", pos.y - 4); // Offset by half the size of the handle for centering
        handle.setAttribute("width", 8);
        handle.setAttribute("height", 8);
        handle.setAttribute("fill", "black");

        // Add a class to the list if its the middle handle
        if (pos.name == "middle") {
            handle.classList.add('middle-handle');
            handle.setAttribute("x", pos.x - 7);
            handle.setAttribute("y", pos.y - 7);
            handle.setAttribute("width", 14);
            handle.setAttribute("height", 14);
            handle.setAttribute("fill", "white");
            handle.style.strokeWidth = "2"
            handle.style.stroke = "rgb(0,0,0)"
        }

        handlesGroup.appendChild(handle);
    });

    svgElement.parentNode.appendChild(handlesGroup);
    attachResizeListeners()
}

function attachResizeListeners() {
    const handles = document.querySelectorAll(".handles rect");
    handles.forEach(handle => {
        if (handle.classList.contains('middle-handle')) {
            handle.addEventListener("mousedown", startMoving);
        } else {
            handle.addEventListener("mousedown", startResizing);
        }
    });
}



// Special resize handling for clipPath rect elements - update attributes directly
function startResizingClipPathRect(event, svgElement, selectedHandle) {
    let startX = event.clientX;
    let startY = event.clientY;
    
    // Get initial attributes
    let initialX = parseFloat(svgElement.getAttribute('x')) || 0;
    let initialY = parseFloat(svgElement.getAttribute('y')) || 0;
    let initialWidth = parseFloat(svgElement.getAttribute('width')) || 0;
    let initialHeight = parseFloat(svgElement.getAttribute('height')) || 0;
    
    const onMouseMove = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;
        
        let newX = initialX;
        let newY = initialY;
        let newWidth = initialWidth;
        let newHeight = initialHeight;
        
        // Determine which handle is being dragged and update accordingly
        if (selectedHandle.classList.contains("top-left-handle")) {
            newX = initialX + dx;
            newY = initialY + dy;
            newWidth = initialWidth - dx;
            newHeight = initialHeight - dy;
        } else if (selectedHandle.classList.contains("top-right-handle")) {
            newY = initialY + dy;
            newWidth = initialWidth + dx;
            newHeight = initialHeight - dy;
        } else if (selectedHandle.classList.contains("bottom-left-handle")) {
            newX = initialX + dx;
            newWidth = initialWidth - dx;
            newHeight = initialHeight + dy;
        } else if (selectedHandle.classList.contains("bottom-right-handle")) {
            newWidth = initialWidth + dx;
            newHeight = initialHeight + dy;
        }
        
        // Ensure minimum dimensions
        newWidth = Math.max(1, newWidth);
        newHeight = Math.max(1, newHeight);
        
        // Update the rect attributes directly
        svgElement.setAttribute('x', newX);
        svgElement.setAttribute('y', newY);
        svgElement.setAttribute('width', newWidth);
        svgElement.setAttribute('height', newHeight);
        
        UpdateSelectionBoxesAndHandle(svgElement);
    };
    
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

function startResizing(event) {
    event.preventDefault();

    const selectedHandle = event.target;
    const svgElement = document.querySelector(".selected-element");
    if (!svgElement) return;

    // ✅ NEW: Special handling for clipPath shapes
    if (isInsideClipPath(svgElement) && svgElement.tagName === 'rect') {
        return startResizingClipPathRect(event, svgElement, selectedHandle);
    }

    const bbox = svgElement.getBBox();
    let startX = event.clientX;
    let startY = event.clientY;

    // Dimensions for incremental scaling
    let prevWidth = bbox.width;
    let prevHeight = bbox.height;

    // Default pivot = top-left
    let pivotX = bbox.x;
    let pivotY = bbox.y;

    if (selectedHandle.classList.contains("top-left-handle")) {
        pivotX = bbox.x + bbox.width;
        pivotY = bbox.y + bbox.height;
    } else if (selectedHandle.classList.contains("top-right-handle")) {
        pivotX = bbox.x;
        pivotY = bbox.y + bbox.height;
    } else if (selectedHandle.classList.contains("bottom-left-handle")) {
        pivotX = bbox.x + bbox.width;
        pivotY = bbox.y;
    } else if (selectedHandle.classList.contains("bottom-right-handle")) {
        pivotX = bbox.x;
        pivotY = bbox.y;
    }

    const onMouseMove = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;

        // Compute scale relative to dragged corner vs pivot
        let scaleX = 1 + dx / prevWidth;
        let scaleY = 1 + dy / prevHeight;

        // For top handles, invert Y scaling (dragging up = shrink)
        if (selectedHandle.classList.contains("top-left-handle") ||
            selectedHandle.classList.contains("top-right-handle")) {
            scaleY = 1 - dy / prevHeight;
        }

        // For left handles, invert X scaling (dragging left = shrink)
        if (selectedHandle.classList.contains("top-left-handle") ||
            selectedHandle.classList.contains("bottom-left-handle")) {
            scaleX = 1 - dx / prevWidth;
        }

        // Build scale matrix around the chosen pivot
        const scaling = svgRoot.createSVGMatrix()
            .translate(pivotX, pivotY)
            .scaleNonUniform(scaleX, scaleY)
            .translate(-pivotX, -pivotY);

        applyTransform(svgElement, scaling);

        // Reset for incremental scaling
        startX = moveEvent.clientX;
        startY = moveEvent.clientY;
        prevWidth *= scaleX;
        prevHeight *= scaleY;

        UpdateSelectionBoxesAndHandle(svgElement);
    };

    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}



function UpdateSelectionBoxesAndHandle(element) {
    // Remove the existing handles + selection box
    removeHandles();
    const existingBox = document.getElementById('selection-box');
    if (existingBox) existingBox.remove();

    // Redraw selection box
    drawBoundingBox(element);

    // ✅ Also recreate handles right away
    createHandlesForElement(element);

    // Update SVG bounds visualization (optional)
    visualizeSVGBounds();
}


// Special move handling for clipPath rect elements - update attributes directly
function startMovingClipPathRect(event, svgElement) {
    let startX = event.clientX;
    let startY = event.clientY;
    
    // Get initial attributes
    let initialX = parseFloat(svgElement.getAttribute('x')) || 0;
    let initialY = parseFloat(svgElement.getAttribute('y')) || 0;
    
    const onMouseMove = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;
        
        // Update the rect position directly
        let newX = initialX + dx;
        let newY = initialY + dy;
        
        svgElement.setAttribute('x', newX);
        svgElement.setAttribute('y', newY);
        
        UpdateSelectionBoxesAndHandle(svgElement);
    };
    
    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

function startMoving(event) {
    if (!event.target.classList.contains('middle-handle')) return;
    event.preventDefault();

    const svgElement = document.querySelector(".selected-element");
    if (!svgElement) return;
    
    // ✅ NEW: Special handling for clipPath shapes
    if (isInsideClipPath(svgElement) && svgElement.tagName === 'rect') {
        return startMovingClipPathRect(event, svgElement);
    }
    
    // Don't allow movement of root SVG element
    if (isRootSVGElement && isRootSVGElement(svgElement)) {
        console.log('Cannot move root SVG element');
        return;
    }

    let startX = event.clientX;
    let startY = event.clientY;

    const onMouseMove = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;

        const translation = svgRoot.createSVGMatrix().translate(dx, dy);
        applyTransform(svgElement, translation);

        startX = moveEvent.clientX; // reset for incremental move
        startY = moveEvent.clientY;

        UpdateSelectionBoxesAndHandle(svgElement);
    };

    const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
}

function applyTransform(element, newMatrix) {
    // Get existing transform or create identity
    const baseTransform = element.transform.baseVal.consolidate();
    let currentMatrix = baseTransform ? baseTransform.matrix : svgRoot.createSVGMatrix();

    // Multiply: current ∘ new
    const combined = currentMatrix.multiply(newMatrix);

    // Apply back
    const transformList = element.transform.baseVal;
    const transform = svgRoot.createSVGTransformFromMatrix(combined);
    transformList.initialize(transform);
}

// Calculate global position of a clipPath shape accounting for all parent transforms
function getGlobalPosition(element, localX, localY) {
    // Start with the local coordinates
    let globalX = localX;
    let globalY = localY;
    
    // Walk up the DOM tree to the SVG root, applying transforms
    let current = element.parentNode;
    while (current && current !== svgRoot) {
        // Check if this element has a transform
        const transform = current.getAttribute('transform');
        if (transform) {
            // Parse the transform matrix
            const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
            if (matrixMatch) {
                const values = matrixMatch[1].split(/\s+/).map(parseFloat);
                if (values.length === 6) {
                    const [a, b, c, d, e, f] = values;
                    // Apply matrix transformation: [x', y'] = [x, y, 1] * [[a, c, e], [b, d, f], [0, 0, 1]]
                    const newX = a * globalX + c * globalY + e;
                    const newY = b * globalX + d * globalY + f;
                    globalX = newX;
                    globalY = newY;
                }
            } else {
                // Handle translate transforms
                const translateMatch = transform.match(/translate\(([^,)]+),\s*([^)]+)\)/);
                if (translateMatch) {
                    const tx = parseFloat(translateMatch[1]) || 0;
                    const ty = parseFloat(translateMatch[2]) || 0;
                    globalX += tx;
                    globalY += ty;
                }
            }
        }
        current = current.parentNode;
    }
    
    return { x: globalX, y: globalY };
}

function drawBoundingBox(element) {
    // Remove any existing selection box first
    const existingBox = document.getElementById('selection-box');
    if (existingBox) {
        existingBox.remove();
    }
    
    // ✅ NEW: Special handling for clipPath shapes
    let bbox;
    let wasTemporarilyVisible = false;
    
    if (isInsideClipPath(element)) {
        // ✅ NEW: For clipPath shapes, calculate global coordinates accounting for parent transforms
        if (element.tagName === 'rect') {
            const x = parseFloat(element.getAttribute('x')) || 0;
            const y = parseFloat(element.getAttribute('y')) || 0;
            const width = parseFloat(element.getAttribute('width')) || 0;
            const height = parseFloat(element.getAttribute('height')) || 0;
            
            // Calculate global position by accounting for parent transforms
            const globalPos = getGlobalPosition(element, x, y);
            
            bbox = { 
                x: globalPos.x, 
                y: globalPos.y, 
                width: width, 
                height: height 
            };
        } else {
            // For other shapes, try the normal method
            const originalStyle = element.getAttribute('style') || '';
            const tempStyle = originalStyle.replace(/fill\s*:\s*none\s*;?/g, '') + ' fill: rgba(99, 102, 241, 0.1);';
            element.setAttribute('style', tempStyle);
            wasTemporarilyVisible = true;
            
            // Force a reflow to ensure the element is rendered
            element.offsetHeight;
            
            bbox = getTransformedBBox(element);
        }
    } else {
        bbox = getTransformedBBox(element);
    }
    
    // Restore original style if we made it temporarily visible
    if (wasTemporarilyVisible) {
        const originalStyle = element.getAttribute('data-original-style') || element.getAttribute('style') || '';
        element.setAttribute('style', originalStyle);
    }
    
    // ✅ NEW: For clipPath shapes, use a simpler bounding box calculation
    let scale = 1;
    if (isInsideClipPath(element)) {
        // For clipPath shapes, use the root scale instead of element scale
        scale = getRootScreenScale();
    } else {
        try {
            scale = getElementScreenScale(element);
        } catch (e) {
            console.log('Error getting element scale, using root scale:', e);
            scale = getRootScreenScale();
        }
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', bbox.x);
    rect.setAttribute('y', bbox.y);
    rect.setAttribute('width', bbox.width);
    rect.setAttribute('height', bbox.height);
    rect.setAttribute('stroke', '#6366f1');
    rect.setAttribute('fill', 'none');
    
    rect.setAttribute('stroke-width', '2px'); 
    rect.setAttribute('stroke-dasharray', '5');
    rect.setAttribute('id', 'selection-box');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');

    // ✅ NEW: For clipPath shapes, append selection box outside the clipped area
    if (isInsideClipPath(element)) {
        // Find the parent group that has the clip-path applied
        let parentGroup = element.parentNode;
        while (parentGroup && parentGroup !== svgRoot) {
            if (parentGroup.getAttribute('style') && parentGroup.getAttribute('style').includes('clip-path')) {
                // Append after the clipped group
                parentGroup.parentNode.insertBefore(rect, parentGroup.nextSibling);
                break;
            }
            parentGroup = parentGroup.parentNode;
        }
        if (!parentGroup || parentGroup === svgRoot) {
            svgRoot.appendChild(rect);
        }
    } else {
        svgRoot.appendChild(rect);
    }
}



function _drawBoundingBox(element) {
    // Get the bounding box in the screen coordinate space
    const bbox = element.getBoundingClientRect();
    
    // Now, get the inverse matrix of the SVG to map screen coordinates to SVG coordinates
    const svgCTM = svgRoot.getScreenCTM().inverse();
    
    // Create a point that will hold the new coordinates
    const svgPoint = svgRoot.createSVGPoint();
    
    // Function to convert a screen coordinate to an SVG coordinate
    function toSVGCoord(x, y) {
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(svgCTM);
    }

    // Convert each corner of the bounding box
    const topLeft = toSVGCoord(bbox.left, bbox.top);
    const bottomRight = toSVGCoord(bbox.right, bbox.bottom);

    // Now create the rectangle with correct coordinates
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', topLeft.x);
    rect.setAttribute('y', topLeft.y);
    rect.setAttribute('width', bottomRight.x - topLeft.x);
    rect.setAttribute('height', bottomRight.y - topLeft.y);
    rect.setAttribute('stroke', '#6366f1');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke-width', '2px');
    rect.setAttribute('stroke-dashoffset', '5');
    rect.setAttribute('stroke-dasharray', '5');
    rect.setAttribute('id', 'selection-box');
    svgRoot.appendChild(rect);
}

function setCorrectTransformOrigin(element) {
    // Get the bounding box in the screen coordinate space
    const bbox = element.getBoundingClientRect();
    
    // Get the matrix that converts from screen coordinates to SVG coordinates
    const svgCTM = svgRoot.getScreenCTM().inverse();
    
    // Create a point that will be used to convert screen coordinates to SVG coordinates
    const svgPoint = svgRoot.createSVGPoint();
    
    // Calculate the center of the bounding box in screen coordinates
    const centerX = bbox.left + bbox.width / 2;
    const centerY = bbox.top + bbox.height / 2;
    
    // Convert the center point to SVG coordinates
    svgPoint.x = centerX;
    svgPoint.y = centerY;
    const centerSVG = svgPoint.matrixTransform(svgCTM);

    // Get the value of the 'transform' attribute
    const transformValue = element.style.transform;

    // Regular expression to extract translation values (global search)
    const regex = /translate\(([^,]+),\s*([^)]+)\)/g;

    // Find all matches and keep the last one
    let lastMatch;
    let match;
    while ((match = regex.exec(transformValue)) !== null) {
        lastMatch = match;
    }

    if (lastMatch) {
        const translateX = parseFloat(lastMatch[1]); // X translation from the last match
        const translateY = parseFloat(lastMatch[2]); // Y translation from the last match

        console.log("Last Translate X: " + translateX + ", Last Translate Y: " + translateY);

        // Default transform origin
        let originX = centerSVG.x;
        let originY = centerSVG.y;

        // Apply the corrected transform-origin
        element.style.transformOrigin = `${originX}px ${originY}px`;

    } else {
        console.log("No translate transform found");
        // Set the transform-origin property using the SVG coordinates
        element.style.transformOrigin = `${centerSVG.x}px ${centerSVG.y}px`;
    }
}

// ✅ NEW: Special transform origin calculation for clipPath elements
function setCorrectTransformOriginForClipPath(element) {
    // For clipPath elements, we need to calculate the center based on the element's own geometry
    // rather than screen coordinates, since clipPath elements have different coordinate contexts
    
    let centerX, centerY;
    
    if (element.tagName === 'rect') {
        // For rectangles, calculate center from x, y, width, height attributes
        const x = parseFloat(element.getAttribute('x')) || 0;
        const y = parseFloat(element.getAttribute('y')) || 0;
        const width = parseFloat(element.getAttribute('width')) || 0;
        const height = parseFloat(element.getAttribute('height')) || 0;
        
        centerX = x + width / 2;
        centerY = y + height / 2;
    } else if (element.tagName === 'circle') {
        // For circles, center is cx, cy
        centerX = parseFloat(element.getAttribute('cx')) || 0;
        centerY = parseFloat(element.getAttribute('cy')) || 0;
    } else if (element.tagName === 'ellipse') {
        // For ellipses, center is cx, cy
        centerX = parseFloat(element.getAttribute('cx')) || 0;
        centerY = parseFloat(element.getAttribute('cy')) || 0;
    } else {
        // For other shapes (path, polygon, etc.), use getBBox() but in local coordinates
        try {
            const bbox = element.getBBox();
            centerX = bbox.x + bbox.width / 2;
            centerY = bbox.y + bbox.height / 2;
        } catch (e) {
            // Fallback to center of SVG viewport
            centerX = 0;
            centerY = 0;
        }
    }
    
    // Set transform origin using the calculated center
    element.style.transformOrigin = `${centerX}px ${centerY}px`;
    
    console.log(`Set clipPath transform origin to: ${centerX}px ${centerY}px for ${element.tagName}`);
}

// Function to add hover effect on SVG elements
function addHoverEffect(svgElement) {
    // Add data attribute for image elements to enable special CSS targeting
    if (svgElement.tagName === 'image') {
        svgElement.setAttribute('data-tag', 'image');
    }
    
    svgElement.addEventListener('mouseenter', function() {
        this.classList.add('hover-effect');
    });

    svgElement.addEventListener('mouseleave', function() {
        this.classList.remove('hover-effect');
    });
}

// Function to select an element in the SVG and the tree view with simulated click event
function selectElement(elementId, element) {
    console.log('selectElement called with ID:', elementId); // Debugging line

    // Check if this is the root SVG element - don't create handles for it
    if (isRootSVGElement && isRootSVGElement(element)) {
        console.log('Root SVG element selected - skipping handle creation');
        return;
    }

    // Hide applied animation editor when selecting a new element
    if (typeof hideAppliedAnimationEditor === 'function') {
        hideAppliedAnimationEditor();
    }

    // Add the handles
    createHandlesForElement(element)

    // Find the corresponding "summary" element in the tree view
    let summaryElement = document.querySelector(`summary[data-element-id="${elementId}"]`);
    
    // If a summary wasn't found, try to find a div
    if (!summaryElement) {
        summaryElement = document.querySelector(`div[data-element-id="${elementId}"]`);
    }

    if (summaryElement) {
        // Expand all parent "details" elements
        let parentDetail = summaryElement.parentElement;
        while (parentDetail.tagName.toLowerCase() === 'details') {
            parentDetail.open = true;
            parentDetail = parentDetail.parentElement;
        }

        // Scroll the element into view within the tree container
        const elementTree = document.getElementById('element-tree');
        if (elementTree) {
            // Calculate the position of the summary element relative to the tree container
            const treeRect = elementTree.getBoundingClientRect();
            const summaryRect = summaryElement.getBoundingClientRect();
            
            // Calculate the scroll position needed to center the element
            const scrollTop = elementTree.scrollTop + (summaryRect.top - treeRect.top) - (treeRect.height / 2) + (summaryRect.height / 2);
            
            // Smooth scroll within the tree container
            elementTree.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
        } else {
            // Fallback to the original behavior if tree container is not found
            summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        summaryElement.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
}

// Function to visualize the bounds of the uploaded SVG
function visualizeSVGBounds(forceShow = null) {
    if (!svgRoot) return;
    
    // Remove existing bounds visualization
    const existingBounds = document.getElementById('svg-bounds');
    if (existingBounds) {
        existingBounds.remove();
    }
    
    // Check if bounds should be shown
    const toggleButton = document.getElementById('toggle-bounds');
    const shouldShow = forceShow !== null ? forceShow : (toggleButton && toggleButton.classList.contains('active'));
    
    if (!shouldShow) return;
    
    // Get the SVG's viewBox or calculate bounds from content
    let svgBounds;
    const viewBox = svgRoot.getAttribute('viewBox');
    
    if (viewBox) {
        const [x, y, width, height] = viewBox.split(' ').map(Number);
        svgBounds = { x, y, width, height };
    } else {
        // Calculate bounds from all SVG elements
        const allElements = svgRoot.querySelectorAll('*');
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        allElements.forEach(element => {
            if (element.getBBox && element.id !== 'svg-bounds' && element.id !== 'svg-bounds-group') {
                try {
                    const bbox = element.getBBox();
                    if (bbox.width > 0 && bbox.height > 0) {
                        minX = Math.min(minX, bbox.x);
                        minY = Math.min(minY, bbox.y);
                        maxX = Math.max(maxX, bbox.x + bbox.width);
                        maxY = Math.max(maxY, bbox.y + bbox.height);
                    }
                } catch (e) {
                    // Skip elements that don't support getBBox
                }
            }
        });
        
        if (minX !== Infinity && maxX > minX && maxY > minY) {
            svgBounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
    }
    
    if (svgBounds && svgBounds.width > 0 && svgBounds.height > 0) {
        // Create bounds visualization rectangle
        const boundsRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        boundsRect.setAttribute('id', 'svg-bounds');
        boundsRect.setAttribute('x', svgBounds.x);
        boundsRect.setAttribute('y', svgBounds.y);
        boundsRect.setAttribute('width', svgBounds.width);
        boundsRect.setAttribute('height', svgBounds.height);
        boundsRect.setAttribute('fill', 'none');
        boundsRect.setAttribute('stroke', '#94a3b8');
        boundsRect.setAttribute('stroke-width', '2');
        boundsRect.setAttribute('stroke-dasharray', '3,3');
        boundsRect.setAttribute('opacity', '1');
        boundsRect.style.pointerEvents = 'none';
        
        // Add bounds info text
        const boundsText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        boundsText.setAttribute('x', svgBounds.x + 5);
        boundsText.setAttribute('y', svgBounds.y - 5);
        boundsText.setAttribute('fill', '#94a3b8');
        boundsText.setAttribute('font-size', '12');
        boundsText.setAttribute('font-family', 'Arial, sans-serif');
        boundsText.setAttribute('opacity', '0.8');
        boundsText.style.pointerEvents = 'none';
        boundsText.textContent = `Bounds: ${Math.round(svgBounds.width)}×${Math.round(svgBounds.height)}`;
        
        // Create a group for bounds visualization
        const boundsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        boundsGroup.setAttribute('id', 'svg-bounds-group');
        boundsGroup.appendChild(boundsRect);
        boundsGroup.appendChild(boundsText);
        
        // Insert at the beginning so it appears behind other elements
        svgRoot.insertBefore(boundsGroup, svgRoot.firstChild);
    }
}

// Function to show bounds control (when SVG is loaded)
function showBoundsControl() {
    const boundsControl = document.querySelector('.bounds-control');
    if (boundsControl) {
        boundsControl.classList.add('visible');
    }
}

// Function to hide bounds control (when no SVG is loaded)
function hideBoundsControl() {
    const boundsControl = document.querySelector('.bounds-control');
    if (boundsControl) {
        boundsControl.classList.remove('visible');
        // Also hide any active bounds visualization
        const existingBounds = document.getElementById('svg-bounds');
        if (existingBounds) {
            existingBounds.remove();
        }
        // Reset button state
        const toggleButton = document.getElementById('toggle-bounds');
        if (toggleButton) {
            toggleButton.classList.remove('active');
        }
        // Reset label
        const boundsLabel = document.querySelector('.bounds-label');
        if (boundsLabel) {
            boundsLabel.textContent = 'Show SVG bounds';
        }
    }
}

// Function to toggle SVG bounds visualization
function toggleSVGBounds() {
    const toggleButton = document.getElementById('toggle-bounds');
    const boundsLabel = document.querySelector('.bounds-label');
    if (!toggleButton) return;
    
    const isActive = toggleButton.classList.contains('active');
    
    if (isActive) {
        // Hide bounds
        toggleButton.classList.remove('active');
        const existingBounds = document.getElementById('svg-bounds');
        if (existingBounds) {
            existingBounds.remove();
        }
        if (boundsLabel) {
            boundsLabel.textContent = 'Show SVG bounds';
        }
        updateStatusBar('SVG bounds hidden');
    } else {
        // Show bounds
        toggleButton.classList.add('active');
        visualizeSVGBounds(true);
        if (boundsLabel) {
            boundsLabel.textContent = 'Hide SVG bounds';
        }
        updateStatusBar('SVG bounds visible');
    }
}

// Function to clear selection when clicking outside SVG elements
function clearSelectionOnOutsideClick(event) {
    // Check if the click is on the SVG viewer but not on an SVG element
    const svgViewer = document.getElementById('svg-viewer');
    const clickedElement = event.target;
    
    // If clicking on the SVG viewer background or placeholder, clear selection
    if (svgViewer === clickedElement || 
        clickedElement.classList.contains('placeholder-text') ||
        clickedElement.classList.contains('svg-viewer') ||
        (clickedElement.tagName === 'svg' && clickedElement === svgRoot)) {
        
        // Clear selection
        const selectionBox = document.getElementById("selection-box");
        if (selectionBox) selectionBox.remove();

        // Remove handles
        removeHandles();

        // Clear selected-element class
        const selected = document.querySelector(".selected-element");
        if (selected) selected.classList.remove("selected-element");

        // Reset global ref
        selectedElement = null;

        // Reset animation UI
        resetControls();
        updateAnimationListUI(null);
        
        // Hide shape styling controls
        hideShapeStylingControls();
        
        // Hide controls section
        hideControlsSection();
        
        // 🔥 New: also remove any temporary preview wrapper
        const oldTempWrapper = document.querySelector(".anim-wrapper.temp-anim");
        if (oldTempWrapper) {
            removeTempPreview(oldTempWrapper);
        }
        
        // ✅ NEW: Also clean up any clipPath shapes with temp animations
        const clipPathShapes = document.querySelectorAll('clipPath *[style*="temp-generic"]');
        clipPathShapes.forEach(shape => {
            removeTempPreviewFromClipPathShape(shape);
        });
        
        // Update status
        updateStatusBar('Selection cleared! 🚫');
    }
}

// Function to initialize hover and click events for SVG elements
function initializeHoverAndSelect() {
    // Use event delegation to handle clicks on nested SVG elements
    svgRoot.addEventListener('click', function(event) {
        // Find the closest ancestor or self that is an SVG element with an ID
        let targetElement = event.target.closest('svg [id]');
        console.log(targetElement)
        
        // Skip linearGradient and use elements
        if (targetElement && 
            targetElement.tagName !== 'linearGradient' && 
            targetElement.tagName !== 'use') {
            selectElement(targetElement.id, targetElement);
        }
    });

    // Add click listener to SVG viewer for clearing selection
    const svgViewer = document.getElementById('svg-viewer');
    svgViewer.addEventListener('click', clearSelectionOnOutsideClick);

    // Add event listener for bounds toggle button and control container
    const toggleButton = document.getElementById('toggle-bounds');
    const boundsControl = document.querySelector('.bounds-control');
    
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleSVGBounds);
    }
    
    if (boundsControl) {
        boundsControl.addEventListener('click', toggleSVGBounds);
    }

    // Add window resize handler to update bounds visualization
    window.addEventListener('resize', function() {
        if (toggleButton && toggleButton.classList.contains('active')) {
            // Debounce the resize event
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(() => {
                visualizeSVGBounds(true);
            }, 250);
        }
    });

    // Initialize hover effects for all SVG elements
    const svgElements = svgRoot.querySelectorAll('*');
    svgElements.forEach(element => {
        addHoverEffect(element);
    });
}


// Function to setup SVG viewer tooltip
function setupSVGViewerTooltip() {
    const svgViewer = document.getElementById('svg-viewer');
    if (!svgViewer) return;

    let tooltip = null;
    let isOverSVG = false;

    function createClearTooltip() {
        if (tooltip) return tooltip;
        
        tooltip = document.createElement('div');
        tooltip.classList.add('tooltip', 'clear-selection-tooltip');
        tooltip.textContent = 'Click to clear selection';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    function showTooltip(event) {
        // Only show tooltip if there's an active selection and we're not over SVG
        if (!selectedElement || !document.getElementById('selection-box') || isOverSVG) return;
        
        // Check if we're hovering over the svg-viewer container or its non-SVG children
        const target = event.target;
        const isSVGViewerHover = target === svgViewer || 
                                target.classList.contains('placeholder-text') ||
                                (target.closest('#svg-viewer') === svgViewer && 
                                 target.tagName !== 'svg' && 
                                 !target.closest('svg'));
        
        if (!isSVGViewerHover) {
            return;
        }
        
        const tooltip = createClearTooltip();
        tooltip.style.visibility = 'visible';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 30}px`;
        
        // Add visible class for smooth animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    }

    function hideTooltip() {
        if (!tooltip) return;
        
        tooltip.classList.remove('visible');
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
        }, 200);
    }

    // Track when mouse is over SVG elements
    svgViewer.addEventListener('mouseover', function(event) {
        if (event.target.tagName === 'svg' || event.target.closest('svg')) {
            isOverSVG = true;
            hideTooltip();
        }
    });

    svgViewer.addEventListener('mouseout', function(event) {
        if (event.target.tagName === 'svg' || event.target.closest('svg')) {
            isOverSVG = false;
        }
    });

    // Add event listeners to the SVG viewer
    svgViewer.addEventListener('mouseenter', showTooltip);
    svgViewer.addEventListener('mouseleave', hideTooltip);
    svgViewer.addEventListener('mousemove', showTooltip);
}

// Export functions for use in other modules
window.removeHandles = removeHandles;
window.createHandlesForElement = createHandlesForElement;
window.attachResizeListeners = attachResizeListeners;
window.startResizing = startResizing;
window.UpdateSelectionBoxesAndHandle = UpdateSelectionBoxesAndHandle;
window.startMoving = startMoving;
window.drawBoundingBox = drawBoundingBox;
window.setCorrectTransformOrigin = setCorrectTransformOrigin;
window.setCorrectTransformOriginForClipPath = setCorrectTransformOriginForClipPath;
window.addHoverEffect = addHoverEffect;
window.selectElement = selectElement;
window.initializeHoverAndSelect = initializeHoverAndSelect;
window.visualizeSVGBounds = visualizeSVGBounds;
window.clearSelectionOnOutsideClick = clearSelectionOnOutsideClick;
window.toggleSVGBounds = toggleSVGBounds;
window.setupSVGViewerTooltip = setupSVGViewerTooltip;
