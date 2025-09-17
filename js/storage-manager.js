// Local storage and state management functionality
// SVG Animator Pro - Storage Manager Module

// Local storage constants and state
const LOCAL_STORAGE_KEY = 'svg-animations';
var LOCAL_STORAGE_CLEAN_STATE = "";
var SVG_BACKUP = "";
var hasUnsavedChanges = false;

// Save current state as clean state
function saveCurrentStateAsClean() {
    LOCAL_STORAGE_CLEAN_STATE = localStorage.getItem(LOCAL_STORAGE_KEY);
    hasUnsavedChanges = false;
}

// Mark that there are unsaved changes
function markAsUnsaved() {
    hasUnsavedChanges = true;
}

// Check if there are unsaved changes
function getHasUnsavedChanges() {
    return hasUnsavedChanges;
}

// Check if there are unsaved changes by comparing current state with clean state
function checkForUnsavedChanges() {
    const currentState = localStorage.getItem(LOCAL_STORAGE_KEY);
    return currentState !== LOCAL_STORAGE_CLEAN_STATE;
}

// Reset to clean state
function resetToCleanState() {
    localStorage.setItem(LOCAL_STORAGE_KEY, LOCAL_STORAGE_CLEAN_STATE);
}

// Get saved animations from localStorage
function getSavedAnimations() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : { animations: {} };
}

// Save animation to localStorage
function saveAnimation(elementId, type, properties) {
    const data = getSavedAnimations();

    // Check if the element already exists
    if (!data.animations[elementId]) {
        data.animations[elementId] = {};
    }

    // Generate unique ID for this animation instance
    const animationId = uniqueID();
    
    // Store animation with type as a property
    data.animations[elementId][animationId] = {
        type: type,
        ...properties
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    markAsUnsaved(); // Mark as unsaved when saving animation
    
    // ✅ NEW: Use centralized left panel refresh
    if (typeof refreshLeftPanel === 'function') {
        refreshLeftPanel(elementId, document.getElementById(elementId));
    } else {
        updateAnimationListUI(elementId);
    }
    
    // Update dropdown states
    if (typeof updateDropdownStates === 'function') {
        updateDropdownStates();
    }
    
    return animationId; // Return the ID for potential use
}

// Remove animation from localStorage
function removeAnimation(elementId, animationId) {
    const data = getSavedAnimations();

    if (data.animations[elementId] && data.animations[elementId][animationId]) {
        // Remove the corresponding style tag from the DOM
        const animationData = data.animations[elementId][animationId];
        if (animationData.animationName) {
            removeStyleTag(animationData.animationName);
        }

        // Stop the animation and remove the wrapper
        const element = document.querySelector(`#${elementId}`);
        if (element) {
            // ✅ NEW: Special handling for clipPath elements
            // For clipPath elements, the animation is applied directly to the shape element
            // (not wrapped in an anim-wrapper group), so we need to ensure proper cleanup
            if (typeof isInsideClipPath === 'function' && isInsideClipPath(element)) {
                // For clipPath elements, call stopClipPathAnimation directly with the animation data
                if (typeof stopClipPathAnimation === 'function') {
                    stopClipPathAnimation(element, animationId);
                }
            } else {
                // For regular elements, use the standard stopAnimation function
                stopAnimation(element, animationId, elementId);
            }
        }

        // Check if we're currently editing this animation - if so, hide the editor panel
        if (typeof currentlyEditingAnimation !== 'undefined' && currentlyEditingAnimation && 
            currentlyEditingAnimation.elementId === elementId && 
            currentlyEditingAnimation.animationId === animationId) {
            if (typeof hideAppliedAnimationEditor === 'function') {
                hideAppliedAnimationEditor();
            }
        }

        // Delete from the localStorage
        delete data.animations[elementId][animationId];

        // Remove the specific named destination that corresponds to this animation
        if (data.namedDestinations && data.namedDestinations.destinations) {
            // Look for named destinations that reference this specific animation
            for (const [destinationElementId, destinationData] of Object.entries(data.namedDestinations.destinations)) {
                if (destinationData.specificAnimationId === animationId || 
                    (destinationData.animationElementId === elementId && destinationData.animationType === animationData.type)) {
                    delete data.namedDestinations.destinations[destinationElementId];
                    console.log('Removed named destination for deleted animation:', destinationElementId);
                    break;
                }
            }
        }

        // Remove the element entry if it has no more animations
        if (Object.keys(data.animations[elementId]).length === 0) {
            delete data.animations[elementId];
        }
    }
    
    // Ensure named destinations are included in the data structure
    if (!data.namedDestinations) {
        data.namedDestinations = { destinations: {} };
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    markAsUnsaved(); // Mark as unsaved when removing animation
    
    // ✅ NEW: Use centralized left panel refresh
    if (typeof refreshLeftPanel === 'function') {
        refreshLeftPanel(elementId, document.getElementById(elementId));
    } else {
        updateAnimationListUI(elementId);
        updateAnimationCountMessage(elementId);
    }
    
    // Update named destinations UI if a named destination was removed
    if (typeof updateNamedDestinationsUI === 'function') {
        updateNamedDestinationsUI();
    }
    
    // Update dropdown states
    if (typeof updateDropdownStates === 'function') {
        updateDropdownStates();
    }

    // Remove the temporary preview animation style tag
    removeStyleTag();
}

// Remove animation by type (for backward compatibility and specific type removal)
function removeAnimationByType(elementId, type) {
    const data = getSavedAnimations();

    if (data.animations[elementId]) {
        // Find all animations of this type and remove them
        const animationsToRemove = [];
        for (const [animationId, animationData] of Object.entries(data.animations[elementId])) {
            if (animationData.type === type) {
                animationsToRemove.push(animationId);
            }
        }
        
        // Remove each animation of this type
        animationsToRemove.forEach(animationId => {
            removeAnimation(elementId, animationId);
        });
    }
}

// Reset all animations to original state
function resetAllAnimations() {
    // Clear animations from the preview
    const elementsWithAnimation = document.querySelectorAll('.application-animation-class');

    elementsWithAnimation.forEach(element => {
        stopAnimation(element);
    });

    // Clear all named destinations when resetting all animations
    if (typeof clearAllNamedDestinations === 'function') {
        clearAllNamedDestinations();
    }

    // Update the UI list
    updateAnimationListUI(null);
}

// Clean up invalid animation entries (like "none" entries with null types)
function cleanupInvalidAnimations() {
    const data = getSavedAnimations();
    let cleaned = false;
    
    for (const elementId in data.animations) {
        const elementAnimations = data.animations[elementId];
        for (const animationKey in elementAnimations) {
            const animationData = elementAnimations[animationKey];
            
            // Remove entries with null type or "none" type
            if (!animationData.type || animationData.type === 'none' || animationData.type === null) {
                delete elementAnimations[animationKey];
                cleaned = true;
            }
        }
        
        // Remove element entry if it has no more animations
        if (Object.keys(elementAnimations).length === 0) {
            delete data.animations[elementId];
            cleaned = true;
        }
    }
    
    if (cleaned) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        console.log('Cleaned up invalid animation entries from localStorage');
    }
}

// Clear all animations from localStorage and reset to clean state
function clearAllAnimations() {
    // Clear animations and named destinations from localStorage, and reset to a clean state
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ 
        animations: {},
        namedDestinations: { destinations: {} }
    }));
    markAsUnsaved(); // Mark as unsaved when clearing animations
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
    
    // Hide the animation count message when all animations are cleared
    updateAnimationCountMessage(null);
    
    // Clear named destinations when clearing all animations
    if (typeof clearAllNamedDestinations === 'function') {
        clearAllNamedDestinations();
    }
    
    // Update dropdown states
    if (typeof updateDropdownStates === 'function') {
        updateDropdownStates();
    }
    
    // Show upload section if no SVG is loaded
    if (!svgRoot) {
        showUploadSection();
    }
}

