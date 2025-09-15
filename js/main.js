// Main application entry point
// SVG Animator Pro - Main Module

// Prevent browser from restoring scroll position on page refresh
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Import all modules by loading them in the correct order
// This ensures all dependencies are available when needed

// Load order is important due to dependencies:
// 1. Core functionality first
// 2. Storage management
// 3. SVG handlers
// 4. Animation management
// 5. UI management
// 6. File handling
// 7. Utilities and event setup

// The modules are loaded via script tags in the HTML, so they're available globally
// This file just ensures proper initialization order

// Initialize the application when all modules are loaded
document.addEventListener('DOMContentLoaded', function() {
    // Scroll to top on page load/refresh to prevent browser from restoring previous scroll position
    window.scrollTo(0, 0);
    
    // Prevent browser from restoring scroll position on page refresh
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Ensure all required functions are available
    if (typeof populateAnimationDropdown === 'undefined') {
        console.error('UI Manager module not loaded');
        return;
    }
    
    if (typeof initializeDragAndDrop === 'undefined') {
        console.error('UI Manager module not loaded');
        return;
    }
    
    if (typeof initializePlaceholderClick === 'undefined') {
        console.error('UI Manager module not loaded');
        return;
    }
    
    if (typeof initializeUploadButton === 'undefined') {
        console.error('UI Manager module not loaded');
        return;
    }
    
    if (typeof initializeKeyboardShortcuts === 'undefined') {
        console.error('Core module not loaded');
        return;
    }
    
    if (typeof setupEventListeners === 'undefined') {
        console.error('Utilities module not loaded');
        return;
    }
    
    // Setup all event listeners
    setupEventListeners();
    
    // Initialize the application
    populateAnimationDropdown();
    updateStatusBar('Ready to animate your SVG files! 🚀');
    initializeDragAndDrop();
    initializePlaceholderClick();
    initializeUploadButton();
    initializeKeyboardShortcuts();
    addHelpTooltips();
    
    // Initialize shape styling controls
    if (typeof initializeShapeStyling === 'function') {
        initializeShapeStyling();
    }
    
    // Initialize controls section state (hidden by default)
    if (typeof hideControlsSection === 'function') {
        hideControlsSection();
    }
    
    // Show upload section on app start (in case no SVG is loaded)
    if (typeof showUploadSection === 'function') {
        showUploadSection();
    }
    
    // Clean up any invalid animation entries from localStorage
    if (typeof cleanupInvalidAnimations === 'function') {
        cleanupInvalidAnimations();
    }
    
    // Initialize recipe functionality
    if (typeof initializeRecipeManager === 'function') {
        initializeRecipeManager();
    }
    
    if (typeof initializeRecipeUI === 'function') {
        initializeRecipeUI();
    }
    
    // Add welcome message
    setTimeout(() => {
        showNotification('Welcome to SVG Animator Pro! 🎉', 'info');
    }, 1000);
    
    console.log('SVG Animator Pro initialized successfully!');
});

// Export any functions that might be needed globally
window.mainInitialized = true;
