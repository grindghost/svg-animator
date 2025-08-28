w// UI updates, tree view, controls, and animation list management
// SVG Animator Pro - UI Manager Module

// Populate animation dropdown
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

// Update animation list UI
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

// Function to get appropriate icon for SVG element types
function getElementIcon(tagName, hasChildren) {
    const tag = tagName.toLowerCase();
    
    if (hasChildren) {
        return '📁'; // Folder icon for groups
    }
    
    switch (tag) {
        case 'rect':
            return '▢'; // Outline square for rectangles
        case 'circle':
            return '⭕'; // Circle for circles
        case 'ellipse':
            return '⭕'; // Circle for ellipses
        case 'line':
            return '➖'; // Line for lines
        case 'polyline':
            return '📈'; // Chart for polylines
        case 'polygon':
            return '🔷'; // Diamond for polygons
        case 'path':
            return '〰️'; // Wave for paths
        case 'text':
            return '📝'; // Text for text elements
        case 'image':
            return '🖼️'; // Image for images
        case 'use':
            return '🔗'; // Link for use elements
        case 'g':
            return '📁'; // Folder for groups
        case 'svg':
            return '🎨'; // Art for SVG root
        default:
            return '🔹'; // Default diamond for unknown elements
    }
}

// Populate tree view
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
    summary.setAttribute('data-depth', depth);

    // Create icon based on element type
    const icon = getElementIcon(element.tagName, hasChildren);
    
    // Add specific class for rectangle elements
    if (element.tagName.toLowerCase() === 'rect') {
        summary.classList.add('rect-element');
    }
    
    // Create a more descriptive label with icon
    let label = element.tagName;
    if (element.id && element.id !== '') {
        summary.setAttribute('data-element-id-full', element.id);
        summary.setAttribute('title', `${element.tagName} (${element.id})`);
    }
    
    // Create the label container with icon and text
    const labelContainer = document.createElement('span');
    labelContainer.className = 'tree-item-label';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'tree-item-icon';
    iconSpan.innerHTML = icon;
    
    const textSpan = document.createElement('span');
    textSpan.className = 'tree-item-text';
    textSpan.textContent = label;
    
    labelContainer.appendChild(iconSpan);
    labelContainer.appendChild(textSpan);
    
    // Clear any existing content and append the new structure
    summary.innerHTML = '';
    summary.appendChild(labelContainer);

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
        
        // Show and update shape styling controls
        showShapeStylingControls();
        updateStylingControlsFromElement(selectedElement);
        
        updateStatusBar(`Selected: ${label} 🎯`);
        
        e.stopPropagation();
    });

    for (let child of element.children) {
        createTreeViewItem(hasChildren ? container : summary, child, depth + 1);
    }
}

// Prepopulate localStorage with element IDs
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

// Initialize drag and drop support for SVG files
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

// Export functions for use in other modules
window.populateAnimationDropdown = populateAnimationDropdown;
window.updateAnimationListUI = updateAnimationListUI;
window.populateTreeView = populateTreeView;
window.createTreeViewItem = createTreeViewItem;
window.prepopulateLocalStorage = prepopulateLocalStorage;
window.initializeDragAndDrop = initializeDragAndDrop;
