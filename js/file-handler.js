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
            populateTreeView(svgRoot);
            saveCurrentStateAsClean();
            initializeHoverAndSelect();
            
            updateStatusBar(`SVG loaded: ${file.name} ✨`);
            
            // Enable controls
            document.getElementById('download-svg').disabled = false;
            document.getElementById('clear-cache').disabled = false;
            
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
        }
    };
    
    reader.onerror = function() {
        updateStatusBar('Error loading SVG file! ❌');
        showNotification('Failed to read the file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
}

// Download animated SVG
function downloadAnimatedSVG() {
    updateStatusBar('Preparing SVG for download... 💾');
    
    const svgBackup = svgRoot.cloneNode(true);

    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    removeHandles();

    const externalStyle = document.querySelector('style');
    if (externalStyle && !svgRoot.querySelector('style')) {
        const embeddedStyle = externalStyle.cloneNode(true);
        svgRoot.prepend(embeddedStyle);
    }

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

    const blob = new Blob([svgRoot.outerHTML], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'animated.svg';
    link.click();

    updateStatusBar('SVG downloaded successfully! 🎉');
}

// Export functions for use in other modules
window.handleSVGUpload = handleSVGUpload;
window.downloadAnimatedSVG = downloadAnimatedSVG;
