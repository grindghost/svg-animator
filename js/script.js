/* localStorage Utility Functions */
const LOCAL_STORAGE_KEY = 'svg-animations';
var LOCAL_STORAGE_CLEAN_STATE = "";
var SVG_BACKUP = "";

let svgRoot = null;
let selectedElement = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    populateAnimationDropdown();
    updateStatusBar('Ready to animate your SVG files! 🚀');
});

// ****************************************

// Status bar updates
function updateStatusBar(message) {
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

// 16 novembre 2023
// Remove handles to move and scale the selected elements...
function removeHandles() {
    const existingHandles = document.querySelector(".handles");
    if (existingHandles) {
        existingHandles.parentNode.removeChild(existingHandles);
    }
}

function createHandlesForElement(svgElement) {
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

    // Recreate handles based on the updated bounding box
    //createHandlesForElement(element);

    // Remove the selection bounding box and redraw it
    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }
    drawBoundingBox(element);
}


function startMoving(event) {
    // Check if the middle handle is the one being clicked
    if (!event.target.classList.contains('middle-handle')) {
        return; // Exit the function if it's not the middle handle
    }

    event.preventDefault();

    const svgElement = document.querySelector(".selected-element");
    let startX = event.clientX;
    let startY = event.clientY;

    // Store the initial transform so that we can apply only the delta
    const initialTransform = svgElement.style.transform;

    const moveElement = (moveEvent) => {
        let dx = moveEvent.clientX - startX;
        let dy = moveEvent.clientY - startY;

        // Apply only the delta movement as a translation
        svgElement.style.transform = `${initialTransform} translate(${dx}px, ${dy}px)`;

        // Update the selection elements
        UpdateSelectionBoxesAndHandle(svgElement)


    };

    // Add event listeners for mousemove and mouseup
    document.addEventListener("mousemove", moveElement);
    document.addEventListener("mouseup", () => {

        document.removeEventListener("mousemove", moveElement);
        // Optional: Store the new transform as the initial transform after the movement is complete
        // svgElement.style.transform = `${initialTransform} translate(${dx}px, ${dy}px)`;
    }, { once: true });
}



// ****************************************

function saveCurrentStateAsClean() {
    LOCAL_STORAGE_CLEAN_STATE = localStorage.getItem(LOCAL_STORAGE_KEY);
}

function resetToCleanState() {
    localStorage.setItem(LOCAL_STORAGE_KEY, LOCAL_STORAGE_CLEAN_STATE);
}


function populateAnimationDropdown() {
    const animationDropdown = document.getElementById('animation-type');
    animationDropdown.innerHTML = '<option value="none">Select animation...</option>';
    
    Object.keys(animationsData).forEach(animationName => {
        const option = document.createElement('option');
        option.value = animationName;
        option.textContent = animationName.charAt(0).toUpperCase() + animationName.slice(1).replace(/-/g, ' ');
        animationDropdown.appendChild(option);
    });
}

function getSavedAnimations() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : { animations: {} };
}

function saveAnimation(elementId, type, properties) {
    const data = getSavedAnimations();

    // Check if the element already exists
    if (!data.animations[elementId]) {
        data.animations[elementId] = {};
    }

    data.animations[elementId][type] = properties;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    updateAnimationListUI(elementId);
}

function removeStyleTag(styleId=undefined) {
    if (styleId == undefined) {

        // Check if the style tag with the ID of animName exists
        const styleTag = document.querySelector(`style#temp-generic`);

        // If it exists, remove it
        if (styleTag) {
          styleTag.remove();
        }
    } else {
        // Check if the style tag with the ID of animName exists
        const styleTag = document.querySelector(`style#${styleId}`);


        // If it exists, remove it
        if (styleTag) {
          styleTag.remove();
        }
    }
}

