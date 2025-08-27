// Fabric.js integration for SVG manipulation
// SVG Animator Pro - Fabric Manager Module

let fabricCanvas;
let svgObjects = new Map(); // Map to store Fabric objects with their original IDs
let isInitialized = false;

// Initialize Fabric.js canvas
function initializeFabricCanvas() {
    if (isInitialized) return;
    
    const canvasElement = document.getElementById('fabric-canvas');
    if (!canvasElement) {
        console.error('Canvas element not found');
        return;
    }
    
    // Create Fabric.js canvas
    fabricCanvas = new fabric.Canvas('fabric-canvas', {
        selection: true,
        preserveObjectStacking: true,
        backgroundColor: '#ffffff'
    });
    
    // Configure canvas behavior
    fabricCanvas.selection = true;
    fabricCanvas.defaultCursor = 'default';
    fabricCanvas.selectionColor = 'rgba(99, 102, 241, 0.3)';
    fabricCanvas.selectionBorderColor = '#6366f1';
    fabricCanvas.selectionLineWidth = 2;
    
    // Enable proportional scaling by default
    fabricCanvas.uniformScaling = true;
    
    // Add zoom and pan functionality
    fabricCanvas.on('mouse:wheel', function(opt) {
        const delta = opt.e.deltaY;
        let zoom = fabricCanvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });
    
    // Add event listeners
    setupFabricEventListeners();
    
    // Make canvas focusable for keyboard events
    fabricCanvas.wrapperEl.setAttribute('tabindex', '0');
    fabricCanvas.wrapperEl.style.outline = 'none';
    
    isInitialized = true;
    console.log('Fabric.js canvas initialized');
}

// Setup Fabric.js event listeners
function setupFabricEventListeners() {
    // Selection events
    fabricCanvas.on('selection:created', function(e) {
        const selectedObjects = e.selected;
        if (selectedObjects.length === 1) {
            const fabricObj = selectedObjects[0];
            const elementId = fabricObj.elementId;
            if (elementId) {
                selectElementInTree(elementId);
                
                // Enable animation controls
                document.getElementById('animation-type').disabled = false;
                document.getElementById('speed-slider').disabled = false;
                document.getElementById('apply-animation').disabled = false;
            }
        }
    });
    
    fabricCanvas.on('selection:cleared', function() {
        // Clear tree selection when canvas selection is cleared
        clearTreeSelection();
        
        // Disable animation controls
        document.getElementById('animation-type').disabled = true;
        document.getElementById('speed-slider').disabled = true;
        document.getElementById('apply-animation').disabled = true;
    });
    
    // Object modification events
    fabricCanvas.on('object:modified', function(e) {
        const fabricObj = e.target;
        if (fabricObj.elementId) {
            updateElementInTree(fabricObj);
        }
    });
    
    // Mouse events for better UX
    fabricCanvas.on('mouse:down', function(e) {
        if (e.target) {
            fabricCanvas.defaultCursor = 'move';
        }
    });
    
    fabricCanvas.on('mouseup', function(e) {
        fabricCanvas.defaultCursor = 'default';
    });
    
    // Add click event for individual object selection
    fabricCanvas.on('mouse:down', function(e) {
        if (e.target && e.target !== fabricCanvas.getActiveGroup()) {
            // If clicking on an individual object, select it
            fabricCanvas.discardActiveObject();
            fabricCanvas.setActiveObject(e.target);
            fabricCanvas.requestRenderAll();
            
            // Update tree selection
            if (e.target.elementId) {
                selectElementInTree(e.target.elementId);
                
                // Enable animation controls
                document.getElementById('animation-type').disabled = false;
                document.getElementById('speed-slider').disabled = false;
                document.getElementById('apply-animation').disabled = false;
            }
        }
    });
    
    // Keyboard shortcuts for better UX
    fabricCanvas.on('key:down', function(e) {
        switch(e.key) {
            case 'Delete':
            case 'Backspace':
                const activeObjects = fabricCanvas.getActiveObjects();
                if (activeObjects.length > 0) {
                    activeObjects.forEach(obj => fabricCanvas.remove(obj));
                    fabricCanvas.requestRenderAll();
                }
                break;
            case 'Escape':
                fabricCanvas.discardActiveObject();
                fabricCanvas.requestRenderAll();
                break;
        }
    });
}

