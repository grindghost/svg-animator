// Animation application, management, and parameter control functionality
// SVG Animator Pro - Animation Manager Module

// Helper function to check if an element is inside a clipPath
function isInsideClipPath(element) {
    let current = element.parentNode;
    while (current && current !== svgRoot) {
        if (current.tagName === 'clipPath') {
            return true;
        }
        current = current.parentNode;
    }
    return false;
}

// Helper function to restore original appearance of clipPath shapes
function restoreClipPathShapeAppearance(element) {
    if (!isInsideClipPath(element)) return;
    
    // Restore original style
    const originalStyle = element.getAttribute('data-original-style');
    if (originalStyle !== null) {
        // ✅ NEW: Clean any animation references from the original style before restoring
        let cleanedStyle = originalStyle;
        
        // Remove animation property from the style string
        cleanedStyle = cleanedStyle.replace(/animation\s*:\s*[^;]+;?\s*/g, '');
        
        // Remove any remaining semicolons that might be left hanging
        cleanedStyle = cleanedStyle.replace(/;\s*;/g, ';');
        cleanedStyle = cleanedStyle.replace(/;\s*$/, '');
        
        element.setAttribute('style', cleanedStyle);
        element.removeAttribute('data-original-style');
    }
}

// ✅ NEW: Special animation stopping for clipPath elements
function stopClipPathAnimation(element, animName = undefined) {
    if (!element || !isInsideClipPath(element)) return;
    
    console.log('stopClipPathAnimation called:', {
        elementId: element.id,
        animName: animName,
        currentStyle: element.getAttribute('style'),
        originalStyle: element.getAttribute('data-original-style')
    });
    
    // Case 1: stopping preview animation
    if (element.style.animation && element.style.animation.includes("temp-generic")) {
        removeTempPreviewFromClipPathShape(element);
        return;
    }
    
    // Case 2: stopping permanent animation(s)
    if (animName) {
        // First, try to look up the animation ID in localStorage to get the actual animation name
        const elementId = element.getAttribute("id");
        if (elementId) {
            const savedAnimations = getSavedAnimations();
            const elementAnimations = savedAnimations.animations[elementId];
            
            // Check if animName is an animation ID (exists in localStorage)
            if (elementAnimations && elementAnimations[animName]) {
                const animationData = elementAnimations[animName];
                const animationName = animationData.animationName;
                
                console.log('Found animation data:', {
                    animName: animName,
                    animationName: animationName,
                    elementStyle: element.style.animation
                });
                
                // Check if this element has the animation we want to stop
                if (element.style.animation && element.style.animation.includes(animationName)) {
                    // Remove the animation from the element's style
                    element.style.animation = "";
                    
                    // Remove animation classes
                    element.classList.remove("application-animation-class");
                    element.classList.forEach(cls => {
                        if (cls.endsWith("-animation-class")) {
                            element.classList.remove(cls);
                        }
                    });
                    
                    // Restore original appearance
                    restoreClipPathShapeAppearance(element);
                    
                    // ✅ NEW: Re-enable animation dropdown and hide warning for clipPath elements
                    // Since the animation is removed, the dropdown can be enabled again
                    const animationDropdown = document.getElementById('animation-type');
                    if (animationDropdown) {
                        animationDropdown.disabled = false;
                    }
                    
                    // Hide the clipPath warning message
                    if (typeof hideClipPathWarning === 'function') {
                        hideClipPathWarning();
                    }
                    
                    console.log('Animation removed from clipPath element');
                    return;
                }
            }
        }
        
        // Fallback: treat animName as a direct animation name (for backward compatibility)
        if (element.style.animation && element.style.animation.includes(animName)) {
            // Remove the animation from the element's style
            element.style.animation = "";
            
            // Remove animation classes
            element.classList.remove("application-animation-class");
            element.classList.forEach(cls => {
                if (cls.endsWith("-animation-class")) {
                    element.classList.remove(cls);
                }
            });
            
            // Restore original appearance
            restoreClipPathShapeAppearance(element);
            
            // ✅ NEW: Re-enable animation dropdown and hide warning for clipPath elements
            // Since the animation is removed, the dropdown can be enabled again
            const animationDropdown = document.getElementById('animation-type');
            if (animationDropdown) {
                animationDropdown.disabled = false;
            }
            
            // Hide the clipPath warning message
            if (typeof hideClipPathWarning === 'function') {
                hideClipPathWarning();
            }
            
            console.log('Animation removed from clipPath element (fallback)');
        }
    } else {
        // stop all animations on this clipPath element
        element.style.animation = "";
        
        // Remove animation classes
        element.classList.remove("application-animation-class");
        element.classList.forEach(cls => {
            if (cls.endsWith("-animation-class")) {
                element.classList.remove(cls);
            }
        });
        
        // Restore original appearance
        restoreClipPathShapeAppearance(element);
        
        // ✅ NEW: Re-enable animation dropdown and hide warning for clipPath elements
        // Since all animations are removed, the dropdown can be enabled again
        const animationDropdown = document.getElementById('animation-type');
        if (animationDropdown) {
            animationDropdown.disabled = false;
        }
        
        // Hide the clipPath warning message
        if (typeof hideClipPathWarning === 'function') {
            hideClipPathWarning();
        }
    }
    
    // Clean up selection box and handles
    try {
        document.getElementById("selection-box").remove();
    } catch (e) {}
    
    // Remove handles when stopping clipPath animation
    if (typeof removeHandles === 'function') {
        removeHandles();
    }
}