function removeAnimation(elementId, type) {
    const data = getSavedAnimations();

    if (data.animations[elementId]) {

        // Remove the corresponding style tag from the DOM,
        // if not temp, because it will not be found in localstorage...
        if (type !== "temp") {
            const styleId = data.animations[elementId][type]['animationName']
            removeStyleTag(styleId)
        }

        // Delete from the localStorage
        delete data.animations[elementId][type];

        // Remove the element entry if it has no more animations
        /*
        if (Object.keys(data.animations[elementId]).length === 0) {
            delete data.animations[elementId];
        }
        */
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    updateAnimationListUI(elementId);

    // Remove the temporary preview animation style tag
    removeStyleTag()

    const element = document.querySelector(`#${elementId}`);
    if (element) {
        stopAnimation(element, type);
    }

}


function resetAllAnimations() {

    // Clear animations from the preview
    const elementsWithAnimation = document.querySelectorAll('.application-animation-class');

    elementsWithAnimation.forEach(element => {
        stopAnimation(element);
    });

    // Update the UI list
    updateAnimationListUI(null);

}


function clearAllAnimations() {
    // Clear animations from localStorage, and reset to a clean state
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ animations: {} }));
    // resetToCleanState()

    // Clear animations from the preview
    const elementsWithAnimation = document.querySelectorAll('.application-animation-class');

    // resetSvgFromBackup(SVG_BACKUP)
    // return;

    elementsWithAnimation.forEach(element => {
        stopAnimation(element);
    });

    // Update the UI list
    updateAnimationListUI(null);

}

function stopAnimation(element, animName=undefined) {
    if (!element) return;

    // If a specific animation is provided, remove just that one
    if (animName) {

        // Remove the class
        element.classList.remove(`${animName}-animation-class`);
        element.classList.remove(`application-animation-class`);

        let animations = element.style.animation.split(', ');
        animations = animations.filter(animation => {
            return !animation.includes(animName);
        });
        element.style.animation = animations.join(', ');

    } else {
        // If no specific animation is provided, remove all animations from the element
        element.style.animation = '';

        // Check if the element is an SVG element
        if (element instanceof SVGElement) {
            const classes = Array.from(element.classList)
                .filter(cls => !cls.endsWith('-animation-class'));
            element.setAttribute('class', classes.join(' '));
        } else {
            element.className = element.className
                .split(' ')
                .filter(cls => !cls.endsWith('-animation-class'))
                .join(' ');
        }
    }

    try {
        document.getElementById('selection-box').remove();
    } catch(e) {
        // Error handling if needed
    }

}


function updateAnimationListUI(selectedElementId) {
    if (!selectedElementId) {
        const animationListDiv = document.getElementById('animation-list-div');
        animationListDiv.innerHTML = '<div class="placeholder-text">No animations applied yet</div>';
        return;
    }

    const data = getSavedAnimations();
    const animationListDiv = document.getElementById('animation-list-div');
    animationListDiv.innerHTML = '';

    if (data.animations[selectedElementId]) {
        Object.entries(data.animations[selectedElementId]).forEach(([animationType, animationProperties]) => {
            const animationDiv = document.createElement('div');
            animationDiv.classList.add('animation-item');

            const animationInfo = document.createElement('div');
            animationInfo.classList.add('animation-info');
            
            const animationName = document.createElement('div');
            animationName.classList.add('animation-name');
            animationName.textContent = animationType.charAt(0).toUpperCase() + animationType.slice(1).replace(/-/g, ' ');
            
            const animationSpeed = document.createElement('div');
            animationSpeed.classList.add('animation-speed');
            animationSpeed.textContent = `Speed: ${animationProperties.speed}s`;

            animationInfo.appendChild(animationName);
            animationInfo.appendChild(animationSpeed);

            // Speed slider
            const speedSlider = document.createElement('input');
            speedSlider.type = 'range';
            speedSlider.min = '0.1';
            speedSlider.max = '5';
            speedSlider.step = '0.1';
            speedSlider.value = animationProperties.speed;
            speedSlider.dataset.elementId = selectedElementId;
            speedSlider.dataset.animationType = animationType;
            speedSlider.classList.add('animation-speed-slider');

            speedSlider.addEventListener('input', function() {
                const speed = this.value;
                const elementToUpdate = document.querySelector(`#${this.dataset.elementId}`);
                if (elementToUpdate) {
                    applyAnimation(elementToUpdate, speed, this.dataset.animationType, true);
                }
            });

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-btn');
            removeButton.innerHTML = '×';
            removeButton.title = 'Remove animation';

            removeButton.addEventListener('click', (e) => {
                removeAnimation(selectedElementId, animationType);
                e.stopPropagation();
                e.preventDefault();
            });

            animationDiv.appendChild(animationInfo);
            animationDiv.appendChild(speedSlider);
            animationDiv.appendChild(removeButton);
            animationListDiv.appendChild(animationDiv);
        });
    } else {
        animationListDiv.innerHTML = '<div class="placeholder-text">No animations applied to this element</div>';
    }
}

