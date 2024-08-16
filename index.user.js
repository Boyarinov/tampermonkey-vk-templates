// ==UserScript==
// @name         Support Templates
// @description  Templates for VK support
// @namespace    http://tampermonkey.net/
// @version      0.1
// @author       Svotin
// @match        https://vk.com/gim*
// @icon         https://www.google.com/s2/favicons?domain=vk.com
// @grant        window.onurlchange
// ==/UserScript==

let templates = null;

function start() {
    'use strict';

    // Remove the old modal if it exists
    const existingModal = document.getElementById('support-template-modal');
    if (existingModal) {
        existingModal.remove();
    }

    if (!templates) {
        templates = getTemplates();
        if (!templates) {
            return;
        }
    }

    mountTemplateList();
}

function setText(text) {
    const chatDiv = document.querySelector("div.im_editable.im-chat-input--text._im_text");
    if (chatDiv) {
        chatDiv.dispatchEvent(new Event('focus'));
        chatDiv.dispatchEvent(new Event('keydown'));
        chatDiv.innerHTML += text;
    }
}

function getTemplates() {
    let response = [];
    const elements = document.getElementsByClassName("TemplatesDropDown__item");
    for (let i = 0; i < elements.length; i++) {
        const name = elements[i].getElementsByTagName("h3")[0].textContent;
        const content = elements[i].getElementsByTagName("div")[0].textContent;
        response.push({
            name,
            content
        });
    }
    return response.length > 0 ? response : null;
}

