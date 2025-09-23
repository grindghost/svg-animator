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
        delete rails[railName];
        localStorage.setItem(RAILS_STORAGE_KEY, JSON.stringify(rails));
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
                const [x, y] = point.split(',').map(parseFloat);
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

// Export functions for global access
window.getSavedRails = getSavedRails;
window.saveRail = saveRail;
window.deleteRail = deleteRail;
window.renameRail = renameRail;
window.validateRailName = validateRailName;
window.extractPathDataFromElement = extractPathDataFromElement;
