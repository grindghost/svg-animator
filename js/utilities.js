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
            
            // ✅ NEW: Check if the selected element has an offset-path animation
            const offsetPathElement = selectedElement.querySelector('[data-offset-path-animation]') || 
                                    (selectedElement.hasAttribute('data-offset-path-animation') ? selectedElement : null);
            
            if (offsetPathElement) {
                // Handle offset-path animation speed change
                const animationId = offsetPathElement.getAttribute('data-offset-path-animation');
                const elementId = offsetPathElement.getAttribute('id');
                
                if (animationId && elementId) {
                    // Find the animation data in localStorage by looking for any offset-path animation
                    const data = getSavedAnimations();
                    let savedAnimationData = null;
                    let foundAnimationId = null;
                    
                    if (data.animations[elementId]) {
                        // Look for any offset-path animation for this element
                        for (const [animId, animData] of Object.entries(data.animations[elementId])) {
                            if (animData.type === 'offset-path') {
                                savedAnimationData = animData;
                                foundAnimationId = animId;
                                break;
                            }
                        }
                    }
                    
                    if (savedAnimationData) {
                        // Create a mock editing animation object for updateOffsetPathAnimationPreview
                        const editingAnimation = {
                            elementId: elementId,
                            animationId: foundAnimationId,
                            animationType: 'offset-path'
                        };
                        
                        updateOffsetPathAnimationPreview(selectedElement, speed, editingAnimation);
                    } else {
                        console.warn('Could not find animation data for offset-path animation:', animationId);
                    }
                }
            } else {
                // Handle regular animations
                applyTempAnimation(selectedElement, speed, undefined, false);
            }
            
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
}