// Remove any temporary preview (keyframe or filter-based)
function removeTempPreview(wrapper) {
    if (!wrapper || !wrapper.classList.contains("temp-anim")) return;

    // ✅ NEW: Handle offset-path animations specially - now simplified
    if (wrapper.classList.contains("temp-temp-offset-path")) {
        removeTempOffsetPathAnimation(wrapper);
        return;
    }

    // ✅ NEW: Handle clipPath shapes specially
    if (isInsideClipPath(wrapper)) {
        // For clipPath shapes, remove animation and restore appearance
        wrapper.style.animation = "";
        removeStyleTag("temp-generic");
        restoreClipPathShapeAppearance(wrapper);
        return;
    }

    // 1. Remove temp keyframe animation
    if (wrapper.style.animation && wrapper.style.animation.includes("temp-generic")) {
        wrapper.style.animation = "";
        removeStyleTag("temp-generic");
    }

    // 2. Remove filter-based animation (like boiled)
    if (wrapper.hasAttribute("filter")) {
        const filterUrl = wrapper.getAttribute("filter"); // e.g. url(#boilEffect-abc123)
        wrapper.removeAttribute("filter");
        wrapper.removeAttribute("data-boiled-filter-id");

        // Try to remove the filter definition itself
        if (filterUrl && filterUrl.startsWith("url(")) {
            const idMatch = filterUrl.match(/#([^)]*)/);
            if (idMatch) {
                const filterId = idMatch[1];
                const filterElem = document.getElementById(filterId);
                if (filterElem && filterElem.tagName.toLowerCase() === "filter") {
                    filterElem.remove();
                }
            }
        }
    }

    // 3. Remove animation marker classes
    wrapper.classList.forEach(cls => {
        if (cls.endsWith("-animation-class")) {
            wrapper.classList.remove(cls);
        }
    });

    // 4. If wrapper has no animation left, unwrap it
    if (!wrapper.style.animation && !wrapper.hasAttribute("filter")) {
        unwrapWrapper(wrapper);
    }
}

// ✅ NEW: Remove temporary preview for clipPath shapes (no wrapper)
function removeTempPreviewFromClipPathShape(element) {
    if (!element || !isInsideClipPath(element)) return;
    
    // Remove animation from the element
    if (element.style.animation && element.style.animation.includes("temp-generic")) {
        element.style.animation = "";
    }
    
    // Remove the temp-generic style tag
    removeStyleTag("temp-generic");
    
    // Restore original appearance
    restoreClipPathShapeAppearance(element);
}


// Remove style tag by ID
function removeStyleTag(styleId=undefined) {
    if (styleId == undefined) {
        // Check if the style tag with the ID of animName exists
        const styleTag = document.querySelector(`style#temp-generic`);

        // If it exists, remove it
        if (styleTag) {
          styleTag.remove();
        }
    } else {
        // Check if the style tag with the ID of animName exists
        const styleTag = document.querySelector(`style#${styleId}`);

        // If it exists, remove it
        if (styleTag) {
          styleTag.remove();
        }
    }
}


function CleanAnimationStyle(element, animation_name) {
    // Function to remove the animation from a single element
    function removeAnimationFromElement(elem) {
        let animations = elem.style.animation.split(', ');
        animations = animations.filter(animation => !animation.includes(animation_name));
        elem.style.animation = animations.join(', ');
    }

    // Apply the function to the provided element
    removeAnimationFromElement(element);

    // Recursively apply the function to all child elements
    element.querySelectorAll('*').forEach(child => {
        removeAnimationFromElement(child);
    });
}

function stopAnimation(element, animName = undefined, elementId = undefined) {
    if (!element) return;
    
    // ✅ NEW: Handle offset-path animations specially - they don't use anim-wrapper groups
    if (element.hasAttribute('data-offset-path-animation')) {
        return removeOffsetPathAnimation(element);
    }
    
    // ✅ NEW: Search for offset-path animations in child elements
    const offsetPathElement = element.querySelector('[data-offset-path-animation]');
    if (offsetPathElement) {
        return removeOffsetPathAnimation(offsetPathElement);
    }

    // ✅ NEW: Handle clipPath elements specially - they don't use anim-wrapper groups
    if (isInsideClipPath(element)) {
        return stopClipPathAnimation(element, animName);
    }

    // ✅ normalize: work on wrapper if shape is inside one
    let wrapper = element;
    if (!(wrapper.classList && wrapper.classList.contains("anim-wrapper"))) {
        // Look for the anim-wrapper that contains this element
        let current = wrapper;
        while (current && current.parentNode) {
            if (current.classList && current.classList.contains("anim-wrapper")) {
                wrapper = current;
                break;
            }
            current = current.parentNode;
        }
        
        if (!wrapper.classList || !wrapper.classList.contains("anim-wrapper")) {
            return; // nothing to stop
        }
    }

    // ✅ Case 1: stopping preview animation
    if (wrapper.classList.contains("temp-anim")) {
        removeTempPreview(wrapper);
        return;
    }

    // ✅ Case 2: stopping permanent animation(s)
    if (animName) {
        // Check if this is an animation ID (UUID format) or animation type name
        const isAnimationId = animName.includes('-') && animName.length > 10; // Animation names like "boiled-abc123def"
        
        if (isAnimationId) {
            // animName is actually an animation ID - find the animation type
            const targetElementId = elementId || wrapper.getAttribute("id") || wrapper.querySelector('[id]')?.getAttribute("id");
            if (targetElementId) {
                const savedAnimations = getSavedAnimations();
                const elementAnimations = savedAnimations.animations[targetElementId];
                if (elementAnimations && elementAnimations[animName]) {
                    const animationData = elementAnimations[animName];
                    // Handle both old format (no type property) and new format (with type property)
                    const animationType = animationData.type || animName;
                    const animationName = animationData.animationName;
                    
                    // Check if this wrapper has the animation we want to stop
                    const hasStyleAnimation = wrapper.style.animation && wrapper.style.animation.includes(animationName);
                    const hasAnimationClass = wrapper.classList.contains(`${animationType}-animation-class`);
                    const hasApplyBasedAnimation = animationData.apply && wrapper.hasAttribute("filter");
                    
                    if (hasStyleAnimation || hasAnimationClass || hasApplyBasedAnimation) {
                        unwrapWrapper(wrapper);
                    } else {
                        // might be nested: recurse upwards
                        const parentWrapper = wrapper.parentNode.closest(".anim-wrapper");
                        if (parentWrapper) stopAnimation(parentWrapper, animName);
                    }
                }
            }
        } else {
            // animName is an animation type - use old logic for backward compatibility
            const hasStyleAnimation = wrapper.style.animation && wrapper.style.animation.includes(animName);
            const hasAnimationClass = wrapper.classList.contains(`${animName}-animation-class`);
            const hasApplyBasedAnimation = wrapper.hasAttribute("filter") && wrapper.classList.contains(`${animName}-animation-class`);
            
            if (hasStyleAnimation || hasAnimationClass || hasApplyBasedAnimation) {
                unwrapWrapper(wrapper);
            } else {
                // might be nested: recurse upwards
                const parentWrapper = wrapper.parentNode.closest(".anim-wrapper");
                if (parentWrapper) stopAnimation(parentWrapper, animName);
            }
        }
    } else {
        // stop all: unwrap everything up the chain
        while (wrapper && wrapper.classList.contains("anim-wrapper")) {
            const parent = unwrapWrapper(wrapper);
            wrapper = parent.closest(".anim-wrapper");
        }
    }

    // ✅ Clean up selection box and handles
    try {
        document.getElementById("selection-box").remove();
    } catch (e) {}
    
    // Remove handles when stopping animation
    if (typeof removeHandles === 'function') {
        removeHandles();
    }
    
    // ✅ NEW: Restore original appearance for clipPath shapes
    restoreClipPathShapeAppearance(element);
}


// helper: unwrap a wrapper group and return parent
function unwrapWrapper(wrapper) {
    // Clean up boiled filter if present
    if (wrapper.hasAttribute("filter")) {
        const filterUrl = wrapper.getAttribute("filter");
        if (filterUrl && filterUrl.startsWith("url(")) {
            const idMatch = filterUrl.match(/#([^)]*)/);
            if (idMatch) {
                const filterId = idMatch[1];
                const filterElem = document.getElementById(filterId);
                if (filterElem && filterElem.tagName.toLowerCase() === "filter") {
                    filterElem.remove();
                }
            }
        }
        // Remove the filter attribute from the wrapper
        wrapper.removeAttribute("filter");
        wrapper.removeAttribute("data-boiled-filter-id");
    }
    
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
    return parent;
}




// Special temp animation handling for clipPath shapes - no temp wrapper
function applyTempAnimationToClipPathShape(element, speed, animName = undefined) {
    // Hide selection box and handles for temp animation preview
    if (document.getElementById("selection-box")) {
        document.getElementById("selection-box").remove();
    }
    removeHandles();
    
    // Clean up any existing temp animation on the element
    if (element.style.animation && element.style.animation.includes("temp-generic")) {
        element.style.animation = "";
    }

    const animationName = "temp-generic";
    const current_selected_anim_in_dropdown = document.getElementById("animation-type").value;
    const animationData = animationsData[current_selected_anim_in_dropdown];
    if (!animationData) {
        console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
        return;
    }

    // Handle apply-based animations (like "boiled") - not supported for clipPath shapes
    if (animationData.apply) {
        updateStatusBar("Apply-based animations not supported for clipPath shapes! ❌");
        return;
    }

    // Build keyframes
    let keyframes = animationData.generateKeyframes
        ? animationData.generateKeyframes(animationData.params)
        : animationData.keyframes;
        
    // ✅ FIX: Scale down animation intensity for clipPath elements
    keyframes = scaleAnimationIntensityForClipPath(keyframes, animationData.type);

    if (!keyframes) {
        console.error(`No keyframes found for animation "${current_selected_anim_in_dropdown}"`);
        return;
    }

    let keyframesString = "";
    for (let percentage in keyframes) {
        let properties = keyframes[percentage];
        let propsString = Object.keys(properties)
            .map(prop => `${prop}: ${properties[prop]};`)
            .join(" ");
        keyframesString += `${percentage} { ${propsString} } `;
    }

    // ✅ FIX: Check if temp-generic style tag already exists and update it, or create new one
    let existingStyleTag = document.querySelector(`style#${animationName}`);
    if (existingStyleTag) {
        // Update existing style tag content
        existingStyleTag.innerHTML = `@keyframes ${animationName} { ${keyframesString} }`;
    } else {
        // Create new style tag
        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;
        svgRoot.insertAdjacentHTML("beforeend", embeddedStyle);
    }

        // Apply animation directly to the element (no wrapper)
        const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
        element.style.animation = newAnimation;

        // ✅ NEW: For clipPath shapes, make them temporarily visible during animation
        if (isInsideClipPath(element)) {
            // Store original style values
            const originalStyle = element.getAttribute('style') || '';
            element.setAttribute('data-original-style', originalStyle);
            
            // Make the element visible for animation preview by modifying the style attribute
            let newStyle = originalStyle;
            
            // Remove fill: none if present
            newStyle = newStyle.replace(/fill\s*:\s*none\s*;?/g, '');
            
            // Add visible fill and stroke
            if (!newStyle.includes('fill:')) {
                newStyle += ' fill: rgba(99, 102, 241, 0.3);';
            }
            if (!newStyle.includes('stroke:')) {
                newStyle += ' stroke: #6366f1; stroke-width: 2px;';
            }
            
            element.setAttribute('style', newStyle);
            
            // ✅ FIX: Set proper transform origin for clipPath elements
            setCorrectTransformOriginForClipPath(element);
        } else {
            setCorrectTransformOrigin(element);
        }
        element.classList.add("application-animation-class");
}

function applyTempAnimation(element, speed, animName = undefined) {
    // Hide selection box and handles for temp animation preview
    if (document.getElementById("selection-box")) {
        document.getElementById("selection-box").remove();
    }
    removeHandles();

    // ✅ NEW: Prevent temp animations on clipPath elements themselves (they have no geometry)
    if (element.tagName === 'clipPath') {
        console.warn("Cannot apply temp animations to clipPath elements - they have no geometry to animate.");
        return;
    }

    // ✅ NEW: Special handling for offset-path animations - skip temp animation, apply directly
    const current_selected_anim_in_dropdown = document.getElementById("animation-type").value;
    if (current_selected_anim_in_dropdown === 'offset-path') {
        console.log('Skipping temp animation for offset-path, will apply directly');
        return; // Skip temp animation for offset-path, apply directly
    }

    // ✅ NEW: Special handling for clipPath shapes - no temp wrapper
    if (isInsideClipPath(element)) {
        return applyTempAnimationToClipPathShape(element, speed, animName);
    }

    // removeStyleTag("temp-generic");
    // 🧹 Clean up any old preview first
    const oldWrapper = document.querySelector(".anim-wrapper.temp-anim");
    if (oldWrapper) {
        // ✅ NEW: Check if this temp wrapper contains offset-path animations
        const offsetPathElement = oldWrapper.querySelector('[class*="temp-temp-offset-path"]');
        if (offsetPathElement) {
            // This is an offset-path temp animation nested inside a temp wrapper
            // We need to remove the entire outer wrapper structure
            console.log('Found offset-path animation inside temp wrapper, removing entire wrapper structure');
            
            // Find the actual shape element (circle, rect, etc.)
            const actualElement = offsetPathElement;
            
            // Restore the element's original position
            const originalCx = actualElement.getAttribute('data-temp-original-cx');
            const originalCy = actualElement.getAttribute('data-temp-original-cy');
            const originalX = actualElement.getAttribute('data-temp-original-x');
            const originalY = actualElement.getAttribute('data-temp-original-y');
            
            if (actualElement.tagName.toLowerCase() === 'circle' || actualElement.tagName.toLowerCase() === 'ellipse') {
                if (originalCx) actualElement.setAttribute('cx', originalCx);
                if (originalCy) actualElement.setAttribute('cy', originalCy);
            } else if (actualElement.tagName.toLowerCase() === 'rect') {
                if (originalX) actualElement.setAttribute('x', originalX);
                if (originalY) actualElement.setAttribute('y', originalY);
            }
            
            // Remove temp animation classes and data attributes
            actualElement.classList.remove('temp-temp-offset-path', 'temp-anim');
            actualElement.removeAttribute('data-temp-original-cx');
            actualElement.removeAttribute('data-temp-original-cy');
            actualElement.removeAttribute('data-temp-original-x');
            actualElement.removeAttribute('data-temp-original-y');
            
            // Remove the temp offset-path style tag
            const tempStyleTag = document.getElementById('temp-temp-offset-path');
            if (tempStyleTag) {
                tempStyleTag.remove();
            }
            
            // Remove the temp-generic style tag
            removeStyleTag("temp-generic");
            
            
            // Unwrap the entire wrapper structure
            unwrapWrapper(oldWrapper);
            
        } else {
            // This is a regular temp animation, use the standard cleanup
            removeTempPreview(oldWrapper);
        }
    }
    
    // ✅ NEW: Also clean up any standalone offset-path temp animations (now simplified)
    const oldOffsetPathElement = document.querySelector('[class*="temp-temp-offset-path"]');
    if (oldOffsetPathElement) {
        removeTempOffsetPathAnimation(oldOffsetPathElement);
    }


    // ✅ Find or create a temp wrapper
    let wrapper;
    if (element.closest && element.closest(".anim-wrapper.temp-anim")) {
        wrapper = element.closest(".anim-wrapper.temp-anim");
    } else {
        wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
        wrapper.classList.add("anim-wrapper", "temp-anim");
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    const animationName = "temp-generic";
    const animationData = animationsData[current_selected_anim_in_dropdown];
    if (!animationData) {
        console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
        return;
    }

    // ✅ NEW special case: filter-based animations like "boiled"
    if (animationData.apply) {
        animationData.apply(wrapper, animationData.params);
        wrapper.classList.add("application-animation-class");
        wrapper.classList.add(`${current_selected_anim_in_dropdown}-animation-class`);
        return; // stop here, skip keyframe logic
    }
    
    // ✅ NEW special case: offset-path animations - apply directly without temp wrapper
    if (current_selected_anim_in_dropdown === 'offset-path') {
        applyOffsetPathAnimation(element, animationData, wrapper);
        return; // stop here, skip keyframe logic
    }

    // Build keyframes
    const keyframes = animationData.generateKeyframes
        ? animationData.generateKeyframes(animationData.params)
        : animationData.keyframes;

    let keyframesString = "";
    for (let percentage in keyframes) {
        let properties = keyframes[percentage];
        let propsString = Object.keys(properties)
            .map(prop => `${prop}: ${properties[prop]};`)
            .join(" ");
        keyframesString += `${percentage} { ${propsString} } `;
    }

    // ✅ FIX: Check if temp-generic style tag already exists and update it, or create new one
    let existingStyleTag = document.querySelector(`style#${animationName}`);
    if (existingStyleTag) {
        // Update existing style tag content
        existingStyleTag.innerHTML = `@keyframes ${animationName} { ${keyframesString} }`;
    } else {
        // Create new style tag
        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;
        svgRoot.insertAdjacentHTML("beforeend", embeddedStyle);
    }

    // Apply animation only to temp wrapper
    const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
    wrapper.style.animation = newAnimation;

    setCorrectTransformOrigin(wrapper);
    wrapper.classList.add("application-animation-class");
}


// Special animation handling for clipPath shapes - no anim-wrapper groups
function applyAnimationToClipPathShape(element, speed, animName = undefined, save = true) {
    try {
        const elementId = element.getAttribute("id") || element.tagName;
        const selectedAnimation = animName || document.getElementById("animation-type").value;
        const animationName = uniqueID();

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        removeStyleTag(animationName);

        // Handle apply-based animations (like "boiled") - not supported for clipPath shapes
        if (animationData.apply) {
            updateStatusBar("Apply-based animations not supported for clipPath shapes! ❌");
            showNotification("Apply-based animations are not supported for clipPath shapes. Please use keyframe-based animations.", "warning");
            return;
        }

        // Build keyframes for keyframe-based animations
        let keyframes = animationData.generateKeyframes
            ? animationData.generateKeyframes(animationData.params)
            : animationData.keyframes;
            
        // ✅ FIX: Scale down animation intensity for clipPath elements
        keyframes = scaleAnimationIntensityForClipPath(keyframes, animationData.type);

        if (!keyframes) {
            throw new Error(`No keyframes found for animation "${selectedAnimation}"`);
        }

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

        // Apply animation directly to the element (no wrapper)
        const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
        element.style.animation = newAnimation;

        // ✅ NEW: For clipPath shapes, make them temporarily visible during animation
        // Store original style values
        const originalStyle = element.getAttribute('style') || '';
        element.setAttribute('data-original-style', originalStyle);
        
        // Make the element visible for animation preview by modifying the style attribute
        let newStyle = originalStyle;
        
        // Remove fill: none if present
        newStyle = newStyle.replace(/fill\s*:\s*none\s*;?/g, '');
        
        // Add visible fill and stroke
        if (!newStyle.includes('fill:')) {
            newStyle += ' fill: rgba(99, 102, 241, 0.3);';
        }
        if (!newStyle.includes('stroke:')) {
            newStyle += ' stroke: #6366f1; stroke-width: 2px;';
        }
        
        element.setAttribute('style', newStyle);

        // ✅ FIX: Set proper transform origin for clipPath elements
        setCorrectTransformOriginForClipPath(element);

        if (save === true) {
            const propertiesToSave = {
                speed: `${speed}`,
                animationName: animationName,
                isClipPathShape: true // Mark as clipPath shape for special handling
            };
            // Save parameters for generateKeyframes animations
            if (animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            const animationId = saveAnimation(elementId, selectedAnimation, propertiesToSave);

            // Create named destination for this clipPath element
            if (typeof createNamedDestination === 'function') {
                // Use the original element's ID, not any wrapper's ID
                const originalElementId = element.getAttribute("id") || element.tagName;
                createNamedDestination(originalElementId, element, selectedAnimation, elementId, animationId);
            }

            // ✅ NEW: Disable animation dropdown and show warning for clipPath elements
            // Since clipPath elements only support one animation, disable the dropdown
            const animationDropdown = document.getElementById('animation-type');
            if (animationDropdown) {
                animationDropdown.disabled = true;
            }
            
            // Show the clipPath warning message
            if (typeof showClipPathWarning === 'function') {
                showClipPathWarning(element);
            }

            resetControls();
            updateStatusBar(`Animation "${selectedAnimation}" applied to clipPath shape! ✨`);
            showNotification(`Animation "${selectedAnimation}" applied successfully to clipPath shape!`, "success");
            
            // Update the animation count message
            updateAnimationCountMessage(elementId);
        }
    } catch (error) {
        console.error("Error applying animation to clipPath shape:", error);
        updateStatusBar("Error applying animation to clipPath shape! ❌");
        showNotification("Error applying animation to clipPath shape!", "error");
    }
}

function applyAnimation(element, speed, animName = undefined, save = true) {
    try {
        removeStyleTag("temp-generic");

        // ✅ NEW: Prevent animations on clipPath elements themselves (they have no geometry)
        if (element.tagName === 'clipPath') {
            throw new Error("Cannot apply animations to clipPath elements - they have no geometry to animate.");
        }

        // ✅ NEW: Special handling for clipPath shapes - no anim-wrapper groups
        if (isInsideClipPath(element)) {
            return applyAnimationToClipPathShape(element, speed, animName, save);
        }

        // ✅ If a temp wrapper exists, promote it
        let wrapper = element.closest
            ? element.closest(".anim-wrapper.temp-anim")
            : null;

        if (wrapper) {
            wrapper.classList.remove("temp-anim"); // promotion
        } else {
            wrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
            wrapper.classList.add("anim-wrapper");
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

        const elementId = wrapper.getAttribute("id") || element.getAttribute("id") || element.tagName;
        const selectedAnimation = animName || document.getElementById("animation-type").value;
        const animationName = uniqueID();

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        // ✅ NEW: Special handling for offset-path animations - apply directly without wrapper
        if (selectedAnimation === 'offset-path') {
            return applyOffsetPathAnimation(element, animationData, wrapper);
        }

        removeStyleTag(animationName);

        // Handle apply-based animations (like "boiled")
        if (animationData.apply) {
            animationData.apply(wrapper, animationData.params);
            wrapper.classList.add("application-animation-class");
            wrapper.classList.add(`${selectedAnimation}-animation-class`);
        } else {
            // Build keyframes for keyframe-based animations
            const keyframes = animationData.generateKeyframes
                ? animationData.generateKeyframes(animationData.params)
                : animationData.keyframes;

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
            const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
            wrapper.style.animation = newAnimation;
        }

        setCorrectTransformOrigin(wrapper);

        if (save === true) {
            const propertiesToSave = {
                speed: `${speed}`,
                animationName: animationName
            };
            // Save parameters for both generateKeyframes and apply-based animations
            if (animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            const animationId = saveAnimation(elementId, selectedAnimation, propertiesToSave);

            // Create named destination for this element
            if (typeof createNamedDestination === 'function') {
                // Use the original element's ID, not the wrapper's ID
                const originalElementId = element.getAttribute("id") || element.tagName;
                createNamedDestination(originalElementId, element, selectedAnimation, elementId, animationId);
            }

            resetControls();
            updateStatusBar(`Animation "${selectedAnimation}" applied! ✨`);
            showNotification(`Animation "${selectedAnimation}" applied successfully!`, "success");
            
            // Update the animation count message
            updateAnimationCountMessage(elementId);
        }
    } catch (error) {
        console.error("Error applying animation:", error);
        updateStatusBar("Error applying animation! ❌");
        showNotification(`Failed to apply animation: ${error.message}`, "error");
    }
}


// Apply animation to image with wrapper
function applyAnimationToImage(element, speed, animName) {
    // Check if the element is a leaf node
    const isLeafElement = element.children.length === 0;

    let gWrapper;

    // If it's a leaf element, check if it's already wrapped by a 'wrapping-group'
    // ✅ NEW: Skip wrapping-group creation for clipPath shapes
    if (isLeafElement && !isInsideClipPath(element)) {
        if (element.parentNode.tagName.toLowerCase() === 'g' && element.parentNode.classList.contains('wrapping-group')) {
            // It's already wrapped by the correct <g> element, so use the existing wrapper
            gWrapper = element.parentNode;
        } else {
            // It's not wrapped yet, so wrap it in a new <g> element with class 'wrapping-group'
            gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gWrapper.classList.add('wrapping-group');
            element.parentNode.insertBefore(gWrapper, element);
            gWrapper.appendChild(element);
        }
    } else {
        // If it's not a leaf element, we assume it's already a group or doesn't need wrapping
        gWrapper = element;
    }

    // Now apply the animation to the <g> wrapper or the original element
    applyTempAnimation(gWrapper, speed, animName, false);
}



function wrapForAnimation(element) {
    // If it's already an anim-wrapper, we wrap THAT wrapper
    let target = element;
    if (
        element.parentNode &&
        element.parentNode.tagName.toLowerCase() === 'g' &&
        element.parentNode.classList.contains('anim-wrapper')
    ) {
        target = element.parentNode;
    }

    // Create a new wrapper
    const gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gWrapper.classList.add('anim-wrapper');

    // Insert wrapper before the target
    target.parentNode.insertBefore(gWrapper, target);
    gWrapper.appendChild(target);

    return gWrapper;
}


function ensureWrapper(element) {
    // If already wrapped in <g.anim-wrapper>, return that wrapper
    if (
        element.parentNode &&
        element.parentNode.tagName.toLowerCase() === 'g' &&
        element.parentNode.classList.contains('anim-wrapper')
    ) {
        return element.parentNode;
    }

    // Otherwise, create a new wrapper group
    const gWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gWrapper.classList.add('anim-wrapper');

    element.parentNode.insertBefore(gWrapper, element);
    gWrapper.appendChild(element);

    return gWrapper;
}


// Function to render parameter controls for parametric animations
function renderParamControls(animationName) {
    const anim = animationsData[animationName];
    const panel = document.getElementById("animation-param-panel");
    const controlsContainer = panel.querySelector(".param-controls");
    
    // Clear existing controls
    controlsContainer.innerHTML = "";
    
    if (!anim || !anim.params) {
        // No parameters - hide the panel
        panel.style.display = "none";
        return;
    }
    
    // Show the panel and create controls for each parameter
    panel.style.display = "block";
    
    // Auto-detect and update parameters based on selected element
    if (selectedElement && anim.params) {
        updateAnimationParamsFromElement(animationName, selectedElement);
    }
    
    // ✅ NEW: Separate dropdown and slider parameters for better ordering
    const dropdownParams = [];
    const sliderParams = [];
    
    for (const [param, value] of Object.entries(anim.params)) {
        if (anim.paramConfig && anim.paramConfig[param] && anim.paramConfig[param].type === 'dropdown') {
            dropdownParams.push([param, value]);
        } else {
            sliderParams.push([param, value]);
        }
    }
    
    // ✅ NEW: Create dropdown controls first (especially rail dropdown)
    for (const [param, value] of dropdownParams) {
        const controlWrapper = document.createElement("div");
        controlWrapper.className = "param-control";
        
        const label = document.createElement("label");
        label.className = "param-label";
        label.textContent = `${param}: `;
        
        // Check if this is a dropdown parameter
        if (anim.paramConfig && anim.paramConfig[param] && anim.paramConfig[param].type === 'dropdown') {
            const config = anim.paramConfig[param];
            const select = document.createElement("select");
            select.className = "param-dropdown";
            
            // Add default option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select a rail...";
            select.appendChild(defaultOption);
            
            // Populate options based on parameter type
            if (param === 'rail') {
                // Check if getSavedRails function is available
                if (typeof getSavedRails !== 'function') {
                    console.error('getSavedRails function not available');
                    // Add a disabled option
                    const disabledOption = document.createElement("option");
                    disabledOption.value = "";
                    disabledOption.textContent = "Rails not available";
                    disabledOption.disabled = true;
                    select.appendChild(disabledOption);
                } else {
                    // Get saved rails
                    const rails = getSavedRails();
                    const railNames = Object.keys(rails).sort();
                
                    railNames.forEach(railName => {
                        const option = document.createElement("option");
                        option.value = railName;
                        option.textContent = railName;
                        select.appendChild(option);
                    });
                    
                    // ✅ NEW: Auto-select the first rail if no value is set and rails are available
                    if (!value && railNames.length > 0) {
                        const firstRail = railNames[0];
                        anim.params[param] = firstRail;
                        select.value = firstRail;
                        console.log(`Auto-selected first rail: ${firstRail}`);
                    }
                }
            }
            
            // Set current value (or use auto-selected value)
            select.value = anim.params[param] || "";
            
            // Add event listener for real-time updates
            select.addEventListener("change", () => {
                const newValue = select.value;
                anim.params[param] = newValue;
                
                // Apply temporary animation to preview changes
                if (selectedElement) {
                    applyTempAnimation(selectedElement, document.getElementById('speed-slider').value, undefined, false);
                }
            });
            
            controlWrapper.appendChild(label);
            controlWrapper.appendChild(select);
            controlsContainer.appendChild(controlWrapper);
        }
    }
    
    // ✅ NEW: Create slider controls after dropdown controls
    for (const [param, value] of sliderParams) {
        const controlWrapper = document.createElement("div");
        controlWrapper.className = "param-control";
        
        const label = document.createElement("label");
        label.className = "param-label";
        label.textContent = `${param}: `;
        
        // Regular slider input
        const input = document.createElement("input");
        input.type = "range";
        input.className = "param-slider";
        
        // Use paramConfig if available, otherwise fall back to old logic
        if (anim.paramConfig && anim.paramConfig[param]) {
            const config = anim.paramConfig[param];
            input.min = config.min.toString();
            input.max = config.max.toString();
            input.step = config.step.toString();
            // Reset param to default if it's not within the configured range
            if (value < config.min || value > config.max) {
                anim.params[param] = config.default;
                input.value = config.default;
            } else {
                input.value = value;
            }
        } else {
            // Fallback to old logic for backward compatibility
            if (param.includes("amplitude") || param.includes("intensity")) {
                input.min = "0.1";
                input.max = "3.0";
                input.step = "0.1";
            } else if (param.includes("blur")) {
                input.min = "0";
                input.max = "20";
                input.step = "1";
            } else if (param.includes("skew")) {
                input.min = "5";
                input.max = "45";
                input.step = "1";
            } else if (param.includes("dash")) {
                input.min = "1";
                input.max = "50";
                input.step = "1";
            } else if (param.includes("gap")) {
                input.min = "1";
                input.max = "30";
                input.step = "1";
            } else {
                // Default range
                input.min = "0";
                input.max = value;
                input.step = "0.1";
            }
            input.value = value;
        }
        
        const span = document.createElement("span");
        span.className = "param-value";
        span.textContent = value;
        
        // Add event listener for real-time updates
        input.addEventListener("input", () => {
            const newValue = parseFloat(input.value);
            anim.params[param] = newValue;
            span.textContent = newValue;
            
            // Apply temporary animation to preview changes
            if (selectedElement) {
                applyTempAnimation(selectedElement, document.getElementById('speed-slider').value, undefined, false);
            }
        });
        
        controlWrapper.appendChild(label);
        controlWrapper.appendChild(input);
        controlWrapper.appendChild(span);
        controlsContainer.appendChild(controlWrapper);
    }
}

// Function to detect stroke properties from selected element and update animation parameters
function updateAnimationParamsFromElement(animationName, element) {
    const anim = animationsData[animationName];
    if (!anim || !anim.params) return;
    
    // Get the actual SVG element (not the wrapper)
    const svgElement = element.classList.contains('anim-wrapper') ? element.querySelector('*') : element;
    if (!svgElement) return;
    
    let paramsUpdated = false;
    
    // Helper function to get style value from both inline and computed styles
    function getStyleValue(element, property) {
        // First try inline style
        let value = element.style.getPropertyValue(property);
        if (value && value !== '') return value;
        
        // Fall back to computed style
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.getPropertyValue(property);
    }
    
    // Check for stroke-dash animation specifically
    if (animationName === 'stroke-dash') {
        const strokeDasharray = getStyleValue(svgElement, 'stroke-dasharray');
        
        if (strokeDasharray && strokeDasharray !== 'none') {
            // Parse existing stroke-dasharray values
            const dashValues = strokeDasharray.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
            
            if (dashValues.length > 0) {
                // Use the first value as dashLength if it's within configured range
                const dashConfig = anim.paramConfig?.dashLength;
                const minDash = dashConfig?.min || 1;
                const maxDash = dashConfig?.max || 50;
                
                if (dashValues[0] >= minDash && dashValues[0] <= maxDash) {
                    anim.params.dashLength = Math.round(dashValues[0]);
                    paramsUpdated = true;
                }
                
                // Use the second value as gapLength if it exists and is within configured range
                if (dashValues.length > 1) {
                    const gapConfig = anim.paramConfig?.gapLength;
                    const minGap = gapConfig?.min || 1;
                    const maxGap = gapConfig?.max || 30;
                    
                    if (dashValues[1] >= minGap && dashValues[1] <= maxGap) {
                        anim.params.gapLength = Math.round(dashValues[1]);
                        paramsUpdated = true;
                    }
                }
            }
        }
        
        // Also check for stroke-width to adjust dash size if needed
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust dashLength based on stroke width for better visual balance
            if (strokeWidth > 5) {
                const dashConfig = anim.paramConfig?.dashLength;
                const minDash = dashConfig?.min || 1;
                const maxDash = dashConfig?.max || 50;
                const newDashLength = Math.max(anim.params.dashLength, Math.round(strokeWidth * 2));
                anim.params.dashLength = Math.min(Math.max(newDashLength, minDash), maxDash);
                paramsUpdated = true;
            }
        }
        
        // If no existing stroke-dasharray, create a reasonable default based on stroke-width
        if (!strokeDasharray || strokeDasharray === 'none') {
            const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width')) || 1;
            const dashConfig = anim.paramConfig?.dashLength;
            const gapConfig = anim.paramConfig?.gapLength;
            
            const minDash = dashConfig?.min || 1;
            const maxDash = dashConfig?.max || 50;
            const minGap = gapConfig?.min || 1;
            const maxGap = gapConfig?.max || 30;
            
            anim.params.dashLength = Math.min(Math.max(8, Math.round(strokeWidth * 3)), maxDash);
            anim.params.gapLength = Math.min(Math.max(4, Math.round(strokeWidth * 1.5)), maxGap);
            paramsUpdated = true;
        }
        
        // Ensure values are within configured ranges
        const dashConfig = anim.paramConfig?.dashLength;
        const gapConfig = anim.paramConfig?.gapLength;
        
        if (dashConfig) {
            anim.params.dashLength = Math.min(Math.max(anim.params.dashLength, dashConfig.min), dashConfig.max);
        }
        if (gapConfig) {
            anim.params.gapLength = Math.min(Math.max(anim.params.gapLength, gapConfig.min), gapConfig.max);
        }
    }
    
    // Check for other stroke-related animations
    if (animationName === 'blur') {
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust blur amount based on stroke width, respecting config limits
            const blurConfig = anim.paramConfig?.blurAmount;
            const minBlur = blurConfig?.min || 0;
            const maxBlur = blurConfig?.max || 20;
            const newBlurAmount = Math.max(anim.params.blurAmount, Math.round(strokeWidth * 2));
            anim.params.blurAmount = Math.min(Math.max(newBlurAmount, minBlur), maxBlur);
            paramsUpdated = true;
        }
    }
    
    // Check for transform-based animations
    if (animationName === 'skew') {
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust skew amount based on stroke width for better visual effect
            if (strokeWidth > 3) {
                const skewConfig = anim.paramConfig?.skewAmount;
                const minSkew = skewConfig?.min || 5;
                const maxSkew = skewConfig?.max || 45;
                const newSkewAmount = Math.max(anim.params.skewAmount, Math.round(strokeWidth * 3));
                anim.params.skewAmount = Math.min(Math.max(newSkewAmount, minSkew), maxSkew);
                paramsUpdated = true;
            }
        }
    }
    
    // Show notification if parameters were updated
    if (paramsUpdated) {
        showNotification(`Parameters auto-detected from selected element! ✨`, 'info');
    }
}

// ✅ NEW: Function to scale down animation intensity for clipPath elements
function scaleAnimationIntensityForClipPath(keyframes, animationType) {
    if (!keyframes) return keyframes;
    
    // Define scaling factors for different animation types
    const scalingFactors = {
        'geometry': 0.3,  // Scale down geometry animations (scale, translate, rotate)
        'filter': 1.0     // Keep filter animations at full intensity
    };
    
    const scaleFactor = scalingFactors[animationType] || 0.5; // Default scaling
    
    const scaledKeyframes = {};
    
    for (let percentage in keyframes) {
        const properties = keyframes[percentage];
        const scaledProperties = {};
        
        for (let prop in properties) {
            let value = properties[prop];
            
            // Scale transform values
            if (prop === 'transform') {
                // Scale translate values
                value = value.replace(/translate\(([^,]+),\s*([^)]+)\)/g, (match, x, y) => {
                    const scaledX = parseFloat(x) * scaleFactor;
                    const scaledY = parseFloat(y) * scaleFactor;
                    return `translate(${scaledX}px, ${scaledY}px)`;
                });
                
                // Scale scale values (but keep them above 0.1 to avoid invisible elements)
                value = value.replace(/scale\(([^)]+)\)/g, (match, scaleValue) => {
                    const scale = parseFloat(scaleValue);
                    const scaledScale = Math.max(0.1, 1 + (scale - 1) * scaleFactor);
                    return `scale(${scaledScale})`;
                });
                
                // Scale rotate values
                value = value.replace(/rotate\(([^)]+)\)/g, (match, rotateValue) => {
                    const rotate = parseFloat(rotateValue);
                    const scaledRotate = rotate * scaleFactor;
                    return `rotate(${scaledRotate}deg)`;
                });
            }
            
            scaledProperties[prop] = value;
        }
        
        scaledKeyframes[percentage] = scaledProperties;
    }
    
    return scaledKeyframes;
}

