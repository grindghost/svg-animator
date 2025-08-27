// Helper functions and utilities
// SVG Animator Pro - Utilities Module

// Event listener setup functions
function setupEventListeners() {
    // Clear cache button
    document.getElementById('clear-cache').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all animations? This action cannot be undone.')) {
            resetSvgFromBackup();
        }
    });

    // SVG upload
    document.getElementById('svg-upload').addEventListener('change', handleSVGUpload);

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', function() {
        // First try to get the currently selected Fabric.js object
        if (typeof getCurrentSelectedObject === 'function') {
            const fabricObj = getCurrentSelectedObject();
            if (fabricObj && fabricObj.elementId) {
                const speed = this.value;
                const domElement = document.getElementById(fabricObj.elementId);
                if (domElement) {
                    applyTempAnimation(domElement, speed, undefined, false);
                }
                document.getElementById('speedDisplay').textContent = `${speed}s`;
                return;
            }
        }
        
        // Fallback to DOM-based selection
        if (selectedElement) {
            const speed = this.value;
            applyTempAnimation(selectedElement, speed, undefined, false);
            document.getElementById('speedDisplay').textContent = `${speed}s`;
        }
    });

    // Apply animation button
    document.getElementById('apply-animation').addEventListener('click', function() {
        // First try to get the currently selected Fabric.js object
        if (typeof getCurrentSelectedObject === 'function') {
            const fabricObj = getCurrentSelectedObject();
            if (fabricObj && fabricObj.elementId) {
                const animationType = document.getElementById('animation-type').value;
                if (animationType != 'none') {
                    let speedValue = document.getElementById('speed-slider').value;
                    const success = applyAnimationToFabricObject(fabricObj.elementId, animationType, speedValue);
                    if (success) {
                        updateStatusBar(`Animation applied to ${fabricObj.elementId} 🎉`);
                        return;
                    }
                }
            }
        }
        
        // Fallback to DOM-based selection
        if (selectedElement) {
            const animationType = document.getElementById('animation-type').value;
            if (animationType != 'none') {
                let speedValue = document.getElementById('speed-slider').value;
                applyAnimation(selectedElement, speedValue);
            } else {
                selectedElement.classList.remove('animated');
            }
        }
    });

    // Animation type dropdown
    document.getElementById('animation-type').addEventListener('change', function() {
        const animationName = this.value;
        let targetElement = selectedElement;

        // First try to get the currently selected Fabric.js object
        if (typeof getCurrentSelectedObject === 'function') {
            const fabricObj = getCurrentSelectedObject();
            if (fabricObj && fabricObj.elementId) {
                const domElement = document.getElementById(fabricObj.elementId);
                if (domElement) {
                    targetElement = domElement;
                }
            }
        }

        if (this.value !== "none") {
            // Render parameter controls for parametric animations
            renderParamControls(animationName);
            
            if (targetElement) {
                const speed = document.getElementById('speed-slider').value;
                applyTempAnimation(targetElement, speed, animationName, false);
            }
            
            document.getElementById('speed-slider').removeAttribute('disabled');
            document.getElementById('speed-slider').value = "1.5";
            document.getElementById('speedDisplay').textContent = "1.5s";
            document.getElementById('apply-animation').removeAttribute('disabled');
            updateStatusBar(`Previewing "${animationName}" animation 🎬`);
        } else {
            // Hide parameter panel when no animation is selected
            document.getElementById('animation-param-panel').style.display = 'none';
            
            document.getElementById('speed-slider').setAttribute('disabled', true);
            document.getElementById('apply-animation').setAttribute('disabled', true);
            updateStatusBar('Animation preview cleared 🚫');
        }
    });

    // Download SVG button
    document.getElementById('download-svg').addEventListener('click', downloadAnimatedSVG);
}

// Export functions for use in other modules
window.setupEventListeners = setupEventListeners;