document.getElementById('clear-cache').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all animations? This action cannot be undone.')) {
        resetSvgFromBackup();
    }
});

document.getElementById('svg-upload').addEventListener('change', handleSVGUpload);

document.getElementById('speed-slider').addEventListener('input', function() {
    if (selectedElement) {
        const speed = this.value;
        applyTempAnimation(selectedElement, speed, undefined, false);
        document.getElementById('speedDisplay').textContent = `${speed}s`;
    }
});


function handleSVGUpload(event) {
    clearAllAnimations();
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.svg')) {
        updateStatusBar('Please select a valid SVG file! ❌');
        return;
    }
    
    updateStatusBar('Loading SVG file... 📁');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const svgData = e.target.result;
            SVG_BACKUP = svgData;
            
            const svgViewer = document.getElementById('svg-viewer');
            svgViewer.innerHTML = svgData;
            svgViewer.classList.add('has-content');
            
            svgRoot = document.querySelector('#svg-viewer svg');
            
            if (!svgRoot) {
                throw new Error('Invalid SVG content');
            }

            prepopulateLocalStorage(svgRoot);
            populateTreeView(svgRoot);
            saveCurrentStateAsClean();
            initializeHoverAndSelect();
            
            updateStatusBar(`SVG loaded: ${file.name} ✨`);
            
            // Enable controls
            document.getElementById('download-svg').disabled = false;
            document.getElementById('clear-cache').disabled = false;
            
            // Show success message
            showNotification('SVG loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error processing SVG:', error);
            updateStatusBar('Error processing SVG file! ❌');
            showNotification('Failed to load SVG file. Please check the file format.', 'error');
            
            // Reset viewer
            const svgViewer = document.getElementById('svg-viewer');
            svgViewer.innerHTML = `
                <div class="placeholder-text">
                    <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 16px;">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414l-3.853 3.853A1 1 0 0 1 1 15.5V2zm5 4a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm4 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm3 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0z"/>
                    </svg>
                    <p>Upload an SVG file to see it here</p>
                </div>
            `;
            svgViewer.classList.remove('has-content');
        }
    };
    
    reader.onerror = function() {
        updateStatusBar('Error loading SVG file! ❌');
        showNotification('Failed to read the file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
}

function resetSvgFromBackup() {
    clearAllAnimations();
    
    const svgViewer = document.getElementById('svg-viewer');
    svgViewer.innerHTML = SVG_BACKUP;
    svgViewer.classList.add('has-content');
    
    svgRoot = document.querySelector('#svg-viewer svg');
    prepopulateLocalStorage(svgRoot);
    populateTreeView(svgRoot);
    saveCurrentStateAsClean();
    
    updateStatusBar('SVG reset to original state 🔄');
}

function prepopulateLocalStorage(element) {
    if (!element.id) {
        element.id = generateUniqueID(); // Assigning unique ID if not present
    }

    const existingAnimations = getSavedAnimations();
    if (!existingAnimations[element.id]) {
        saveAnimation(element.id, null); // Prepopulate with empty values
    }

    for (let child of element.children) {
        prepopulateLocalStorage(child);
    }

}

function generateUniqueID() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}


function populateTreeView(rootElement) {
    const treeDiv = document.getElementById('element-tree');
    treeDiv.innerHTML = '';
    createTreeViewItem(treeDiv, rootElement);
}