// Apply offset-path animation with special handling - NO WRAPPER GROUPS
function applyOffsetPathAnimation(element, animationData, wrapper) {
    // Get the selected rail
    const selectedRail = animationData.params.rail;
    if (!selectedRail) {
        console.error('No rail selected for offset-path animation');
        return;
    }
    
    // Get the rail data
    if (typeof getSavedRails !== 'function') {
        console.error('getSavedRails function not available');
        return;
    }
    
    const rails = getSavedRails();
    const railData = rails[selectedRail];
    if (!railData) {
        console.error('Rail not found:', selectedRail);
        return;
    }
    
    // Create a unique animation ID
    const animationId = uniqueID();
    const animationName = `offset-path-${animationId}`;
    
    // Extract the actual shape element from any wrapper structure
    let actualElement = element;
    if (element.classList.contains('wrapping-group') || element.classList.contains('anim-wrapper')) {
        const shapeElement = element.querySelector('circle, ellipse, rect, path, line, polyline, polygon');
        if (shapeElement) {
            actualElement = shapeElement;
        }
    }
    
    // Get the original element's position and attributes
    // First check if we have stored position from temp animation in data attributes
    let originalCx, originalCy, originalX, originalY;
    
    // Check if the actual element has the original position stored in data attributes
    const storedCx = actualElement.getAttribute('data-temp-original-cx');
    const storedCy = actualElement.getAttribute('data-temp-original-cy');
    const storedX = actualElement.getAttribute('data-temp-original-x');
    const storedY = actualElement.getAttribute('data-temp-original-y');
    
    if (storedCx !== null && storedCy !== null) {
        // Use the position stored during temp animation
        originalCx = storedCx;
        originalCy = storedCy;
        originalX = storedX || 0;
        originalY = storedY || 0;
    } else {
        // This is the first time applying offset-path animation
        // We need to capture the original position before the element gets moved to 0,0
        // Check if the element is already at 0,0 (which means it might have been moved by a previous animation)
        const currentCx = actualElement.getAttribute('cx');
        const currentCy = actualElement.getAttribute('cy');
        const currentX = actualElement.getAttribute('x');
        const currentY = actualElement.getAttribute('y');
        
        if (currentCx === '0' && currentCy === '0' && currentX === '0' && currentY === '0') {
            // Element is already at 0,0, try to get original position from data attributes
            originalCx = actualElement.getAttribute('data-original-cx') || 0;
            originalCy = actualElement.getAttribute('data-original-cy') || 0;
            originalX = actualElement.getAttribute('data-original-x') || 0;
            originalY = actualElement.getAttribute('data-original-y') || 0;
        } else {
            // Element is at its original position, capture it
            originalCx = currentCx || 0;
            originalCy = currentCy || 0;
            originalX = currentX || 0;
            originalY = currentY || 0;
        }
    }
    
    // Reset element position to 0,0 for offset-path animation
    if (actualElement.tagName.toLowerCase() === 'circle' || actualElement.tagName.toLowerCase() === 'ellipse') {
        actualElement.setAttribute('cx', '0');
        actualElement.setAttribute('cy', '0');
    } else if (actualElement.tagName.toLowerCase() === 'rect') {
        actualElement.setAttribute('x', '0');
        actualElement.setAttribute('y', '0');
    }
    
    // Add the animation class to the element itself
    actualElement.classList.add(animationName);
    actualElement.classList.add('application-animation-class');
    
    // Create the CSS animation
    const direction = animationData.params.direction || 0;
    const speed = animationData.params.speed || 1.0;
    const duration = 8 / speed; // Base duration of 8 seconds adjusted by speed
    
    const startDistance = direction === 0 ? "0%" : "100%";
    const endDistance = direction === 0 ? "100%" : "0%";
    
    const style = document.createElement('style');
    style.id = animationName;
    style.setAttribute('data-anikit', '');
    style.textContent = `
        .${animationName} {
            offset-path: path("${railData.pathData}");
            offset-rotate: auto;
            animation: move-${animationId} ${duration}s linear infinite;
        }
        
        @keyframes move-${animationId} {
            to {
                offset-distance: ${endDistance};
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Store animation data for later removal
    actualElement.setAttribute('data-offset-path-animation', animationId);
    actualElement.setAttribute('data-original-cx', originalCx);
    actualElement.setAttribute('data-original-cy', originalCy);
    actualElement.setAttribute('data-original-x', originalX);
    actualElement.setAttribute('data-original-y', originalY);
    actualElement.setAttribute('data-rail-name', selectedRail);
    
    // Clean up temp animation data attributes
    actualElement.removeAttribute('data-temp-original-cx');
    actualElement.removeAttribute('data-temp-original-cy');
    actualElement.removeAttribute('data-temp-original-x');
    actualElement.removeAttribute('data-temp-original-y');
    
    // Clean up global temp position storage
    const elementId = actualElement.getAttribute('id') || actualElement.tagName;
    if (window.tempOffsetPathPositions && window.tempOffsetPathPositions[elementId]) {
        delete window.tempOffsetPathPositions[elementId];
    }
    
    // Save animation to localStorage for the animation selector
    if (typeof getSavedAnimations === 'function' && typeof saveAnimation === 'function') {
        const animationData = {
            type: 'offset-path',
            animationName: animationName,
            params: {
                speed: speed,
                direction: direction,
                rail: selectedRail
            },
            originalPosition: {
                cx: originalCx,
                cy: originalCy,
                x: originalX,
                y: originalY
            }
        };
        saveAnimation(elementId, 'offset-path', animationData);
    }
    
    console.log('Applied offset-path animation:', animationName);
}


// Apply temp offset-path animation for preview - NO WRAPPER GROUPS
function applyTempOffsetPathAnimation(element, speed, animName = undefined) {
    // Get the selected rail
    const railSelect = document.querySelector('.param-dropdown');
    const selectedRail = railSelect ? railSelect.value : '';
    
    if (!selectedRail) {
        console.warn('No rail selected for offset-path animation preview');
        return;
    }
    
    // Get the rail data
    if (typeof getSavedRails !== 'function') {
        console.error('getSavedRails function not available');
        return;
    }
    
    const rails = getSavedRails();
    const railData = rails[selectedRail];
    if (!railData) {
        console.error('Rail not found:', selectedRail);
        return;
    }
    
    // Clean up any existing temp offset-path animation
    removeTempOffsetPathAnimation(element);
    
    // Create a unique temp animation ID
    const tempAnimationId = 'temp-offset-path';
    const animationName = `temp-${tempAnimationId}`;
    
    // Extract the actual shape element from any wrapper structure
    let actualElement = element;
    if (element.classList.contains('wrapping-group') || element.classList.contains('anim-wrapper')) {
        const shapeElement = element.querySelector('circle, ellipse, rect, path, line, polyline, polygon');
        if (shapeElement) {
            actualElement = shapeElement;
        }
    }
    
    console.log('Temp animation - actual element found:', actualElement);
    
    // Get the original element's position and attributes from the actual element
    const originalCx = actualElement.getAttribute('cx') || 0;
    const originalCy = actualElement.getAttribute('cy') || 0;
    const originalX = actualElement.getAttribute('x') || 0;
    const originalY = actualElement.getAttribute('y') || 0;
    
    console.log('Temp animation - capturing original position:', { cx: originalCx, cy: originalCy, x: originalX, y: originalY });
    
    // Reset element position to 0,0 for offset-path animation
    if (actualElement.tagName.toLowerCase() === 'circle' || actualElement.tagName.toLowerCase() === 'ellipse') {
        actualElement.setAttribute('cx', '0');
        actualElement.setAttribute('cy', '0');
    } else if (actualElement.tagName.toLowerCase() === 'rect') {
        actualElement.setAttribute('x', '0');
        actualElement.setAttribute('y', '0');
    }
    
    // Add the animation class to the element itself
    actualElement.classList.add(animationName);
    actualElement.classList.add('temp-anim');
    
    // Create the CSS animation
    const direction = 0; // Default direction for temp preview
    const duration = 8 / (speed || 1.0); // Base duration of 8 seconds adjusted by speed
    
    const startDistance = direction === 0 ? "0%" : "100%";
    const endDistance = direction === 0 ? "100%" : "0%";
    
    const style = document.createElement('style');
    style.id = animationName;
    style.setAttribute('data-temp', 'true');
    style.textContent = `
        .${animationName} {
            offset-path: path("${railData.pathData}");
            offset-rotate: auto;
            animation: temp-move-${tempAnimationId} ${duration}s linear infinite;
        }
        
        @keyframes temp-move-${tempAnimationId} {
            to {
                offset-distance: ${endDistance};
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // Store original position for restoration
    actualElement.setAttribute('data-temp-original-cx', originalCx);
    actualElement.setAttribute('data-temp-original-cy', originalCy);
    actualElement.setAttribute('data-temp-original-x', originalX);
    actualElement.setAttribute('data-temp-original-y', originalY);
    
    // Also store in a global variable for the permanent animation to use
    const elementId = actualElement.getAttribute('id') || actualElement.tagName;
    if (!window.tempOffsetPathPositions) {
        window.tempOffsetPathPositions = {};
    }
    window.tempOffsetPathPositions[elementId] = {
        cx: originalCx,
        cy: originalCy,
        x: originalX,
        y: originalY
    };
    console.log('Stored position in global variable for element', elementId, ':', window.tempOffsetPathPositions[elementId]);
    
    console.log('Applied temp offset-path animation:', animationName);
}

// Remove offset-path animation and restore original state - SIMPLIFIED
function removeOffsetPathAnimation(element) {
    console.log('removeOffsetPathAnimation called with element:', element);
    
    // Check if this is a temp animation or has temp classes
    if (element.classList.contains('temp-temp-offset-path')) {
        console.log('This element has temp animation classes, cleaning up temp animation first');
        removeTempOffsetPathAnimation(element);
        // Continue with permanent animation cleanup
    }
    
    // Extract the actual shape element from any wrapper structure
    let actualElement = element;
    if (element.classList.contains('wrapping-group') || element.classList.contains('anim-wrapper')) {
        const shapeElement = element.querySelector('circle, ellipse, rect, path, line, polyline, polygon');
        if (shapeElement) {
            actualElement = shapeElement;
        }
    }
    
    console.log('actualElement found:', actualElement);
    
    const animationId = actualElement.getAttribute('data-offset-path-animation');
    console.log('animationId found:', animationId);
    if (!animationId) return;
    
    // Remove the animation class
    const animationName = `offset-path-${animationId}`;
    console.log('Removing animation class:', animationName);
    console.log('Element classes before removal:', actualElement.getAttribute('class'));
    actualElement.classList.remove(animationName);
    actualElement.classList.remove('application-animation-class');
    console.log('Element classes after removal:', actualElement.getAttribute('class'));
    
    // Remove the style tag
    const styleTag = document.getElementById(animationName);
    if (styleTag) {
        styleTag.remove();
    }
    
    // Get original position from localStorage
    let originalCx, originalCy, originalX, originalY;
    if (typeof getSavedAnimations === 'function') {
        const elementId = actualElement.getAttribute('id') || actualElement.tagName;
        const savedAnimations = getSavedAnimations();
        if (savedAnimations.animations[elementId]) {
            for (const [savedAnimationId, savedAnimationData] of Object.entries(savedAnimations.animations[elementId])) {
                if (savedAnimationData.animationName === animationName && savedAnimationData.originalPosition) {
                    originalCx = savedAnimationData.originalPosition.cx;
                    originalCy = savedAnimationData.originalPosition.cy;
                    originalX = savedAnimationData.originalPosition.x;
                    originalY = savedAnimationData.originalPosition.y;
                    break;
                }
            }
        }
    }
    
    // Fallback to data attributes if localStorage doesn't have the position
    if (originalCx === undefined) {
        originalCx = actualElement.getAttribute('data-original-cx');
        originalCy = actualElement.getAttribute('data-original-cy');
        originalX = actualElement.getAttribute('data-original-x');
        originalY = actualElement.getAttribute('data-original-y');
    }
    
    console.log('Restoring position - originalCx:', originalCx, 'originalCy:', originalCy, 'originalX:', originalX, 'originalY:', originalY);
    
    if (actualElement.tagName.toLowerCase() === 'circle' || actualElement.tagName.toLowerCase() === 'ellipse') {
        if (originalCx) actualElement.setAttribute('cx', originalCx);
        if (originalCy) actualElement.setAttribute('cy', originalCy);
        console.log('Circle position after restoration - cx:', actualElement.getAttribute('cx'), 'cy:', actualElement.getAttribute('cy'));
    } else if (actualElement.tagName.toLowerCase() === 'rect') {
        if (originalX) actualElement.setAttribute('x', originalX);
        if (originalY) actualElement.setAttribute('y', originalY);
        console.log('Rect position after restoration - x:', actualElement.getAttribute('x'), 'y:', actualElement.getAttribute('y'));
    }
    
    // Clean up data attributes
    actualElement.removeAttribute('data-offset-path-animation');
    actualElement.removeAttribute('data-original-cx');
    actualElement.removeAttribute('data-original-cy');
    actualElement.removeAttribute('data-original-x');
    actualElement.removeAttribute('data-original-y');
    actualElement.removeAttribute('data-rail-name');
    
    // Remove animation from localStorage
    if (typeof getSavedAnimations === 'function' && typeof removeAnimation === 'function') {
        const elementId = actualElement.getAttribute('id') || actualElement.tagName;
        // Find the animation ID in localStorage that matches this animation
        const savedAnimations = getSavedAnimations();
        if (savedAnimations.animations[elementId]) {
            for (const [savedAnimationId, savedAnimationData] of Object.entries(savedAnimations.animations[elementId])) {
                if (savedAnimationData.animationName === animationName) {
                    removeAnimation(elementId, savedAnimationId);
                    break;
                }
            }
        }
    }
    
    console.log('Removed offset-path animation:', animationName);
}

// Remove temp offset-path animation and restore original state - SIMPLIFIED
function removeTempOffsetPathAnimation(element) {
    // Extract the actual shape element from any wrapper structure
    let actualElement = element;
    if (element.classList.contains('wrapping-group') || element.classList.contains('anim-wrapper')) {
        const shapeElement = element.querySelector('circle, ellipse, rect, path, line, polyline, polygon');
        if (shapeElement) {
            actualElement = shapeElement;
        }
    }
    
    // Remove the animation class
    actualElement.classList.remove('temp-temp-offset-path');
    actualElement.classList.remove('temp-anim');
    
    // Remove the style tag
    const styleTag = document.getElementById('temp-temp-offset-path');
    if (styleTag) {
        styleTag.remove();
    }
    
    // Restore original position
    const originalCx = actualElement.getAttribute('data-temp-original-cx');
    const originalCy = actualElement.getAttribute('data-temp-original-cy');
    const originalX = actualElement.getAttribute('data-temp-original-x');
    const originalY = actualElement.getAttribute('data-temp-original-y');
    
    if (actualElement.tagName.toLowerCase() === 'circle' || actualElement.tagName.toLowerCase() === 'ellipse') {
        if (originalCx) actualElement.setAttribute('cx', originalCx);
        if (originalCy) actualElement.setAttribute('cy', originalCy);
    } else if (actualElement.tagName.toLowerCase() === 'rect') {
        if (originalX) actualElement.setAttribute('x', originalX);
        if (originalY) actualElement.setAttribute('y', originalY);
    }
    
    // Clean up data attributes
    actualElement.removeAttribute('data-temp-original-cx');
    actualElement.removeAttribute('data-temp-original-cy');
    actualElement.removeAttribute('data-temp-original-x');
    actualElement.removeAttribute('data-temp-original-y');
    
    // Clean up global temp position storage
    const elementId = actualElement.getAttribute('id') || actualElement.tagName;
    if (window.tempOffsetPathPositions && window.tempOffsetPathPositions[elementId]) {
        delete window.tempOffsetPathPositions[elementId];
    }
    
    console.log('Removed temp offset-path animation');
}

// Export functions for use in other modules
window.removeStyleTag = removeStyleTag;
window.removeTempPreview = removeTempPreview;
window.removeTempPreviewFromClipPathShape = removeTempPreviewFromClipPathShape;
window.stopClipPathAnimation = stopClipPathAnimation;
window.CleanAnimationStyle = CleanAnimationStyle;
window.stopAnimation = stopAnimation;
window.applyTempAnimation = applyTempAnimation;
window.applyAnimationToImage = applyAnimationToImage;
window.applyAnimation = applyAnimation;
window.applyOffsetPathAnimation = applyOffsetPathAnimation;
window.removeOffsetPathAnimation = removeOffsetPathAnimation;
window.applyTempOffsetPathAnimation = applyTempOffsetPathAnimation;
window.removeTempOffsetPathAnimation = removeTempOffsetPathAnimation;
window.renderParamControls = renderParamControls;
window.updateAnimationParamsFromElement = updateAnimationParamsFromElement;
window.scaleAnimationIntensityForClipPath = scaleAnimationIntensityForClipPath;
