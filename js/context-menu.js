// Context Menu functionality for SVG Animator Pro
// Handles right-click context menu with animation options

let contextMenu = null;
let animationSubmenu = null;
let currentTargetElement = null;
let submenuTimeout = null;

// Initialize context menu functionality
function initializeContextMenu() {
    contextMenu = document.getElementById('context-menu');
    animationSubmenu = document.getElementById('animation-submenu');
    
    if (!contextMenu || !animationSubmenu) {
        console.error('Context menu elements not found');
        return;
    }
    
    // Populate animation submenu
    populateAnimationSubmenu();
    
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
    
    // Prevent context menu from closing when hovering over submenu
    animationSubmenu.addEventListener('mouseenter', () => {
        if (submenuTimeout) {
            clearTimeout(submenuTimeout);
            submenuTimeout = null;
        }
    });
    
    animationSubmenu.addEventListener('mouseleave', hideAnimationSubmenu);
}

// Handle right-click events
function handleRightClick(event) {
    // Check if the click is on an SVG element
    const svgElement = event.target.closest('svg');
    if (!svgElement) {
        return;
    }
    
    // Check if the click is on a selectable SVG element (not the root SVG)
    const targetElement = event.target;
    if (targetElement === svgElement || targetElement.tagName === 'svg') {
        return;
    }
    
    // Prevent default context menu
    event.preventDefault();
    
    // Store the target element
    currentTargetElement = targetElement;
    
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
    
    // Hide submenu initially
    animationSubmenu.classList.add('hidden');
    
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

// Handle clicks outside the context menu
function handleClickOutside(event) {
    if (!contextMenu || contextMenu.classList.contains('hidden')) {
        return;
    }
    
    // Check if click is outside the context menu and submenu
    const isClickInsideMenu = contextMenu.contains(event.target) || 
                             animationSubmenu.contains(event.target);
    
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

// Re-initialize context menu when SVG content changes
function reinitializeContextMenu() {
    // Re-populate animation submenu in case animations data changed
    populateAnimationSubmenu();
}

// Export functions for global access
window.initializeContextMenu = initializeContextMenu;
window.reinitializeContextMenu = reinitializeContextMenu;
