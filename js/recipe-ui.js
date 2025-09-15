// Recipe UI event handlers and management
// SVG Animator Pro - Recipe UI Module

// Show recipe creation overlay
function showRecipeOverlay() {
    const overlay = document.getElementById('recipe-overlay');
    if (!overlay) return;
    
    // Clear form
    document.getElementById('recipe-name').value = '';
    document.getElementById('recipe-name-error').classList.add('hidden');
    document.getElementById('recipe-save-btn').disabled = true;
    
    // Update recipe list
    updateRecipeList();
    
    // Check if selected element has animations and update UI accordingly
    updateRecipeFormState();
    
    // Show overlay
    overlay.classList.remove('hidden');
    
    // Focus on name input if element has animations
    if (hasSelectedElementWithAnimations()) {
        setTimeout(() => {
            document.getElementById('recipe-name').focus();
        }, 100);
    }
}

// Hide recipe creation overlay
function hideRecipeOverlay() {
    const overlay = document.getElementById('recipe-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Check if selected element has animations
function hasSelectedElementWithAnimations() {
    if (!selectedElement || !selectedElement.id) {
        return false;
    }
    
    const animations = getCurrentElementAnimations(selectedElement.id);
    return animations.length > 0;
}

// Update recipe form state based on selected element
function updateRecipeFormState() {
    const nameInput = document.getElementById('recipe-name');
    const saveBtn = document.getElementById('recipe-save-btn');
    const description = document.querySelector('.recipe-description');
    
    if (!nameInput || !saveBtn || !description) return;
    
    const hasAnimations = hasSelectedElementWithAnimations();
    
    if (hasAnimations) {
        // Element has animations - enable form
        nameInput.disabled = false;
        saveBtn.disabled = true; // Will be enabled when name is entered
        description.textContent = 'Save the current animations on the selected element as a reusable recipe.';
        description.style.color = 'var(--text-secondary)';
    } else {
        // Element has no animations - disable form
        nameInput.disabled = true;
        saveBtn.disabled = true;
        description.textContent = '⚠️ Select an element with at least 1 animation applied to create a recipe.';
        description.style.color = 'var(--text-muted)';
    }
}

// Update recipe list in overlay
function updateRecipeList() {
    const recipeList = document.getElementById('recipe-list');
    if (!recipeList) return;
    
    const recipes = getSavedRecipes();
    const recipeNames = Object.keys(recipes).sort();
    
    if (recipeNames.length === 0) {
        recipeList.innerHTML = '<div class="recipe-placeholder">No recipes saved yet</div>';
        return;
    }
    
    recipeList.innerHTML = '';
    
    recipeNames.forEach(recipeName => {
        const recipe = recipes[recipeName];
        const recipeItem = document.createElement('div');
        recipeItem.className = 'recipe-item';
        
        const animationCount = recipe.animations.length;
        const animationTypes = recipe.animations.map(anim => anim.type).join(', ');
        
        recipeItem.innerHTML = `
            <div class="recipe-item-info">
                <div class="recipe-item-name">${recipeName}</div>
                <div class="recipe-item-details">${animationCount} animation${animationCount > 1 ? 's' : ''}: ${animationTypes}</div>
            </div>
            <div class="recipe-item-actions">
                <button class="recipe-item-btn rename" title="Rename recipe">✏️</button>
                <button class="recipe-item-btn delete" title="Delete recipe">🗑️</button>
            </div>
        `;
        
        // Add event listeners
        const renameBtn = recipeItem.querySelector('.rename');
        const deleteBtn = recipeItem.querySelector('.delete');
        
        renameBtn.addEventListener('click', () => renameRecipePrompt(recipeName));
        deleteBtn.addEventListener('click', () => deleteRecipePrompt(recipeName));
        
        recipeList.appendChild(recipeItem);
    });
}

// Rename recipe prompt
function renameRecipePrompt(recipeName) {
    const newName = prompt(`Rename recipe "${recipeName}":`, recipeName);
    
    if (newName && newName.trim() && newName.trim() !== recipeName) {
        const trimmedName = newName.trim();
        
        // Validate name
        if (trimmedName.length < 1 || trimmedName.length > 50) {
            showNotification('Recipe name must be between 1 and 50 characters', 'error');
            return;
        }
        
        const result = renameRecipe(recipeName, trimmedName);
        if (result.success) {
            showNotification(`Recipe renamed to "${trimmedName}"`, 'success');
            updateRecipeList();
            updateRecipeDropdown();
        } else {
            showNotification(result.error, 'error');
        }
    }
}

// Delete recipe prompt
function deleteRecipePrompt(recipeName) {
    if (confirm(`Are you sure you want to delete the recipe "${recipeName}"?`)) {
        const result = deleteRecipe(recipeName);
        if (result.success) {
            showNotification(`Recipe "${recipeName}" deleted`, 'success');
            updateRecipeList();
            updateRecipeDropdown();
        } else {
            showNotification(result.error, 'error');
        }
    }
}

// Validate recipe name
function validateRecipeName(name) {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
        return { valid: false, error: 'Recipe name is required', canOverride: false };
    }
    
    if (trimmedName.length < 1) {
        return { valid: false, error: 'Recipe name must be at least 1 character', canOverride: false };
    }
    
    if (trimmedName.length > 50) {
        return { valid: false, error: 'Recipe name must be less than 50 characters', canOverride: false };
    }
    
    // Check if name already exists
    const recipes = getSavedRecipes();
    if (recipes[trimmedName]) {
        return { valid: false, error: 'Recipe name already exists', canOverride: true };
    }
    
    return { valid: true, canOverride: false };
}

// Handle recipe name input
function handleRecipeNameInput() {
    const nameInput = document.getElementById('recipe-name');
    const errorDiv = document.getElementById('recipe-name-error');
    const saveBtn = document.getElementById('recipe-save-btn');
    
    if (!nameInput || !errorDiv || !saveBtn) return;
    
    // Don't process if form is disabled (no animations on selected element)
    if (nameInput.disabled) {
        return;
    }
    
    const validation = validateRecipeName(nameInput.value);
    
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
            overrideLink.innerHTML = ' <a href="#" onclick="overrideExistingRecipe(event)">Override existing recipe</a>';
            errorDiv.appendChild(overrideLink);
        }
        
        errorDiv.classList.remove('hidden');
        saveBtn.disabled = true;
    }
}

