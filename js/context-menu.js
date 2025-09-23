// Context Menu functionality for SVG Animator Pro
// Handles right-click context menu with animation options

let contextMenu = null;
let animationSubmenu = null;
let recipeSubmenu = null;
let currentTargetElement = null;
let submenuTimeout = null;

// Initialize context menu functionality
function initializeContextMenu() {
    contextMenu = document.getElementById('context-menu');
    animationSubmenu = document.getElementById('animation-submenu');
    recipeSubmenu = document.getElementById('recipe-submenu');
    
    if (!contextMenu || !animationSubmenu || !recipeSubmenu) {
        console.error('Context menu elements not found');
        return;
    }
    
    // Populate animation and recipe submenus
    populateAnimationSubmenu();
    populateRecipeSubmenu();
    
    // Add event listeners
    setupContextMenuEventListeners();
    
    console.log('Context menu initialized');
}

// Populate the animation submenu with available animations
function populateAnimationSubmenu() {
    if (!animationSubmenu || !window.animationsData) {
        return;
    }
    
    // Clear existing items
    animationSubmenu.innerHTML = '';
    
    // Add animation items
    Object.keys(window.animationsData).forEach(animationName => {
        const animationData = window.animationsData[animationName];
        const item = document.createElement('div');
        item.className = 'context-submenu-item';
        item.textContent = animationName;
        item.dataset.animation = animationName;
        
        // Add click handler
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            applyAnimationFromContextMenu(animationName);
            hideContextMenu();
        });
        
        animationSubmenu.appendChild(item);
    });
}

// Populate the recipe submenu with available recipes
function populateRecipeSubmenu() {
    if (!recipeSubmenu || !window.getSavedRecipes) {
        return;
    }
    
    // Clear existing items
    recipeSubmenu.innerHTML = '';
    
    const recipes = window.getSavedRecipes();
    const recipeNames = Object.keys(recipes).sort();
    
    if (recipeNames.length === 0) {
        const item = document.createElement('div');
        item.className = 'context-submenu-item context-submenu-item-disabled';
        item.textContent = 'No recipes available';
        recipeSubmenu.appendChild(item);
        return;
    }
    
    // Add recipe items
    recipeNames.forEach(recipeName => {
        const recipe = recipes[recipeName];
        const item = document.createElement('div');
        item.className = 'context-submenu-item';
        item.textContent = recipeName;
        item.dataset.recipe = recipeName;
        
        // Add click handler
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            applyRecipeFromContextMenu(recipeName);
            hideContextMenu();
        });
        
        recipeSubmenu.appendChild(item);
    });
}

// Setup event listeners for context menu
function setupContextMenuEventListeners() {
    // Right-click on SVG elements
    document.addEventListener('contextmenu', handleRightClick);
    
    // Click outside to close
    document.addEventListener('click', handleClickOutside);
    
    // Escape key to close
    document.addEventListener('keydown', handleKeyDown);
    
    // Scroll event to keep menu in position
    window.addEventListener('scroll', handleScroll);
    
    // Hover over "Add animation" to show submenu
    const addAnimationItem = contextMenu.querySelector('[data-action="add-animation"]');
    if (addAnimationItem) {
        addAnimationItem.addEventListener('mouseenter', showAnimationSubmenu);
        addAnimationItem.addEventListener('mouseleave', hideAnimationSubmenu);
    }
    
    // Hover over "Apply a recipe" to show submenu
    const applyRecipeItem = contextMenu.querySelector('[data-action="apply-recipe"]');
    if (applyRecipeItem) {
        applyRecipeItem.addEventListener('mouseenter', showRecipeSubmenu);
        applyRecipeItem.addEventListener('mouseleave', hideRecipeSubmenu);
    }
    
    // Click on "New rail from shape"
    const newRailItem = contextMenu.querySelector('[data-action="new-rail"]');
    if (newRailItem) {
        newRailItem.addEventListener('click', (e) => {
            e.stopPropagation();
            handleNewRailFromShape();
        });
    }
    
    // Prevent context menu from closing when hovering over submenus
    animationSubmenu.addEventListener('mouseenter', () => {
        if (submenuTimeout) {
            clearTimeout(submenuTimeout);
            submenuTimeout = null;
        }
    });
    
    animationSubmenu.addEventListener('mouseleave', hideAnimationSubmenu);
    
    recipeSubmenu.addEventListener('mouseenter', () => {
        if (submenuTimeout) {
            clearTimeout(submenuTimeout);
            submenuTimeout = null;
        }
    });
    
    recipeSubmenu.addEventListener('mouseleave', hideRecipeSubmenu);
}

