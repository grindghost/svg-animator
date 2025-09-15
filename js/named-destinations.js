// Named Destinations functionality for SVG Animator Pro
// SVG Animator Pro - Named Destinations Module

// Get saved named destinations from localStorage (integrated with svg-animations)
function getNamedDestinations() {
    const savedData = localStorage.getItem('svg-animations');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            return data.namedDestinations || { destinations: {} };
        } catch (error) {
            console.warn('Error parsing named destinations data:', error);
            return { destinations: {} };
        }
    }
    
    // Migration: Check for old separate localStorage key and migrate if found
    const oldData = localStorage.getItem('svg-named-destinations');
    if (oldData) {
        try {
            const oldNamedDestinations = JSON.parse(oldData);
            // Migrate to integrated structure
            const animationsData = getSavedAnimations();
            animationsData.namedDestinations = oldNamedDestinations;
            localStorage.setItem('svg-animations', JSON.stringify(animationsData));
            // Remove old key
            localStorage.removeItem('svg-named-destinations');
            console.log('Migrated named destinations to integrated structure');
            return oldNamedDestinations;
        } catch (error) {
            console.warn('Error migrating named destinations data:', error);
            localStorage.removeItem('svg-named-destinations'); // Clean up corrupted data
        }
    }
    
    return { destinations: {} };
}

// Save named destinations to localStorage (integrated with svg-animations)
function saveNamedDestinations(namedDestinationsData) {
    const data = getSavedAnimations();
    data.namedDestinations = namedDestinationsData;
    localStorage.setItem('svg-animations', JSON.stringify(data));
    markAsUnsaved(); // Mark as unsaved when saving named destinations
}

// Create a named destination for an element
function createNamedDestination(elementId, element, animationType, animationElementId = null, specificAnimationId = null) {
    const data = getNamedDestinations();
    
    // If the element is a wrapper (anim-wrapper or wrapping-group), find the original element inside it
    let originalElement = element;
    if (element.classList.contains('anim-wrapper') || element.classList.contains('wrapping-group')) {
        // Find the first child element that's not another wrapper
        const childElements = element.children;
        for (let child of childElements) {
            if (!child.classList.contains('anim-wrapper') && !child.classList.contains('wrapping-group')) {
                originalElement = child;
                break;
            }
        }
    }
    
    // Ensure original element has an ID for consistent treeview lookup
    let actualElementId = originalElement.id;
    if (!actualElementId) {
        // Generate a unique ID for elements without one
        actualElementId = `element-${uniqueID()}`;
        originalElement.id = actualElementId;
    }
    
    // Check if element already has a named destination
    if (data.destinations[actualElementId]) {
        return data.destinations[actualElementId].id; // Return existing destination ID
    }
    
    // Generate unique ID for this destination
    const destinationId = uniqueID();
    
    // Create default name based on original element and animation
    const elementTag = originalElement.tagName.toLowerCase();
    let defaultName;
    
    // Check if original element has a previously saved custom name
    const savedName = originalElement.getAttribute('data-animation-name');
    if (savedName) {
        // Use the saved custom name
        defaultName = savedName;
    } else {
        // If element has an ID, use it in the name
        if (actualElementId && actualElementId !== elementTag) {
            defaultName = `${actualElementId} (${animationType})`;
        } else {
            // For elements without IDs, use tag name
            defaultName = `${elementTag} (${animationType})`;
        }
    }
    
    // Store destination data
    data.destinations[actualElementId] = {
        id: destinationId,
        elementId: actualElementId,
        name: defaultName,
        animationType: animationType,
        animationElementId: animationElementId,  // Store the elementId where animations are stored
        specificAnimationId: specificAnimationId,  // Store the specific animation ID
        createdAt: new Date().toISOString()
    };
    
    saveNamedDestinations(data);
    updateNamedDestinationsUI();
    
    return destinationId;
}

// Update named destination name
function updateNamedDestinationName(destinationId, newName) {
    const data = getNamedDestinations();
    
    // Find the destination by ID
    for (const elementId in data.destinations) {
        if (data.destinations[elementId].id === destinationId) {
            // Trim to 50 characters as requested
            const trimmedName = newName.trim().substring(0, 50);
            data.destinations[elementId].name = trimmedName;
            
            // Save the custom name to the element's attribute for persistence
            // Try to find the original element (not wrapped in animation wrapper)
            let element = document.querySelector(`#${elementId}`);
            if (!element) {
                // If not found by ID, try to find by tag name (for elements without IDs)
                const elements = document.querySelectorAll(elementId);
                if (elements.length > 0) {
                    element = elements[0]; // Take the first one
                }
            }
            
            if (element) {
                element.setAttribute('data-animation-name', trimmedName);
            }
            
            saveNamedDestinations(data);
            updateNamedDestinationsUI();
            return true;
        }
    }
    
    return false;
}

