// Main application entry point
// SVG Animator Pro - Main Module

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
    // Ensure all required functions are available
    if (typeof populateAnimationDropdown === 'undefined') {
        console.error('UI Manager module not loaded');
        return;
    }
    
    if (typeof initializeDragAndDrop === 'undefined') {
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
    
    // Add welcome message
    setTimeout(() => {
        showNotification('Welcome to SVG Animator Pro! 🎉', 'info');
    }, 1000);
    
    console.log('SVG Animator Pro initialized successfully!');
});

// Export any functions that might be needed globally
window.mainInitialized = true;
