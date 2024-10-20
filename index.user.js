// ==UserScript==
// @name         Support Templates (Animated Hover Effects)
// @description  Templates for VK support with animated hover effects
// @namespace    http://tampermonkey.net/
// @version      5.2
// @author
// @match        https://vk.com/*
// @icon         https://www.google.com/s2/favicons?domain=vk.com
// @grant        window.onurlchange
// ==/UserScript==

let templates = null;
let myTemplates = JSON.parse(localStorage.getItem('myTemplates')) || [
    { name: "Приветствие", content: "Здравствуйте! Чем могу помочь?" },
    { name: "Ответ на частый вопрос", content: "Это частый вопрос, вот ответ на него..." }
];
let activeTab = "templates";
let glowColor = localStorage.getItem('glowColor') || "yellow";
let glowIntensity = parseInt(localStorage.getItem('glowIntensity'), 10) || 5;
let panelOpacity = parseFloat(localStorage.getItem('panelOpacity')) || 1.0;
let panelBorderRadius = parseFloat(localStorage.getItem('panelBorderRadius')) || 10;
let manualTheme = localStorage.getItem('manualTheme') || 'auto';

function isLightTheme() {
    if (manualTheme !== 'auto') {
        return manualTheme === 'light';
    } else {
        const body = document.body;
        const vkDarkThemeEnabled = body.classList.contains('vkui--scheme_dark') || body.classList.contains('vkui--scheme_space_gray');
        return !vkDarkThemeEnabled;
    }
}

async function start() {
    'use strict';

    const existingModal = document.getElementById('support-template-modal');
    if (existingModal) {
        if (existingModal.resizeObserver) {
            existingModal.resizeObserver.disconnect();
        }
        document.removeEventListener('mousemove', existingModal.onMouseMove);
        document.removeEventListener('mouseup', existingModal.onMouseUp);

        existingModal.remove();
    }

    if (!templates) {
        templates = await getTemplates();
        if (!templates) {
            return;
        }
    }

    mountTemplateList();
}

