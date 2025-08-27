// Animation application, management, and parameter control functionality
// SVG Animator Pro - Animation Manager Module

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

// Clean animation styles from elements
function _CleanAnimationStyle(element, animation_name) {
    let animations = element.style.animation.split(', ');
    animations = animations.filter(animation => {
        return !animation.includes(animation_name);
    });

    element.style.animation = animations.join(', ');
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

function stopAnimation(element, animName = undefined) {
    if (!element) return;

    // Step 1: Find the nearest anim-wrapper (element might be a shape or a wrapper itself)
    let wrapper = element;
    if (!(wrapper.classList && wrapper.classList.contains("anim-wrapper"))) {
        if (wrapper.parentNode && wrapper.parentNode.classList.contains("anim-wrapper")) {
            wrapper = wrapper.parentNode;
        } else {
            return; // nothing to stop
        }
    }

    if (animName) {
        // Step 2a: Remove just this animation wrapper if its animation matches animName
        if (
            wrapper.style.animation.includes(animName) ||
            wrapper.classList.contains(`${animName}-animation-class`)
        ) {
            unwrapWrapper(wrapper);
        }
    } else {
        // Step 2b: Remove ALL animation wrappers (unroll until no anim-wrapper)
        while (wrapper && wrapper.classList.contains("anim-wrapper")) {
            const parent = unwrapWrapper(wrapper);
            wrapper = parent.closest(".anim-wrapper"); // check if there's another one up the chain
        }
    }

    // Clean up any leftover selection box
    try {
        document.getElementById("selection-box").remove();
    } catch (e) {}
}

function unwrapWrapper(wrapper) {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
    return parent;
}

// Stop animation on element
function _stopAnimation(element, animName=undefined) {
    if (!element) return;

    // If a specific animation is provided, remove just that one
    if (animName) {
        // Remove the class
        element.classList.remove(`${animName}-animation-class`);
        element.classList.remove(`application-animation-class`);

        let animations = element.style.animation.split(', ');
        animations = animations.filter(animation => {
            return !animation.includes(animName);
        });
        element.style.animation = animations.join(', ');

    } else {
        // If no specific animation is provided, remove all animations from the element
        element.style.animation = '';

        // Check if the element is an SVG element
        if (element instanceof SVGElement) {
            const classes = Array.from(element.classList)
                .filter(cls => !cls.endsWith('-animation-class'));
            element.setAttribute('class', classes.join(' '));
        } else {
            element.className = element.className
                .split(' ')
                .filter(cls => !cls.endsWith('-animation-class'))
                .join(' ');
        }
    }

    try {
        document.getElementById('selection-box').remove();
    } catch(e) {
        // Error handling if needed
    }
}

function applyTempAnimation(element, speed, animName = undefined, save = true) {
    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    removeStyleTag();
    CleanAnimationStyle(element, "temp-generic");

    const wrapper = wrapForAnimation(element); // ✅ always add a NEW wrapper for compounding
 // ✅ wrap the element
    const elementId = wrapper.getAttribute('id') || element.getAttribute('id') || element.tagName;
    const animationName = "temp-generic";

    const current_selected_anim_in_dropdown = document.getElementById('animation-type').value;
    const animationData = animationsData[current_selected_anim_in_dropdown];
    if (!animationData) {
        console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
        return;
    }

    // Build keyframes
    let keyframes = animationData.generateKeyframes
        ? animationData.generateKeyframes(animationData.params)
        : animationData.keyframes;

    let keyframesString = '';
    for (let percentage in keyframes) {
        let properties = keyframes[percentage];
        let propsString = Object.keys(properties).map(prop => {
            return `${prop}: ${properties[prop]};`;
        }).join(' ');
        keyframesString += `${percentage} { ${propsString} } `;
    }

    const embeddedStyle = `
        <style id="${animationName}" data-anikit="">
            @keyframes ${animationName} {
                ${keyframesString}
            }
        </style>
    `;
    svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);

    CleanAnimationStyle(wrapper, animationName);

    const existingAnimation = wrapper.style.animation;
    const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
    const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

    wrapper.style.animation = combinedAnimation;

    setCorrectTransformOrigin(wrapper);
    wrapper.classList.add(`application-animation-class`);

    if (save === true) {
        const elementId2 = element.getAttribute('id') || element.tagName;
        saveAnimation(elementId2, "temp", { speed: `${speed}`, animationName: animationName });

        // Reset controls
        document.getElementById('animation-type').value = "none";
        const event = new Event('change');
        document.getElementById('animation-type').dispatchEvent(event);
        document.getElementById('speed-slider').value = '1.5';
        document.getElementById('speedDisplay').textContent = '1.5s';
    }
}