function templatesToHtml(parent, filter = "") {
    parent.innerHTML = ""; // Clear current list
    templates
        .filter(template =>
            template.name.toLowerCase().includes(filter.toLowerCase()) ||
            template.content.toLowerCase().includes(filter.toLowerCase()) // Include content in filter
        )
        .forEach(template => {
            const templateContainer = document.createElement("div");
            templateContainer.style.marginBottom = "15px";
            templateContainer.style.padding = "10px";
            templateContainer.style.border = "1px solid var(--vkui--color_separator_primary)";
            templateContainer.style.borderRadius = "4px";
            templateContainer.style.fontFamily = "Georgia, serif";
            templateContainer.style.cursor = "pointer";

            const templateName = document.createElement("div");
            templateName.innerHTML = `<b>${template.name}</b>`;
            templateName.style.marginBottom = "5px";
            templateName.style.color = "var(--vkui--color_text_primary--active)";

            const templateContent = document.createElement("div");
            templateContent.innerText = template.content.replaceAll("\n", "");
            templateContent.style.fontSize = "12px";
            templateContent.style.color = "var(--vkui--color_text_secondary)";
            templateContent.style.whiteSpace = "nowrap";
            templateContent.style.overflow = "hidden";
            templateContent.style.textOverflow = "ellipsis";

            templateContainer.addEventListener("click", () => {
                setText(template.content);
            });

            templateContainer.appendChild(templateName);
            templateContainer.appendChild(templateContent);
            parent.appendChild(templateContainer);
        });
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function mountTemplateList() {
    const divModal = document.createElement("div");
    divModal.id = 'support-template-modal'; // Set an ID for the modal

    // Retrieve the last saved position and width from localStorage
    const savedLeft = localStorage.getItem('support-template-modal-left');
    const savedTop = localStorage.getItem('support-template-modal-top');

    // Set initial position and width from saved values or default
    divModal.style.position = "fixed";
    divModal.style.top = savedTop ? `${savedTop}px` : "10px";
    divModal.style.left = savedLeft ? `${savedLeft}px` : "10px";
    divModal.style.paddingLeft = "10px";
    divModal.style.display = "flex";
    divModal.style.flexDirection = "column";
    divModal.style.color = "white";
    divModal.style.fontFamily = "Georgia, serif";
    divModal.style.outlineColor = "var(--vkui--size_border--regular)"
    divModal.style.zIndex = "1000"; // Ensure the panel is above other content

    // Create a draggable header
    const divHeader = document.createElement("div");
    divHeader.style.cursor = "move"; // Indicate that the header is draggable
    divHeader.style.backgroundColor = "#333";
    divHeader.style.padding = "10px";
    divHeader.style.borderTopLeftRadius = "16px";
    divHeader.style.borderTopRightRadius = "16px";
    divHeader.innerHTML = "<b>Шаблоны</b>";
    divHeader.style.textAlign = "center";

    let isDragging = false;
    let offsetX, offsetY;

    // Make the header draggable
    divHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - divModal.getBoundingClientRect().left;
        offsetY = e.clientY - divModal.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = divModal.offsetWidth;
            const modalHeight = divModal.offsetHeight;

            // Calculate new position
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;

            // Clamp position within viewport bounds
            newX = clamp(newX, 0, viewportWidth - modalWidth);
            newY = clamp(newY, 0, viewportHeight - modalHeight);

            divModal.style.left = `${newX}px`;
            divModal.style.top = `${newY}px`;

            // Save the new position to localStorage
            localStorage.setItem('support-template-modal-left', newX);
            localStorage.setItem('support-template-modal-top', newY);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    const padding = 25;
    const divContent = document.createElement("div");
    divContent.style.padding = padding + "px";
    divContent.style.background = "var(--vkui--color_background_content)";
    divContent.style.borderBottomLeftRadius = "16px";
    divContent.style.borderBottomRightRadius = "16px";
    divContent.style.minWidth = "120px";
    divContent.style.maxWidth = "450px";
    divContent.style.resize = "horizontal";
    divContent.style.fontFamily = "Georgia, serif";
    divContent.style.overflow = "hidden";
    divContent.style.display = "flex";
    divContent.style.flexDirection = "column";

    // Set initial height within bounds
    divContent.style.maxHeight = "70vh";
    divContent.style.minHeight = "10vh";
    divContent.style.overflowY = "auto"; // Enable scrolling

    // Save the width of divContent when resized
    const resizeObserver = new ResizeObserver(() => {
        if (divContent.offsetWidth > 0) {
            const width = (divContent.offsetWidth - padding * 2) + "px";
            localStorage.setItem('support-template-modal-width', width);
        }
    });
    resizeObserver.observe(divContent);
    divContent.style.width = localStorage.getItem('support-template-modal-width') || "250px";

    // Create and add the filter input element
    const inputFilter = document.createElement("input");
    inputFilter.type = "text";
    inputFilter.placeholder = "Фильтр";
    inputFilter.style.width = "100%";
    inputFilter.style.marginBottom = "10px";
    inputFilter.style.padding = "5px";
    inputFilter.style.border = "none";
    inputFilter.style.borderRadius = "4px";
    inputFilter.style.fontFamily = "Georgia, serif";
    inputFilter.style.backgroundColor = "var(--vkui--color_search_field_background)";

    // Create a container for the template list
    const listContainer = document.createElement("div");
    listContainer.style.overflowY = "auto";
    listContainer.style.flexGrow = "1";
    listContainer.style.maxHeight = "calc(100% - 50px)"; // Ensure listContainer fits within divContent

    // Add the inputFilter and listContainer to divContent
    divContent.appendChild(inputFilter);
    divContent.appendChild(listContainer);

    // Add event listener to update the template list when filter changes
    inputFilter.addEventListener('input', () => {
        const filterValue = inputFilter.value;
        templatesToHtml(listContainer, filterValue);
    });

    // Initial population of the template list
    templatesToHtml(listContainer);

    // Append header and content to the modal
    divModal.appendChild(divHeader);
    divModal.appendChild(divContent);
    document.body.appendChild(divModal);
}

// Call start on window load
window.addEventListener('load', start);

// Add urlchange event listener to handle URL changes
if (window.onurlchange === null) {
    window.addEventListener('urlchange', () => {
        templates = null; // Reset templates to force reloading them
        start(); // Re-run start to reload templates and UI
    });
}
