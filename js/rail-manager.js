// Rail Management functionality
// SVG Animator Pro - Rail Manager Module

// Local storage key for rails
const RAILS_STORAGE_KEY = 'svg-animation-rails';

// Get saved rails from localStorage
function getSavedRails() {
    const savedData = localStorage.getItem(RAILS_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
}

// Save rail to localStorage
function saveRail(railName, pathData) {
    const rails = getSavedRails();
    
    // Validate rail name
    const validation = validateRailName(railName);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }
    
    // Save rail data
    rails[railName] = {
        name: railName,
        pathData: pathData,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem(RAILS_STORAGE_KEY, JSON.stringify(rails));
    
    return { success: true };
}

// Delete rail from localStorage
function deleteRail(railName) {
    const rails = getSavedRails();
    
    if (rails[railName]) {
        // ✅ NEW: Remove all offset-path animations that use this rail
        removeAnimationsWithDeletedRail(railName);
        
        delete rails[railName];
        localStorage.setItem(RAILS_STORAGE_KEY, JSON.stringify(rails));
        
        // ✅ NEW: Refresh rail dropdowns in the UI
        refreshRailDropdowns();
        
        return { success: true };
    }
    
    return { success: false, error: 'Rail not found' };
}

// Rename rail
function renameRail(oldName, newName) {
    const rails = getSavedRails();
    
    if (!rails[oldName]) {
        return { success: false, error: 'Rail not found' };
    }
    
    // Validate new name
    const validation = validateRailName(newName);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }
    
    // Check if new name already exists
    if (rails[newName] && newName !== oldName) {
        return { success: false, error: 'Rail name already exists' };
    }
    
    // Rename rail
    const railData = rails[oldName];
    railData.name = newName;
    rails[newName] = railData;
    delete rails[oldName];
    
    localStorage.setItem(RAILS_STORAGE_KEY, JSON.stringify(rails));
    
    // ✅ NEW: Update all offset-path animations that reference this rail
    updateAnimationsWithRenamedRail(oldName, newName);
    
    // ✅ NEW: Refresh rail dropdowns in the UI
    refreshRailDropdowns();
    
    return { success: true };
}

// Validate rail name
function validateRailName(name) {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
        return { valid: false, error: 'Rail name is required' };
    }
    
    if (trimmedName.length < 1) {
        return { valid: false, error: 'Rail name must be at least 1 character' };
    }
    
    if (trimmedName.length > 50) {
        return { valid: false, error: 'Rail name must be less than 50 characters' };
    }
    
    // Check if name already exists
    const rails = getSavedRails();
    if (rails[trimmedName]) {
        return { valid: false, error: 'Rail name already exists', canOverride: true };
    }
    
    return { valid: true, canOverride: false };
}

// Extract path data from element
function extractPathDataFromElement(element) {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'path') {
        const d = element.getAttribute('d') || '';
        return d;
    } else if (['circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect'].includes(tagName)) {
        // For shape elements, we need to convert them to path data
        // This is a simplified approach - in a real implementation, you might want to use
        // a library like SVGPathData or similar to properly convert shapes to paths
        const pathData = convertShapeToPath(element);
        return pathData;
    }
    
    return '';
}

