// Recipe management functionality
// SVG Animator Pro - Recipe Manager Module

// Recipe storage constants
const RECIPE_STORAGE_KEY = 'svg-animation-recipes';

// Generate a unique string for animation names (without relying on dropdown values)
function generateUniqueString() {
    return Math.random().toString(36).substr(2, 9);
}

// Get saved recipes from localStorage
function getSavedRecipes() {
    const savedData = localStorage.getItem(RECIPE_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : {};
}

// Save recipe to localStorage
function saveRecipe(recipeName, animations) {
    const recipes = getSavedRecipes();
    
    // Check if recipe name already exists
    if (recipes[recipeName]) {
        return { success: false, error: 'Recipe name already exists' };
    }
    
    // Create recipe object
    recipes[recipeName] = {
        name: recipeName,
        animations: animations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    return { success: true };
}

// Update existing recipe
function updateRecipe(recipeName, animations) {
    const recipes = getSavedRecipes();
    
    if (!recipes[recipeName]) {
        return { success: false, error: 'Recipe not found' };
    }
    
    recipes[recipeName].animations = animations;
    recipes[recipeName].updatedAt = new Date().toISOString();
    
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    return { success: true };
}

// Delete recipe from localStorage
function deleteRecipe(recipeName) {
    const recipes = getSavedRecipes();
    
    if (recipes[recipeName]) {
        delete recipes[recipeName];
        localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
        return { success: true };
    }
    
    return { success: false, error: 'Recipe not found' };
}

// Rename recipe
function renameRecipe(oldName, newName) {
    const recipes = getSavedRecipes();
    
    if (!recipes[oldName]) {
        return { success: false, error: 'Original recipe not found' };
    }
    
    if (recipes[newName]) {
        return { success: false, error: 'New recipe name already exists' };
    }
    
    // Move recipe to new name
    recipes[newName] = recipes[oldName];
    recipes[newName].name = newName;
    recipes[newName].updatedAt = new Date().toISOString();
    delete recipes[oldName];
    
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
    return { success: true };
}

// Get current animations for selected element
function getCurrentElementAnimations(elementId) {
    if (!elementId) return [];
    
    const data = getSavedAnimations();
    const elementAnimations = data.animations[elementId];
    
    if (!elementAnimations) return [];
    
    // Convert to recipe format
    const animations = [];
    Object.entries(elementAnimations).forEach(([animationId, animationData]) => {
        animations.push({
            id: animationId,
            type: animationData.type,
            speed: animationData.speed,
            animationName: animationData.animationName,
            params: animationData.params || {}
        });
    });
    
    return animations;
}

// Apply recipe to selected element
function applyRecipeToElement(elementId, recipeName) {
    const recipes = getSavedRecipes();
    const recipe = recipes[recipeName];
    
    if (!recipe) {
        return { success: false, error: 'Recipe not found' };
    }
    
    if (!elementId) {
        return { success: false, error: 'No element selected' };
    }
    
    try {
        // Apply each animation from the recipe
        recipe.animations.forEach(animationData => {
            // Create a temporary animation data object for the applyAnimation function
            const tempAnimationData = {
                type: animationData.type,
                speed: parseFloat(animationData.speed),
                params: animationData.params
            };
            
            // Apply the animation
            applyAnimationFromRecipe(elementId, tempAnimationData);
        });
        
        // ✅ NEW: Use centralized left panel refresh
        if (typeof refreshLeftPanel === 'function') {
            refreshLeftPanel(elementId, document.getElementById(elementId));
        } else {
            updateAnimationListUI(elementId);
            updateAnimationCountMessage(elementId);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error applying recipe:', error);
        return { success: false, error: error.message };
    }
}

// Apply animation from recipe data
function applyAnimationFromRecipe(elementId, animationData) {
    const element = document.querySelector(`#${elementId}`);
    if (!element) {
        throw new Error(`Element with ID ${elementId} not found`);
    }
    
    // Create a new wrapper for this specific animation
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    wrapper.classList.add("anim-wrapper");
    
    // Insert wrapper before the element
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    
    // Generate unique animation name with proper format: animationType-uniqueString
    const animationName = `${animationData.type}-${generateUniqueString()}`;
    const selectedAnimation = animationData.type;
    
    const animData = animationsData[selectedAnimation];
    if (!animData) {
        throw new Error(`Animation "${selectedAnimation}" not found`);
    }
    
    removeStyleTag(animationName);
    
    // Handle apply-based animations (like "boiled")
    if (animData.apply) {
        // Temporarily set the params for the animation
        const originalParams = animData.params;
        animData.params = animationData.params;
        
        animData.apply(wrapper, animData.params);
        wrapper.classList.add("application-animation-class");
        wrapper.classList.add(`${selectedAnimation}-animation-class`);
        
        // Restore original params
        animData.params = originalParams;
    } else {
        // Build keyframes for keyframe-based animations
        const keyframes = animData.generateKeyframes
            ? animData.generateKeyframes(animationData.params)
            : animData.keyframes;
        
        let keyframesString = "";
        for (let percentage in keyframes) {
            let properties = keyframes[percentage];
            let propsString = Object.keys(properties)
                .map(prop => `${prop}: ${properties[prop]};`)
                .join(" ");
            keyframesString += `${percentage} { ${propsString} } `;
        }
        
        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;
        svgRoot.insertAdjacentHTML("beforeend", embeddedStyle);
        
        // Apply permanent animation
        const newAnimation = `${animationData.speed}s linear 0s infinite normal forwards running ${animationName}`;
        wrapper.style.animation = newAnimation;
    }
    
    setCorrectTransformOrigin(wrapper);
    
    // Save the animation directly to localStorage with our custom animation name
    const data = getSavedAnimations();
    
    // Check if the element already exists
    if (!data.animations[elementId]) {
        data.animations[elementId] = {};
    }
    
    // Store animation with our custom animation name as the key
    data.animations[elementId][animationName] = {
        type: selectedAnimation,
        speed: `${animationData.speed}`,
        animationName: animationName
    };
    
    if (animationData.params) {
        data.animations[elementId][animationName].params = { ...animationData.params };
    }
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    markAsUnsaved();
    
    // ✅ NEW: Use centralized left panel refresh
    if (typeof refreshLeftPanel === 'function') {
        refreshLeftPanel(elementId, document.getElementById(elementId));
    } else {
        updateAnimationListUI(elementId);
    }
}

// Update recipe dropdown
function updateRecipeDropdown() {
    const dropdown = document.getElementById('recipe-selector');
    if (!dropdown) return;
    
    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="none">Select recipe...</option>';
    
    const recipes = getSavedRecipes();
    const recipeNames = Object.keys(recipes).sort();
    
    recipeNames.forEach(recipeName => {
        const option = document.createElement('option');
        option.value = recipeName;
        option.textContent = recipeName;
        dropdown.appendChild(option);
    });
}

// Update create recipe button state
function updateCreateRecipeButton() {
    const button = document.getElementById('create-recipe-btn');
    if (!button) return;
    
    // Enable button only if there's a selected element with animations
    const hasSelectedElement = selectedElement && selectedElement.id;
    const hasAnimations = hasSelectedElement ? getCurrentElementAnimations(selectedElement.id).length > 0 : false;
    
    button.disabled = !hasSelectedElement || !hasAnimations;
}

// Initialize recipe functionality
function initializeRecipeManager() {
    // Update button state when element selection changes
    if (typeof updateCreateRecipeButton === 'function') {
        // Hook into existing selection system
        const originalUpdateAnimationListUI = window.updateAnimationListUI;
        if (originalUpdateAnimationListUI) {
            window.updateAnimationListUI = function(elementId) {
                originalUpdateAnimationListUI(elementId);
                updateCreateRecipeButton();
            };
        }
    }
    
    // Initialize dropdown
    updateRecipeDropdown();
}

// Export functions for use in other modules
window.getSavedRecipes = getSavedRecipes;
window.saveRecipe = saveRecipe;
window.updateRecipe = updateRecipe;
window.deleteRecipe = deleteRecipe;
window.renameRecipe = renameRecipe;
window.getCurrentElementAnimations = getCurrentElementAnimations;
window.applyRecipeToElement = applyRecipeToElement;
window.updateRecipeDropdown = updateRecipeDropdown;
window.updateCreateRecipeButton = updateCreateRecipeButton;
window.initializeRecipeManager = initializeRecipeManager;