// Apply temporary animation for preview
function _applyTempAnimation(element, speed, animName=undefined, save=true) {
    // Remove the selection bounding box (better preview)
    if (document.getElementById('selection-box')) {
        document.getElementById('selection-box').remove();
    }

    removeStyleTag()

    // 👽 Remove any temp-generic animations when applying the selected animation
    CleanAnimationStyle(element, "temp-generic")

    // Don't apply the animation, if already exist...
    const elementId = element.getAttribute('id') || element.tagName;

    let animationName;

    // Get a temporary animation name
    selectedAnimation = "temp"

    // Get saved animations for this element
    const savedAnimations = getSavedAnimations().animations[elementId] || {};

    // If an animation of the same type already exists for this element, use its existing unique ID
    const existingAnimationName = savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].animationName;

    // Use existing name if present, otherwise generate a new one
    animationName = "temp-generic"

    const current_selected_anim_in_dropdown = document.getElementById('animation-type').value;

    const animationData = animationsData[current_selected_anim_in_dropdown];

    if (!animationData) {
        console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
        return;
    }

    // Handle both parametric and static animations
    let keyframes;
    if (animationData.generateKeyframes) {
        // Parametric animation - generate keyframes from current parameters
        keyframes = animationData.generateKeyframes(animationData.params);
    } else {
        // Legacy static animation
        keyframes = animationData.keyframes;
    }

    // Extract the current transform style
    const initialTransformValue = element.style.transform;

    // When defining your keyframes, make sure the initial keyframe starts with the current transform state
    let keyframesString = '';
    for (let percentage in keyframes) {
        let properties = keyframes[percentage];
        let propsString = Object.keys(properties).map(prop => {
            // ... Add the initial transforms in the animation...
            return `${prop}: ${initialTransformValue} ${properties[prop]};`;
        }).join(' ');
        keyframesString += `${percentage} { ${propsString} } `;
    }

    const embeddedStyle = `
        <style id="${animationName}" data-anikit="">
            @keyframes ${animationName} {
                ${keyframesString}
            }
        </style>
    `;

    // Add the embedded style. No need to check for existing style as each animation has a unique name
    svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);

    // Don't add the animation with the same name multiple times
    CleanAnimationStyle(element, animationName)

    // Check if the element already has animations and combine them
    const existingAnimation = element.style.animation;
    const existingTransform = element.style.transform;
    console.log(existingTransform)
    const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
    const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

    // element.style.animation = combinedAnimation;
    element.setAttribute('style', `animation: ${combinedAnimation} !important; transform: ${existingTransform}`);

    setCorrectTransformOrigin(element)
    //element.style.transformOrigin = "50% 50%";

    element.classList.add(`application-animation-class`)

    // Save this animation. If you're using a function to save animations, you might need to modify it to support multiple animations
    if (save == true) {
        const elementId2 = element.getAttribute('id') || element.tagName;
        saveAnimation(elementId2, selectedAnimation, { speed: `${speed}`, animationName: animationName });

        // Reset the apply animation controls
        document.getElementById('animation-type').value = "none";
        const event = new Event('change');
        document.getElementById('animation-type').dispatchEvent(event);
        document.getElementById('speed-slider').value = '1.5';
        document.getElementById('speedDisplay').textContent = '1.5s';
    }
}