// Handle right-click events
function handleRightClick(event) {
    // Check if the click is on an SVG element
    const svgElement = event.target.closest('svg');
    if (!svgElement) {
        return;
    }
    
    // Check if the click is on a selectable SVG element (not the root SVG)
    let targetElement = event.target;
    if (targetElement === svgElement || targetElement.tagName === 'svg') {
        return;
    }
    
    // Check if we clicked on a selection handle - if so, find the actual element
    if (targetElement.classList.contains('middle-handle') || 
        targetElement.classList.contains('corner-handle') ||
        targetElement.classList.contains('edge-handle') ||
        targetElement.classList.contains('rotation-handle')) {
        
        // Try to get the currently selected element from the application
        if (typeof selectedElement !== 'undefined' && selectedElement) {
            console.log('Using selectedElement from application:', selectedElement);
            targetElement = selectedElement;
        } else {
            // Fallback: try to find the original element by looking for elements with similar IDs
            const elementId = targetElement.id;
            if (elementId) {
                // Try to find the original element by looking for elements with similar IDs
                const possibleElements = svgElement.querySelectorAll('*[id*="' + elementId.split('-')[0] + '"]');
                for (let elem of possibleElements) {
                    if (!elem.classList.contains('middle-handle') && 
                        !elem.classList.contains('corner-handle') &&
                        !elem.classList.contains('edge-handle') &&
                        !elem.classList.contains('rotation-handle')) {
                        targetElement = elem;
                        break;
                    }
                }
            }
        }
    }
    
    // Prevent default context menu
    event.preventDefault();
    
    // Store the target element
    currentTargetElement = targetElement;
    console.log('Right-click on element:', targetElement);
    console.log('currentTargetElement set to:', currentTargetElement);
    
    // Update context menu based on element type
    updateContextMenuForElement(targetElement);
    
    // Show context menu
    showContextMenu(event.clientX, event.clientY);
}

// Show context menu at specified position
function showContextMenu(x, y) {
    if (!contextMenu) return;
    
    // Get the SVG viewer container
    const svgViewer = document.getElementById('svg-viewer');
    if (!svgViewer) return;
    
    // Move context menu to SVG viewer if not already there
    if (contextMenu.parentNode !== svgViewer) {
        svgViewer.appendChild(contextMenu);
    }
    
    const svgViewerRect = svgViewer.getBoundingClientRect();
    
    // Calculate position relative to the SVG viewer
    const relativeX = x - svgViewerRect.left;
    const relativeY = y - svgViewerRect.top;
    
    // Position the menu relative to the SVG viewer
    contextMenu.style.left = `${relativeX}px`;
    contextMenu.style.top = `${relativeY}px`;
    
    // Show the menu
    contextMenu.classList.remove('hidden');
    
    // Hide submenus initially
    animationSubmenu.classList.add('hidden');
    recipeSubmenu.classList.add('hidden');
    
    // Adjust position if menu would go outside the SVG viewer
    const menuRect = contextMenu.getBoundingClientRect();
    const svgViewerWidth = svgViewerRect.width;
    const svgViewerHeight = svgViewerRect.height;
    
    // Adjust horizontal position if needed
    if (relativeX + menuRect.width > svgViewerWidth) {
        contextMenu.style.left = `${relativeX - menuRect.width}px`;
    }
    
    // Adjust vertical position if needed
    if (relativeY + menuRect.height > svgViewerHeight) {
        contextMenu.style.top = `${relativeY - menuRect.height}px`;
    }
    
    // Store the initial position for scroll handling
    contextMenu.dataset.initialX = contextMenu.style.left;
    contextMenu.dataset.initialY = contextMenu.style.top;
}

