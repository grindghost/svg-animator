// Local storage and state management functionality
// SVG Animator Pro - Storage Manager Module

// Local storage constants and state
const LOCAL_STORAGE_KEY = 'svg-animations';
var LOCAL_STORAGE_CLEAN_STATE = "";
var SVG_BACKUP = "";

// Save current state as clean state
function saveCurrentStateAsClean() {
    LOCAL_STORAGE_CLEAN_STATE = localStorage.getItem(LOCAL_STORAGE_KEY);
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

    data.animations[elementId][type] = properties;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    updateAnimationListUI(elementId);
}

// Remove animation from localStorage
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

// Reset all animations to original state
function resetAllAnimations() {
    // Clear animations from the preview
    const elementsWithAnimation = document.querySelectorAll('.application-animation-class');

    elementsWithAnimation.forEach(element => {
        stopAnimation(element);
    });

    // Update the UI list
    updateAnimationListUI(null);
}

// Clear all animations from localStorage and reset to clean state
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

// Reset SVG from backup
function resetSvgFromBackup() {
    clearAllAnimations();
    
    const svgViewer = document.getElementById('svg-viewer');
    svgViewer.innerHTML = SVG_BACKUP;
    svgViewer.classList.add('has-content');
    
    svgRoot = document.querySelector('#svg-viewer svg');
    prepopulateLocalStorage(svgRoot);
    populateTreeView(svgRoot);
    saveCurrentStateAsClean();
    
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
window.resetAllAnimations = resetAllAnimations;
window.clearAllAnimations = clearAllAnimations;
window.resetSvgFromBackup = resetSvgFromBackup;
