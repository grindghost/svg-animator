// File upload, download, and drag & drop functionality
// SVG Animator Pro - File Handler Module

// Handle SVG file upload
function handleSVGUpload(event) {
    clearAllAnimations();
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.svg')) {
        updateStatusBar('Please select a valid SVG file! ❌');
        return;
    }
    
    updateStatusBar('Loading SVG file... 📁');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const svgData = e.target.result;
            SVG_BACKUP = svgData;
            
            const svgViewer = document.getElementById('svg-viewer');
            svgViewer.innerHTML = svgData;
            svgViewer.classList.add('has-content');
            
            svgRoot = document.querySelector('#svg-viewer svg');
            
            if (!svgRoot) {
                throw new Error('Invalid SVG content');
            }

            prepopulateLocalStorage(svgRoot);
            
            // Process clipPath elements first - move them from defs to consuming elements
            processClipPathElements(svgRoot);
            
            populateTreeView(svgRoot);
            saveCurrentStateAsClean();
            initializeHoverAndSelect();
            setupSVGViewerTooltip();
            
            // Show named destinations section and update UI
            if (typeof updateNamedDestinationsUI === 'function') {
                const namedDestinationsSection = document.getElementById('named-destinations-section');
                if (namedDestinationsSection) {
                    namedDestinationsSection.classList.remove('hidden');
                }
                updateNamedDestinationsUI();
            }
            
            // Re-initialize context menu for new SVG content
            if (typeof reinitializeContextMenu === 'function') {
                reinitializeContextMenu();
            }
            
            updateStatusBar(`SVG loaded: ${file.name} ✨`);
            
            // Enable controls
            document.getElementById('download-svg').disabled = false;
            document.getElementById('clear-cache').disabled = false;
            // Update dropdown states
            if (typeof updateDropdownStates === 'function') {
                updateDropdownStates();
            }
            
            // Show bounds control now that SVG is loaded
            if (typeof showBoundsControl === 'function') {
                showBoundsControl();
            }
            
            // Hide upload section after successful import
            hideUploadSection();
            
            // Show success message
            showNotification('SVG loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error processing SVG:', error);
            updateStatusBar('Error processing SVG file! ❌');
            showNotification('Failed to load SVG file. Please check the file format.', 'error');
            
            // Reset viewer
            const svgViewer = document.getElementById('svg-viewer');
            svgViewer.innerHTML = `
                <div class="placeholder-text">
                    <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 16px;">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414l-3.853 3.853A1 1 0 0 1 1 15.5V2zm5 4a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm4 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm3 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0z"/>
                    </svg>
                    <p>Upload an SVG file to see it here</p>
                </div>
            `;
            svgViewer.classList.remove('has-content');
            
            // Show upload section on error
            showUploadSection();
        }
    };
    
    reader.onerror = function() {
        updateStatusBar('Error loading SVG file! ❌');
        showNotification('Failed to read the file. Please try again.', 'error');
        
        // Show upload section on error
        showUploadSection();
    };
    
    reader.readAsText(file);
}