// Hide context menu
function hideContextMenu() {
    if (!contextMenu) return;
    
    contextMenu.classList.add('hidden');
    animationSubmenu.classList.add('hidden');
    recipeSubmenu.classList.add('hidden');
    currentTargetElement = null;
    
    // Clean up stored position data
    delete contextMenu.dataset.initialX;
    delete contextMenu.dataset.initialY;
    
    if (submenuTimeout) {
        clearTimeout(submenuTimeout);
        submenuTimeout = null;
    }
}

// Show animation submenu
function showAnimationSubmenu() {
    if (!animationSubmenu) return;
    
    animationSubmenu.classList.remove('hidden');
    
    // Clear any existing timeout
    if (submenuTimeout) {
        clearTimeout(submenuTimeout);
        submenuTimeout = null;
    }
}

// Hide animation submenu with delay
function hideAnimationSubmenu() {
    if (!animationSubmenu) return;
    
    submenuTimeout = setTimeout(() => {
        animationSubmenu.classList.add('hidden');
    }, 150); // Small delay to prevent flickering
}

// Show recipe submenu
function showRecipeSubmenu() {
    if (!recipeSubmenu) return;
    
    // Hide animation submenu when showing recipe submenu
    animationSubmenu.classList.add('hidden');
    
    recipeSubmenu.classList.remove('hidden');
    
    // Clear any existing timeout
    if (submenuTimeout) {
        clearTimeout(submenuTimeout);
        submenuTimeout = null;
    }
}

// Hide recipe submenu with delay
function hideRecipeSubmenu() {
    if (!recipeSubmenu) return;
    
    submenuTimeout = setTimeout(() => {
        recipeSubmenu.classList.add('hidden');
    }, 150); // Small delay to prevent flickering
}

// Handle clicks outside the context menu
function handleClickOutside(event) {
    if (!contextMenu || contextMenu.classList.contains('hidden')) {
        return;
    }
    
    // Check if click is outside the context menu and submenus
    const isClickInsideMenu = contextMenu.contains(event.target) || 
                             animationSubmenu.contains(event.target) ||
                             recipeSubmenu.contains(event.target);
    
    if (!isClickInsideMenu) {
        hideContextMenu();
    }
}

// Handle keyboard events
function handleKeyDown(event) {
    if (!contextMenu || contextMenu.classList.contains('hidden')) {
        return;
    }
    
    // Escape key closes the context menu
    if (event.key === 'Escape') {
        hideContextMenu();
    }
}

// Handle scroll events to keep menu in position
function handleScroll() {
    if (!contextMenu || contextMenu.classList.contains('hidden')) {
        return;
    }
    
    // Restore the menu to its original position
    const initialX = contextMenu.dataset.initialX;
    const initialY = contextMenu.dataset.initialY;
    
    if (initialX && initialY) {
        contextMenu.style.left = initialX;
        contextMenu.style.top = initialY;
    }
}

// Apply animation from context menu
function applyAnimationFromContextMenu(animationName) {
    if (!currentTargetElement) {
        console.error('No target element for animation');
        return;
    }
    
    // Get default speed for the animation
    const animationData = window.animationsData[animationName];
    const defaultSpeed = animationData?.defaultSpeed || '1.0';
    
    // Apply the animation using the existing applyAnimation function
    if (typeof applyAnimation === 'function') {
        try {
            applyAnimation(currentTargetElement, defaultSpeed, animationName, true);
            console.log(`Applied animation "${animationName}" to element`);
        } catch (error) {
            console.error('Error applying animation:', error);
            showNotification(`Error applying animation: ${error.message}`, 'error');
        }
    } else {
        console.error('applyAnimation function not available');
        showNotification('Animation system not available', 'error');
    }
}