function createTreeViewItem(parent, element, depth = 0) {
    // Skip over <style> and <defs> tags
    if (element.tagName === 'style' || element.tagName === 'defs') {
        return;
    }

    // Check if the element has child elements (is not a leaf)
    const hasChildren = element.children.length > 0;

    const container = hasChildren ? document.createElement('details') : document.createElement('div');
    const summary = hasChildren ? document.createElement('summary') : container;

    // Set the data-element-id attribute to match the SVG element's ID
    summary.setAttribute('data-element-id', element.id);

    // Create a more descriptive label
    let label = element.tagName;
    if (element.id && element.id !== '') {
        label += ` (${element.id})`;
    }
    summary.textContent = label;
    summary.style.paddingLeft = `${depth * 15}px`;

    if (hasChildren) {
        container.appendChild(summary);
        parent.appendChild(container);
    } else {
        parent.appendChild(summary);
    }

    summary.addEventListener('click', function(e) {
        e.stopPropagation();
        removeStyleTag();

        // Clear selection for previously selected element in SVG
        if (selectedElement && document.getElementById('selection-box')) {
            document.getElementById('selection-box').remove();
        }

        // Clear highlighted treeview item
        const previouslyHighlighted = document.querySelector('.selected');
        if (previouslyHighlighted) {
            CleanAnimationStyle(svgRoot, "temp-generic");
            previouslyHighlighted.classList.remove('selected');
        }

        // Check if the clicked element is a leaf node
        const isLeafElement = element.children.length === 0;
        let targetElement = element;

        // If it's a leaf element and the parent is not a 'wrapping-group', wrap it
        if (isLeafElement) {
            if (!element.parentNode.classList || !element.parentNode.classList.contains('wrapping-group')) {
                const gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                gWrapper.classList.add('wrapping-group');
                gWrapper.id = generateUniqueID();

                element.parentNode.insertBefore(gWrapper, element);
                gWrapper.appendChild(element);
                targetElement = gWrapper;
            } else if (element.parentNode.classList.contains('wrapping-group')) {
                targetElement = element.parentNode;
            }
        }

        // Highlight the current treeview item
        summary.classList.add('selected');

        // Set the selected element in SVG and add the 'selected-element' class
        selectedElement = targetElement;

        CleanAnimationStyle(selectedElement, "temp-generic");
        createHandlesForElement(selectedElement);

        // Check if any element in the DOM already has the 'selected-element' class
        const existingElementWithClass = document.querySelector('.selected-element');
        if (!existingElementWithClass) {
            selectedElement.classList.add('selected-element');
        } else {
            existingElementWithClass.classList.remove('selected-element');
            selectedElement.classList.add('selected-element');
        }

        // Draw the bounding box around the selected element in SVG
        drawBoundingBox(selectedElement);

        // Reset the animation controls
        resetControls();

        // Update the animation details UI for the selected element
        updateAnimationListUI(selectedElement.id);

        // Enable the dropdown for animation types
        document.getElementById('animation-type').disabled = false;
        
        updateStatusBar(`Selected: ${label} 🎯`);
        
        e.stopPropagation();
    });

    for (let child of element.children) {
        createTreeViewItem(hasChildren ? container : summary, child, depth + 1);
    }
}


document.getElementById('apply-animation').addEventListener('click', function() {
    if (selectedElement) {
        const animationType = document.getElementById('animation-type').value;
        if (animationType != 'none') {
            let speedValue = document.getElementById('speed-slider').value;
            applyAnimation(selectedElement, speedValue);
        } else {
            selectedElement.classList.remove('animated');
        }
    }
});


document.getElementById('animation-type').addEventListener('change', function() {
    const element = selectedElement;
    const speed = document.getElementById('speed-slider').value;
    const animationName = document.getElementById('animation-type').value;

    if (this.value !== "none") {
        // Render parameter controls for parametric animations
        renderParamControls(animationName);
        
        applyTempAnimation(selectedElement, speed, animationName, false);
        document.getElementById('speed-slider').removeAttribute('disabled');
        document.getElementById('speed-slider').value = "1.5";
        document.getElementById('speedDisplay').textContent = "1.5s";
        document.getElementById('apply-animation').removeAttribute('disabled');
        updateStatusBar(`Previewing "${animationName}" animation 🎬`);
    } else {
        // Hide parameter panel when no animation is selected
        document.getElementById('animation-param-panel').style.display = 'none';
        
        document.getElementById('speed-slider').setAttribute('disabled', true);
        document.getElementById('apply-animation').setAttribute('disabled', true);
        updateStatusBar('Animation preview cleared 🚫');
    }
});

function uniqueID(existingName = null) {
    if (existingName) return existingName;

    const prefix = document.getElementById('animation-type').value;
    return `${prefix}-` + Math.random().toString(36).substr(2, 9);
}


function applyAnimationToImage(element, speed, animName) {
    // Check if the element is a leaf node
    const isLeafElement = element.children.length === 0;

    let gWrapper;

    // If it's a leaf element, check if it's already wrapped by a 'wrapping-group'
    if (isLeafElement) {
        if (element.parentNode.tagName.toLowerCase() === 'g' && element.parentNode.classList.contains('wrapping-group')) {
            // It's already wrapped by the correct <g> element, so use the existing wrapper
            gWrapper = element.parentNode;
        } else {
            // It's not wrapped yet, so wrap it in a new <g> element with class 'wrapping-group'
            gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gWrapper.classList.add('wrapping-group');
            element.parentNode.insertBefore(gWrapper, element);
            gWrapper.appendChild(element);
        }
    } else {
        // If it's not a leaf element, we assume it's already a group or doesn't need wrapping
        gWrapper = element;
    }

    // Now apply the animation to the <g> wrapper or the original element
    applyTempAnimation(gWrapper, speed, animName, false);
}


