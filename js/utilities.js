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

    // Add beforeunload event listener to warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        // Check if there's an SVG loaded and if there are unsaved changes
        const hasSvg = document.querySelector('.svg-viewer.has-content') !== null;
        const hasChanges = checkForUnsavedChanges();
        
        if (hasSvg && hasChanges) {
            const message = 'You have unsaved changes in your project. Are you sure you want to leave?';
            e.preventDefault();
            e.returnValue = message; // For older browsers
            return message; // For modern browsers
        }
    });

    // Add click event listeners to footer links to check for unsaved changes
    const footerLinks = document.querySelectorAll('.footer-link');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const hasSvg = document.querySelector('.svg-viewer.has-content') !== null;
            const hasChanges = checkForUnsavedChanges();
            
            if (hasSvg && hasChanges) {
                const confirmed = confirm('You have unsaved changes in your project. Are you sure you want to leave?');
                if (!confirmed) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    });

    // Add event listener for page visibility change (handles tab switching, minimizing, etc.)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is being hidden, check for unsaved changes
            const hasSvg = document.querySelector('.svg-viewer.has-content') !== null;
            const hasChanges = checkForUnsavedChanges();
            
            if (hasSvg && hasChanges) {
                // Show a notification to remind user about unsaved changes
                showNotification('You have unsaved changes in your project. Don\'t forget to save!', 'info');
            }
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
            // Check if the selected animation should show the speed slider
            const animationData = animationsData[animationName];
            const showSpeedSlider = animationData && animationData.defaultSpeedSlider !== false;
            
            // Show/hide speed control group based on animation's defaultSpeedSlider property
            const speedControlGroup = document.getElementById('speed-control-group');
            if (speedControlGroup) {
                speedControlGroup.style.display = showSpeedSlider ? 'block' : 'none';
            }
            
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
            
            // Hide speed control group when no animation is selected
            const speedControlGroup = document.getElementById('speed-control-group');
            if (speedControlGroup) {
                speedControlGroup.style.display = 'none';
            }
            
            document.getElementById('speed-slider').setAttribute('disabled', true);
            document.getElementById('apply-animation').setAttribute('disabled', true);
            updateStatusBar('Animation preview cleared 🚫');
            hidePreviewBadge();
        }
    });

    // Download SVG button
    document.getElementById('download-svg').addEventListener('click', downloadAnimatedSVG);
    
    // Initialize dropdown functionality
    initializeDropdowns();
    
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

