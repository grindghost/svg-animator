// Rail UI event handlers and management
// SVG Animator Pro - Rail UI Module

let currentRailElement = null;

// Show rails management overlay
function showRailsOverlay(element = null) {
    const overlay = document.getElementById('rails-overlay');
    if (!overlay) return;
    
    // Store the element for rail creation
    currentRailElement = element;
    
    // Debug logging
    console.log('showRailsOverlay called with element:', element);
    console.log('currentRailElement set to:', currentRailElement);
    
    // Clear form
    document.getElementById('rail-name').value = '';
    document.getElementById('rail-name-error').classList.add('hidden');
    document.getElementById('rails-save-btn').disabled = true;
    
    // Update rails list
    updateRailsList();
    
    // Update form state based on whether we have an element
    updateRailsFormState();
    
    // Show overlay
    overlay.classList.remove('hidden');
    
    // Focus on name input if we have an element
    if (element) {
        setTimeout(() => {
            document.getElementById('rail-name').focus();
        }, 100);
    }
}

// Hide rails management overlay
function hideRailsOverlay() {
    const overlay = document.getElementById('rails-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    currentRailElement = null;
}

// Update rails form state based on selected element
function updateRailsFormState() {
    const nameInput = document.getElementById('rail-name');
    const saveBtn = document.getElementById('rails-save-btn');
    const description = document.querySelector('.rails-description');
    
    if (!nameInput || !saveBtn || !description) return;
    
    // Debug logging
    console.log('updateRailsFormState - currentRailElement:', currentRailElement);
    console.log('updateRailsFormState - nameInput.disabled before:', nameInput.disabled);
    
    if (currentRailElement) {
        // Element selected - enable form
        nameInput.disabled = false;
        saveBtn.disabled = true; // Will be enabled when name is entered
        description.textContent = 'Create an animation rail from the selected path or shape element.';
        description.style.color = 'var(--text-secondary)';
        console.log('Form enabled for element:', currentRailElement);
    } else {
        // No element selected - disable form
        nameInput.disabled = true;
        saveBtn.disabled = true;
        description.textContent = '⚠️ Right-click on a path or shape element to create a rail.';
        description.style.color = 'var(--text-muted)';
        console.log('Form disabled - no element selected');
    }
    
    console.log('updateRailsFormState - nameInput.disabled after:', nameInput.disabled);
}

// Update rails list in overlay
function updateRailsList() {
    const railsList = document.getElementById('rails-list');
    if (!railsList) return;
    
    // Check if getSavedRails function is available
    if (typeof getSavedRails !== 'function') {
        console.error('getSavedRails function not available');
        railsList.innerHTML = '<div class="rails-placeholder">Error loading rails</div>';
        return;
    }
    
    const rails = getSavedRails();
    const railNames = Object.keys(rails).sort();
    
    if (railNames.length === 0) {
        railsList.innerHTML = '<div class="rails-placeholder">No rails saved yet</div>';
        return;
    }
    
    railsList.innerHTML = '';
    
    railNames.forEach(railName => {
        const rail = rails[railName];
        const railItem = document.createElement('div');
        railItem.className = 'rails-item';
        
        railItem.innerHTML = `
            <div class="rails-item-info">
                <div class="rails-item-name">${railName}</div>
                <div class="rails-item-details">Created: ${new Date(rail.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="rails-item-actions">
                <button class="rails-item-btn rename" title="Rename rail">✏️</button>
                <button class="rails-item-btn delete" title="Delete rail">🗑️</button>
            </div>
        `;
        
        // Add event listeners
        const renameBtn = railItem.querySelector('.rename');
        const deleteBtn = railItem.querySelector('.delete');
        
        renameBtn.addEventListener('click', () => renameRailPrompt(railName));
        deleteBtn.addEventListener('click', () => deleteRailPrompt(railName));
        
        railsList.appendChild(railItem);
    });
}

// Rename rail prompt
function renameRailPrompt(railName) {
    const newName = prompt(`Rename rail "${railName}":`, railName);
    
    if (newName && newName.trim() && newName.trim() !== railName) {
        const trimmedName = newName.trim();
        
        // Validate name
        if (trimmedName.length < 1 || trimmedName.length > 50) {
            showNotification('Rail name must be between 1 and 50 characters', 'error');
            return;
        }
        
        // Check if renameRail function is available
        if (typeof renameRail !== 'function') {
            console.error('renameRail function not available');
            showNotification('Rail system not available', 'error');
            return;
        }
        
        const result = renameRail(railName, trimmedName);
        if (result.success) {
            showNotification(`Rail renamed to "${trimmedName}"`, 'success');
            updateRailsList();
        } else {
            showNotification(result.error, 'error');
        }
    }
}

// Delete rail prompt
function deleteRailPrompt(railName) {
    if (confirm(`Are you sure you want to delete the rail "${railName}"?`)) {
        // Check if deleteRail function is available
        if (typeof deleteRail !== 'function') {
            console.error('deleteRail function not available');
            showNotification('Rail system not available', 'error');
            return;
        }
        
        const result = deleteRail(railName);
        if (result.success) {
            showNotification(`Rail "${railName}" deleted`, 'success');
            updateRailsList();
        } else {
            showNotification(result.error, 'error');
        }
    }
}

// Handle rail name input
function handleRailNameInput() {
    const nameInput = document.getElementById('rail-name');
    const errorDiv = document.getElementById('rail-name-error');
    const saveBtn = document.getElementById('rails-save-btn');
    
    if (!nameInput || !errorDiv || !saveBtn) return;
    
    // Don't process if form is disabled (no element selected)
    if (nameInput.disabled) {
        return;
    }
    
    // Check if validateRailName function is available
    if (typeof validateRailName !== 'function') {
        console.error('validateRailName function not available');
        return;
    }
    
    const validation = validateRailName(nameInput.value);
    
    if (validation.valid) {
        errorDiv.classList.add('hidden');
        saveBtn.disabled = false;
    } else {
        // Clear any existing override link
        const existingLink = errorDiv.querySelector('.override-link');
        if (existingLink) {
            existingLink.remove();
        }
        
        errorDiv.textContent = validation.error;
        
        // Add override link if applicable
        if (validation.canOverride) {
            const overrideLink = document.createElement('span');
            overrideLink.className = 'override-link';
            overrideLink.innerHTML = ' <a href="#" onclick="overrideExistingRail(event)">Override existing rail</a>';
            errorDiv.appendChild(overrideLink);
        }
        
        errorDiv.classList.remove('hidden');
        saveBtn.disabled = true;
    }
}

// Override existing rail
function overrideExistingRail(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('rail-name');
    const errorDiv = document.getElementById('rail-name-error');
    const saveBtn = document.getElementById('rails-save-btn');
    
    if (!nameInput || !errorDiv || !saveBtn) return;
    
    const railName = nameInput.value.trim();
    
    // Get current element path data
    if (!currentRailElement) {
        showNotification('No element selected', 'error');
        return;
    }
    
    // Check if required functions are available
    if (typeof extractPathDataFromElement !== 'function' || typeof saveRail !== 'function') {
        console.error('Required rail functions not available');
        showNotification('Rail system not available', 'error');
        return;
    }
    
    const pathData = extractPathDataFromElement(currentRailElement);
    if (!pathData) {
        showNotification('Selected element has no valid path data', 'error');
        return;
    }
    
    // Update existing rail
    const result = saveRail(railName, pathData);
    if (result.success) {
        showNotification(`🚂 Rail "${railName}" updated successfully!`, 'success');
        hideRailsOverlay();
        updateRailsList();
    } else {
        showNotification(result.error, 'error');
    }
}

// Save rail from form
function saveRailFromForm() {
    const nameInput = document.getElementById('rail-name');
    if (!nameInput) return;
    
    const railName = nameInput.value.trim();
    
    // Check if required functions are available
    if (typeof validateRailName !== 'function' || typeof extractPathDataFromElement !== 'function' || typeof saveRail !== 'function') {
        console.error('Required rail functions not available');
        showNotification('Rail system not available', 'error');
        return;
    }
    
    const validation = validateRailName(railName);
    
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    // Get current element path data
    if (!currentRailElement) {
        showNotification('No element selected', 'error');
        return;
    }
    
    const pathData = extractPathDataFromElement(currentRailElement);
    if (!pathData) {
        showNotification('Selected element has no valid path data', 'error');
        return;
    }
    
    // Save new rail
    const result = saveRail(railName, pathData);
    if (result.success) {
        showNotification(`🚂 Rail "${railName}" saved successfully!`, 'success');
        hideRailsOverlay();
        updateRailsList();
    } else {
        showNotification(result.error, 'error');
    }
}

// Initialize rails UI event handlers
function initializeRailsUI() {
    // Rails overlay close buttons
    const closeBtn = document.getElementById('rails-close-btn');
    const cancelBtn = document.getElementById('rails-cancel-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideRailsOverlay);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideRailsOverlay);
    }
    
    // Close overlay when clicking outside
    const overlay = document.getElementById('rails-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideRailsOverlay();
            }
        });
    }
    
    // Rail name input
    const nameInput = document.getElementById('rail-name');
    if (nameInput) {
        nameInput.addEventListener('input', handleRailNameInput);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRailFromForm();
            }
        });
    }
    
    // Save rail button
    const saveBtn = document.getElementById('rails-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveRailFromForm);
    }
}

// Export functions for use in other modules
window.showRailsOverlay = showRailsOverlay;
window.hideRailsOverlay = hideRailsOverlay;
window.updateRailsList = updateRailsList;
window.initializeRailsUI = initializeRailsUI;
window.overrideExistingRail = overrideExistingRail;