// Load SVG into Fabric.js canvas
async function loadSVGToFabric(svgData) {
    if (!isInitialized) {
        initializeFabricCanvas();
    }
    
    // Clear existing content
    fabricCanvas.clear();
    svgObjects.clear();
    
    try {
        // Parse SVG string
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        if (svgElement.tagName !== 'svg') {
            throw new Error('Invalid SVG content');
        }
        
        // Get SVG dimensions
        const viewBox = svgElement.getAttribute('viewBox');
        let width = parseInt(svgElement.getAttribute('width')) || 800;
        let height = parseInt(svgElement.getAttribute('height')) || 600;
        
        if (viewBox) {
            const viewBoxParts = viewBox.split(' ').map(Number);
            if (viewBoxParts.length === 4) {
                width = viewBoxParts[2];
                height = viewBoxParts[3];
            }
        }
        
        // Set canvas dimensions
        fabricCanvas.setDimensions({
            width: Math.min(width, 800),
            height: Math.min(height, 600)
        });
        
        // Load SVG into Fabric.js
        fabric.loadSVGFromString(svgData, function(objects, options) {
            // Add objects individually to the canvas for proper selection
            objects.forEach((fabricObj, index) => {
                // Generate unique ID if none exists
                if (!fabricObj.elementId) {
                    fabricObj.elementId = `element_${index}`;
                }
                
                // Store reference
                svgObjects.set(fabricObj.elementId, fabricObj);
                
                // Make object selectable and interactive
                fabricObj.selectable = true;
                fabricObj.evented = true;
                
                // Add hover effect
                fabricObj.on('mouseover', function() {
                    fabricCanvas.defaultCursor = 'pointer';
                });
                
                fabricObj.on('mouseout', function() {
                    fabricCanvas.defaultCursor = 'default';
                });
                
                // Add to canvas
                fabricCanvas.add(fabricObj);
            });
            
            // Center all objects
            if (objects.length > 0) {
                const allObjects = fabricCanvas.getObjects();
                const group = new fabric.Group(allObjects, {
                    left: 0,
                    top: 0,
                    originX: 'left',
                    originY: 'top'
                });
                
                // Remove individual objects and add the group for positioning
                fabricCanvas.clear();
                fabricCanvas.add(group);
                fabricCanvas.centerObject(group);
                
                // Now ungroup and add objects back individually
                const ungroupedObjects = group.getObjects();
                group.removeWithUpdate();
                
                ungroupedObjects.forEach(obj => {
                    fabricCanvas.add(obj);
                });
                
                // Center the canvas view
                fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
                fabricCanvas.requestRenderAll();
            }
            
            // Process individual objects for selection
            processSVGObjects(objects, svgElement);
            
            // Render canvas
            fabricCanvas.renderAll();
            
            // Hide placeholder
            const placeholder = document.getElementById('placeholder-content');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
            
            console.log('SVG loaded into Fabric.js successfully');
        });
        
    } catch (error) {
        console.error('Error loading SVG to Fabric.js:', error);
        throw error;
    }
}

// Process SVG objects and make them individually selectable
function processSVGObjects(fabricObjects, svgElement) {
    // Since we're now adding objects individually to the canvas,
    // we just need to ensure they have proper IDs and references
    fabricObjects.forEach((fabricObj, index) => {
        // Generate unique ID if none exists
        if (!fabricObj.elementId) {
            fabricObj.elementId = `element_${index}`;
        }
        
        // Store reference (this is now done in loadSVGToFabric)
        // svgObjects.set(fabricObj.elementId, fabricObj);
        
        // Objects are already made selectable in loadSVGToFabric
        // fabricObj.selectable = true;
        // fabricObj.evented = true;
        
        // Add hover effect (already done in loadSVGToFabric)
        // fabricObj.on('mouseover', function() {
        //     fabricCanvas.defaultCursor = 'pointer';
        // });
        
        // fabricObj.on('mouseout', function() {
        //     fabricCanvas.defaultCursor = 'default';
        // });
    });
}

// Select element by ID
function selectElementById(elementId) {
    console.log('Attempting to select element by ID:', elementId);
    const fabricObj = svgObjects.get(elementId);
    if (fabricObj) {
        console.log('Found Fabric object:', fabricObj);
        fabricCanvas.discardActiveObject();
        fabricCanvas.setActiveObject(fabricObj);
        fabricCanvas.requestRenderAll();
        return true;
    }
    
    console.log('Element not found in svgObjects:', elementId);
    console.log('Available objects:', Array.from(svgObjects.keys()));
    return false;
}

// Get selected objects
function getSelectedObjects() {
    return fabricCanvas.getActiveObjects();
}