// Apply recipe from context menu
function applyRecipeFromContextMenu(recipeName) {
    if (!currentTargetElement) {
        console.error('No target element for recipe application');
        return;
    }
    
    // Ensure the element has an ID - create one if it doesn't exist
    let elementId = currentTargetElement.id;
    if (!elementId) {
        // Generate a unique ID for the element
        elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        currentTargetElement.id = elementId;
    }
    
    // Apply the recipe using the existing applyRecipeToElement function
    if (typeof window.applyRecipeToElement === 'function') {
        try {
            const result = window.applyRecipeToElement(elementId, recipeName);
            
            if (result.success) {
                console.log(`Applied recipe "${recipeName}" to element`);
                if (typeof showNotification === 'function') {
                    showNotification(`🧪 Recipe "${recipeName}" applied successfully!`, 'success');
                }
            } else {
                console.error('Error applying recipe:', result.error);
                if (typeof showNotification === 'function') {
                    showNotification(`Error applying recipe: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error applying recipe:', error);
            if (typeof showNotification === 'function') {
                showNotification(`Error applying recipe: ${error.message}`, 'error');
            }
        }
    } else {
        console.error('applyRecipeToElement function not available');
        if (typeof showNotification === 'function') {
            showNotification('Recipe system not available', 'error');
        }
    }
}

// Re-initialize context menu when SVG content changes
function reinitializeContextMenu() {
    // Re-populate animation and recipe submenus in case data changed
    populateAnimationSubmenu();
    populateRecipeSubmenu();
}

// Update context menu recipe submenu (called when recipes change)
function updateContextMenuRecipeSubmenu() {
    if (recipeSubmenu) {
        populateRecipeSubmenu();
    }
}

// Update context menu based on element type
function updateContextMenuForElement(element) {
    const newRailItem = document.getElementById('new-rail-item');
    if (!newRailItem) return;
    
    // Check if element can be used as a rail (path or shape elements, not groups or clipPaths)
    const canBeRail = canElementBeRail(element);
    
    if (canBeRail) {
        newRailItem.classList.remove('context-menu-item-disabled');
        newRailItem.style.opacity = '1';
        newRailItem.style.cursor = 'pointer';
    } else {
        newRailItem.classList.add('context-menu-item-disabled');
        newRailItem.style.opacity = '0.5';
        newRailItem.style.cursor = 'not-allowed';
    }
}

// Check if an element can be used as a rail
function canElementBeRail(element) {
    const tagName = element.tagName.toLowerCase();
    
    // Allow path and shape elements
    const validElements = ['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect'];
    
    // Disallow groups and clipPaths
    const invalidElements = ['g', 'clippath', 'defs', 'svg'];
    
    return validElements.includes(tagName) && !invalidElements.includes(tagName);
}

// Handle new rail from shape action
function handleNewRailFromShape() {
    console.log('handleNewRailFromShape called');
    console.log('currentTargetElement:', currentTargetElement);
    
    if (!currentTargetElement) {
        console.error('No target element for rail creation');
        return;
    }
    
    // Validate element can be used as rail
    if (!canElementBeRail(currentTargetElement)) {
        console.log('Element cannot be used as rail:', currentTargetElement);
        showNotification('Selected element cannot be used as a rail. Please select a path or shape element.', 'error');
        return;
    }
    
    console.log('Element validated for rail creation:', currentTargetElement);
    
    // Store the element before hiding the context menu
    const elementForRail = currentTargetElement;
    
    // Hide context menu
    hideContextMenu();
    
    // Show rails overlay
    if (typeof showRailsOverlay === 'function') {
        console.log('Calling showRailsOverlay with element:', elementForRail);
        showRailsOverlay(elementForRail);
    } else {
        console.error('showRailsOverlay function not available');
        showNotification('Rails system not available', 'error');
    }
}

// Export functions for global access
window.initializeContextMenu = initializeContextMenu;
window.reinitializeContextMenu = reinitializeContextMenu;
window.updateContextMenuRecipeSubmenu = updateContextMenuRecipeSubmenu;
window.handleNewRailFromShape = handleNewRailFromShape;
