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

    // ✅ normalize: work on wrapper if shape is inside one
    let wrapper = element;
    if (!(wrapper.classList && wrapper.classList.contains("anim-wrapper"))) {
        if (wrapper.parentNode && wrapper.parentNode.classList.contains("anim-wrapper")) {
            wrapper = wrapper.parentNode;
        } else {
            return; // nothing to stop
        }
    }

    // ✅ Case 1: stopping preview animation
    if (wrapper.classList.contains("temp-anim")) {
        unwrapWrapper(wrapper);
        return;
    }

    // ✅ Case 2: stopping permanent animation(s)
    if (animName) {
        // remove only if wrapper matches that animation
        if (
            wrapper.style.animation.includes(animName) ||
            wrapper.classList.contains(`${animName}-animation-class`)
        ) {
            unwrapWrapper(wrapper);
        } else {
            // might be nested: recurse upwards
            const parentWrapper = wrapper.parentNode.closest(".anim-wrapper");
            if (parentWrapper) stopAnimation(parentWrapper, animName);
        }
    } else {
        // stop all: unwrap everything up the chain
        while (wrapper && wrapper.classList.contains("anim-wrapper")) {
            const parent = unwrapWrapper(wrapper);
            wrapper = parent.closest(".anim-wrapper");
        }
    }

    // ✅ Clean up selection box
    try {
        document.getElementById("selection-box").remove();
    } catch (e) {}
}


// helper: unwrap a wrapper group and return parent
function unwrapWrapper(wrapper) {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
    return parent;
}


function unwrapWrapper(wrapper) {
    const parent = wrapper.parentNode;
    while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
    return parent;
}


function applyTempAnimation(element, speed, animName = undefined) {
    if (document.getElementById("selection-box")) {
        document.getElementById("selection-box").remove();
    }

    removeStyleTag("temp-generic");

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
    const current_selected_anim_in_dropdown = document.getElementById("animation-type").value;
    const animationData = animationsData[current_selected_anim_in_dropdown];
    if (!animationData) {
        console.error(`Animation "${current_selected_anim_in_dropdown}" not found.`);
        return;
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

    const embeddedStyle = `
        <style id="${animationName}" data-anikit="">
            @keyframes ${animationName} {
                ${keyframesString}
            }
        </style>
    `;
    svgRoot.insertAdjacentHTML("beforeend", embeddedStyle);

    // Apply animation only to temp wrapper
    const newAnimation = `${speed}s linear 0s infinite normal forwards running ${animationName}`;
    wrapper.style.animation = newAnimation;

    setCorrectTransformOrigin(wrapper);
    wrapper.classList.add("application-animation-class");
}


function applyAnimation(element, speed, animName = undefined, save = true) {
    try {
        removeStyleTag("temp-generic");

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
        const savedAnimations = getSavedAnimations().animations[elementId] || {};
        const existingAnimationName =
            savedAnimations[selectedAnimation] &&
            savedAnimations[selectedAnimation].animationName;
        const animationName = uniqueID(existingAnimationName);

        const animationData = animationsData[selectedAnimation];
        if (!animationData) {
            throw new Error(`Animation "${selectedAnimation}" not found.`);
        }

        removeStyleTag(animationName);

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

        setCorrectTransformOrigin(wrapper);
        wrapper.classList.add("application-animation-class");
        wrapper.classList.add(`${selectedAnimation}-animation-class`);

        if (save === true) {
            const propertiesToSave = {
                speed: `${speed}`,
                animationName: animationName
            };
            if (animationData.generateKeyframes && animationData.params) {
                propertiesToSave.params = { ...animationData.params };
            }
            saveAnimation(elementId, selectedAnimation, propertiesToSave);

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
    
    // Auto-detect and update parameters based on selected element
    if (selectedElement && anim.params) {
        updateAnimationParamsFromElement(animationName, selectedElement);
    }
    
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
                // Use the first value as dashLength if it's reasonable
                if (dashValues[0] > 0 && dashValues[0] <= 50) {
                    anim.params.dashLength = Math.round(dashValues[0]);
                    paramsUpdated = true;
                }
                
                // Use the second value as gapLength if it exists and is reasonable
                if (dashValues.length > 1 && dashValues[1] > 0 && dashValues[1] <= 30) {
                    anim.params.gapLength = Math.round(dashValues[1]);
                    paramsUpdated = true;
                }
            }
        }
        
        // Also check for stroke-width to adjust dash size if needed
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust dashLength based on stroke width for better visual balance
            if (strokeWidth > 5) {
                anim.params.dashLength = Math.max(anim.params.dashLength, Math.round(strokeWidth * 2));
                paramsUpdated = true;
            }
        }
        
        // If no existing stroke-dasharray, create a reasonable default based on stroke-width
        if (!strokeDasharray || strokeDasharray === 'none') {
            const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width')) || 1;
            anim.params.dashLength = Math.max(8, Math.round(strokeWidth * 3));
            anim.params.gapLength = Math.max(4, Math.round(strokeWidth * 1.5));
            paramsUpdated = true;
        }
        
        // Ensure minimum reasonable values
        if (anim.params.dashLength < 3) {
            anim.params.dashLength = 3;
            paramsUpdated = true;
        }
        if (anim.params.gapLength < 2) {
            anim.params.gapLength = 2;
            paramsUpdated = true;
        }
    }
    
    // Check for other stroke-related animations
    if (animationName === 'blur') {
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust blur amount based on stroke width
            anim.params.blurAmount = Math.max(anim.params.blurAmount, Math.round(strokeWidth * 2));
            paramsUpdated = true;
        }
    }
    
    // Check for transform-based animations
    if (animationName === 'skew') {
        const strokeWidth = parseFloat(getStyleValue(svgElement, 'stroke-width'));
        
        if (strokeWidth && !isNaN(strokeWidth) && strokeWidth > 0) {
            // Adjust skew amount based on stroke width for better visual effect
            if (strokeWidth > 3) {
                anim.params.skewAmount = Math.max(anim.params.skewAmount, Math.round(strokeWidth * 3));
                paramsUpdated = true;
            }
        }
    }
    
    // Show notification if parameters were updated
    if (paramsUpdated) {
        showNotification(`Parameters auto-detected from selected element! ✨`, 'info');
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
window.updateAnimationParamsFromElement = updateAnimationParamsFromElement;
