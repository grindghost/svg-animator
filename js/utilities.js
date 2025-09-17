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

    // Applied animation editor event listeners
    setupAppliedAnimationEditorListeners();

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
            // Always keep Lottie export disabled until functionality is ready
            exportLottieItem.setAttribute('disabled', 'true');
        }
    }
    
    // Expose update function globally
    window.updateDropdownStates = updateDropdownStates;
    
    // Initial state update
    updateDropdownStates();
}

// Setup event listeners for applied animation editor
function setupAppliedAnimationEditorListeners() {

    // Tab switching
    document.getElementById('controls-tab').addEventListener('click', function() {
        switchToTab('controls');

    });

    document.getElementById('editor-tab').addEventListener('click', function() {
        // Editor tab click is handled by the animation selection
        // This is just for completeness
    });

    // Applied animation speed slider
    document.getElementById('applied-speed-slider').addEventListener('input', function() {
        const speed = this.value;
        document.getElementById('applied-speed-display').textContent = `${speed}s`;
        
        // Apply temporary animation to preview changes (only if speed slider is visible)
        const speedControlGroup = document.querySelector('.applied-animation-controls .control-group');
        if (speedControlGroup && speedControlGroup.style.display !== 'none' && currentlyEditingAnimation && selectedElement) {
            updateAnimationPreview(selectedElement, speed, currentlyEditingAnimation);
            
            // Auto-save the speed change to localStorage
            saveParameterChange(currentlyEditingAnimation, 'speed', speed);
        }
    });

    // Note: Apply Changes button removed - changes are now saved in real-time

    // Remove applied animation button
    document.getElementById('remove-applied-animation').addEventListener('click', function() {
        if (currentlyEditingAnimation) {
            if (confirm('Are you sure you want to remove this animation?')) {
                removeAnimation(currentlyEditingAnimation.elementId, currentlyEditingAnimation.animationId);
                hideAppliedAnimationEditor();
                showNotification('Animation removed successfully!', 'success');
            }
        }
    });

    // Parameter slider changes (real-time preview)
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('param-slider') && 
            e.target.closest('#applied-param-controls')) {
            
            const param = e.target.dataset.param;
            const value = parseFloat(e.target.value);
            
            // Update the value display
            const valueSpan = e.target.parentElement.querySelector('.param-value');
            if (valueSpan) {
                valueSpan.textContent = value;
            }
            
            // Update the animation parameters in the global animations object for real-time preview
            if (currentlyEditingAnimation && window.animationsData && window.animationsData[currentlyEditingAnimation.animationType]) {
                window.animationsData[currentlyEditingAnimation.animationType].params[param] = value;
            }
            
            // Apply temporary animation to preview changes
            if (currentlyEditingAnimation && selectedElement) {
                const speedControlGroup = document.querySelector('.applied-animation-controls .control-group');
                let speed = currentlyEditingAnimation.animationData.speed; // Use original speed as default
                
                // Only get speed from slider if it's visible
                if (speedControlGroup && speedControlGroup.style.display !== 'none') {
                    speed = document.getElementById('applied-speed-slider').value;
                }
                
                updateAnimationPreview(selectedElement, speed, currentlyEditingAnimation);
                
                // Auto-save the parameter change to localStorage
                saveParameterChange(currentlyEditingAnimation, param, value);
            }
        }
    });
}

// Helper function to save parameter changes in real-time
function saveParameterChange(editingAnimation, paramName, value) {
    const data = getSavedAnimations();
    if (data.animations[editingAnimation.elementId] && data.animations[editingAnimation.elementId][editingAnimation.animationId]) {
        const animationData = data.animations[editingAnimation.elementId][editingAnimation.animationId];
        
        // Initialize params if they don't exist
        if (!animationData.params) {
            animationData.params = {};
        }
        
        // Update the parameter
        if (paramName === 'speed') {
            animationData.speed = parseFloat(value);
        } else {
            animationData.params[paramName] = parseFloat(value);
        }
        
        // Save to localStorage
        localStorage.setItem('svg-animations', JSON.stringify(data));
        markAsUnsaved();
        
        // ✅ NEW: Use centralized left panel refresh
        if (typeof refreshLeftPanel === 'function') {
            refreshLeftPanel(editingAnimation.elementId, document.getElementById(editingAnimation.elementId));
        } else {
            updateAnimationListUI(editingAnimation.elementId);
        }
    }
}