// ✅ NEW: Show rail selection for offset path animations
function showOffsetPathRailSelection(element, speed, animationName) {
    // Create a simple rail selection modal/overlay
    const overlay = document.createElement('div');
    overlay.className = 'rail-selection-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    const modal = document.createElement('div');
    modal.className = 'rails-modal';
    modal.style.cssText = `
        max-width: 400px;
        width: 90%;
    `;
    
    modal.innerHTML = `
        <div class="rails-modal-header">
            <h3>🛤️ Select Rail for Offset Path Animation</h3>
            <button id="cancel-rail-selection" class="rails-close-btn" title="Cancel">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        
        <div class="rails-modal-content">
            <div class="rails-form">
                <p class="rails-description" style="color: var(--text-secondary);">
                    Choose which rail to use for the offset path animation:
                </p>
                
                <div class="form-group">
                    <label for="rail-selection-dropdown" class="form-label">Select Rail</label>
                    <select id="rail-selection-dropdown" class="form-input">
                        <option value="">Select a rail...</option>
                    </select>
                </div>
                
                <div class="rails-actions">
                    <button id="apply-rail-selection" class="btn btn-primary" disabled>Apply Animation</button>
                </div>
            </div>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Populate rail dropdown
    const dropdown = document.getElementById('rail-selection-dropdown');
    const rails = getSavedRails();
    const railNames = Object.keys(rails).sort();
    
    railNames.forEach(railName => {
        const option = document.createElement('option');
        option.value = railName;
        option.textContent = railName;
        dropdown.appendChild(option);
    });
    
    // Handle rail selection change
    dropdown.addEventListener('change', function() {
        const applyButton = document.getElementById('apply-rail-selection');
        applyButton.disabled = !this.value;
    });
    
    // Handle apply button click
    document.getElementById('apply-rail-selection').addEventListener('click', function() {
        const selectedRail = dropdown.value;
        if (selectedRail) {
            const animationData = {
                params: {
                    rail: selectedRail,
                    speed: parseFloat(speed),
                    direction: 0
                }
            };
            applyOffsetPathAnimation(element, animationData, null);
            updateStatusBar(`Applied "${animationName}" animation with rail "${selectedRail}"! ✨`);
            showNotification(`Applied "${animationName}" animation successfully!`, "success");
            
            // Disable apply button since animation is already applied
            document.getElementById('apply-animation').setAttribute('disabled', 'disabled');
            
            // Hide parameter panel for offset-path animations (use editor tab instead)
            document.getElementById('animation-param-panel').style.display = 'none';
            
            // Update animation count and UI
            updateAnimationCountMessage(element.getAttribute('id'));
            refreshLeftPanel(element.getAttribute('id'), element);
            
            // Close modal
            document.body.removeChild(overlay);
        }
    });
    
    // Handle cancel button click (now in header)
    document.getElementById('cancel-rail-selection').addEventListener('click', function() {
        document.getElementById('animation-type').value = 'none';
        document.body.removeChild(overlay);
    });
    
    // Handle overlay click to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            document.getElementById('animation-type').value = 'none';
            document.body.removeChild(overlay);
        }
    });
}

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
            
            // ✅ NEW: Special handling for offset-path animations - show rail selection first
            if (animationName === 'offset-path') {
                // Check if rails are available
                if (typeof getSavedRails === 'function') {
                    const rails = getSavedRails();
                    const railNames = Object.keys(rails);
                    
                    if (railNames.length === 0) {
                        // No rails available - show error message
                        updateStatusBar('No rails available! Please create a rail first. 🛤️');
                        showNotification('No rails available! Please create a rail first.', 'error');
                        document.getElementById('animation-type').value = 'none';
                        return;
                    } else if (railNames.length === 1) {
                        // Only one rail available - use it automatically
                        const railName = railNames[0];
                        const animationData = {
                            params: {
                                rail: railName,
                                speed: parseFloat(speed),
                                direction: 0
                            }
                        };
                        applyOffsetPathAnimation(selectedElement, animationData, null);
                        updateStatusBar(`Applied "${animationName}" animation with rail "${railName}"! ✨`);
                        showNotification(`Applied "${animationName}" animation successfully!`, "success");
                        
                        // Disable apply button since animation is already applied
                        document.getElementById('apply-animation').setAttribute('disabled', 'disabled');
                        
                        // Hide parameter panel for offset-path animations (use editor tab instead)
                        document.getElementById('animation-param-panel').style.display = 'none';
                        
                        // Update animation count and UI
                        updateAnimationCountMessage(selectedElement.getAttribute('id'));
                        refreshLeftPanel(selectedElement.getAttribute('id'), selectedElement);
                    } else {
                        // Multiple rails available - show rail selection
                        showOffsetPathRailSelection(selectedElement, speed, animationName);
                    }
                } else {
                    // getSavedRails function not available
                    updateStatusBar('Rail system not available! Please check your setup. ❌');
                    showNotification('Rail system not available! Please check your setup.', 'error');
                    document.getElementById('animation-type').value = 'none';
                    return;
                }
            } else {
                // Regular animations - show preview and apply button
                console.log('Applying temp animation for:', animationName);
                console.log('selectedElement:', selectedElement);
                applyTempAnimation(selectedElement, speed, animationName);
                document.getElementById('speed-slider').removeAttribute('disabled');
                document.getElementById('speed-slider').value = "1.5";
                document.getElementById('speedDisplay').textContent = "1.5s";
                document.getElementById('apply-animation').removeAttribute('disabled');
                updateStatusBar(`Previewing "${animationName}" animation 🎬`);
                console.log('Showing preview badge...');
                showPreviewBadge();
                console.log('Preview badge should be visible now');
            }
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
    document.getElementById('project-import').addEventListener('change', function(e) {
        console.log('Project import file selected:', e.target.files[0]);
        // TODO: Implement project import functionality
        showNotification('Project import feature coming soon!', 'info');
    });
    
    // Preview apply button
    const previewApplyBtn = document.getElementById('preview-apply-btn');
    if (previewApplyBtn) {
        console.log('Preview apply button found, attaching event listener');
        previewApplyBtn.addEventListener('click', function() {
            console.log('Preview apply button clicked!');
            console.log('selectedElement:', selectedElement);
            if (selectedElement) {
                const animationType = document.getElementById('animation-type').value;
                console.log('animationType:', animationType);
                if (animationType != 'none') {
                    let speedValue = document.getElementById('speed-slider').value;
                    console.log('speedValue:', speedValue);
                    console.log('Calling applyAnimation...');
                    applyAnimation(selectedElement, speedValue);
                    console.log('Calling hidePreviewBadge...');
                    hidePreviewBadge();
                    console.log('Preview apply completed!');
                } else {
                    console.log('No animation selected');
                }
            } else {
                console.log('No selected element');
            }
        });
    } else {
        console.error('Preview apply button not found!');
    }

// ✅ NEW: Rail management modal
function openRailManager() {
    // Create rail management modal using existing rail modal styling
    const overlay = document.createElement('div');
    overlay.id = 'rails-overlay';
    overlay.className = 'rails-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'rails-modal';
    
    // Get current rails
    const rails = getSavedRails();
    const railNames = Object.keys(rails).sort();
    
    modal.innerHTML = `
        <div class="rails-modal-header">
            <h3>🛤️ Manage Rails</h3>
            <button id="close-rail-manager" class="rails-close-btn" title="Close">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
        
        <div class="rails-modal-content">
            <div class="rails-form">
                <p class="rails-description" style="color: var(--text-secondary);">
                    Manage your existing rails. Rename or delete rails here.
                </p>
            </div>
            
            <div class="rails-list-section">
                <h4>Existing Rails</h4>
                <div id="rails-list" class="rails-list">
                    ${railNames.length === 0 ? 
                        '<div class="rails-empty">No rails available. Create rails through the main interface first.</div>' :
                        railNames.map(railName => `
                            <div class="rails-item">
                                <div class="rails-item-info">
                                    <div class="rails-item-name">${railName}</div>
                                    <div class="rails-item-details">Created: ${new Date(rails[railName].createdAt).toLocaleDateString()}</div>
                                </div>
                                <div class="rails-item-actions">
                                    <button class="rails-item-btn edit-rail" data-rail="${railName}" title="Edit rail">✏️</button>
                                    <button class="rails-item-btn delete-rail" data-rail="${railName}" title="Delete rail">🗑️</button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event listeners
    document.getElementById('close-rail-manager').addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    
    // Edit rail buttons (rename functionality)
    document.querySelectorAll('.edit-rail').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const railName = e.target.dataset.rail;
            const newName = prompt(`Rename rail "${railName}" to:`, railName);
            if (newName && newName.trim() && newName !== railName) {
                if (typeof renameRail === 'function') {
                    const result = renameRail(railName, newName.trim());
                    if (result.success) {
                        showNotification(`Rail renamed from "${railName}" to "${newName}"!`, 'success');
                        // Close and reopen the modal to refresh the list
                        document.body.removeChild(overlay);
                        openRailManager();
                        // ✅ NEW: Refresh the left panel to show updated animations
                        if (typeof refreshLeftPanel === 'function' && selectedElement) {
                            refreshLeftPanel(selectedElement.getAttribute('id'), selectedElement);
                        }
                    } else {
                        showNotification(`Failed to rename rail: ${result.error}`, 'error');
                    }
                } else {
                    showNotification('Rename rail function not available', 'error');
                }
            }
        });
    });
    
    // Delete rail buttons
    document.querySelectorAll('.delete-rail').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const railName = e.target.dataset.rail;
            if (confirm(`Are you sure you want to delete the rail "${railName}"?`)) {
                if (typeof deleteRail === 'function') {
                    const result = deleteRail(railName);
                    if (result.success) {
                        showNotification(`Rail "${railName}" deleted successfully!`, 'success');
                        // Close and reopen the modal to refresh the list
                        document.body.removeChild(overlay);
                        openRailManager();
                        // ✅ NEW: Refresh the left panel to show updated animations
                        if (typeof refreshLeftPanel === 'function' && selectedElement) {
                            refreshLeftPanel(selectedElement.getAttribute('id'), selectedElement);
                        }
                    } else {
                        showNotification(`Failed to delete rail: ${result.error}`, 'error');
                    }
                } else {
                    showNotification('Delete rail function not available', 'error');
                }
            }
        });
    });
}

// Preview badge management functions
function showPreviewBadge() {
    console.log('showPreviewBadge called');
    const badge = document.getElementById('preview-badge');
    console.log('Badge element:', badge);
    if (badge) {
        badge.classList.remove('hidden');
        console.log('Badge classes after removing hidden:', badge.classList.toString());
        console.log('Badge display style:', window.getComputedStyle(badge).display);
    } else {
        console.error('Preview badge element not found!');
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
    document.getElementById('applied-speed-slider').addEventListener('input', function(e) {
        console.log('Applied speed slider input event triggered');
        
        // Prevent event bubbling to avoid triggering parent click handlers
        e.stopPropagation();
        
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

    // Prevent click events on applied speed slider from bubbling up to parent elements
    document.getElementById('applied-speed-slider').addEventListener('click', function(e) {
        console.log('Applied speed slider click event triggered');
        // Prevent event bubbling to avoid triggering parent click handlers
        e.stopPropagation();
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
            
            console.log('Parameter slider input event triggered');
            
            // Prevent event bubbling to avoid triggering parent click handlers
            e.stopPropagation();
            
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

    // Prevent click events on parameter sliders from bubbling up to parent elements
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('param-slider') && 
            e.target.closest('#applied-param-controls')) {
            console.log('Parameter slider click event triggered');
            // Prevent event bubbling to avoid triggering parent click handlers
            e.stopPropagation();
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
        
        // Don't refresh the entire left panel on every parameter change to avoid interference
        // The animation list UI will be updated when the user finishes editing
    }
}

// Helper function to update animation preview in real-time
function updateAnimationPreview(element, speed, editingAnimation) {
    // ✅ NEW: Handle offset-path animations specially
    if (editingAnimation.animationType === 'offset-path') {
        return updateOffsetPathAnimationPreview(element, speed, editingAnimation);
    }
    
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

// ✅ NEW: Helper function to update offset-path animation preview in real-time
function updateOffsetPathAnimationPreview(element, speed, editingAnimation) {
    console.log('updateOffsetPathAnimationPreview called with:', {
        element: element,
        speed: speed,
        editingAnimation: editingAnimation
    });
    
    // Find the actual element with the offset-path animation
    let actualElement = element;
    if (element.classList.contains('wrapping-group') || element.classList.contains('anim-wrapper')) {
        const shapeElement = element.querySelector('circle, rect, ellipse, path, line, polyline, polygon');
        if (shapeElement) {
            actualElement = shapeElement;
        }
    }
    
    // Check if this element has an offset-path animation
    const currentAnimationId = actualElement.getAttribute('data-offset-path-animation');
    if (!currentAnimationId) {
        console.error('No offset-path animation ID found on element');
        return;
    }
    
    // Get the rail data from the element's data attributes
    const railName = actualElement.getAttribute('data-rail-name');
    if (!railName) {
        console.error('No rail name found on element');
        return;
    }
    
    // Get the rail data
    if (typeof getSavedRails !== 'function') {
        console.error('getSavedRails function not available');
        return;
    }
    
    const rails = getSavedRails();
    if (!rails[railName]) {
        console.error('Rail not found:', railName);
        return;
    }
    
    const railData = rails[railName];
    
    // Get direction from the element's class or data attributes
    // The direction is encoded in the offset-distance value in the existing CSS
    const currentAnimationName = `offset-path-${currentAnimationId}`;
    const existingStyle = document.getElementById(currentAnimationName);
    
    if (!existingStyle) {
        console.error('No existing style tag found with ID:', currentAnimationName);
        return;
    }
    
    // Parse the current CSS to determine direction from the keyframes
    const currentCSS = existingStyle.textContent;
    // Look for the keyframes to determine the intended direction
    // Direction 0: starts at 0%, ends at 100%
    // Direction 1: starts at 100%, ends at 0%
    const keyframesMatch = currentCSS.match(/(100%|to)\s*\{[^}]*offset-distance:\s*(\d+)%/);
    // If keyframes end at 100%, it's direction 0 (normal)
    // If keyframes end at 0%, it's direction 1 (reversed)
    const currentDirection = keyframesMatch ? (parseInt(keyframesMatch[2]) === 100 ? 0 : 1) : 0;
    
    const duration = 8 / speed; // Base duration of 8 seconds adjusted by speed
    const startDistance = currentDirection === 0 ? "0%" : "100%";
    const endDistance = currentDirection === 0 ? "100%" : "0%";
    
    // Update the existing style tag
    const moveAnimationId = currentAnimationId;
    
    const newCSS = `
        .${currentAnimationName} {
            offset-path: path("${railData.pathData}");
            offset-rotate: auto;
            animation: move-${moveAnimationId} ${duration}s linear infinite;
        }
        
            @keyframes move-${moveAnimationId} {
                0% { offset-path: path("${railData.pathData}"); offset-distance: ${startDistance}; }
                100% { offset-path: path("${railData.pathData}"); offset-distance: ${endDistance}; }
            }    `;
    
    existingStyle.textContent = newCSS;
    console.log('Updated offset-path animation preview with speed:', speed, 'duration:', duration, 'direction:', currentDirection);
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
window.updateOffsetPathAnimationPreview = updateOffsetPathAnimationPreview;
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

        // Refresh the left panel to ensure animation count message and names list are properly displayed
        if (typeof refreshLeftPanel === 'function' && selectedElement) {
            refreshLeftPanel(selectedElement.id, selectedElement);
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
