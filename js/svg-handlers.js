// SVG manipulation, handles, selection, and bounding box functionality
// SVG Animator Pro - SVG Handlers Module

// Remove handles to move and scale the selected elements
function removeHandles() {
    const existingHandles = document.querySelector(".handles");
    if (existingHandles) {
        existingHandles.parentNode.removeChild(existingHandles);
    }
}

function createHandlesForElement(svgElement) {
    // Clean previous handles
    removeHandles();

    const bbox = svgElement.getBBox();          // untransformed bbox
    const ctm = svgElement.getCTM();            // includes current transform
    const svgPoint = svgRoot.createSVGPoint();

    // helper: apply CTM to (x,y)
    function applyCTM(x, y) {
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(ctm);
    }

    // Corners in transformed coords
    const topLeft     = applyCTM(bbox.x, bbox.y);
    const topRight    = applyCTM(bbox.x + bbox.width, bbox.y);
    const bottomLeft  = applyCTM(bbox.x, bbox.y + bbox.height);
    const bottomRight = applyCTM(bbox.x + bbox.width, bbox.y + bbox.height);
    const center      = applyCTM(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);

    const positions = [
        { x: topLeft.x, y: topLeft.y, name: "corner" },
        { x: topRight.x, y: topRight.y, name: "corner" },
        { x: bottomLeft.x, y: bottomLeft.y, name: "corner" },
        { x: bottomRight.x, y: bottomRight.y, name: "corner" },
        { x: center.x, y: center.y, name: "middle" }
    ];

    // Handles group
    const handlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    handlesGroup.setAttribute("class", "handles");

    positions.forEach(pos => {
        const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        handle.setAttribute("x", pos.x - 4);
        handle.setAttribute("y", pos.y - 4);
        handle.setAttribute("width", 8);
        handle.setAttribute("height", 8);
        handle.setAttribute("fill", "rgba(99, 102, 241, 0.8)");
        handle.style.stroke = "white";
        handle.style.strokeWidth = "2";
        handle.classList.add(pos.name + '-handle');

        if (pos.name === "middle") {
            handle.setAttribute("x", pos.x - 7);
            handle.setAttribute("y", pos.y - 7);
            handle.setAttribute("width", 14);
            handle.setAttribute("height", 14);
            handle.setAttribute("fill", "white");
            handle.style.strokeWidth = "2";
            handle.style.stroke = "rgb(99, 102, 241)";
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

function startResizing(event) {
    event.preventDefault();

    const selectedHandle = event.target;
    const svgElement = document.querySelector(".selected-element");
    if (!svgElement) return;

    const bbox = svgElement.getBBox();
    let startX = event.clientX;
    let startY = event.clientY;

    let prevWidth = bbox.width;
    let prevHeight = bbox.height;

    const onMouseMove = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;

        // Small incremental scaling factor
        let scaleX = 1 + dx / prevWidth;
        let scaleY = 1 + dy / prevHeight;

        // Build incremental scaling matrix around bbox top-left (pivot)
        const scaling = svgRoot.createSVGMatrix()
            .translate(bbox.x, bbox.y)
            .scaleNonUniform(scaleX, scaleY)
            .translate(-bbox.x, -bbox.y);

        applyTransform(svgElement, scaling);

        // Reset reference points for incremental scaling
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




function _startResizing(event) {
    event.preventDefault();

    const selectedHandle = event.target;
    const svgElement = document.querySelector(".selected-element");
    const originalBBox = svgElement.getBBox();

    const resizeElement = (moveEvent) => {
        // Calculate the scale factors based on mouse movement and original dimensions
        let scaleX, scaleY;
        if (selectedHandle === event.target) { // Assuming this is a specific handle, e.g., top-left
            scaleX = (moveEvent.clientX - originalBBox.x) / originalBBox.width;
            scaleY = (moveEvent.clientY - originalBBox.y) / originalBBox.height;
        }
        // Apply the scaling to the element
        svgElement.style.transform = `scale(${scaleX}, ${scaleY})`;
        svgElement.style.transformOrigin = 'top left'; // Adjust as needed based on the handle

        // Update the selection elements
        UpdateSelectionBoxesAndHandle(svgElement)
    };

    document.addEventListener("mousemove", resizeElement);
    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", resizeElement);
    }, { once: true });
}

function UpdateSelectionBoxesAndHandle(element) {
    // Update the bounding box based on the transformed element

    // Remove the existing handles
    removeHandles();

    // Remove the selection bounding box and redraw it
    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }
    drawBoundingBox(element);
}

function startMoving(event) {
    if (!event.target.classList.contains('middle-handle')) return;
    event.preventDefault();

    const svgElement = document.querySelector(".selected-element");
    if (!svgElement) return;

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


function drawBoundingBox(element) {
    const bbox = element.getBBox();
    const ctm = element.getCTM();
    const svgPoint = svgRoot.createSVGPoint();

    function applyCTM(x, y) {
        svgPoint.x = x;
        svgPoint.y = y;
        return svgPoint.matrixTransform(ctm);
    }

    const topLeft     = applyCTM(bbox.x, bbox.y);
    const topRight    = applyCTM(bbox.x + bbox.width, bbox.y);
    const bottomLeft  = applyCTM(bbox.x, bbox.y + bbox.height);
    const bottomRight = applyCTM(bbox.x + bbox.width, bbox.y + bbox.height);

    const minX = Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const maxX = Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x);
    const minY = Math.min(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);
    const maxY = Math.max(topLeft.y, topRight.y, bottomLeft.y, bottomRight.y);

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', minX);
    rect.setAttribute('y', minY);
    rect.setAttribute('width', maxX - minX);
    rect.setAttribute('height', maxY - minY);
    rect.setAttribute('stroke', '#6366f1');
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke-width', '2px');
    rect.setAttribute('stroke-dasharray', '5');
    rect.setAttribute('id', 'selection-box');
    svgRoot.appendChild(rect);
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

// Function to add hover effect on SVG elements
function addHoverEffect(svgElement) {
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

        // Simulate a click on the "summary" element if additional actions are required
        summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Optional: scroll the item into view
        summaryElement.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    }
}

// Function to initialize hover and click events for SVG elements
function initializeHoverAndSelect() {
    // Use event delegation to handle clicks on nested SVG elements
    svgRoot.addEventListener('click', function(event) {
        // Find the closest ancestor or self that is an SVG element with an ID
        let targetElement = event.target.closest('svg [id]');
        console.log(targetElement)
        if (targetElement) {
            selectElement(targetElement.id, targetElement);
        }
    });

    // Initialize hover effects for all SVG elements
    const svgElements = svgRoot.querySelectorAll('*');
    svgElements.forEach(element => {
        createTooltip(element); 
        addHoverEffect(element);
    });
}

function createTooltip(element) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.textContent = element.tagName + ' : ' + element.id;
    document.body.appendChild(tooltip);

    element.addEventListener('mouseenter', function(event) {
        tooltip.style.visibility = 'visible';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 30}px`;
        
        // Add visible class for smooth animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
    });

    element.addEventListener('mouseleave', function() {
        tooltip.classList.remove('visible');
        setTimeout(() => {
            tooltip.style.visibility = 'hidden';
        }, 200);
    });
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
window.addHoverEffect = addHoverEffect;
window.selectElement = selectElement;
window.initializeHoverAndSelect = initializeHoverAndSelect;
window.createTooltip = createTooltip;