function setTextFocus(div) {
    const chatDiv = div || document.querySelector("div.im_editable.im-chat-input--text._im_text");

    if (chatDiv) {
        chatDiv.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(chatDiv);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
}

function setText(text) {
    const chatDiv = document.querySelector("div.im_editable.im-chat-input--text._im_text");
    if (chatDiv) {
        chatDiv.dispatchEvent(new Event('keydown'));
        chatDiv.innerHTML += text.replaceAll("\n", "</br>");
        setTextFocus(chatDiv);
    }
}

async function getTemplates() {
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
    parent.innerHTML = "";
    const currentTemplates = activeTab === "templates" ? templates : myTemplates;
    currentTemplates
        .filter(template =>
            template.name.toLowerCase().includes(filter.toLowerCase()) ||
            template.content.toLowerCase().includes(filter.toLowerCase())
        )
        .forEach((template, index) => {
            const templateContainer = document.createElement("div");
            templateContainer.className = "template-container";
            templateContainer.style.marginBottom = "15px";
            templateContainer.style.padding = "10px";
            templateContainer.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#444'}`;
            templateContainer.style.borderRadius = "4px";
            templateContainer.style.backgroundColor = isLightTheme() ? "#f0f0f0" : "#333";
            templateContainer.style.display = "flex";
            templateContainer.style.flexDirection = "column";
            templateContainer.style.flex = "1 1 auto";
            templateContainer.style.transition = "all 0.3s ease";

            const templateName = document.createElement("div");
            templateName.innerHTML = `<b>${template.name}</b>`;
            templateName.style.marginBottom = "5px";
            templateName.style.color = isLightTheme() ? "#000" : "#fff";
            templateName.style.cursor = "pointer";

            templateName.addEventListener("click", () => {
                setText(template.content);
            });

            const templateContent = document.createElement("div");
            templateContent.innerText = template.content.replaceAll("\n", "");
            templateContent.style.fontSize = "12px";
            templateContent.style.color = isLightTheme() ? "#555" : "#aaa";
            templateContent.style.whiteSpace = "nowrap";
            templateContent.style.overflow = "hidden";
            templateContent.style.textOverflow = "ellipsis";

            templateContainer.appendChild(templateName);
            templateContainer.appendChild(templateContent);

            templateContainer.addEventListener("click", (e) => {
                if (!e.target.closest('span')) {
                    setText(template.content);
                }
            });

            if (activeTab === "myTemplates") {
                const actionsContainer = document.createElement("div");
                actionsContainer.style.display = "flex";
                actionsContainer.style.marginTop = "10px";

                const editIcon = document.createElement("span");
                editIcon.innerHTML = "✏️";
                editIcon.style.marginRight = "10px";
                editIcon.style.cursor = "pointer";
                editIcon.title = "Редактировать шаблон";
                editIcon.addEventListener("click", (e) => {
                    e.stopPropagation();
                    showAddTemplateModal(index);
                });

                const deleteIcon = document.createElement("span");
                deleteIcon.innerHTML = "🗑️";
                deleteIcon.style.marginRight = "10px";
                deleteIcon.style.cursor = "pointer";
                deleteIcon.title = "Удалить шаблон";
                deleteIcon.addEventListener("click", (e) => {
                    e.stopPropagation();
                    if (confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
                        myTemplates.splice(index, 1);
                        saveTemplates();
                        updateTemplateContent();
                    }
                });

                actionsContainer.appendChild(editIcon);
                actionsContainer.appendChild(deleteIcon);
                templateContainer.appendChild(actionsContainer);
            }

            parent.appendChild(templateContainer);
        });

    if (activeTab === "myTemplates") {
        const addTemplateButton = document.createElement("div");
        addTemplateButton.innerHTML = "➕ Добавить шаблон";
        addTemplateButton.style.padding = "10px";
        addTemplateButton.style.marginTop = "10px";
        addTemplateButton.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#444'}`;
        addTemplateButton.style.borderRadius = "4px";
        addTemplateButton.style.cursor = "pointer";
        addTemplateButton.style.textAlign = "center";
        addTemplateButton.style.backgroundColor = isLightTheme() ? "#e0e0e0" : "#555";
        addTemplateButton.style.color = isLightTheme() ? "#000" : "#fff";
        addTemplateButton.addEventListener("click", () => {
            showAddTemplateModal();
        });
        parent.appendChild(addTemplateButton);
    }
}

function showAddTemplateModal(editIndex = null) {
    const addTemplateModal = document.createElement("div");
    addTemplateModal.id = "add-template-modal";
    addTemplateModal.style.position = "fixed";
    addTemplateModal.style.top = "50%";
    addTemplateModal.style.left = "50%";
    addTemplateModal.style.transform = "translate(-50%, -50%)";
    addTemplateModal.style.width = "400px";
    addTemplateModal.style.padding = "20px";
    addTemplateModal.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
    addTemplateModal.style.border = `1px solid ${isLightTheme() ? '#333' : '#555'}`;
    addTemplateModal.style.borderRadius = "10px";
    addTemplateModal.style.boxShadow = `0 0 20px ${glowIntensity}px ${glowColor}`;
    addTemplateModal.style.zIndex = "1001";
    addTemplateModal.style.color = isLightTheme() ? "#000" : "#fff";
    addTemplateModal.style.fontFamily = "Georgia, serif";
    addTemplateModal.style.textAlign = "center";

    const title = document.createElement("div");
    title.innerHTML = editIndex !== null ? "<b>✏️ Редактировать шаблон</b>" : "<b>➕ Добавить новый шаблон</b>";
    title.style.fontSize = "18px";
    title.style.marginBottom = "15px";
    addTemplateModal.appendChild(title);

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Введите имя шаблона";
    nameInput.style.width = "calc(100% - 20px)";
    nameInput.style.marginBottom = "10px";
    nameInput.style.padding = "10px";
    nameInput.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#555'}`;
    nameInput.style.borderRadius = "5px";
    nameInput.style.backgroundColor = isLightTheme() ? "#fff" : "#333";
    nameInput.style.color = isLightTheme() ? "#000" : "#fff";
    nameInput.style.fontFamily = "Georgia, serif";
    addTemplateModal.appendChild(nameInput);

    const contentInput = document.createElement("textarea");
    contentInput.placeholder = "Введите содержание шаблона";
    contentInput.style.width = "calc(100% - 20px)";
    contentInput.style.height = "100px";
    contentInput.style.marginBottom = "10px";
    contentInput.style.padding = "10px";
    contentInput.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#555'}`;
    contentInput.style.borderRadius = "5px";
    contentInput.style.backgroundColor = isLightTheme() ? "#fff" : "#333";
    contentInput.style.color = isLightTheme() ? "#000" : "#fff";
    contentInput.style.fontFamily = "Georgia, serif";
    contentInput.style.resize = "none";
    addTemplateModal.appendChild(contentInput);

    if (editIndex !== null) {
        nameInput.value = myTemplates[editIndex].name;
        contentInput.value = myTemplates[editIndex].content;
    }

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";
    buttonContainer.style.marginTop = "10px";

    const saveButton = document.createElement("button");
    saveButton.innerHTML = editIndex !== null ? "Сохранить" : "Добавить";
    saveButton.style.padding = "10px";
    saveButton.style.border = "none";
    saveButton.style.borderRadius = "5px";
    saveButton.style.backgroundColor = glowColor;
    saveButton.style.color = "#000";
    saveButton.style.cursor = "pointer";
    saveButton.addEventListener("click", () => {
        const newName = nameInput.value.trim();
        const newContent = contentInput.value.trim();
        if (newName && newContent) {
            if (editIndex !== null) {
                myTemplates[editIndex].name = newName;
                myTemplates[editIndex].content = newContent;
            } else {
                myTemplates.push({ name: newName, content: newContent });
            }
            saveTemplates();
            updateTemplateContent();
            document.body.removeChild(addTemplateModal);
        }
    });

    const cancelButton = document.createElement("button");
    cancelButton.innerHTML = "Отмена";
    cancelButton.style.padding = "10px";
    cancelButton.style.border = "none";
    cancelButton.style.borderRadius = "5px";
    cancelButton.style.backgroundColor = isLightTheme() ? "#555" : "#777";
    cancelButton.style.color = "#fff";
    cancelButton.style.cursor = "pointer";
    cancelButton.addEventListener("click", () => {
        document.body.removeChild(addTemplateModal);
    });

    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(cancelButton);
    addTemplateModal.appendChild(buttonContainer);

    document.body.appendChild(addTemplateModal);
}

function saveTemplates() {
    localStorage.setItem('myTemplates', JSON.stringify(myTemplates));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function updateBorderRadius() {
    const header = document.getElementById('support-template-modal');
    if (header) {
        header.style.borderTopLeftRadius = `${panelBorderRadius}px`;
        header.style.borderBottomLeftRadius = `${panelBorderRadius}px`;
        header.style.borderTopRightRadius = `${panelBorderRadius}px`;
        header.style.borderBottomRightRadius = `${panelBorderRadius}px`;
    }
}

function mountTemplateList() {
    let divModal = document.getElementById('support-template-modal');
    if (!divModal) {
        divModal = document.createElement("div");
        divModal.id = 'support-template-modal';

        const savedLeft = localStorage.getItem('support-template-modal-left');
        const savedTop = localStorage.getItem('support-template-modal-top');
        const savedWidth = localStorage.getItem('support-template-modal-width');
        const savedHeight = localStorage.getItem('support-template-modal-height');

        divModal.style.position = "fixed";
        divModal.style.top = savedTop ? `${Math.min(parseInt(savedTop, 10), window.innerHeight - 300)}px` : "10px";
        divModal.style.left = savedLeft ? `${Math.min(parseInt(savedLeft, 10), window.innerWidth - 300)}px` : "10px";
        divModal.style.width = savedWidth ? `${savedWidth}px` : "400px";
        divModal.style.height = savedHeight ? `${savedHeight}px` : "300px";
        divModal.style.minHeight = "150px";
        divModal.style.padding = "0";
        divModal.style.display = "flex";
        divModal.style.flexDirection = "column";
        divModal.style.color = isLightTheme() ? "#000" : "#fff";
        divModal.style.fontFamily = "Georgia, serif";
        divModal.style.outlineColor = "var(--vkui--size_border--regular)";
        divModal.style.zIndex = "1000";
        divModal.style.boxShadow = `0 0 20px ${glowIntensity}px ${glowColor}`;
        divModal.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#444'}`;
        divModal.style.resize = "both";
        divModal.style.maxWidth = "600px";
        divModal.style.maxHeight = "80vh";
        divModal.style.overflow = "hidden";
        divModal.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
        divModal.style.opacity = panelOpacity;
        divModal.style.borderRadius = `${panelBorderRadius}px`;
        divModal.style.boxSizing = 'border-box';

        document.body.appendChild(divModal);

        const style = document.createElement('style');
        style.innerHTML = `
        #support-template-modal {
            transition: width 0.0s ease, height 0.0s ease;
        }
        .template-container:hover {
            box-shadow: 0 0 10px 2px ${glowColor};
            background: linear-gradient(135deg, ${glowColor}, ${isLightTheme() ? "#f0f0f0" : "#333"});
            cursor: pointer;
        }
        `;
        document.head.appendChild(style);

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                localStorage.setItem('support-template-modal-width', width);
                localStorage.setItem('support-template-modal-height', height);
            }
        });
        resizeObserver.observe(divModal);
        divModal.resizeObserver = resizeObserver;

        const header = document.createElement("div");
        header.style.cursor = "move";
        header.style.backgroundColor = isLightTheme() ? "#f0f0f0" : "#333";
        header.style.padding = "10px";
        header.style.borderTopLeftRadius = `${panelBorderRadius}px`;
        header.style.borderTopRightRadius = `${panelBorderRadius}px`;
        header.style.position = 'relative';
        header.innerHTML = `<b style='font-size: 16px; line-height: 1.5; color: ${isLightTheme() ? '#000' : '#fff'};'>Support Helper V2.0</b>`;

        header.style.textAlign = "center";
        header.style.flexShrink = "0";
        divModal.prepend(header);

        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - divModal.getBoundingClientRect().left;
            offsetY = e.clientY - divModal.getBoundingClientRect().top;
            e.preventDefault();
        });

        const onMouseMove = (e) => {
            if (isDragging) {
                const newX = e.clientX - offsetX;
                const newY = e.clientY - offsetY;
                divModal.style.left = `${clamp(newX, 0, window.innerWidth - divModal.offsetWidth)}px`;
                divModal.style.top = `${clamp(newY, 0, window.innerHeight - divModal.offsetHeight)}px`;
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                localStorage.setItem('support-template-modal-left', parseInt(divModal.style.left, 10));
                localStorage.setItem('support-template-modal-top', parseInt(divModal.style.top, 10));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        divModal.onMouseMove = onMouseMove;
        divModal.onMouseUp = onMouseUp;

        const tabContainer = document.createElement("div");
        tabContainer.style.display = "flex";
        tabContainer.style.marginBottom = "0";
        tabContainer.style.overflow = "hidden";
        tabContainer.style.flexWrap = "nowrap";
        tabContainer.style.justifyContent = "center";
        tabContainer.style.backgroundColor = isLightTheme() ? "#f0f0f0" : "#333";
        tabContainer.style.padding = "5px 10px";
        tabContainer.style.borderBottom = `1px solid ${isLightTheme() ? '#ccc' : '#444'}`;
        tabContainer.style.flexShrink = "0";

        const templatesTab = document.createElement("div");
        templatesTab.id = 'templates-tab';
        templatesTab.innerHTML = "<b>Шаблоны группы</b>";
        templatesTab.style.cursor = "pointer";
        templatesTab.style.padding = "8px 20px";
        templatesTab.style.borderRadius = "5px";
        templatesTab.style.backgroundColor = activeTab === "templates" ? (isLightTheme() ? "#e0e0e0" : "#555") : "transparent";
        templatesTab.style.boxShadow = activeTab === "templates" ? `0 0 5px 2px ${glowColor}` : "none";
        templatesTab.style.color = isLightTheme() ? "#000" : "#fff";

        const myTemplatesTab = document.createElement("div");
        myTemplatesTab.id = 'my-templates-tab';
        myTemplatesTab.innerHTML = "<b>Мои шаблоны</b>";
        myTemplatesTab.style.cursor = "pointer";
        myTemplatesTab.style.padding = "8px 20px";
        myTemplatesTab.style.borderRadius = "5px";
        myTemplatesTab.style.backgroundColor = activeTab === "myTemplates" ? (isLightTheme() ? "#e0e0e0" : "#555") : "transparent";
        myTemplatesTab.style.boxShadow = activeTab === "myTemplates" ? `0 0 5px 2px ${glowColor}` : "none";
        myTemplatesTab.style.color = isLightTheme() ? "#000" : "#fff";

        templatesTab.addEventListener('click', () => {
            activeTab = "templates";
            updateTabStyles();
            updateTemplateContent();
        });

        myTemplatesTab.addEventListener('click', () => {
            activeTab = "myTemplates";
            updateTabStyles();
            updateTemplateContent();
        });

        tabContainer.appendChild(templatesTab);
        tabContainer.appendChild(myTemplatesTab);
        divModal.appendChild(tabContainer);

        const controlsContainer = document.createElement("div");
        controlsContainer.style.display = "flex";
        controlsContainer.style.marginTop = "0";
        controlsContainer.style.justifyContent = "space-around"; // Размещение смайликов по ширине панели
        controlsContainer.style.padding = "5px 10px";
        controlsContainer.style.backgroundColor = isLightTheme() ? "#f0f0f0" : "#333";
        controlsContainer.style.color = isLightTheme() ? "#000" : "#fff";
        controlsContainer.style.flexWrap = "nowrap"; // Смайлики не будут переноситься на новую строку



        const glowColorLabel = document.createElement("label");
        glowColorLabel.innerHTML = "<b>✨</b>";
        glowColorLabel.style.fontSize = '20px';
        glowColorLabel.style.padding = '1px';
        glowColorLabel.style.cursor = 'pointer';
        glowColorLabel.addEventListener('click', (e) => {
            const colorWindow = document.createElement('div');
            colorWindow.style.position = 'fixed';
            colorWindow.style.top = '50%';
            colorWindow.style.left = '50%';
            colorWindow.style.transform = 'translate(-50%, -50%)';
            colorWindow.style.padding = '20px';
            colorWindow.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
            colorWindow.style.border = `1px solid ${isLightTheme() ? '#222' : '#555'}`;
            colorWindow.style.zIndex = '1001';

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = glowColor;
            colorInput.addEventListener('input', (e) => {
                glowColor = e.target.value;
                localStorage.setItem('glowColor', glowColor);
                updateGlowEffect();
            });

            const closeButton = document.createElement('button');
            closeButton.innerText = 'Закрыть';
            closeButton.style.marginTop = '10px';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(colorWindow);
            });

            colorWindow.appendChild(colorInput);
            colorWindow.appendChild(closeButton);
            document.body.appendChild(colorWindow);
        });

        const glowIntensityLabel = document.createElement("label");
        glowIntensityLabel.innerHTML = "<b>💡</b>";
        glowIntensityLabel.style.fontSize = '20px';
        glowIntensityLabel.style.padding = '10px';
        glowIntensityLabel.style.cursor = 'pointer';
        glowIntensityLabel.addEventListener('click', (e) => {
            const intensityWindow = document.createElement('div');
            intensityWindow.style.position = 'fixed';
            intensityWindow.style.top = '50%';
            intensityWindow.style.left = '50%';
            intensityWindow.style.transform = 'translate(-50%, -50%)';
            intensityWindow.style.padding = '20px';
            intensityWindow.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
            intensityWindow.style.border = `1px solid ${isLightTheme() ? '#222' : '#555'}`;
            intensityWindow.style.zIndex = '1001';

            const intensitySlider = document.createElement('input');
            intensitySlider.type = 'range';
            intensitySlider.min = '0';
            intensitySlider.max = '20';
            intensitySlider.value = glowIntensity;
            intensitySlider.addEventListener('input', (e) => {
                glowIntensity = parseInt(e.target.value, 10);
                localStorage.setItem('glowIntensity', glowIntensity);
                updateGlowEffect();
            });

            const closeButton = document.createElement('button');
            closeButton.innerText = 'Закрыть';
            closeButton.style.marginTop = '10px';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(intensityWindow);
            });

            intensityWindow.appendChild(intensitySlider);
            intensityWindow.appendChild(closeButton);
            document.body.appendChild(intensityWindow);
        });

        const opacityLabel = document.createElement("label");
        opacityLabel.innerHTML = "<b>🔍</b>";
        opacityLabel.style.fontSize = '20px';
        opacityLabel.style.padding = '10px';
        opacityLabel.style.cursor = 'pointer';
        opacityLabel.addEventListener('click', (e) => {
            const opacityWindow = document.createElement('div');
            opacityWindow.style.position = 'fixed';
            opacityWindow.style.top = '50%';
            opacityWindow.style.left = '50%';
            opacityWindow.style.transform = 'translate(-50%, -50%)';
            opacityWindow.style.padding = '20px';
            opacityWindow.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
            opacityWindow.style.border = `1px solid ${isLightTheme() ? '#222' : '#555'}`;
            opacityWindow.style.zIndex = '1001';

            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0.1';
            opacitySlider.max = '1.0';
            opacitySlider.step = '0.1';
            opacitySlider.value = panelOpacity;
            opacitySlider.addEventListener('input', (e) => {
                panelOpacity = parseFloat(e.target.value);
                localStorage.setItem('panelOpacity', panelOpacity);
                divModal.style.opacity = panelOpacity;
            });

            const closeButton = document.createElement('button');
            closeButton.innerText = 'Закрыть';
            closeButton.style.marginTop = '10px';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(opacityWindow);
            });

            opacityWindow.appendChild(opacitySlider);
            opacityWindow.appendChild(closeButton);
            document.body.appendChild(opacityWindow);
        });

        const themeLabel = document.createElement("label");
        themeLabel.innerHTML = isLightTheme() ? "<b>🌞</b>" : "<b>🌜</b>";
        themeLabel.style.fontSize = '20px';
        themeLabel.style.padding = '10px';
        themeLabel.style.cursor = 'pointer';
        themeLabel.addEventListener('click', () => {
            if (manualTheme === 'light') {
                manualTheme = 'dark';
            } else if (manualTheme === 'dark') {
                manualTheme = 'auto';
            } else {
                manualTheme = 'light';
            }
            localStorage.setItem('manualTheme', manualTheme);
            const divModal = document.getElementById('support-template-modal');
            if (divModal) {
                divModal.remove();
                mountTemplateList();
            }
        });

        controlsContainer.style.alignItems = 'center';
        glowColorLabel.style.fontFamily = 'Arial, sans-serif';
        glowColorLabel.style.textAlign = 'center';
        glowColorLabel.style.textShadow = `0 0 5px ${glowColor}`;
        glowColorLabel.style.color = isLightTheme() ? "#000" : "#fff";

        glowIntensityLabel.style.fontFamily = 'Arial, sans-serif';
        glowIntensityLabel.style.textAlign = 'center';
        glowIntensityLabel.style.textShadow = `0 0 5px ${glowColor}`;
        glowIntensityLabel.style.color = isLightTheme() ? "#000" : "#fff";

        opacityLabel.style.fontFamily = 'Arial, sans-serif';
        opacityLabel.style.textAlign = 'center';
        opacityLabel.style.textShadow = `0 0 5px ${glowColor}`;
        opacityLabel.style.color = isLightTheme() ? "#000" : "#fff";

        themeLabel.style.fontFamily = 'Arial, sans-serif';
        themeLabel.style.textAlign = 'center';
        themeLabel.style.color = isLightTheme() ? "#000" : "#fff";

        controlsContainer.appendChild(glowColorLabel);
        controlsContainer.appendChild(glowIntensityLabel);
        controlsContainer.appendChild(opacityLabel);
        controlsContainer.appendChild(themeLabel);

        const borderRadiusLabel = document.createElement("label");
        borderRadiusLabel.innerHTML = "<b>✂️</b>";
        borderRadiusLabel.style.fontSize = '20px';
        borderRadiusLabel.style.padding = '10px';
        borderRadiusLabel.style.cursor = 'pointer';
        borderRadiusLabel.addEventListener('click', (e) => {
            const borderRadiusWindow = document.createElement('div');
            borderRadiusWindow.style.position = 'fixed';
            borderRadiusWindow.style.top = '50%';
            borderRadiusWindow.style.left = '50%';
            borderRadiusWindow.style.transform = 'translate(-50%, -50%)';
            borderRadiusWindow.style.padding = '20px';
            borderRadiusWindow.style.backgroundColor = isLightTheme() ? "#fff" : "#222";
            borderRadiusWindow.style.border = `1px solid ${isLightTheme() ? '#222' : '#555'}`;
            borderRadiusWindow.style.zIndex = '1001';

            const borderRadiusSlider = document.createElement('input');
            borderRadiusSlider.type = 'range';
            borderRadiusSlider.min = '0';
            borderRadiusSlider.max = '50';
            borderRadiusSlider.value = panelBorderRadius;
            borderRadiusSlider.addEventListener('input', (e) => {
                panelBorderRadius = parseFloat(e.target.value);
                localStorage.setItem('panelBorderRadius', panelBorderRadius);
                updateBorderRadius();
            });

            const closeButton = document.createElement('button');
            closeButton.innerText = 'Закрыть';
            closeButton.style.marginTop = '10px';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(borderRadiusWindow);
            });

            borderRadiusWindow.appendChild(borderRadiusSlider);
            borderRadiusWindow.appendChild(closeButton);
            document.body.appendChild(borderRadiusWindow);
        });

        controlsContainer.appendChild(borderRadiusLabel);

        divModal.appendChild(controlsContainer);
    }

    updateTemplateContent();
    updateTabStyles();
}