// Convert shape element to path data (simplified)
function convertShapeToPath(element) {
    const tagName = element.tagName.toLowerCase();
    
    switch (tagName) {
        case 'circle':
            const cx = parseFloat(element.getAttribute('cx') || 0);
            const cy = parseFloat(element.getAttribute('cy') || 0);
            const r = parseFloat(element.getAttribute('r') || 0);
            const circlePath = `M ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy}`;
            return circlePath;
            
        case 'ellipse':
            const ecx = parseFloat(element.getAttribute('cx') || 0);
            const ecy = parseFloat(element.getAttribute('cy') || 0);
            const rx = parseFloat(element.getAttribute('rx') || 0);
            const ry = parseFloat(element.getAttribute('ry') || 0);
            return `M ${ecx - rx},${ecy} A ${rx},${ry} 0 1,1 ${ecx + rx},${ecy} A ${rx},${ry} 0 1,1 ${ecx - rx},${ecy}`;
            
        case 'rect':
            const x = parseFloat(element.getAttribute('x') || 0);
            const y = parseFloat(element.getAttribute('y') || 0);
            const width = parseFloat(element.getAttribute('width') || 0);
            const height = parseFloat(element.getAttribute('height') || 0);
            const rectRx = parseFloat(element.getAttribute('rx') || 0);
            const rectRy = parseFloat(element.getAttribute('ry') || 0);
            
            if (rectRx > 0 || rectRy > 0) {
                // Rounded rectangle
                return `M ${x + rectRx},${y} L ${x + width - rectRx},${y} Q ${x + width},${y} ${x + width},${y + rectRy} L ${x + width},${y + height - rectRy} Q ${x + width},${y + height} ${x + width - rectRx},${y + height} L ${x + rectRx},${y + height} Q ${x},${y + height} ${x},${y + height - rectRy} L ${x},${y + rectRy} Q ${x},${y} ${x + rectRx},${y}`;
            } else {
                // Regular rectangle
                return `M ${x},${y} L ${x + width},${y} L ${x + width},${y + height} L ${x},${y + height} Z`;
            }
            
        case 'line':
            const x1 = parseFloat(element.getAttribute('x1') || 0);
            const y1 = parseFloat(element.getAttribute('y1') || 0);
            const x2 = parseFloat(element.getAttribute('x2') || 0);
            const y2 = parseFloat(element.getAttribute('y2') || 0);
            return `M ${x1},${y1} L ${x2},${y2}`;
            
        case 'polyline':
        case 'polygon':
            const points = element.getAttribute('points') || '';
            const pointPairs = points.trim().split(/\s+/);
            let pathData = '';
            
            pointPairs.forEach((point, index) => {
                // Handle both comma-separated (x,y) and space-separated (x y) formats
                let x, y;
                if (point.includes(',')) {
                    // Comma-separated format: "x,y"
                    [x, y] = point.split(',').map(parseFloat);
                } else {
                    // Space-separated format: "x y" - need to pair up coordinates
                    const coords = points.trim().split(/\s+/).map(parseFloat);
                    if (index * 2 + 1 < coords.length) {
                        x = coords[index * 2];
                        y = coords[index * 2 + 1];
                    } else {
                        return; // Skip if we don't have enough coordinates
                    }
                }
                
                if (index === 0) {
                    pathData += `M ${x},${y}`;
                } else {
                    pathData += ` L ${x},${y}`;
                }
            });
            
            if (tagName === 'polygon') {
                pathData += ' Z';
            }
            
            return pathData;
            
        default:
            return '';
    }
}

// ✅ NEW: Update all offset-path animations that reference a renamed rail
function updateAnimationsWithRenamedRail(oldRailName, newRailName) {
    if (typeof getSavedAnimations !== 'function') {
        console.warn('getSavedAnimations function not available');
        return;
    }
    
    const savedAnimations = getSavedAnimations();
    let hasChanges = false;
    
    // Iterate through all elements and their animations
    Object.keys(savedAnimations.animations).forEach(elementId => {
        const elementAnimations = savedAnimations.animations[elementId];
        
        Object.keys(elementAnimations).forEach(animationId => {
            const animationData = elementAnimations[animationId];
            
            // Check if this is an offset-path animation that uses the renamed rail
            if (animationData.type === 'offset-path' && animationData.params && animationData.params.rail === oldRailName) {
                // Update the rail reference
                animationData.params.rail = newRailName;
                hasChanges = true;
                
                console.log(`Updated offset-path animation ${animationId} on element ${elementId} to use rail "${newRailName}"`);
            }
        });
    });
    
    // Save the updated animations if there were changes
    if (hasChanges) {
        localStorage.setItem('svg-animations', JSON.stringify(savedAnimations));
        console.log(`Updated ${Object.keys(savedAnimations.animations).length} elements with renamed rail references`);
    }
}