// Delete a named destination
function deleteNamedDestination(destinationId) {
    const data = getNamedDestinations();
    
    // Find and remove the destination by ID
    for (const elementId in data.destinations) {
        if (data.destinations[elementId].id === destinationId) {
            // Remove the custom name attribute from the element when explicitly deleting
            // Try to find the original element (not wrapped in animation wrapper)
            let element = document.querySelector(`#${elementId}`);
            if (!element) {
                // If not found by ID, try to find by tag name (for elements without IDs)
                const elements = document.querySelectorAll(elementId);
                if (elements.length > 0) {
                    element = elements[0]; // Take the first one
                }
            }
            
            if (element) {
                element.removeAttribute('data-animation-name');
            }
            
            delete data.destinations[elementId];
            saveNamedDestinations(data);
            updateNamedDestinationsUI();
            return true;
        }
    }
    
    return false;
}

// Select element by named destination
function selectElementByDestination(destinationId) {
    const data = getNamedDestinations();
    
    // Find the destination by ID
    for (const elementId in data.destinations) {
        if (data.destinations[elementId].id === destinationId) {
            const destination = data.destinations[elementId];
            const element = document.getElementById(destination.elementId);
            
            if (element) {
                console.log('selectElementByDestination - simulating click on element:', element);
                // Simulate a click on the SVG element to trigger the same behavior as direct clicking
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                element.dispatchEvent(clickEvent);
                updateStatusBar(`Selected: ${destination.name} ✨`);
                return true;
            } else {
                updateStatusBar(`Element not found: ${destination.name} ❌`);
                return false;
            }
        }
    }
    
    return false;
}

// Update the named destinations UI
function updateNamedDestinationsUI() {
    const container = document.getElementById('named-destinations-container');
    if (!container) return;
    
    const data = getNamedDestinations();
    const destinations = Object.values(data.destinations);
    
    // Clear existing content
    container.innerHTML = '';
    
    if (destinations.length === 0) {
        container.innerHTML = '<div class="named-destinations-empty">No named destinations yet</div>';
        return;
    }
    
    // Create destination tags
    destinations.forEach(destination => {
        const tag = createDestinationTag(destination);
        container.appendChild(tag);
    });
}

// Create a destination tag element
function createDestinationTag(destination) {
    const tag = document.createElement('div');
    tag.className = 'named-destination-tag';
    tag.dataset.destinationId = destination.id;
    
    tag.innerHTML = `
        <span class="destination-name" title="${destination.name}">${destination.name}</span>
        <button class="destination-edit-btn" title="Edit name">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L9.5 10.5 6 7l3.146-3.146a.5.5 0 0 1 .708 0z"/>
                <path d="M6.5 7.5L10 11l-3.5 3.5L3 11l3.5-3.5z"/>
            </svg>
        </button>
        <button class="destination-delete-btn" title="Delete">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
        </button>
    `;
    
    // Add click handler for selecting the element
    tag.addEventListener('click', (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.closest('.destination-edit-btn') || e.target.closest('.destination-delete-btn')) {
            return;
        }
        
        selectElementByDestination(destination.id);
        
        // Try to trigger the animation editor if we have animation data
        if (typeof selectAnimationForEditing === 'function') {
            const animationsData = getSavedAnimations();
            
            // Determine which element ID to use for finding animations
            const searchElementId = destination.animationElementId || destination.elementId;
            
            console.log('Named destination clicked:', destination);
            console.log('Searching for animations under elementId:', searchElementId);
            
            const elementAnimations = animationsData.animations[searchElementId];
            
            if (elementAnimations) {
                let animationId = null;
                let animationData = null;
                
                // If we have a specific animation ID, use that
                if (destination.specificAnimationId && elementAnimations[destination.specificAnimationId]) {
                    animationId = destination.specificAnimationId;
                    animationData = elementAnimations[destination.specificAnimationId];
                    console.log('Found specific animation:', animationId, animationData);
                } else {
                    // Fallback: Find animation with matching type (for backward compatibility)
                    for (const [animId, animData] of Object.entries(elementAnimations)) {
                        if (animData.type === destination.animationType) {
                            animationId = animId;
                            animationData = animData;
                            console.log('Found matching animation by type:', animationId, animationData);
                            break;
                        }
                    }
                }
                
                if (animationId && animationData) {
                    // Trigger the animation editor panel
                    selectAnimationForEditing(
                        searchElementId,
                        animationId,
                        destination.animationType,
                        animationData
                    );
                } else {
                    console.log('No matching animation found');
                }
            } else {
                console.log('No animations found for elementId:', searchElementId);
            }
        }
    });
    
    // Add edit button handler
    const editBtn = tag.querySelector('.destination-edit-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditDestinationModal(destination);
    });
    
    // Add delete button handler
    const deleteBtn = tag.querySelector('.destination-delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNamedDestination(destination.id);
        showNotification(`Named destination "${destination.name}" deleted`, 'info');
    });
    
    return tag;
}