function applyTempAnimation(element, speed, animName=undefined, save=true) {

   // Remove the selection bounding box (better preview)
    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    removeStyleTag()

    // 👽 Remove any temp-generic animations when applying the selected animation
    CleanAnimationStyle(element, "temp-generic")

    // Don't apply the animation, if already exist...
    const elementId = element.getAttribute('id') || element.tagName;

    let animationName;

    // Get a temporary animation name
    selectedAnimation = "temp"

    // Get saved animations for this element
    const savedAnimations = getSavedAnimations().animations[elementId] || {};

    // If an animation of the same type already exists for this element, use its existing unique ID
    const existingAnimationName = savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].animationName;

    // Use existing name if present, otherwise generate a new one
    animationName = "temp-generic"

    const current_selected_anim_in_dropdown = document.getElementById('animation-type').value;

            const animationData = animationsData[current_selected_anim_in_dropdown];

        if (!animationData) {
            console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
            return;
        }

        // Handle both parametric and static animations
        let keyframes;
        if (animationData.generateKeyframes) {
            // Parametric animation - generate keyframes from current parameters
            keyframes = animationData.generateKeyframes(animationData.params);
        } else {
            // Legacy static animation
            keyframes = animationData.keyframes;
        }

        // Extract the current transform style
        const initialTransformValue = element.style.transform;

        // When defining your keyframes, make sure the initial keyframe starts with the current transform state
        let keyframesString = '';
        for (let percentage in keyframes) {
            let properties = keyframes[percentage];
            let propsString = Object.keys(properties).map(prop => {
                // ... Add the initial transforms in the animation...
                return `${prop}: ${initialTransformValue} ${properties[prop]};`;
            }).join(' ');
            keyframesString += `${percentage} { ${propsString} } `;
        }

    const embeddedStyle = `
        <style id="${animationName}" data-anikit="">
            @keyframes ${animationName} {
                ${keyframesString}
            }
        </style>
    `;

    // Add the embedded style. No need to check for existing style as each animation has a unique name
    svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);

    // Don't add the animation with the same name multiple times
    CleanAnimationStyle(element, animationName)

    // Check if the element already has animations and combine them
    const existingAnimation = element.style.animation;
    const existingTransform = element.style.transform;
    console.log(existingTransform)
    const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
    const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

    // element.style.animation = combinedAnimation;
    element.setAttribute('style', `animation: ${combinedAnimation} !important; transform: ${existingTransform}`);

    setCorrectTransformOrigin(element)
    //element.style.transformOrigin = "50% 50%";

    element.classList.add(`application-animation-class`)


    // Save this animation. If you're using a function to save animations, you might need to modify it to support multiple animations
    if (save == true) {
        const elementId2 = element.getAttribute('id') || element.tagName;
        saveAnimation(elementId2, selectedAnimation, { speed: `${speed}`, animationName: animationName });

        // Reset the apply animation controls
        document.getElementById('animation-type').value = "none";
        const event = new Event('change');
        document.getElementById('animation-type').dispatchEvent(event);
        document.getElementById('speed-slider').value = '1.5';
        document.getElementById('speedDisplay').textContent = '1.5s';
    }
}