// Download animated SVG
function downloadAnimatedSVG() {
    updateStatusBar('Preparing SVG for download... 💾');
    
    const svgBackup = svgRoot.cloneNode(true);

    // Check if bounds were visible before removing them
    const boundsWereVisible = document.getElementById('svg-bounds') !== null;
    const toggleButton = document.getElementById('toggle-bounds');

    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    // Remove bounds visualization
    if (document.getElementById('svg-bounds')) {
        document.getElementById('svg-bounds').remove();
    }
    if (document.getElementById('svg-bounds-group')) {
        document.getElementById('svg-bounds-group').remove();
    }

    removeHandles();

    // Include external styles if no internal styles exist
    const externalStyle = document.querySelector('style');
    if (externalStyle && !svgRoot.querySelector('style')) {
        const embeddedStyle = externalStyle.cloneNode(true);
        svgRoot.prepend(embeddedStyle);
    }
    
    // ✅ NEW: Ensure all dynamic style tags are included in the SVG
    // This is crucial for offset-path animations and other dynamic animations
    const allStyleTags = document.querySelectorAll('style');
    allStyleTags.forEach(styleTag => {
        // Skip if this style tag is already inside the SVG
        if (svgRoot.contains(styleTag)) {
            return;
        }
        
        // Check if this style tag contains animation keyframes or offset-path properties
        const styleContent = styleTag.textContent || styleTag.innerHTML;
        if (styleContent.includes('@keyframes') || styleContent.includes('offset-path') || styleContent.includes('offset-distance')) {
            // Clone the style tag and add it to the SVG
            const clonedStyle = styleTag.cloneNode(true);
            svgRoot.prepend(clonedStyle);
        }
    });

    const existingMetadata = svgRoot.querySelector('metadata');
    if (!existingMetadata) {
        const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        
        // Create comprehensive metadata including animation parameters
        const metadataContent = {
            version: '1.0',
            animations: getSavedAnimations()
        };
        
        metadata.textContent = JSON.stringify(metadataContent);
        svgRoot.prepend(metadata);
    }

    // Get SVG content and minify it
    let svgContent = svgRoot.outerHTML;
    
    // Apply SVG minification if the library is available
    if (typeof SVGO !== 'undefined') {
        updateStatusBar('Optimizing SVG for smaller file size... ⚡');
        
        try {
            const originalSize = new Blob([svgContent]).size;
            
            // Use svg-minifier to optimize the SVG
            const minifiedContent = SVGO.optimize(svgContent);
            svgContent = minifiedContent;
            
            const optimizedSize = new Blob([svgContent]).size;
            const reduction = originalSize - optimizedSize;
            const reductionPercent = ((reduction / originalSize) * 100).toFixed(1);
            
            if (reduction > 0) {
                updateStatusBar(`SVG optimized! Size reduced by ${reductionPercent}% (${(reduction / 1024).toFixed(1)}KB saved) 🎯`);
                showNotification(`SVG optimized! Size reduced by ${reductionPercent}%`, 'success');
            } else {
                updateStatusBar('SVG already optimized! 📦');
            }
        } catch (error) {
            console.warn('SVG optimization failed, using original content:', error);
            updateStatusBar('Using original SVG (optimization failed) ⚠️');
        }
    }

    const blob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animated.svg';
    link.click();

    // Restore bounds visualization if it was visible
    if (boundsWereVisible && toggleButton) {
        toggleButton.classList.add('active');
        visualizeSVGBounds(true);
    }

    updateStatusBar('SVG downloaded successfully! 🎉');
}

// Clear SVG viewer and show upload section
function clearSVGViewer() {
    const svgViewer = document.getElementById('svg-viewer');
    svgViewer.innerHTML = `
        <div class="placeholder-text">
            <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 16px;">
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.414l-3.853 3.853A1 1 0 0 1 1 15.5V2zm5 4a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm4 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0zm3 0a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0z"/>
            </svg>
            <p>Upload an SVG file to see it here</p>
        </div>
    `;
    svgViewer.classList.remove('has-content');
    
    // Clear the element tree
    const elementTree = document.getElementById('element-tree');
    if (elementTree) {
        elementTree.innerHTML = '<div class="placeholder-text">No SVG loaded</div>';
    }
    
    // Clear animations list
    const animationList = document.getElementById('animation-list-div');
    if (animationList) {
        animationList.innerHTML = '<div class="placeholder-text">No animations applied yet</div>';
    }
    
    // Hide bounds control since no SVG is loaded
    if (typeof hideBoundsControl === 'function') {
        hideBoundsControl();
    }
    
    // Show upload section again
    showUploadSection();
    
    // Disable controls
    document.getElementById('download-svg').disabled = true;
    document.getElementById('clear-cache').disabled = true;
    // Update dropdown states
    if (typeof updateDropdownStates === 'function') {
        updateDropdownStates();
    }
    
    // Hide controls section
    hideControlsSection();
    
    // Clear global variables
    svgRoot = null;
    SVG_BACKUP = null;
    
    // Clear localStorage
    clearAllAnimations();
    
    // Reinitialize placeholder click functionality
    initializePlaceholderClick();
    
    updateStatusBar('SVG viewer cleared. Ready for a new file! 🗑️');
}

// Export functions for use in other modules
window.handleSVGUpload = handleSVGUpload;
window.downloadAnimatedSVG = downloadAnimatedSVG;
window.clearSVGViewer = clearSVGViewer;
