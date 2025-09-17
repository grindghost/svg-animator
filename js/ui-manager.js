// UI updates, tree view, controls, and animation list management
// SVG Animator Pro - UI Manager Module

// Populate animation dropdown
function populateAnimationDropdown(filterForClipPath = false) {
    const animationDropdown = document.getElementById('animation-type');
    animationDropdown.innerHTML = '<option value="none">Select animation...</option>';
    
    // Sort animation names alphabetically
    const sortedAnimationNames = Object.keys(animationsData).sort();
    
    sortedAnimationNames.forEach(animationName => {
        const animationData = animationsData[animationName];
        
        // ✅ NEW: Filter out filter-based animations for clipPath shapes
        if (filterForClipPath && animationData.type === 'filter') {
            return; // Skip filter-based animations
        }
        
        const option = document.createElement('option');
        option.value = animationName;
        option.textContent = animationName.charAt(0).toUpperCase() + animationName.slice(1).replace(/-/g, ' ');
        animationDropdown.appendChild(option);
    });
}

// Global variable to track currently selected animation for editing
let currentlyEditingAnimation = null;

// Update animation list UI
function updateAnimationListUI(selectedElementId) {
    if (!selectedElementId) {
        const animationListDiv = document.getElementById('animation-list-div');
        animationListDiv.innerHTML = '<div class="placeholder-text">No animations applied yet</div>';
        hideAppliedAnimationEditor();
        return;
    }

    const data = getSavedAnimations();
    const animationListDiv = document.getElementById('animation-list-div');
    animationListDiv.innerHTML = '';

    if (data.animations[selectedElementId]) {
        Object.entries(data.animations[selectedElementId]).forEach(([animationKey, animationData]) => {
            // Handle both old format (animationType as key) and new format (animationId as key)
            const isOldFormat = !animationData.type;
            const animationType = isOldFormat ? animationKey : animationData.type;
            const animationId = isOldFormat ? animationKey : animationKey;
            
            const animationDiv = document.createElement('div');
            animationDiv.classList.add('animation-item', 'animation-selector');
            animationDiv.dataset.elementId = selectedElementId;
            animationDiv.dataset.animationId = animationId;
            animationDiv.dataset.animationType = animationType;

            const animationInfo = document.createElement('div');
            animationInfo.classList.add('animation-info');
            
            const animationName = document.createElement('div');
            animationName.classList.add('animation-name');
            animationName.textContent = animationType.charAt(0).toUpperCase() + animationType.slice(1).replace(/-/g, ' ');
            
            const animationSpeed = document.createElement('div');
            animationSpeed.classList.add('animation-speed');
            animationSpeed.textContent = `Speed: ${animationData.speed}s`;

            animationInfo.appendChild(animationName);
            animationInfo.appendChild(animationSpeed);

            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-btn');
            removeButton.innerHTML = '×';
            removeButton.title = 'Remove animation';

            removeButton.addEventListener('click', (e) => {
                removeAnimation(selectedElementId, animationId);
                e.stopPropagation();
                e.preventDefault();
            });

            // Add click handler for animation selection
            animationDiv.addEventListener('click', (e) => {
                if (e.target === removeButton) return; // Don't select when clicking remove
                selectAnimationForEditing(selectedElementId, animationId, animationType, animationData);

                // Smooth scroll to .animation-id-display
                // add offset of 100px
                const animationIdDisplay = document.querySelector('.tab-button');
                if (animationIdDisplay) {
                    animationIdDisplay.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest', top: 100 });
                }
            });

            animationDiv.appendChild(animationInfo);
            animationDiv.appendChild(removeButton);
            animationListDiv.appendChild(animationDiv);
        });
    } else {
        animationListDiv.innerHTML = '<div class="placeholder-text">No animations applied to this element</div>';
        hideAppliedAnimationEditor();
    }
}

/**
 * Refreshes the entire left panel content for a selected element
 * This centralizes all left panel updates in one place
 * @param {string|null} selectedElementId - The ID of the selected element, or null to clear
 * @param {Element|null} selectedElement - The actual DOM element (optional, for styling controls)
 */
function refreshLeftPanel(selectedElementId, selectedElement = null) {
    // Update animation list and count
    updateAnimationListUI(selectedElementId);
    updateAnimationCountMessage(selectedElementId);
    
    if (selectedElementId && selectedElement) {
        // Element is selected - show and update controls
        document.getElementById('animation-type').disabled = false;
        showShapeStylingControls();
        updateStylingControlsFromElement(selectedElement);
        showControlsSection();
        
        // Show appropriate warnings
        showClipPathWarning(selectedElement);
        hideRootElementMessage();
        hideClipPathElementMessage();
    } else {
        // No element selected - hide controls
        resetControls();
        hideShapeStylingControls();
        hideControlsSection();
        hideAppliedAnimationEditor();
    }
}