// Export to Lottie function
async function exportToLottie() {
    try {
        updateStatusBar('Preparing Lottie export... 🎬');
        
        // Check if we have animations to export
        const savedAnimations = getSavedAnimations();
        if (!savedAnimations.animations || Object.keys(savedAnimations.animations).length === 0) {
            alert('No animations found to export. Please apply some animations first.');
            updateStatusBar('No animations to export ❌');
            return;
        }

        // Import the lottie exporter module
        const { exportToLottie: lottieExport } = await import('./lottie-exporter.js');
        
        // Get animations data from the global scope
        const animationsData = window.animationsData;
        if (!animationsData) {
            alert('Animation templates not found. Please refresh the page and try again.');
            updateStatusBar('Export failed - missing animation data ❌');
            return;
        }

        // Generate Lottie JSON
        const lottieJson = lottieExport(savedAnimations, animationsData);
        
        // Debug logging
        console.log('Generated Lottie JSON:', lottieJson);
        console.log('Number of layers:', lottieJson.layers.length);
        console.log('Animation duration:', lottieJson.op, 'frames');
        
        // Create and download the file
        const jsonString = JSON.stringify(lottieJson, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'svg-animations.lottie.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateStatusBar('Lottie file exported successfully! 🎉');
        
    } catch (error) {
        console.error('Error exporting to Lottie:', error);
        alert('Failed to export to Lottie. Please check the console for details.');
        updateStatusBar('Lottie export failed ❌');
    }
}

// Export functions for use in other modules
// Initialize dropdown functionality
function initializeDropdowns() {
    // Open dropdown
    const openDropdown = document.getElementById('open-dropdown');
    const openToggle = document.getElementById('open-dropdown-toggle');
    const openMenu = document.getElementById('open-dropdown-menu');
    
    // Save dropdown
    const saveDropdown = document.getElementById('save-dropdown');
    const saveToggle = document.getElementById('save-dropdown-toggle');
    const saveMenu = document.getElementById('save-dropdown-menu');
    
    // Dropdown items
    const uploadSvgItem = document.getElementById('upload-svg-item');
    const importProjectItem = document.getElementById('import-project-item');
    const exportProjectItem = document.getElementById('export-project-item');
    const exportLottieItem = document.getElementById('export-lottie-item');
    
    // Toggle dropdown function
    function toggleDropdown(dropdown, menu, toggle) {
        const isOpen = menu.classList.contains('open');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu.open').forEach(openMenu => {
            openMenu.classList.remove('open');
            openMenu.parentElement.classList.remove('open');
        });
        
        // Toggle current dropdown
        if (!isOpen) {
            menu.classList.add('open');
            dropdown.classList.add('open');
            toggle.classList.add('open');
        }
    }
    
    // Open dropdown toggle
    if (openToggle && openMenu) {
        openToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(openDropdown, openMenu, openToggle);
        });
    }
    
    // Save dropdown toggle
    if (saveToggle && saveMenu) {
        saveToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            // Don't open if disabled
            if (!saveDropdown.classList.contains('disabled')) {
                toggleDropdown(saveDropdown, saveMenu, saveToggle);
            }
        });
    }
    
    // Upload SVG item
    if (uploadSvgItem) {
        uploadSvgItem.addEventListener('click', function() {
            document.getElementById('svg-upload').click();
            closeAllDropdowns();
        });
    }
    
    // Import Project item
    if (importProjectItem) {
        importProjectItem.addEventListener('click', function() {
            document.getElementById('project-import').click();
            closeAllDropdowns();
        });
    }
    
    // Export Project item
    if (exportProjectItem) {
        exportProjectItem.addEventListener('click', function() {
            if (!exportProjectItem.hasAttribute('disabled')) {
                exportProject();
                closeAllDropdowns();
            }
        });
    }
    
    // Export Lottie item
    if (exportLottieItem) {
        exportLottieItem.addEventListener('click', function() {
            if (!exportLottieItem.hasAttribute('disabled')) {
                exportToLottie();
                closeAllDropdowns();
            }
        });
    }
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            closeAllDropdowns();
        }
    });
    
    // Close all dropdowns function
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
            menu.classList.remove('open');
            menu.parentElement.classList.remove('open');
        });
        document.querySelectorAll('.dropdown-toggle.open').forEach(toggle => {
            toggle.classList.remove('open');
        });
    }
    
    // Update dropdown item states based on project state
    function updateDropdownStates() {
        const hasAnimations = document.querySelectorAll('.animation-item').length > 0;
        const hasSvg = document.querySelector('.svg-viewer.has-content') !== null;
        
        // Update save dropdown state - disable if no SVG is loaded
        if (saveDropdown) {
            if (hasSvg) {
                saveDropdown.classList.remove('disabled');
                saveToggle.disabled = false;
            } else {
                saveDropdown.classList.add('disabled');
                saveToggle.disabled = true;
            }
        }
        
        // Update export items
        if (exportProjectItem) {
            if (hasAnimations && hasSvg) {
                exportProjectItem.removeAttribute('disabled');
            } else {
                exportProjectItem.setAttribute('disabled', 'true');
            }
        }
        
        if (exportLottieItem) {
            if (hasAnimations && hasSvg) {
                exportLottieItem.removeAttribute('disabled');
            } else {
                exportLottieItem.setAttribute('disabled', 'true');
            }
        }
    }
    
    // Expose update function globally
    window.updateDropdownStates = updateDropdownStates;
    
    // Initial state update
    updateDropdownStates();
}

window.setupEventListeners = setupEventListeners;
window.showPreviewBadge = showPreviewBadge;
window.hidePreviewBadge = hidePreviewBadge;
window.exportToLottie = exportToLottie;
window.initializeDropdowns = initializeDropdowns;
