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
    reader.onload = async function(e) {
        try {
            const svgData = e.target.result;
            SVG_BACKUP = svgData;
            
            // Load SVG into Fabric.js canvas
            await loadSVGToFabric(svgData);
            
            // Get SVG element for tree view (we'll use the original SVG data)
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
            const svgElement = svgDoc.documentElement;
            
            if (!svgElement || svgElement.tagName !== 'svg') {
                throw new Error('Invalid SVG content');
            }

            // Create a temporary container to populate tree view
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = svgData;
            const tempSvgRoot = tempContainer.querySelector('svg');
            
            prepopulateLocalStorage(tempSvgRoot);
            populateTreeView(tempSvgRoot);
            saveCurrentStateAsClean();
            
            // Mark viewer as having content
            const svgViewer = document.getElementById('svg-viewer');
            svgViewer.classList.add('has-content');
            
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
            clearCanvas();
            const svgViewer = document.getElementById('svg-viewer');
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
    
    // Use Fabric.js export if available, otherwise fall back to original method
    if (typeof exportSVGFromFabric === 'function' && isCanvasInitialized()) {
        try {
            const svgString = exportSVGFromFabric();
            if (svgString) {
                downloadSVGString(svgString, 'animated-svg.svg');
                return;
            }
        } catch (error) {
            console.warn('Fabric.js export failed, falling back to original method:', error);
        }
    }
    
    // Fallback to original method if Fabric.js is not available
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

// Helper function to download SVG string
function downloadSVGString(svgString, filename) {
    const blob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    updateStatusBar('SVG downloaded successfully! 🎉');
}

// Export functions for use in other modules
window.handleSVGUpload = handleSVGUpload;
window.downloadAnimatedSVG = downloadAnimatedSVG;