// Function to select an animation for editing
function selectAnimationForEditing(elementId, animationId, animationType, animationData) {
    // Remove previous selection
    document.querySelectorAll('.animation-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const clickedItem = document.querySelector(`[data-element-id="${elementId}"][data-animation-id="${animationId}"]`);
    if (clickedItem) {
        clickedItem.classList.add('selected');
    }
    
    // Store current editing state
    currentlyEditingAnimation = {
        elementId: elementId,
        animationId: animationId,
        animationType: animationType,
        animationData: animationData
    };
    
    // Show the applied animation editor
    showAppliedAnimationEditor(animationType, animationData, animationId);
}

// Function to show the applied animation editor
function showAppliedAnimationEditor(animationType, animationData, animationId) {
    const editor = document.getElementById('applied-animation-editor');
    const editorTab = document.getElementById('editor-tab');
    const controlsTab = document.getElementById('controls-tab');
    const controlsContent = document.getElementById('controls-content');
    const animationNameSpan = document.getElementById('editor-animation-name');
    const animationIdSpan = document.getElementById('editor-animation-id');
    const speedSlider = document.getElementById('applied-speed-slider');
    const speedDisplay = document.getElementById('applied-speed-display');
    const paramControls = document.getElementById('applied-param-controls');
    
    // Update tab content with animation info
    // Show just the animation name in the button (without emoji)
    animationNameSpan.textContent = animationType.charAt(0).toUpperCase() + animationType.slice(1).replace(/-/g, ' ');
    
    // Use the animationId parameter passed to the function
    animationIdSpan.textContent = `${animationId}`;
    
    // Update the tab content header with animation ID
    const tabContentHeader = document.querySelector('.tab-content-header');
    if (tabContentHeader) {
        // Remove any existing animation ID display
        const existingIdDisplay = tabContentHeader.querySelector('.animation-id-display');
        if (existingIdDisplay) {
            existingIdDisplay.remove();
        }
        
        // Add animation ID to the header
        const idDisplay = document.createElement('div');
        idDisplay.className = 'animation-id-display';
        idDisplay.textContent = `Animation ID: ${animationId}`;
        idDisplay.style.cssText = 'font-size: 0.8rem; color: var(--text-muted);';
        tabContentHeader.appendChild(idDisplay);
    }
    
    // Update speed controls (only if the animation uses defaultSpeedSlider)
    const anim = window.animationsData && window.animationsData[animationType] ? window.animationsData[animationType] : null;
    const speedControlGroup = document.querySelector('.applied-animation-controls .control-group');
    
    if (anim && anim.defaultSpeedSlider !== false) {
        // Show speed controls
        speedSlider.value = animationData.speed;
        speedDisplay.textContent = `${animationData.speed}s`;
        if (speedControlGroup) {
            speedControlGroup.style.display = 'block';
        }
    } else {
        // Hide speed controls for animations that don't use defaultSpeedSlider
        if (speedControlGroup) {
            speedControlGroup.style.display = 'none';
        }
    }
    
    // Clear existing parameter controls
    paramControls.innerHTML = '';
    
    // Load animation definition and render parameters
    if (window.animationsData && window.animationsData[animationType]) {
        const anim = window.animationsData[animationType];
        if (anim.params) {
            // Create a copy of the animation parameters to work with
            const workingParams = { ...anim.params };
            
            // Override with saved parameter values if available
            if (animationData.params) {
                Object.assign(workingParams, animationData.params);
            }
            
            for (const [param, defaultValue] of Object.entries(anim.params)) {
                // Use saved parameter values if available, otherwise use defaults
                const paramValue = workingParams[param] !== undefined ? workingParams[param] : defaultValue;
                
                const controlWrapper = document.createElement("div");
                controlWrapper.className = "param-control";
                
                const label = document.createElement("label");
                label.className = "param-label";
                label.textContent = `${param}: `;
                
                const input = document.createElement("input");
                input.type = "range";
                input.className = "param-slider";
                input.dataset.param = param;
                
                // Use paramConfig if available, otherwise fall back to old logic
                if (anim.paramConfig && anim.paramConfig[param]) {
                    const config = anim.paramConfig[param];
                    input.min = config.min.toString();
                    input.max = config.max.toString();
                    input.step = config.step.toString();
                    input.value = paramValue;
                } else {
                    // Fallback to old logic for backward compatibility
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
                    } else if (param.includes("dash")) {
                        input.min = "1";
                        input.max = "50";
                        input.step = "1";
                    } else if (param.includes("gap")) {
                        input.min = "1";
                        input.max = "30";
                        input.step = "1";
                    } else {
                        // Default range
                        input.min = "0";
                        input.max = paramValue;
                        input.step = "0.1";
                    }
                    input.value = paramValue;
                }
                
                const span = document.createElement("span");
                span.className = "param-value";
                span.textContent = paramValue;
                
                controlWrapper.appendChild(label);
                controlWrapper.appendChild(input);
                controlWrapper.appendChild(span);
                paramControls.appendChild(controlWrapper);
                
                // Update the working parameters with the current value
                workingParams[param] = paramValue;
            }
            
            // Store the working parameters in the global animations object for real-time preview
            if (window.animationsData && window.animationsData[animationType]) {
                window.animationsData[animationType].params = workingParams;
            }
        }
    }
    console.log('Switching to editor tab');
    // Switch to editor tab
    controlsTab.classList.remove('active');
    editorTab.classList.add('active');
    editorTab.style.display = 'flex';
    controlsContent.classList.remove('active');
    editor.classList.add('active');

    // Show controls content
    controlsContent.style.display = 'block';

    // Hide the controls placeholder when in editor mode
    const controlsPlaceholder = document.querySelector('.controls-placeholder');
    if (controlsPlaceholder) {
        controlsPlaceholder.style.display = 'none';
    }

    // hide controls section
    hideControlsSection();

}