// Show edit destination modal
function showEditDestinationModal(destination) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('edit-destination-modal');
    if (!modal) {
        modal = createEditDestinationModal();
        document.body.appendChild(modal);
    }
    
    // Populate modal with current data
    const nameInput = modal.querySelector('#destination-name-input');
    nameInput.value = destination.name;
    nameInput.dataset.destinationId = destination.id;
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Focus input
    setTimeout(() => {
        nameInput.focus();
        nameInput.select();
    }, 100);
}

// Create edit destination modal
function createEditDestinationModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-destination-modal';
    modal.className = 'edit-destination-modal hidden';
    
    modal.innerHTML = `
        <div class="edit-destination-modal-content">
            <div class="edit-destination-modal-header">
                <h3>Edit Named Destination</h3>
                <button class="edit-destination-close-btn" title="Close">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <div class="edit-destination-modal-body">
                <div class="form-group">
                    <label for="destination-name-input" class="form-label">Destination Name</label>
                    <input type="text" id="destination-name-input" class="form-input" placeholder="Enter destination name..." maxlength="50">
                    <div class="form-help">Maximum 50 characters</div>
                </div>
                <div class="edit-destination-actions">
                    <button id="edit-destination-cancel-btn" class="btn btn-secondary">Cancel</button>
                    <button id="edit-destination-save-btn" class="btn btn-primary">Save</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const closeBtn = modal.querySelector('.edit-destination-close-btn');
    const cancelBtn = modal.querySelector('#edit-destination-cancel-btn');
    const saveBtn = modal.querySelector('#edit-destination-save-btn');
    const nameInput = modal.querySelector('#destination-name-input');
    
    const closeModal = () => {
        modal.classList.add('hidden');
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Save on Enter key
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        }
    });
    
    // Save button handler
    saveBtn.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        const destinationId = nameInput.dataset.destinationId;
        
        if (newName && newName.length > 0) {
            if (updateNamedDestinationName(destinationId, newName)) {
                showNotification(`Named destination updated to "${newName}"`, 'success');
                closeModal();
            } else {
                showNotification('Failed to update named destination', 'error');
            }
        } else {
            showNotification('Please enter a valid name', 'error');
        }
    });
    
    return modal;
}

// Remove named destination for a specific element
function removeNamedDestinationForElement(elementId) {
    const data = getNamedDestinations();
    
    if (data.destinations[elementId]) {
        delete data.destinations[elementId];
        saveNamedDestinations(data);
        updateNamedDestinationsUI();
        return true;
    }
    
    return false;
}

// Clear all named destinations (useful when clearing all animations)
function clearAllNamedDestinations() {
    // Remove all data-animation-name attributes from elements
    const elementsWithNames = document.querySelectorAll('[data-animation-name]');
    elementsWithNames.forEach(element => {
        element.removeAttribute('data-animation-name');
    });
    
    const data = getSavedAnimations();
    data.namedDestinations = { destinations: {} };
    localStorage.setItem('svg-animations', JSON.stringify(data));
    markAsUnsaved();
    updateNamedDestinationsUI();
}

// Export functions for use in other modules
window.getNamedDestinations = getNamedDestinations;
window.saveNamedDestinations = saveNamedDestinations;
window.createNamedDestination = createNamedDestination;
window.updateNamedDestinationName = updateNamedDestinationName;
window.deleteNamedDestination = deleteNamedDestination;
window.removeNamedDestinationForElement = removeNamedDestinationForElement;
window.selectElementByDestination = selectElementByDestination;
window.updateNamedDestinationsUI = updateNamedDestinationsUI;
window.clearAllNamedDestinations = clearAllNamedDestinations;