// Reset SVG from backup
function resetSvgFromBackup() {
    clearAllAnimations();
    
    const svgViewer = document.getElementById('svg-viewer');
    svgViewer.innerHTML = SVG_BACKUP;
    svgViewer.classList.add('has-content');
    
    svgRoot = document.querySelector('#svg-viewer svg');
    prepopulateLocalStorage(svgRoot);
    
    // Process clipPath elements first - move them from defs to consuming elements
    processClipPathElements(svgRoot);
    
    populateTreeView(svgRoot);
    saveCurrentStateAsClean(); // This will reset hasUnsavedChanges to false
    
    // Reinitialize hover and select functionality to restore shape selection
    initializeHoverAndSelect();
    
    updateStatusBar('SVG reset to original state 🔄');
}

// Export functions for use in other modules
window.saveCurrentStateAsClean = saveCurrentStateAsClean;
window.resetToCleanState = resetToCleanState;
window.getSavedAnimations = getSavedAnimations;
window.saveAnimation = saveAnimation;
window.removeAnimation = removeAnimation;
window.removeAnimationByType = removeAnimationByType;
window.resetAllAnimations = resetAllAnimations;
window.clearAllAnimations = clearAllAnimations;
window.resetSvgFromBackup = resetSvgFromBackup;
window.markAsUnsaved = markAsUnsaved;
window.getHasUnsavedChanges = getHasUnsavedChanges;
window.checkForUnsavedChanges = checkForUnsavedChanges;
window.cleanupInvalidAnimations = cleanupInvalidAnimations;