// Function to render parameter controls for parametric animations
function renderParamControls(animationName) {
    const anim = animationsData[animationName];
    const panel = document.getElementById("animation-param-panel");
    const controlsContainer = panel.querySelector(".param-controls");
    
    // Clear existing controls
    controlsContainer.innerHTML = "";
    
    if (!anim || !anim.params) {
        // No parameters - hide the panel
        panel.style.display = "none";
        return;
    }
    
    // Show the panel and create controls for each parameter
    panel.style.display = "block";
    
    for (const [param, value] of Object.entries(anim.params)) {
        const controlWrapper = document.createElement("div");
        controlWrapper.className = "param-control";
        
        const label = document.createElement("label");
        label.className = "param-label";
        label.textContent = `${param}: `;
        
        const input = document.createElement("input");
        input.type = "range";
        input.className = "param-slider";
        
        // Set appropriate min/max/step based on parameter type
        if (param.includes("amplitude") || param.includes("intensity")) {
            input.min = "0.1";
            input.max = "3.0";
            input.step = "0.1";
        } else if (param.includes("blur")) {
            input.min = "0";
            input.max = "20";
            input.step = "1";
        } else if (param.includes("skew")) {
            input.min = "5";
            input.max = "45";
            input.step = "1";
        } else {
            // Default range
            input.min = "0";
            input.max = "5";
            input.step = "0.1";
        }
        
        input.value = value;
        
        const span = document.createElement("span");
        span.className = "param-value";
        span.textContent = value;
        
        // Add event listener for real-time updates
        input.addEventListener("input", () => {
            const newValue = parseFloat(input.value);
            anim.params[param] = newValue;
            span.textContent = newValue;
            
            // Apply temporary animation to preview changes
            if (selectedElement) {
                applyTempAnimation(selectedElement, document.getElementById('speed-slider').value, undefined, false);
            }
        });
        
        controlWrapper.appendChild(label);
        controlWrapper.appendChild(input);
        controlWrapper.appendChild(span);
        controlsContainer.appendChild(controlWrapper);
    }
}


function _CleanAnimationStyle(element, animation_name) {

        let animations = element.style.animation.split(', ');
        animations = animations.filter(animation => {
            return !animation.includes(animation_name);
        });

        element.style.animation = animations.join(', ');
}

function CleanAnimationStyle(element, animation_name) {
    // Function to remove the animation from a single element
    function removeAnimationFromElement(elem) {
        let animations = elem.style.animation.split(', ');
        animations = animations.filter(animation => !animation.includes(animation_name));
        elem.style.animation = animations.join(', ');
    }

    // Apply the function to the provided element
    removeAnimationFromElement(element);

    // Recursively apply the function to all child elements
    element.querySelectorAll('*').forEach(child => {
        removeAnimationFromElement(child);
    });
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



function applyAnimation(element, speed, animName=undefined, save=true) {
    try {
        removeStyleTag();

        const elementId = element.getAttribute('id') || element.tagName;
        let animationName;
        let selectedAnimation;

        if (animName == undefined) {
            selectedAnimation = document.getElementById('animation-type').value;
        } else {
            selectedAnimation = animName;
        }

        const savedAnimations = getSavedAnimations().animations[elementId] || {};
        const existingAnimationName = savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].animationName;
        animationName = uniqueID(existingAnimationName);

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        removeStyleTag(animationName);

        // Handle both parametric and static animations
        let keyframes;
        if (animationData.generateKeyframes) {
            // Parametric animation - generate keyframes from current parameters
            keyframes = animationData.generateKeyframes(animationData.params);
        } else {
            // Legacy static animation
            keyframes = animationData.keyframes;
        }

        const initialTransformValue = element.style.transform;
        let keyframesString = '';
        for (let percentage in keyframes) {
            let properties = keyframes[percentage];
            let propsString = Object.keys(properties).map(prop => {
                return `${prop}: ${initialTransformValue} ${properties[prop]};`;
            }).join(' ');
            keyframesString += `${percentage} { ${propsString} } `;
        }

        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;

        svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);
        CleanAnimationStyle(element, animationName);

        const existingAnimation = element.style.animation;
        const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
        const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

        element.setAttribute('style', `animation: ${combinedAnimation} !important`);
        setCorrectTransformOrigin(element);
        CleanAnimationStyle(element, "temp-generic");

        element.classList.add(`application-animation-class`);
        element.classList.add(`${selectedAnimation}-animation-class`);

        if (save == true) {
            const elementId2 = element.getAttribute('id') || element.tagName;
            
            // Prepare properties to save, including parameters for parametric animations
            const propertiesToSave = { 
                speed: `${speed}`, 
                animationName: animationName 
            };
            
            // Add parameter values if this is a parametric animation
            if (animationData.generateKeyframes && animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            
            saveAnimation(elementId2, selectedAnimation, propertiesToSave); 

            resetControls();
            updateStatusBar(`Animation "${selectedAnimation}" applied! ✨`);
            showNotification(`Animation "${selectedAnimation}" applied successfully!`, 'success');
        }
        
    } catch (error) {
        console.error('Error applying animation:', error);
        updateStatusBar('Error applying animation! ❌');
        showNotification(`Failed to apply animation: ${error.message}`, 'error');
    }
}