function updateTemplateContent() {
    const divContent = document.getElementById('support-template-content');
    if (!divContent) {
        const newDivContent = document.createElement("div");
        newDivContent.id = 'support-template-content';
        newDivContent.style.flexGrow = "1";
        newDivContent.style.padding = "10px";
        newDivContent.style.background = isLightTheme() ? "#fff" : "#222";
        newDivContent.style.borderBottomLeftRadius = `${panelBorderRadius}px`;
        newDivContent.style.borderBottomRightRadius = `${panelBorderRadius}px`;
        newDivContent.style.fontFamily = "Georgia, serif";
        newDivContent.style.display = "flex";
        newDivContent.style.flexDirection = "column";
        newDivContent.style.overflowY = "scroll";
        newDivContent.style.width = "100%";
        newDivContent.style.minHeight = "100px";
        newDivContent.style.height = "100%";
        newDivContent.style.flexShrink = "1";
        newDivContent.style.color = isLightTheme() ? "#000" : "#fff";

        const divModal = document.getElementById('support-template-modal');
        divModal.appendChild(newDivContent);
    }

    const updatedDivContent = document.getElementById('support-template-content');
    updatedDivContent.innerHTML = "";

    const inputFilter = document.createElement("input");
    inputFilter.type = "text";
    inputFilter.placeholder = "Фильтр";
    inputFilter.style.width = "calc(100% - 20px)";
    inputFilter.style.marginBottom = "10px";
    inputFilter.style.padding = "5px";
    inputFilter.style.border = `1px solid ${isLightTheme() ? '#ccc' : '#555'}`;
    inputFilter.style.borderRadius = "4px";
    inputFilter.style.fontFamily = "Georgia, serif";
    inputFilter.style.backgroundColor = isLightTheme() ? "#fff" : "#333";
    inputFilter.style.color = isLightTheme() ? "#000" : "#fff";
    inputFilter.style.flexShrink = "0";

    const listContainer = document.createElement("div");
    listContainer.style.overflowY = "scroll";
    listContainer.style.flexGrow = "1";
    listContainer.style.minHeight = "100px";
    listContainer.style.height = "100%";
    listContainer.style.flex = "1 1 auto";

    updatedDivContent.appendChild(inputFilter);
    updatedDivContent.appendChild(listContainer);

    inputFilter.addEventListener('input', () => {
        const filterValue = inputFilter.value;
        templatesToHtml(listContainer, filterValue);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
            e.preventDefault();
            inputFilter.focus();
        } else if (e.key === 'ArrowLeft' && activeTab === 'myTemplates') {
            activeTab = 'templates';
            updateTabStyles();
            updateTemplateContent();
        } else if (e.key === 'ArrowRight' && activeTab === 'templates') {
            activeTab = 'myTemplates';
            updateTabStyles();
            updateTemplateContent();
        }
    });

    templatesToHtml(listContainer);
}

