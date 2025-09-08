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
        if (selectedElement) {
            const speed = this.value;
            applyTempAnimation(selectedElement, speed, undefined, false);
            document.getElementById('speedDisplay').textContent = `${speed}s`;
        }
    });

    // Apply animation button
    document.getElementById('apply-animation').addEventListener('click', function() {
        if (selectedElement) {
            const animationType = document.getElementById('animation-type').value;
            if (animationType != 'none') {
                let speedValue = document.getElementById('speed-slider').value;
                applyAnimation(selectedElement, speedValue);
                hidePreviewBadge();
            } else {
                selectedElement.classList.remove('animated');
            }
        }
    });

    // Animation type dropdown
    document.getElementById('animation-type').addEventListener('change', function() {
        const element = selectedElement;
        const speed = document.getElementById('speed-slider').value;
        const animationName = document.getElementById('animation-type').value;

        if (this.value !== "none") {
            // Render parameter controls for parametric animations
            renderParamControls(animationName);
            
            applyTempAnimation(selectedElement, speed, animationName, false);
            document.getElementById('speed-slider').removeAttribute('disabled');
            document.getElementById('speed-slider').value = "1.5";
            document.getElementById('speedDisplay').textContent = "1.5s";
            document.getElementById('apply-animation').removeAttribute('disabled');
            updateStatusBar(`Previewing "${animationName}" animation 🎬`);
            showPreviewBadge();
        } else {
            // Hide parameter panel when no animation is selected
            document.getElementById('animation-param-panel').style.display = 'none';
            
            document.getElementById('speed-slider').setAttribute('disabled', true);
            document.getElementById('apply-animation').setAttribute('disabled', true);
            updateStatusBar('Animation preview cleared 🚫');
            hidePreviewBadge();
        }
    });

    // Download SVG button
    document.getElementById('download-svg').addEventListener('click', downloadAnimatedSVG);
    
    // Export project button
    document.getElementById('export-project').addEventListener('click', exportProject);
    
    // Import project button
    document.getElementById('import-project').addEventListener('click', function() {
        document.getElementById('project-import').click();
    });
    
    // Project import file input
    document.getElementById('project-import').addEventListener('change', handleProjectImport);
    
    // Preview apply button
    document.getElementById('preview-apply-btn').addEventListener('click', function() {
        if (selectedElement) {
            const animationType = document.getElementById('animation-type').value;
            if (animationType != 'none') {
                let speedValue = document.getElementById('speed-slider').value;
                applyAnimation(selectedElement, speedValue);
                hidePreviewBadge();
            }
        }
    });
}

// Preview badge management functions
function showPreviewBadge() {
    const badge = document.getElementById('preview-badge');
    if (badge) {
        badge.classList.remove('hidden');
    }
}

function hidePreviewBadge() {
    const badge = document.getElementById('preview-badge');
    if (badge) {
        badge.classList.add('hidden');
    }
}

// Export functions for use in other modules
window.setupEventListeners = setupEventListeners;
window.showPreviewBadge = showPreviewBadge;
window.hidePreviewBadge = hidePreviewBadge;