// ✅ NEW: Remove all offset-path animations that use a deleted rail
function removeAnimationsWithDeletedRail(railName) {
    if (typeof getSavedAnimations !== 'function') {
        console.warn('getSavedAnimations function not available');
        return;
    }
    
    const savedAnimations = getSavedAnimations();
    let hasChanges = false;
    let removedCount = 0;
    
    // Iterate through all elements and their animations
    Object.keys(savedAnimations.animations).forEach(elementId => {
        const elementAnimations = savedAnimations.animations[elementId];
        const animationsToRemove = [];
        
        Object.keys(elementAnimations).forEach(animationId => {
            const animationData = elementAnimations[animationId];
            
            // Check if this is an offset-path animation that uses the deleted rail
            if (animationData.type === 'offset-path' && animationData.params && animationData.params.rail === railName) {
                animationsToRemove.push(animationId);
                hasChanges = true;
                removedCount++;
                
                console.log(`Marking offset-path animation ${animationId} on element ${elementId} for removal (uses deleted rail "${railName}")`);
            }
        });
        
        // Remove the marked animations
        animationsToRemove.forEach(animationId => {
            delete elementAnimations[animationId];
        });
        
        // If no animations left for this element, remove the element entirely
        if (Object.keys(elementAnimations).length === 0) {
            delete savedAnimations.animations[elementId];
        }
    });
    
    // Save the updated animations if there were changes
    if (hasChanges) {
        localStorage.setItem('svg-animations', JSON.stringify(savedAnimations));
        console.log(`Removed ${removedCount} offset-path animations that used deleted rail "${railName}"`);
        
        // ✅ NEW: Also remove the animations from the DOM
        removeOffsetPathAnimationsFromDOM(railName);
    }
}

// ✅ NEW: Remove offset-path animations from DOM elements
function removeOffsetPathAnimationsFromDOM(railName) {
    // Find all elements with offset-path animations
    const elementsWithOffsetPath = document.querySelectorAll('[data-offset-path-animation]');
    
    elementsWithOffsetPath.forEach(element => {
        const animationId = element.getAttribute('data-offset-path-animation');
        const elementId = element.getAttribute('id');
        const dataRailName = element.getAttribute('data-rail-name');
        
        // Check if this element uses the deleted rail (either from localStorage or data attributes)
        let shouldRemove = false;
        
        if (typeof getSavedAnimations === 'function' && elementId) {
            const savedAnimations = getSavedAnimations();
            
            // Check if the animation still exists in localStorage
            if (savedAnimations.animations[elementId] && savedAnimations.animations[elementId][animationId]) {
                const animationData = savedAnimations.animations[elementId][animationId];
                
                if (animationData.type === 'offset-path' && animationData.params && animationData.params.rail === railName) {
                    shouldRemove = true;
                }
            } else if (dataRailName === railName) {
                // Animation data was already removed from localStorage, but element has data-rail-name attribute
                shouldRemove = true;
            }
        } else if (dataRailName === railName) {
            // Fallback: check data-rail-name attribute
            shouldRemove = true;
        }
        
        if (shouldRemove) {
            // Use the existing removeOffsetPathAnimation function if possible
            if (typeof removeOffsetPathAnimation === 'function' && elementId && typeof getSavedAnimations === 'function') {
                const savedAnimations = getSavedAnimations();
                if (savedAnimations.animations[elementId] && savedAnimations.animations[elementId][animationId]) {
                    removeOffsetPathAnimation(element);
                    console.log(`Removed offset-path animation from DOM element ${elementId}`);
                } else {
                    // Animation data was already removed, clean up manually
                    cleanupOrphanedOffsetPathAnimation(element);
                }
            } else {
                // Clean up manually
                cleanupOrphanedOffsetPathAnimation(element);
            }
        }
    });
}

