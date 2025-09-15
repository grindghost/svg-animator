// Named Destinations functionality for SVG Animator Pro
// SVG Animator Pro - Named Destinations Module

// Storage key for named destinations
const NAMED_DESTINATIONS_KEY = 'svg-named-destinations';

// Get saved named destinations from localStorage
function getNamedDestinations() {
    const savedData = localStorage.getItem(NAMED_DESTINATIONS_KEY);
    return savedData ? JSON.parse(savedData) : { destinations: {} };
}

// Save named destinations to localStorage
function saveNamedDestinations(data) {
    localStorage.setItem(NAMED_DESTINATIONS_KEY, JSON.stringify(data));
    markAsUnsaved(); // Mark as unsaved when saving named destinations
}

// Create a named destination for an element
function createNamedDestination(elementId, element, animationType) {
    const data = getNamedDestinations();
    
    // Check if element already has a named destination
    if (data.destinations[elementId]) {
        return data.destinations[elementId].id; // Return existing destination ID
    }
    
    // Generate unique ID for this destination
    const destinationId = uniqueID();
    
    // Create default name based on element and animation
    const elementTag = element.tagName.toLowerCase();
    let defaultName;
    
    // If element has an ID, use it in the name
    if (elementId && elementId !== elementTag) {
        defaultName = `${elementId} (${animationType})`;
    } else {
        // For elements without IDs, use tag name
        defaultName = `${elementTag} (${animationType})`;
    }
    
    // Store destination data
    data.destinations[elementId] = {
        id: destinationId,
        elementId: elementId,
        name: defaultName,
        animationType: animationType,
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
            data.destinations[elementId].name = newName.trim().substring(0, 50);
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
            let element = document.getElementById(destination.elementId);
            
            // If element not found by ID, try to find it by tag name (for elements without IDs)
            if (!element && destination.elementId === destination.elementId.toLowerCase()) {
                // This might be a tag name, try to find the first element of this type
                const elements = document.querySelectorAll(destination.elementId);
                if (elements.length > 0) {
                    element = elements[0]; // Take the first one
                }
            }
            
            if (element) {
                // Use the existing selectElement function to select and highlight the element
                selectElement(destination.elementId, element);
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

// Clear all named destinations (useful when clearing all animations)
function clearAllNamedDestinations() {
    localStorage.setItem(NAMED_DESTINATIONS_KEY, JSON.stringify({ destinations: {} }));
    updateNamedDestinationsUI();
}

// Export functions for use in other modules
window.getNamedDestinations = getNamedDestinations;
window.saveNamedDestinations = saveNamedDestinations;
window.createNamedDestination = createNamedDestination;
window.updateNamedDestinationName = updateNamedDestinationName;
window.deleteNamedDestination = deleteNamedDestination;
window.selectElementByDestination = selectElementByDestination;
window.updateNamedDestinationsUI = updateNamedDestinationsUI;
window.clearAllNamedDestinations = clearAllNamedDestinations;