// Function to hide the applied animation editor
function hideAppliedAnimationEditor() {
    const editor = document.getElementById('applied-animation-editor');
    const editorTab = document.getElementById('editor-tab');
    const controlsTab = document.getElementById('controls-tab');
    const controlsContent = document.getElementById('controls-content');
    
    // Clean up animation ID display from tab header
    const tabContentHeader = document.querySelector('.tab-content-header');
    if (tabContentHeader) {
        const existingIdDisplay = tabContentHeader.querySelector('.animation-id-display');
        if (existingIdDisplay) {
            existingIdDisplay.remove();
        }
    }
    
    // Switch back to controls tab
    editorTab.classList.remove('active');
    editorTab.style.display = 'none';
    controlsTab.classList.add('active');
    controlsContent.classList.add('active');
    editor.classList.remove('active');
    
    // When returning to controls tab, we need to restore the proper state
    const controlsPlaceholder = document.querySelector('.controls-placeholder');
    const controlsSection = document.querySelector('.controls-section');
    
    // Check if there's a selected element by looking for elements with 'selected-element' class
    const selectedElement = document.querySelector('.selected-element');
    const hasSelectedElement = selectedElement !== null;
    
    
    if (hasSelectedElement) {
        // Element is selected - show controls section and hide placeholder
        if (controlsSection) {
            controlsSection.classList.remove('hidden');
        }
        if (controlsPlaceholder) {
            controlsPlaceholder.style.display = 'none';
        }
    } else {
        // No element selected - hide controls section and show placeholder
        if (controlsSection) {
            controlsSection.classList.add('hidden');
        }
        if (controlsPlaceholder) {
            controlsPlaceholder.style.display = 'block';
        }
    }
    
    currentlyEditingAnimation = null;
    
    // Remove selection from all animation items in the bottom panel
    document.querySelectorAll('.animation-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Clear any visual selection indicators in the animation list
    const animationListDiv = document.getElementById('animation-list-div');
    if (animationListDiv) {
        // Remove any selection styling from animation items
        animationListDiv.querySelectorAll('.animation-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
}

// Function to check if an element is the root SVG element
function isRootSVGElement(element) {
    return element && element.tagName && element.tagName.toLowerCase() === 'svg' && element === svgRoot;
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

// Process clipPath elements - move them from defs to consuming elements
function processClipPathElements(rootElement) {
    const defs = rootElement.querySelector('defs');
    if (!defs) return;
    
    const clipPaths = defs.querySelectorAll('clipPath');
    
    clipPaths.forEach(clipPath => {
        const clipPathId = clipPath.getAttribute('id');
        if (!clipPathId) return;
        
        // Find all elements that use this clipPath
        // We need to check both attributes and CSS styles
        let consumingElements = [];
        
        // Check all elements for clip-path in attributes
        const allElements = rootElement.querySelectorAll('*');
        allElements.forEach(element => {
            // Check clip-path attribute
            const clipPathAttr = element.getAttribute('clip-path') || element.getAttribute('clipPath');
            if (clipPathAttr && clipPathAttr.includes(clipPathId)) {
                consumingElements.push(element);
                return;
            }
            
            // Check clip-path in style attribute
            const styleAttr = element.getAttribute('style');
            if (styleAttr && styleAttr.includes('clip-path') && styleAttr.includes(clipPathId)) {
                consumingElements.push(element);
                return;
            }
            
            // Check computed style (for elements with CSS classes)
            const computedStyle = window.getComputedStyle(element);
            const clipPathStyle = computedStyle.clipPath;
            if (clipPathStyle && clipPathStyle.includes(clipPathId)) {
                consumingElements.push(element);
            }
        });
        
        consumingElements.forEach(consumingElement => {
            // Clone the clipPath and move it as the first child of the consuming element
            const clonedClipPath = clipPath.cloneNode(true);
            consumingElement.insertBefore(clonedClipPath, consumingElement.firstChild);
        });
        
        // Remove the original clipPath from defs after moving it
        clipPath.remove();
    });
}

// Populate tree view
function populateTreeView(rootElement) {
    const treeDiv = document.getElementById('element-tree');
    treeDiv.innerHTML = '';
    createTreeViewItem(treeDiv, rootElement);
}

// ✅ ENHANCED: Create tree view item with wrapper group filtering
// This function now automatically filters out anim-wrapper and wrapping-group elements
// while still showing the actual SVG elements that users care about
function createTreeViewItem(parent, element, depth = 0) {
    // Skip over <style> and <defs> tags
    if (element.tagName === 'style' || element.tagName === 'defs') {
        return;
    }

    // Skip over <linearGradient> and <use> elements
    if (element.tagName === 'linearGradient' || 
        element.tagName === 'use') {
        return;
    }

    // ✅ NEW: Handle clipPath elements specially - show them in treeview with special styling
    if (element.tagName === 'clipPath') {
        // Create a tree item for the clipPath element itself
        const hasChildren = element.children.length > 0;
        const container = hasChildren ? document.createElement('details') : document.createElement('div');
        const summary = hasChildren ? document.createElement('summary') : container;

        // Set the data-element-id attribute to match the SVG element's ID
        summary.setAttribute('data-element-id', element.id);
        summary.setAttribute('data-depth', depth);
        summary.classList.add('clippath-element'); // Add special class for styling

        // Create icon for clipPath
        const icon = '✂️'; // Scissors icon for clipPath
        
        // Create a more descriptive label with icon
        let label = `clipPath`;
        
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

        // Add click handler for clipPath elements - just clear selection, don't select clipPath itself
        summary.addEventListener('click', function(e) {
            e.stopPropagation();
            removeStyleTag();
            
            // ✅ NEW: Also clean up any clipPath shapes with temp animations
            const clipPathShapes = document.querySelectorAll('clipPath *[style*="temp-generic"]');
            clipPathShapes.forEach(shape => {
                removeTempPreviewFromClipPathShape(shape);
            });

            // Clear selection for previously selected element in SVG
            if (selectedElement && document.getElementById('selection-box')) {
                document.getElementById('selection-box').remove();
            }

            // ✅ NEW: Remove any existing handles
            removeHandles();

            // Clear highlighted treeview item
            const previouslyHighlighted = document.querySelector('.selected');
            if (previouslyHighlighted) {
                previouslyHighlighted.classList.remove('selected');
            }
            
            // Hide clipPath warning when clearing selection
            hideClipPathWarning();

            // Highlight the current treeview item (visual feedback only)
            summary.classList.add('selected');

            // Clear any existing element with 'selected-element' class
            const existingElementWithClass = document.querySelector('.selected-element');
            if (existingElementWithClass) {
                existingElementWithClass.classList.remove('selected-element');
            }

            // Don't select the clipPath element itself - just clear selection
            selectedElement = null;

            // Show controls section with clipPath message instead of hiding it
            showControlsSection();
            showClipPathElementMessage(label);
            
            // Hide root element message if it was showing
            hideRootElementMessage();
            
            updateStatusBar(`ClipPath: ${label} ✂️ (Not selectable)`);
        });

        // Process clipPath children
        if (hasChildren) {
            for (let child of element.children) {
                createTreeViewItem(container, child, depth + 1);
            }
        }
        return;
    }

    // ✅ NEW: Skip wrapper groups but process their children
    if (element.classList.contains('anim-wrapper') || 
        element.classList.contains('wrapping-group')) {
        
        // Recursively process children to find actual elements
        for (let child of element.children) {
            createTreeViewItem(parent, child, depth);
        }
        return; // Don't create a tree item for the wrapper itself
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

        // ✅ NEW: Skip regular selection for clipPath elements
        if (element.tagName === 'clipPath') {
            return; // Let the clipPath-specific handler take care of this
        }

        // Clear selection for previously selected element in SVG
        if (selectedElement && document.getElementById('selection-box')) {
            document.getElementById('selection-box').remove();
        }

        // Clear highlighted treeview item
        const previouslyHighlighted = document.querySelector('.selected');
        if (previouslyHighlighted) {
            previouslyHighlighted.classList.remove('selected');
        }
        
        // ✅ NEW: Hide clipPath warning when clearing selection
        hideClipPathWarning();

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

        // Check if the clicked element is a leaf node
        const isLeafElement = element.children.length === 0;
        let targetElement = element;

        // If it's a leaf element and the parent is not a 'wrapping-group', wrap it
        // ✅ NEW: Skip wrapping-group creation for clipPath shapes
        if (isLeafElement && !isInsideClipPath(element)) {
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

        // Check if this is the root SVG element
        if (isRootSVGElement(element)) {
            // For root SVG element, show special message and disable controls
            hideRootElementMessage(); // Clear any existing message first
            hideClipPathElementMessage(); // Clear clipPath message too
            showRootElementMessage();
            
            // Clear any existing handles and selection box from previous selection
            removeHandles();
            const existingSelectionBox = document.getElementById('selection-box');
            if (existingSelectionBox) {
                existingSelectionBox.remove();
            }
            
            // Remove selected-element class from any previously selected element
            const previouslySelected = document.querySelector('.selected-element');
            if (previouslySelected) {
                previouslySelected.classList.remove('selected-element');
            }
            
            // Don't create handles or bounding box for root element
            // Don't add selected-element class to prevent manipulation
            
            // Show controls section but with disabled controls
            showControlsSection();
            
            updateStatusBar(`Root element selected - not manipulable 🎨`);
        } else {
            // For regular elements, proceed with normal selection behavior
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

            // ✅ NEW: Use centralized left panel refresh
            refreshLeftPanel(selectedElement.id, selectedElement);
            
            updateStatusBar(`Selected: ${label} 🎯`);
        }
        
        e.stopPropagation();
    });

    // ✅ MODIFIED: Process children but filter out wrapper groups
    for (let child of element.children) {
        // Skip wrapper groups when processing children
        if (!child.classList.contains('anim-wrapper') && 
            !child.classList.contains('wrapping-group')) {
            createTreeViewItem(hasChildren ? container : summary, child, depth + 1);
        } else {
            // If it's a wrapper group, process its children directly
            for (let grandChild of child.children) {
                createTreeViewItem(hasChildren ? container : summary, grandChild, depth + 1);
            }
        }
    }
}

// Prepopulate localStorage with element IDs
function prepopulateLocalStorage(element) {
    if (!element.id) {
        element.id = generateUniqueID(); // Assigning unique ID if not present
    }

    // Only create entries for elements that actually have animations
    // Don't prepopulate empty entries anymore

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

// Initialize placeholder text click handler
function initializePlaceholderClick() {
    const svgViewer = document.getElementById('svg-viewer');
    
    // Add click handler to the SVG viewer
    svgViewer.addEventListener('click', function(e) {
        // Check if the click is on the placeholder text (when no SVG is loaded)
        const placeholderText = svgViewer.querySelector('.placeholder-text');
        if (placeholderText && (e.target === placeholderText || placeholderText.contains(e.target))) {
            e.preventDefault();
            e.stopPropagation();
            // Trigger the file upload dialog
            document.getElementById('svg-upload').click();
        }
    });
    
    // Also add direct click handler to placeholder text for better reliability
    const placeholderText = svgViewer.querySelector('.placeholder-text');
    if (placeholderText) {
        placeholderText.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Placeholder text clicked - opening file dialog');
            const fileInput = document.getElementById('svg-upload');
            if (fileInput) {
                fileInput.click();
            } else {
                console.error('svg-upload element not found');
            }
        });
        
        // Make it visually clear that it's clickable
        placeholderText.style.cursor = 'pointer';
        placeholderText.title = 'Click to upload an SVG file';
    } else {
        console.log('Placeholder text not found during initialization');
    }
}

// Show controls section when an element is selected
function showControlsSection() {
    const controlsSection = document.querySelector('.controls-section');
    const controlsPlaceholder = document.querySelector('.controls-placeholder');
    
    if (controlsSection) {
        controlsSection.classList.remove('hidden');
    }
    if (controlsPlaceholder) {
        controlsPlaceholder.classList.add('hidden');
    }
    
    // Check if the selected element is the SVG root and disable recipe controls accordingly
    if (selectedElement && isRootSVGElement(selectedElement)) {
        hideRecipeControls();
    } else {
        showRecipeControls();
    }
}

// Hide controls section when no element is selected
function hideControlsSection() {
    const controlsSection = document.querySelector('.controls-section');
    const controlsPlaceholder = document.querySelector('.controls-placeholder');
    
    if (controlsSection) {
        controlsSection.classList.add('hidden');
    }
    if (controlsPlaceholder) {
        controlsPlaceholder.classList.remove('hidden');
    }
    
    // Hide the animation count message when no element is selected
    updateAnimationCountMessage(null);
}

// Function to update existing anim-wrapper animation speed
function updateAnimationSpeed(elementId, animationId, newSpeed) {
    try {
        // Find the element by ID
        const element = document.querySelector(`#${elementId}`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            return;
        }

        // Find the anim-wrapper group that contains this element and has the specific animation
        const animWrapper = element.closest('.anim-wrapper');
        if (!animWrapper) {
            console.error(`No anim-wrapper found for element ${elementId}`);
            return;
        }

        // Get the saved animation data to find the animation name
        const savedAnimations = getSavedAnimations();
        const elementAnimations = savedAnimations.animations[elementId];
        if (!elementAnimations || !elementAnimations[animationId]) {
            console.error(`No saved animation data found for ${elementId} with ID ${animationId}`);
            return;
        }

        const animationData = elementAnimations[animationId];
        const animationName = animationData.animationName;
        if (!animationName) {
            console.error(`No animation name found for ${elementId} with ID ${animationId}`);
            return;
        }

        // Handle both old format (animationType as key) and new format (animationId as key)
        const isOldFormat = !animationData.type;
        const animationType = isOldFormat ? animationId : animationData.type;

        // Check if this anim-wrapper has the correct animation class and animation name in style
        const hasCorrectAnimation = animWrapper.classList.contains(`${animationType}-animation-class`) &&
                                   animWrapper.style.animation && 
                                   animWrapper.style.animation.includes(animationName);

        if (!hasCorrectAnimation) {
            console.error(`Anim-wrapper does not contain the expected animation ${animationName}`);
            return;
        }

        // Update the animation speed in the style attribute
        const currentAnimation = animWrapper.style.animation;
        const newAnimation = currentAnimation.replace(/(\d+(?:\.\d+)?)s/, `${newSpeed}s`);
        animWrapper.style.animation = newAnimation;

        // Update the saved data
        animationData.speed = newSpeed.toString();
        const data = getSavedAnimations();
        data.animations[elementId][animationId] = animationData;
        localStorage.setItem('svg-animations', JSON.stringify(data));

        console.log(`Updated animation speed for ${animationType} to ${newSpeed}s`);
        
    } catch (error) {
        console.error('Error updating animation speed:', error);
    }
}

// Function to count existing animations for an element
function getAnimationCount(elementId) {
    if (!elementId) return 0;
    
    const data = getSavedAnimations();
    const elementAnimations = data.animations[elementId];
    
    if (!elementAnimations) return 0;
    
    return Object.keys(elementAnimations).length;
}

// Function to update the animation count message
function updateAnimationCountMessage(elementId) {
    const messageDiv = document.getElementById('animation-count-message');
    if (!messageDiv) return;
    
    const count = getAnimationCount(elementId);
    
    // ✅ NEW: Hide animation count message for clipPath elements
    // Since clipPath elements only support one animation, don't show "You can add more!" message
    if (elementId) {
        const element = document.querySelector(`#${elementId}`);
        if (element && typeof isInsideClipPath === 'function' && isInsideClipPath(element)) {
            messageDiv.style.display = 'none';
            return;
        }
    }
    
    if (count > 0) {
        messageDiv.style.display = 'block';
        messageDiv.innerHTML = `
            <div class="animation-count-info">
                <span class="count-icon">🎭</span>
                <span class="count-text">This element already has ${count} animation${count > 1 ? 's' : ''} applied. You can add more!</span>
            </div>
        `;
        
        // Add click event listener for smooth scroll to animation list
        messageDiv.style.cursor = 'pointer';
        messageDiv.title = 'Click to scroll to applied animations';
        
        // Remove any existing event listeners to prevent duplicates
        messageDiv.removeEventListener('click', scrollToAnimationList);
        messageDiv.addEventListener('click', scrollToAnimationList);
    } else {
        messageDiv.style.display = 'none';
    }
}

// Function to smoothly scroll to the animation list
// add offset of 100px     
function scrollToAnimationList() {
    const animationList = document.querySelector('.animation-list');
    if (animationList) {
        // Get the position of the animation list
        const rect = animationList.getBoundingClientRect();
        const offset = 200; // Negative offset of 100px
        
        // Calculate the target scroll position
        const targetPosition = window.pageYOffset + rect.top - offset;
        
        // Smooth scroll to the calculated position
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Function to hide the upload section after SVG import
function hideUploadSection() {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'none';
    }
}

// Function to show the upload section (for reset functionality)
function showUploadSection() {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
    
    // Hide named destinations section when showing upload section
    const namedDestinationsSection = document.getElementById('named-destinations-section');
    if (namedDestinationsSection) {
        namedDestinationsSection.classList.add('hidden');
    }
}

// Function to show root element message and hide controls
function showRootElementMessage() {
    // Hide all control panels
    hideShapeStylingControls();
    hideAnimationControls();
    
    // Create or show the root element message
    let messageDiv = document.getElementById('root-element-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'root-element-message';
        messageDiv.className = 'root-element-message';
        messageDiv.innerHTML = `
            <div class="root-message-content">
                <div class="root-message-icon">🎨</div>
                <div class="root-message-text">
                    <div class="root-message-title">Root Element Selected</div>
                    <div class="root-message-description">The root element is not manipulable. Select a child element to apply styling or animations.</div>
                </div>
            </div>
        `;
        
        // Insert the message after the controls section
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection) {
            controlsSection.appendChild(messageDiv);
        }
    } else {
        messageDiv.style.display = 'block';
    }
}

// Function to hide root element message
function hideRootElementMessage() {
    const messageDiv = document.getElementById('root-element-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Function to show clipPath element message
function showClipPathElementMessage(clipPathLabel) {
    // Hide all control panels
    hideShapeStylingControls();
    hideAnimationControls();
    hideRecipeControls();
    
    // Create or show the clipPath element message
    let messageDiv = document.getElementById('clippath-element-message');
    if (!messageDiv) {
        messageDiv = document.createElement('div');
        messageDiv.id = 'clippath-element-message';
        messageDiv.className = 'clippath-element-message';
        messageDiv.innerHTML = `
            <div class="clippath-message-content">
                <div class="clippath-message-icon">✂️</div>
                <div class="clippath-message-text">
                    <div class="clippath-message-title">ClipPath Element Selected</div>
                    <div class="clippath-message-description">ClipPath elements define clipping regions but have no geometry themselves. To manipulate the clipping shape, select the geometric elements (rect, circle, path, etc.) inside this clipPath.</div>
                </div>
            </div>
        `;
        
        // Insert the message after the controls section
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection) {
            controlsSection.appendChild(messageDiv);
        }
    } else {
        messageDiv.style.display = 'block';
    }
}

// Function to hide clipPath element message
function hideClipPathElementMessage() {
    const messageDiv = document.getElementById('clippath-element-message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// Function to hide animation controls
function hideAnimationControls() {
    const animationType = document.getElementById('animation-type');
    const speedControlGroup = document.getElementById('speed-control-group');
    const animationParamPanel = document.getElementById('animation-param-panel');
    const applyButton = document.getElementById('apply-animation');
    
    if (animationType) animationType.disabled = true;
    if (speedControlGroup) speedControlGroup.style.display = 'none';
    if (animationParamPanel) animationParamPanel.style.display = 'none';
    if (applyButton) applyButton.disabled = true;
}

// Initialize upload button functionality
function initializeUploadButton() {
    const uploadBtn = document.getElementById('upload-svg-btn');
    const fileInput = document.getElementById('svg-upload');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
    }
}

// Export functions for use in other modules
window.populateAnimationDropdown = populateAnimationDropdown;
window.updateAnimationListUI = updateAnimationListUI;
window.refreshLeftPanel = refreshLeftPanel;
window.populateTreeView = populateTreeView;
window.createTreeViewItem = createTreeViewItem;
window.prepopulateLocalStorage = prepopulateLocalStorage;
window.initializeDragAndDrop = initializeDragAndDrop;
window.initializePlaceholderClick = initializePlaceholderClick;
window.showControlsSection = showControlsSection;
window.hideControlsSection = hideControlsSection;
window.updateAnimationSpeed = updateAnimationSpeed;
window.getAnimationCount = getAnimationCount;
window.updateAnimationCountMessage = updateAnimationCountMessage;
window.hideUploadSection = hideUploadSection;
window.showUploadSection = showUploadSection;
window.initializeUploadButton = initializeUploadButton;
window.isRootSVGElement = isRootSVGElement;
// Function to show clipPath warning
function showClipPathWarning(element) {
    // Remove any existing clipPath warning
    hideClipPathWarning();
    
    // Hide clipPath element message when showing warning for elements inside clipPath
    hideClipPathElementMessage();
    
    if (!isInsideClipPath(element)) {
        return; // Not inside clipPath, no warning needed
    }
    
    // Check if element already has an animation
    const hasAnimation = element.style.animation && element.style.animation.trim() !== '';
    
    // ✅ NEW: Disable animation dropdown if clipPath element already has an animation
    const animationDropdown = document.getElementById('animation-type');
    if (animationDropdown) {
        animationDropdown.disabled = hasAnimation;
    }
    
    // Create warning message
    const warningDiv = document.createElement('div');
    warningDiv.id = 'clippath-warning';
    warningDiv.className = 'clippath-warning';
    warningDiv.innerHTML = `
        <div class="warning-icon">⚠️</div>
        <div class="warning-content">
            <div class="warning-title">ClipPath Shape Selected</div>
            <div class="warning-text">
                ${hasAnimation ? 
                    'This clipPath shape already has an animation. Only one animation per clipPath shape is supported.' : 
                    'ClipPath shapes have limited animation support. Only geometry-based animations are available (no filter-based animations), and only one animation per shape.'
                }
            </div>
        </div>
    `;
    
    // Insert warning after animation count message
    const animationCountMessage = document.getElementById('animation-count-message');
    if (animationCountMessage) {
        animationCountMessage.parentNode.insertBefore(warningDiv, animationCountMessage.nextSibling);
    } else {
        // Insert at the beginning of controls section
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection) {
            controlsSection.insertBefore(warningDiv, controlsSection.firstChild);
        }
    }
    
    // Disable animation dropdown if already has animation
    if (hasAnimation) {
        const animationDropdown = document.getElementById('animation-type');
        if (animationDropdown) {
            animationDropdown.disabled = true;
            animationDropdown.title = 'ClipPath shapes with existing animations cannot have additional animations applied';
        }
    } else {
        // ✅ NEW: Repopulate dropdown with only geometry-based animations
        populateAnimationDropdown(true); // Filter for clipPath
        
        // Enable animation dropdown for clipPath shapes
        const animationDropdown = document.getElementById('animation-type');
        if (animationDropdown) {
            animationDropdown.disabled = false;
            animationDropdown.title = 'Only geometry-based animations are available for clipPath shapes';
        }
    }
    
    // ✅ NEW: Disable recipe and styling controls for clipPath shapes
    hideRecipeControls();
    showShapeStylingControls(); // Show styling controls
    disableStylingControls(); // But disable them
    showUnsupportedFillMessage('ClipPath shapes cannot be styled');
}

// Function to hide clipPath warning
function hideClipPathWarning() {
    const warningDiv = document.getElementById('clippath-warning');
    if (warningDiv) {
        warningDiv.remove();
    }
    
    // ✅ NEW: Re-enable animation dropdown when hiding clipPath warning
    // This ensures the dropdown is enabled when switching away from clipPath elements
    const animationDropdown = document.getElementById('animation-type');
    if (animationDropdown) {
        animationDropdown.disabled = false;
    }
    
    // ✅ NEW: Repopulate dropdown with all animations (no filter)
    populateAnimationDropdown(false); // Show all animations
    
    // Clear any tooltip
    if (animationDropdown) {
        animationDropdown.title = '';
    }
    
    // ✅ NEW: Show recipe and styling controls again for regular elements
    showRecipeControls();
    showShapeStylingControls();
    enableStylingControls(); // Re-enable styling controls
    
    // Only clear unsupported fill message if we're not dealing with group/image elements
    // This prevents clearing group/image messages when hiding clipPath warnings
    const currentMessage = document.getElementById('unsupported-fill-message');
    if (currentMessage) {
        const messageText = currentMessage.textContent;
        if (!messageText.includes('Group elements cannot be styled') && 
            !messageText.includes('Image elements cannot be styled')) {
            clearUnsupportedFillMessage();
        }
    } else {
        clearUnsupportedFillMessage(); // Safe to clear if no message exists
    }
}

// Function to show recipe controls
function showRecipeControls() {
    const recipeSelector = document.getElementById('recipe-selector');
    const createRecipeBtn = document.getElementById('create-recipe-btn');
    const manageRecipesLink = document.getElementById('manage-recipes-link');
    
    if (recipeSelector) {
        recipeSelector.disabled = false;
    }
    if (createRecipeBtn) {
        createRecipeBtn.disabled = false;
    }
    if (manageRecipesLink) {
        manageRecipesLink.style.pointerEvents = 'auto';
        manageRecipesLink.style.opacity = '1';
    }
}

// Function to hide recipe controls
function hideRecipeControls() {
    const recipeSelector = document.getElementById('recipe-selector');
    const createRecipeBtn = document.getElementById('create-recipe-btn');
    const manageRecipesLink = document.getElementById('manage-recipes-link');
    
    if (recipeSelector) {
        recipeSelector.disabled = true;
    }
    if (createRecipeBtn) {
        createRecipeBtn.disabled = true;
    }
    if (manageRecipesLink) {
        manageRecipesLink.style.pointerEvents = 'none';
        manageRecipesLink.style.opacity = '0.5';
    }
}

window.showRootElementMessage = showRootElementMessage;
window.hideRootElementMessage = hideRootElementMessage;
window.showClipPathElementMessage = showClipPathElementMessage;
window.hideClipPathElementMessage = hideClipPathElementMessage;
window.hideAnimationControls = hideAnimationControls;
window.hideAppliedAnimationEditor = hideAppliedAnimationEditor;
window.showRecipeControls = showRecipeControls;
window.hideRecipeControls = hideRecipeControls;
window.showAppliedAnimationEditor = showAppliedAnimationEditor;
window.selectAnimationForEditing = selectAnimationForEditing;
window.showClipPathWarning = showClipPathWarning;
window.hideClipPathWarning = hideClipPathWarning;
window.isInsideClipPath = isInsideClipPath;
window.processClipPathElements = processClipPathElements;
