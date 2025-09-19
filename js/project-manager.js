// Project export and import functionality
// SVG Animator Pro - Project Manager Module

// Export current project as .svganim file
async function exportProject() {
    try {
        updateStatusBar('Preparing project for export... 📦');
        
        // Check if we have an SVG loaded
        if (!svgRoot) {
            showNotification('No SVG loaded to export!', 'error');
            return;
        }
        
        // Get current localStorage data
        const animationsData = getSavedAnimations();
        const projectData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            animations: animationsData.animations,
            namedDestinations: animationsData.namedDestinations || { destinations: {} },
            svgBackup: SVG_BACKUP || ''
        };
        
        // Create a clean SVG for export (without selection boxes, bounds, etc.)
        const exportSvg = svgRoot.cloneNode(true);
        
        // Remove UI elements that shouldn't be in the exported SVG
        const elementsToRemove = exportSvg.querySelectorAll('#selection-box, #svg-bounds, #svg-bounds-group');
        elementsToRemove.forEach(el => el.remove());
        
        // Remove handles
        const handles = exportSvg.querySelectorAll('.handle');
        handles.forEach(handle => handle.remove());
        
        // Remove temporary animation styles
        const tempStyles = exportSvg.querySelectorAll('style[id^="temp-"]');
        tempStyles.forEach(style => style.remove());
        
        // Get SVG content and minify it
        let svgContent = exportSvg.outerHTML;
        
        // Apply SVG minification if the library is available
        if (typeof SVGO !== 'undefined') {
            try {
                // Use svg-minifier to optimize the SVG
                const minifiedContent = SVGO.optimize(svgContent);
                svgContent = minifiedContent;
            } catch (error) {
                console.warn('SVG optimization failed during project export, using original content:', error);
            }
        }

        // Create project object
        const project = {
            metadata: projectData,
            svg: svgContent
        };
        
        // Convert to JSON
        const projectJson = JSON.stringify(project, null, 2);
        
        // Create and download the .svganim file
        const blob = new Blob([projectJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Generate filename based on current date/time
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `svg-animator-project-${timestamp}.svganim`;
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        
        updateStatusBar('Project exported successfully! 🎉');
        showNotification('Project exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting project:', error);
        updateStatusBar('Error exporting project! ❌');
        showNotification('Failed to export project. Please try again.', 'error');
    }
}

// Import project from .svganim file
async function importProject(file) {
    try {
        updateStatusBar('Importing project... 📥');
        
        const text = await file.text();
        const project = JSON.parse(text);
        
        // Validate project format
        if (!project.metadata || !project.svg) {
            throw new Error('Invalid project file format');
        }
        
        // Clear current state
        clearAllAnimations();
        
        // Load the SVG
        const svgViewer = document.getElementById('svg-viewer');
        svgViewer.innerHTML = project.svg;
        svgViewer.classList.add('has-content');
        
        // Update global variables
        svgRoot = document.querySelector('#svg-viewer svg');
        SVG_BACKUP = project.metadata.svgBackup || project.svg;
        
        if (!svgRoot) {
            throw new Error('Invalid SVG content in project file');
        }

        // ✅ NEW: Notify App store about SVG load
        if (window.App) {
            window.App.setSVG(svgRoot);
        }
        
        // Restore localStorage data (integrated structure)
        const animationsData = {
            animations: project.metadata.animations || {},
            namedDestinations: project.metadata.namedDestinations || { destinations: {} }
        };
        localStorage.setItem('svg-animations', JSON.stringify(animationsData));
        markAsUnsaved(); // Mark as unsaved when importing project
        
        // Rebuild UI
        prepopulateLocalStorage(svgRoot);
        
        // Process clipPath elements first - move them from defs to consuming elements
        processClipPathElements(svgRoot);
        
        populateTreeView(svgRoot);
        saveCurrentStateAsClean();
        initializeHoverAndSelect();
        
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
        
        // Show named destinations section and update UI
        if (typeof updateNamedDestinationsUI === 'function') {
            const namedDestinationsSection = document.getElementById('named-destinations-section');
            if (namedDestinationsSection) {
                namedDestinationsSection.classList.remove('hidden');
            }
            updateNamedDestinationsUI();
        }
        
        // Hide upload section after successful project import
        hideUploadSection();
        
        updateStatusBar(`Project imported: ${file.name} ✨`);
        showNotification('Project imported successfully!', 'success');
        
    } catch (error) {
        console.error('Error importing project:', error);
        updateStatusBar('Error importing project! ❌');
        showNotification('Failed to import project. Please check the file format.', 'error');
    }
}

// Handle file input for project import
function handleProjectImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.name.endsWith('.svganim')) {
        importProject(file);
    } else {
        showNotification('Please select a valid .svganim project file!', 'error');
    }
    
    // Reset file input
    event.target.value = '';
}

// Enable/disable export button based on SVG state
function updateExportButtonState() {
    const exportButton = document.getElementById('export-project');
    if (exportButton) {
        exportButton.disabled = !svgRoot;
    }
}

// Export functions for use in other modules
window.exportProject = exportProject;
window.importProject = importProject;
window.handleProjectImport = handleProjectImport;
window.updateExportButtonState = updateExportButtonState;