// ✅ NEW: Clean up orphaned offset-path animations (when localStorage data is already removed)
function cleanupOrphanedOffsetPathAnimation(element) {
    const animationId = element.getAttribute('data-offset-path-animation');
    if (!animationId) return;
    
    // Remove animation classes
    const animationName = `offset-path-${animationId}`;
    element.classList.remove(animationName);
    element.classList.remove('application-animation-class');
    
    // Remove the style tag
    const styleTag = document.getElementById(animationName);
    if (styleTag) {
        styleTag.remove();
    }
    
    // Restore original position from data attributes
    const originalCx = element.getAttribute('data-original-cx');
    const originalCy = element.getAttribute('data-original-cy');
    const originalX = element.getAttribute('data-original-x');
    const originalY = element.getAttribute('data-original-y');
    
    if (element.tagName.toLowerCase() === 'circle' || element.tagName.toLowerCase() === 'ellipse') {
        if (originalCx) element.setAttribute('cx', originalCx);
        if (originalCy) element.setAttribute('cy', originalCy);
    } else if (element.tagName.toLowerCase() === 'rect') {
        if (originalX) element.setAttribute('x', originalX);
        if (originalY) element.setAttribute('y', originalY);
    }
    
    // Clean up data attributes
    element.removeAttribute('data-offset-path-animation');
    element.removeAttribute('data-original-cx');
    element.removeAttribute('data-original-cy');
    element.removeAttribute('data-original-x');
    element.removeAttribute('data-original-y');
    element.removeAttribute('data-rail-name');
    
    console.log(`Cleaned up orphaned offset-path animation from element ${element.id}`);
}

// ✅ NEW: Refresh all rail dropdowns in the UI
function refreshRailDropdowns() {
    // Get current rails
    const rails = getSavedRails();
    const railNames = Object.keys(rails).sort();
    
    // Find all rail dropdowns in the UI
    const railDropdowns = document.querySelectorAll('.param-dropdown[data-param="rail"], #rail-selection-dropdown');
    
    railDropdowns.forEach(dropdown => {
        // Store the current selected value
        const currentValue = dropdown.value;
        
        // Clear existing options (except the first default option)
        const defaultOption = dropdown.querySelector('option[value=""]');
        dropdown.innerHTML = '';
        
        // Add back the default option
        if (defaultOption) {
            dropdown.appendChild(defaultOption);
        } else {
            // Create default option if it doesn't exist
            const newDefaultOption = document.createElement('option');
            newDefaultOption.value = '';
            newDefaultOption.textContent = 'Select a rail...';
            dropdown.appendChild(newDefaultOption);
        }
        
        // Add all available rails
        railNames.forEach(railName => {
            const option = document.createElement('option');
            option.value = railName;
            option.textContent = railName;
            dropdown.appendChild(option);
        });
        
        // Restore the selected value if it still exists
        if (currentValue && railNames.includes(currentValue)) {
            dropdown.value = currentValue;
        } else {
            dropdown.value = '';
        }
    });
    
    console.log(`Refreshed ${railDropdowns.length} rail dropdowns with ${railNames.length} rails`);
}

// Export functions for global access
window.getSavedRails = getSavedRails;
window.saveRail = saveRail;
window.deleteRail = deleteRail;
window.renameRail = renameRail;
window.validateRailName = validateRailName;
window.extractPathDataFromElement = extractPathDataFromElement;
window.updateAnimationsWithRenamedRail = updateAnimationsWithRenamedRail;
window.removeAnimationsWithDeletedRail = removeAnimationsWithDeletedRail;
window.removeOffsetPathAnimationsFromDOM = removeOffsetPathAnimationsFromDOM;
window.cleanupOrphanedOffsetPathAnimation = cleanupOrphanedOffsetPathAnimation;
window.refreshRailDropdowns = refreshRailDropdowns;