// Apply animation to image with wrapper
function applyAnimationToImage(element, speed, animName) {
    // Check if the element is a leaf node
    const isLeafElement = element.children.length === 0;

    let gWrapper;

    // If it's a leaf element, check if it's already wrapped by a 'wrapping-group'
    if (isLeafElement) {
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

function applyAnimation(element, speed, animName = undefined, save = true) {
    try {
        removeStyleTag();

        const wrapper = wrapForAnimation(element); // ✅ always add a NEW wrapper for compounding
 // ✅ wrap the element
        const elementId = wrapper.getAttribute('id') || element.getAttribute('id') || element.tagName;

        const selectedAnimation = animName || document.getElementById('animation-type').value;
        const savedAnimations = getSavedAnimations().animations[elementId] || {};
        const existingAnimationName = savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].animationName;
        const animationName = uniqueID(existingAnimationName);

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        removeStyleTag(animationName);

        // ✅ Restore parameters if they exist in savedAnimations
        if (savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].params) {
            animationData.params = {
                ...animationData.params,
                ...savedAnimations[selectedAnimation].params
            };
        }
        

        // ✅ Now build keyframes with the restored params
        let keyframes = animationData.generateKeyframes
            ? animationData.generateKeyframes(animationData.params)
            : animationData.keyframes;

        let keyframesString = '';
        for (let percentage in keyframes) {
            let properties = keyframes[percentage];
            let propsString = Object.keys(properties).map(prop => {
                return `${prop}: ${properties[prop]};`;
            }).join(' ');
            keyframesString += `${percentage} { ${propsString} } `;
        }

        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;
        svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);

        CleanAnimationStyle(wrapper, animationName);

        const existingAnimation = wrapper.style.animation;
        const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
        const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

        wrapper.style.animation = combinedAnimation;

        setCorrectTransformOrigin(wrapper);
        CleanAnimationStyle(wrapper, "temp-generic");

        wrapper.classList.add(`application-animation-class`);
        wrapper.classList.add(`${selectedAnimation}-animation-class`);

        if (save === true) {
            const elementId2 = element.getAttribute('id') || element.tagName;
            const propertiesToSave = {
                speed: `${speed}`,
                animationName: animationName
            };
            if (animationData.generateKeyframes && animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            saveAnimation(elementId2, selectedAnimation, propertiesToSave);

            resetControls();
            updateStatusBar(`Animation "${selectedAnimation}" applied! ✨`);
            showNotification(`Animation "${selectedAnimation}" applied successfully!`, 'success');
        }
    } catch (error) {
        console.error('Error applying animation:', error);
        updateStatusBar('Error applying animation! ❌');
        showNotification(`Failed to apply animation: ${error.message}`, 'error');
    }
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


// Main animation application function
function _applyAnimation(element, speed, animName=undefined, save=true) {
    try {
        removeStyleTag();

        const elementId = element.getAttribute('id') || element.tagName;
        let animationName;
        let selectedAnimation;

        if (animName == undefined) {
            selectedAnimation = document.getElementById('animation-type').value;
        } else {
            selectedAnimation = animName;
        }

        const savedAnimations = getSavedAnimations().animations[elementId] || {};
        const existingAnimationName = savedAnimations[selectedAnimation] && savedAnimations[selectedAnimation].animationName;
        animationName = uniqueID(existingAnimationName);

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        removeStyleTag(animationName);

        // Handle both parametric and static animations
        let keyframes;
        if (animationData.generateKeyframes) {
            // Parametric animation - generate keyframes from current parameters
            keyframes = animationData.generateKeyframes(animationData.params);
        } else {
            // Legacy static animation
            keyframes = animationData.keyframes;
        }

        const initialTransformValue = element.style.transform;
        let keyframesString = '';
        for (let percentage in keyframes) {
            let properties = keyframes[percentage];
            let propsString = Object.keys(properties).map(prop => {
                return `${prop}: ${initialTransformValue} ${properties[prop]};`;
            }).join(' ');
            keyframesString += `${percentage} { ${propsString} } `;
        }

        const embeddedStyle = `
            <style id="${animationName}" data-anikit="">
                @keyframes ${animationName} {
                    ${keyframesString}
                }
            </style>
        `;

        svgRoot.insertAdjacentHTML('beforeend', embeddedStyle);
        CleanAnimationStyle(element, animationName);

        const existingAnimation = element.style.animation;
        const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
        const combinedAnimation = existingAnimation ? `${existingAnimation}, ${newAnimation}` : newAnimation;

        element.setAttribute('style', `animation: ${combinedAnimation} !important`);
        setCorrectTransformOrigin(element);
        CleanAnimationStyle(element, "temp-generic");

        element.classList.add(`application-animation-class`);
        element.classList.add(`${selectedAnimation}-animation-class`);

        if (save == true) {
            const elementId2 = element.getAttribute('id') || element.tagName;
            
            // Prepare properties to save, including parameters for parametric animations
            const propertiesToSave = { 
                speed: `${speed}`, 
                animationName: animationName 
            };
            
            // Add parameter values if this is a parametric animation
            if (animationData.generateKeyframes && animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            
            saveAnimation(elementId2, selectedAnimation, propertiesToSave); 

            resetControls();
            updateStatusBar(`Animation "${selectedAnimation}" applied! ✨`);
            showNotification(`Animation "${selectedAnimation}" applied successfully!`, 'success');
        }
        
    } catch (error) {
        console.error('Error applying animation:', error);
        updateStatusBar('Error applying animation! ❌');
        showNotification(`Failed to apply animation: ${error.message}`, 'error');
    }
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
    
    for (const [param, value] of Object.entries(anim.params)) {
        const controlWrapper = document.createElement("div");
        controlWrapper.className = "param-control";
        
        const label = document.createElement("label");
        label.className = "param-label";
        label.textContent = `${param}: `;
        
        const input = document.createElement("input");
        input.type = "range";
        input.className = "param-slider";
        
        // Set appropriate min/max/step based on parameter type
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
        } else {
            // Default range
            input.min = "0";
            input.max = "5";
            input.step = "0.1";
        }
        
        input.value = value;
        
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

// Export functions for use in other modules
window.removeStyleTag = removeStyleTag;
window._CleanAnimationStyle = _CleanAnimationStyle;
window.CleanAnimationStyle = CleanAnimationStyle;
window.stopAnimation = stopAnimation;
window.applyTempAnimation = applyTempAnimation;
window.applyAnimationToImage = applyAnimationToImage;
window.applyAnimation = applyAnimation;
window.renderParamControls = renderParamControls;