// Helper function to update animation preview in real-time
function updateAnimationPreview(element, speed, editingAnimation) {
    // ✅ NEW: Handle clipPath elements differently - they don't use anim-wrapper groups
    const isClipPathElement = isInsideClipPath(element);
    
    // Find the existing animation wrapper (only for non-clipPath elements)
    let wrapper = null;
    if (isClipPathElement) {
        wrapper = element;
    } else {
        // Get the original animation name from the saved data to find the correct wrapper
        const data = getSavedAnimations();
        const savedAnimationData = data.animations[editingAnimation.elementId] && data.animations[editingAnimation.elementId][editingAnimation.animationId];
        const originalAnimationName = savedAnimationData ? savedAnimationData.animationName : null;
        
        if (originalAnimationName) {
            // Find the wrapper that has this specific animation
            const allWrappers = document.querySelectorAll('.anim-wrapper');
            for (let w of allWrappers) {
                if (w.style.animation && w.style.animation.includes(originalAnimationName)) {
                    wrapper = w;
                    break;
                }
            }
        }
        
        // Fallback to closest wrapper if specific one not found
        if (!wrapper) {
            wrapper = element.closest('.anim-wrapper');
        }
    }
    
    if (!wrapper) return;
    
    const animationType = editingAnimation.animationType;
    const animationData = window.animationsData && window.animationsData[animationType];
    
    if (!animationData) return;
    
    // Get the original animation name from the saved data
    const data = getSavedAnimations();
    const savedAnimationData = data.animations[editingAnimation.elementId] && data.animations[editingAnimation.elementId][editingAnimation.animationId];
    const originalAnimationName = savedAnimationData ? savedAnimationData.animationName : null;
    
    if (!originalAnimationName) return;
    
    // Handle apply-based animations (like "boiled") - not supported for clipPath elements
    if (animationData.apply) {
        if (isClipPathElement) {
            console.warn("Apply-based animations not supported for clipPath elements during parameter editing");
            return;
        }
        // Re-apply the animation with current parameters
        animationData.apply(wrapper, animationData.params);
    } else {
        // Handle keyframe-based animations
        const keyframes = animationData.generateKeyframes
            ? animationData.generateKeyframes(animationData.params)
            : animationData.keyframes;
            
        if (keyframes) {
            // ✅ NEW: Scale down animation intensity for clipPath elements
            const scaledKeyframes = isClipPathElement ? 
                scaleAnimationIntensityForClipPath(keyframes, animationData.type) : 
                keyframes;
            
            // Update the existing animation style instead of creating a new one
            let existingStyle = document.getElementById(originalAnimationName);
            
            // Build keyframes string
            let keyframesString = "";
            for (let percentage in scaledKeyframes) {
                let properties = scaledKeyframes[percentage];
                let propsString = Object.keys(properties)
                    .map(prop => `${prop}: ${properties[prop]};`)
                    .join(" ");
                keyframesString += `${percentage} { ${propsString} } `;
            }
            
            // Update the existing style or create it if it doesn't exist
            if (existingStyle) {
                // Update the existing style with proper CSS format
                const newCSS = `@keyframes ${originalAnimationName} { ${keyframesString} }`;
                existingStyle.textContent = newCSS;
            } else {
                const embeddedStyle = `
                    <style id="${originalAnimationName}" data-anikit="">
                        @keyframes ${originalAnimationName} {
                            ${keyframesString}
                        }
                    </style>
                `;
                svgRoot.insertAdjacentHTML("beforeend", embeddedStyle);
            }
            
            // Update the animation timing (speed) on the wrapper or element
            const currentAnimation = wrapper.style.animation;
            const newAnimation = currentAnimation.replace(/\d+\.?\d*s/, `${speed}s`);
            wrapper.style.animation = newAnimation;
        }
    }
}

// Helper function to update an applied animation
function updateAppliedAnimation(elementId, animationId, speed, params) {
    const data = getSavedAnimations();
    if (data.animations[elementId] && data.animations[elementId][animationId]) {
        const animationData = data.animations[elementId][animationId];
        
        // Update the saved data
        animationData.speed = parseFloat(speed);
        if (params) {
            animationData.params = params;
        }
        
        // Save the updated data
        localStorage.setItem('svg-animations', JSON.stringify(data));
        markAsUnsaved();
        
        // ✅ NEW: Use centralized left panel refresh
        if (typeof refreshLeftPanel === 'function') {
            refreshLeftPanel(elementId, document.getElementById(elementId));
        } else {
            updateAnimationListUI(elementId);
        }
        
        // Reapply the animation with new parameters
        const element = document.getElementById(elementId);
        if (element) {
            // First, remove the existing animation
            stopAnimation(element, animationData.animationName);
            // Then apply the animation with new parameters
            applyAnimation(element, speed, animationData.type, false);
        }
    }
}

window.setupEventListeners = setupEventListeners;
window.showPreviewBadge = showPreviewBadge;
window.hidePreviewBadge = hidePreviewBadge;
window.exportToLottie = exportToLottie;
window.initializeDropdowns = initializeDropdowns;
window.setupAppliedAnimationEditorListeners = setupAppliedAnimationEditorListeners;
window.updateAppliedAnimation = updateAppliedAnimation;
window.updateAnimationPreview = updateAnimationPreview;
window.saveParameterChange = saveParameterChange;

// Function to switch between tabs
function switchToTab(tabName) {
    const controlsTab = document.getElementById('controls-tab');
    const editorTab = document.getElementById('editor-tab');
    const controlsContent = document.getElementById('controls-content');
    const editor = document.getElementById('applied-animation-editor');

    if (tabName === 'controls') {
        controlsTab.classList.add('active');
        editorTab.classList.remove('active');
        editorTab.style.display = 'none';
        controlsContent.classList.add('active');
        editor.classList.remove('active');

        // remove hidden class from controls-section
        const controlsSection = document.querySelector('.controls-section');
        if (controlsSection) {
            controlsSection.classList.remove('hidden');
        }

        // display animation-count-message
        const animationCountMessage = document.getElementById('animation-count-message');
        if (animationCountMessage) {
            animationCountMessage.style.display = 'block';
        }

        // display animation-list-div
        const animationListDiv = document.getElementById('animation-list-div');
        if (animationListDiv) {
            animationListDiv.style.display = 'block';
        }

    } else if (tabName === 'editor') {
        controlsTab.classList.remove('active');
        editorTab.classList.add('active');
        editorTab.style.display = 'flex';
        controlsContent.classList.remove('active');
        editor.classList.add('active');
    }
}

window.switchToTab = switchToTab;