// Override existing recipe
function overrideExistingRecipe(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('recipe-name');
    const errorDiv = document.getElementById('recipe-name-error');
    const saveBtn = document.getElementById('recipe-save-btn');
    
    if (!nameInput || !errorDiv || !saveBtn) return;
    
    const recipeName = nameInput.value.trim();
    
    // Get current element animations
    if (!selectedElement || !selectedElement.id) {
        showNotification('No element selected', 'error');
        return;
    }
    
    const animations = getCurrentElementAnimations(selectedElement.id);
    if (animations.length === 0) {
        showNotification('Selected element has no animations to save', 'error');
        return;
    }
    
    // Update existing recipe
    const result = updateRecipe(recipeName, animations);
    if (result.success) {
        showNotification(`🧪 Recipe "${recipeName}" updated successfully!`, 'success');
        hideRecipeOverlay();
        updateRecipeList();
        updateRecipeDropdown();
    } else {
        showNotification(result.error, 'error');
    }
}

// Save recipe
function saveRecipeFromForm() {
    const nameInput = document.getElementById('recipe-name');
    if (!nameInput) return;
    
    const recipeName = nameInput.value.trim();
    const validation = validateRecipeName(recipeName);
    
    if (!validation.valid) {
        showNotification(validation.error, 'error');
        return;
    }
    
    // Get current element animations
    if (!selectedElement || !selectedElement.id) {
        showNotification('No element selected', 'error');
        return;
    }
    
    const animations = getCurrentElementAnimations(selectedElement.id);
    if (animations.length === 0) {
        showNotification('Selected element has no animations to save', 'error');
        return;
    }
    
    // Save new recipe
    const result = saveRecipe(recipeName, animations);
    if (result.success) {
        showNotification(`🧪 Recipe "${recipeName}" saved successfully!`, 'success');
        hideRecipeOverlay();
        updateRecipeList();
        updateRecipeDropdown();
    } else {
        showNotification(result.error, 'error');
    }
}

// Handle recipe selector change
function handleRecipeSelectorChange() {
    const selector = document.getElementById('recipe-selector');
    if (!selector) return;
    
    const selectedRecipe = selector.value;
    
    if (selectedRecipe === 'none' || !selectedRecipe) {
        return;
    }
    
    // Apply recipe to selected element
    if (!selectedElement || !selectedElement.id) {
        showNotification('🧪 Please select an element first', 'error');
        selector.value = 'none';
        return;
    }
    
    const result = applyRecipeToElement(selectedElement.id, selectedRecipe);
    
    if (result.success) {
        showNotification(`🧪 Recipe "${selectedRecipe}" applied successfully!`, 'success');
        updateStatusBar(`Recipe "${selectedRecipe}" applied! ✨`);
    } else {
        showNotification(result.error, 'error');
    }
    
    // Reset selector
    selector.value = 'none';
}

// Initialize recipe UI event handlers
function initializeRecipeUI() {
    // Create recipe button
    const createBtn = document.getElementById('create-recipe-btn');
    if (createBtn) {
        createBtn.addEventListener('click', showRecipeOverlay);
    }
    
    // Manage recipes link
    const manageLink = document.getElementById('manage-recipes-link');
    if (manageLink) {
        manageLink.addEventListener('click', (e) => {
            e.preventDefault();
            showRecipeOverlay();
        });
    }
    
    // Recipe overlay close buttons
    const closeBtn = document.getElementById('recipe-close-btn');
    const cancelBtn = document.getElementById('recipe-cancel-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideRecipeOverlay);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideRecipeOverlay);
    }
    
    // Close overlay when clicking outside
    const overlay = document.getElementById('recipe-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideRecipeOverlay();
            }
        });
    }
    
    // Recipe name input
    const nameInput = document.getElementById('recipe-name');
    if (nameInput) {
        nameInput.addEventListener('input', handleRecipeNameInput);
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRecipeFromForm();
            }
        });
    }
    
    // Save recipe button
    const saveBtn = document.getElementById('recipe-save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveRecipeFromForm);
    }
    
    // Recipe selector
    const recipeSelector = document.getElementById('recipe-selector');
    if (recipeSelector) {
        recipeSelector.addEventListener('change', handleRecipeSelectorChange);
    }
    
    // Enable/disable recipe selector based on element selection
    // Note: showControlsSection override removed - now handled in ui-manager.js
    // to properly check for SVG root selection
    
    const originalHideControlsSection = window.hideControlsSection;
    if (originalHideControlsSection) {
        window.hideControlsSection = function() {
            originalHideControlsSection();
            const recipeSelector = document.getElementById('recipe-selector');
            if (recipeSelector) {
                recipeSelector.disabled = true;
            }
        };
    }
}

// Export functions for use in other modules
window.showRecipeOverlay = showRecipeOverlay;
window.hideRecipeOverlay = hideRecipeOverlay;
window.updateRecipeList = updateRecipeList;
window.initializeRecipeUI = initializeRecipeUI;
window.overrideExistingRecipe = overrideExistingRecipe;