// Get selected object IDs
function getSelectedObjectIds() {
    const selected = fabricCanvas.getActiveObjects();
    return selected.map(obj => obj.elementId).filter(Boolean);
}

// Clear selection
function clearSelection() {
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
}

// Export SVG from Fabric.js
function exportSVGFromFabric() {
    if (!fabricCanvas) return null;
    
    // Get SVG string from Fabric.js
    const svgString = fabricCanvas.toSVG({
        encoding: 'UTF-8',
        suppressPreamble: false
    });
    
    return svgString;
}

// Update canvas size
function resizeCanvas(width, height) {
    if (fabricCanvas) {
        fabricCanvas.setDimensions({
            width: width,
            height: height
        });
        fabricCanvas.renderAll();
    }
}

// Get canvas instance
function getCanvas() {
    return fabricCanvas;
}

// Check if canvas is initialized
function isCanvasInitialized() {
    return isInitialized;
}

// Clear canvas
function clearCanvas() {
    if (fabricCanvas) {
        fabricCanvas.clear();
        svgObjects.clear();
        fabricCanvas.renderAll();
        
        // Show placeholder
        const placeholder = document.getElementById('placeholder-content');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
    }
}

// Apply animation to Fabric.js object
function applyAnimationToFabricObject(elementId, animationType, speed) {
    const fabricObj = svgObjects.get(elementId);
    if (!fabricObj) {
        console.error('Fabric object not found for element:', elementId);
        return false;
    }
    
    // Find the corresponding DOM element
    const domElement = document.getElementById(elementId);
    if (!domElement) {
        console.error('DOM element not found for element:', elementId);
        return false;
    }
    
    // Apply animation to the DOM element (this will be reflected in Fabric.js)
    if (typeof applyAnimation === 'function') {
        applyAnimation(domElement, speed, animationType, true);
        
        // Update Fabric.js object to reflect the animation
        fabricCanvas.requestRenderAll();
        return true;
    }
    
    return false;
}

// Get the currently selected Fabric.js object
function getCurrentSelectedObject() {
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject && activeObject.elementId) {
        return activeObject;
    }
    return null;
}

// Helper function to select element in tree view
function selectElementInTree(elementId) {
    console.log('Selecting element in tree:', elementId);
    
    // Find the corresponding element in the tree view
    let summaryElement = document.querySelector(`summary[data-element-id="${elementId}"]`);
    
    if (!summaryElement) {
        summaryElement = document.querySelector(`div[data-element-id="${elementId}"]`);
    }

    if (summaryElement) {
        console.log('Found tree element:', summaryElement);
        
        // Expand all parent details elements
        let parentDetail = summaryElement.parentElement;
        while (parentDetail && parentDetail.tagName.toLowerCase() === 'details') {
            parentDetail.open = true;
            parentDetail = parentDetail.parentElement;
        }

        // Scroll into view and highlight
        summaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        summaryElement.classList.add('selected-in-tree');
        
        // Remove highlight from other elements
        document.querySelectorAll('.selected-in-tree').forEach(el => {
            if (el !== summaryElement) {
                el.classList.remove('selected-in-tree');
            }
        });
        
        console.log('Element selected in tree successfully');
    } else {
        console.log('Tree element not found for:', elementId);
        console.log('Available tree elements:', document.querySelectorAll('[data-element-id]'));
    }
}

// Helper function to clear tree selection
function clearTreeSelection() {
    document.querySelectorAll('.selected-in-tree').forEach(el => {
        el.classList.remove('selected-in-tree');
    });
}

// Helper function to update element in tree
function updateElementInTree(fabricObj) {
    // This function can be used to update tree view when objects are modified
    // For now, we'll just log the modification
    console.log('Element modified:', fabricObj.elementId, fabricObj);
}

// Export functions for use in other modules
window.initializeFabricCanvas = initializeFabricCanvas;
window.loadSVGToFabric = loadSVGToFabric;
window.selectElementById = selectElementById;
window.getSelectedObjects = getSelectedObjects;
window.getSelectedObjectIds = getSelectedObjectIds;
window.clearSelection = clearSelection;
window.exportSVGFromFabric = exportSVGFromFabric;
window.resizeCanvas = resizeCanvas;
window.getCanvas = getCanvas;
window.isCanvasInitialized = isCanvasInitialized;
window.clearCanvas = clearCanvas;
window.applyAnimationToFabricObject = applyAnimationToFabricObject;
window.getCurrentSelectedObject = getCurrentSelectedObject;