function updateTabStyles() {
    const templatesTab = document.getElementById('templates-tab');
    const myTemplatesTab = document.getElementById('my-templates-tab');

    const activeBackgroundColor = isLightTheme() ? "#e0e0e0" : "#555";

    templatesTab.style.backgroundColor = activeTab === "templates" ? activeBackgroundColor : "transparent";
    templatesTab.style.boxShadow = activeTab === "templates" ? `0 0 10px 2px ${glowColor}` : "none";
    templatesTab.style.color = isLightTheme() ? "#000" : "#fff";

    myTemplatesTab.style.backgroundColor = activeTab === "myTemplates" ? activeBackgroundColor : "transparent";
    myTemplatesTab.style.boxShadow = activeTab === "myTemplates" ? `0 0 10px 2px ${glowColor}` : "none";
    myTemplatesTab.style.color = isLightTheme() ? "#000" : "#fff";

    const modal = document.getElementById('support-template-modal');
    const content = document.getElementById('support-template-content');
    if (activeTab === "myTemplates") {
        modal.style.height = "fit-content";
        content.style.height = "100%";
    } else {
        modal.style.height = "auto";
        content.style.height = "100%";
    }
}

function updateGlowEffect() {
    updateBorderRadius();
    const divModal = document.getElementById('support-template-modal');
    if (divModal) {
        divModal.style.boxShadow = `0 0 20px ${glowIntensity}px ${glowColor}`;
    }
    updateTabStyles();

    // Обновление стилей для эффекта при наведении
    const styleElement = document.querySelector('head style');
    if (styleElement) {
        styleElement.innerHTML = `
        #support-template-modal {
            transition: width 0.0s ease, height 0.0s ease;
        }
        .template-container:hover {
            box-shadow: 0 0 10px 2px ${glowColor};
            background: linear-gradient(135deg, ${glowColor}, ${isLightTheme() ? "#f0f0f0" : "#333"});
            cursor: pointer;
        }
        `;
    }
}

window.addEventListener('load', () => {
    start();
});

if (window.onurlchange === null) {
    window.addEventListener('urlchange', () => {
        const currentUrl = window.location.href;
        const existingModal = document.getElementById('support-template-modal');

        if (currentUrl.includes("&z=photo") || currentUrl.includes("&z=video")) {
            if (existingModal) {
                existingModal.style.visibility = 'hidden';
            }
        } else {
            if (existingModal) {
                existingModal.style.visibility = 'visible';
            }
            templates = null;
            start();
        }
    });
}
