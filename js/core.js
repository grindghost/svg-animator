// Core application initialization and main logic
// SVG Animator Pro - Core Module

// Global state variables
let svgRoot = null;
let selectedElement = null;
let selectedAnimation = null;

// Initialize the app
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

// Status bar updates
function updateStatusBar(message) {
    const statusText = document.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = message;
    }
}

// Reset controls to default state
function resetControls() {
    document.getElementById('animation-type').value = "none";
    document.getElementById('speed-slider').value = '1.5';
    document.getElementById('speedDisplay').textContent = '1.5s';
    
    // Hide the parameter panel when resetting controls
    document.getElementById('animation-param-panel').style.display = 'none';
    
    // Hide the shape styling panel when resetting controls
    if (typeof hideShapeStylingControls === 'function') {
        hideShapeStylingControls();
    }

    const event = new Event('change');
    document.getElementById('animation-type').dispatchEvent(event);
}

// Generate unique ID for elements
function generateUniqueID() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Generate unique animation ID
function uniqueID(existingName = null) {
    if (existingName) return existingName;

    const prefix = document.getElementById('animation-type').value;
    return `${prefix}-` + Math.random().toString(36).substr(2, 9);
}

// Show notification system
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

// Keyboard shortcuts initialization
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

// Export functions for use in other modules
window.updateStatusBar = updateStatusBar;
window.resetControls = resetControls;
window.generateUniqueID = generateUniqueID;
window.uniqueID = uniqueID;
window.showNotification = showNotification;
window.selectedElement = selectedElement;
window.svgRoot = svgRoot;