function drawBoundingBox(element) {
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





function resetControls() {
    document.getElementById('animation-type').value = "none";
    document.getElementById('speed-slider').value = '1.5';
    document.getElementById('speedDisplay').textContent = '1.5s';
    
    // Hide the parameter panel when resetting controls
    document.getElementById('animation-param-panel').style.display = 'none';

    const event = new Event('change');
    document.getElementById('animation-type').dispatchEvent(event);
}

 document.getElementById('download-svg').addEventListener('click', function() {
    updateStatusBar('Preparing SVG for download... 💾');
    
    const svgBackup = svgRoot.cloneNode(true);

    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    removeHandles();

    const externalStyle = document.querySelector('style');
    if (externalStyle && !svgRoot.querySelector('style')) {
        const embeddedStyle = externalStyle.cloneNode(true);
        svgRoot.prepend(embeddedStyle);
    }

    const existingMetadata = svgRoot.querySelector('metadata');
    if (!existingMetadata) {
        const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        
        // Create comprehensive metadata including animation parameters
        const metadataContent = {
            version: '1.0',
            animations: getSavedAnimations()
        };
        
        metadata.textContent = JSON.stringify(metadataContent);
        svgRoot.prepend(metadata);
    }

    const blob = new Blob([svgRoot.outerHTML], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animated.svg';
    link.click();

    updateStatusBar('SVG downloaded successfully! 🎉');
});


// Function to add hover effect on SVG elements
function addHoverEffect(svgElement) {

    svgElement.addEventListener('mouseenter', function() {
        this.classList.add('hover-effect');
    });

    svgElement.addEventListener('mouseleave', function() {
        this.classList.remove('hover-effect');
    });
}

// Updated function to select an element in the SVG and the tree view with simulated click event
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

// Add notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        z-index: 1000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }
    
    .notification-close:hover {
        background: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(style);

// Add drag and drop support for SVG files
function initializeDragAndDrop() {
    const svgViewer = document.getElementById('svg-viewer');
    
    svgViewer.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        svgViewer.classList.add('loading');
    });
    
    svgViewer.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        svgViewer.classList.remove('loading');
    });
    
    svgViewer.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        svgViewer.classList.remove('loading');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                // Create a fake event object
                const fakeEvent = {
                    target: {
                        files: [file]
                    }
                };
                handleSVGUpload(fakeEvent);
            } else {
                showNotification('Please drop an SVG file!', 'error');
            }
        }
    });
}

// Add keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + O to open file
        if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
            e.preventDefault();
            document.getElementById('svg-upload').click();
        }
        
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const downloadBtn = document.getElementById('download-svg');
            if (!downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
        
        // Delete key to remove selected animation
        if (e.key === 'Delete' && selectedElement) {
            const animationType = document.getElementById('animation-type').value;
            if (animationType !== 'none') {
                removeAnimation(selectedElement.id, animationType);
            }
        }
        
        // Escape to clear selection
        if (e.key === 'Escape') {
            if (selectedElement) {
                const selectionBox = document.getElementById('selection-box');
                if (selectionBox) selectionBox.remove();
                removeHandles();
                
                const treeItem = document.querySelector('.selected');
                if (treeItem) treeItem.classList.remove('selected');
                
                selectedElement = null;
                resetControls();
                updateAnimationListUI(null);
                updateStatusBar('Selection cleared! 🚫');
            }
        }
    });
}

// Add help tooltip
function addHelpTooltips() {
    const helpElements = [
        { element: 'svg-upload', text: 'Upload an SVG file to get started' },
        { element: 'animation-type', text: 'Choose from 20+ animation types' },
        { element: 'speed-slider', text: 'Adjust animation speed from 0.1s to 5s' },
        { element: 'apply-animation', text: 'Apply the selected animation to the element' },
        { element: 'download-svg', text: 'Download the animated SVG file' },
        { element: 'clear-cache', text: 'Reset all animations to original state' }
    ];
    
    helpElements.forEach(({ element, text }) => {
        const el = document.getElementById(element);
        if (el) {
            el.title = text;
        }
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    populateAnimationDropdown();
    updateStatusBar('Ready to animate your SVG files! 🚀');
    initializeDragAndDrop();
    initializeKeyboardShortcuts();
    addHelpTooltips();
    
    // Add welcome message
    setTimeout(() => {
        showNotification('Welcome to SVG Animator Pro! 🎉', 'info');
    }, 1000);
});
