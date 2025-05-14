import { REGEX_PATTERNS } from './constants.js';

export function setMapLocation(propertyAddress) {
  const element = document.getElementsByClassName("g5ere__property_address")[0];
  if (element) {
    element.value = propertyAddress;

    const event = new Event("input", { bubbles: true });
    element.dispatchEvent(event);

    setTimeout(() => {
      const mapResults = document.querySelectorAll(".g5ere__suggestion");
      if (mapResults.length > 0) {
        mapResults[0].click();
      }
    }, 1000);
  }
}

export function setPropertyFeatures(propertyFeatures, propertyFeatureIds) {
  const transformedFeatures = propertyFeatures.map((feature) => {
    const featureId = propertyFeatureIds.find(
      (f) => f.name.toLowerCase() === feature.toLowerCase()
    )?.id;
    return featureId || "";
  });
  transformedFeatures.forEach((feature) => {
    const featureElement = document.getElementById(feature);
    if (featureElement) {
      featureElement.checked = true;
    }
  });
}

export function getPropertyFeatureIds() {
  const propertyFeatureIds = [];
  const featureField = document.querySelectorAll(".property-fields.property-feature.row");
  featureField.forEach((field) => {
    const propertyFeaturesInputs = field.querySelectorAll(".custom-control.custom-checkbox");
    propertyFeaturesInputs.forEach((feature) => {
      const featureId = feature.querySelector("input").id;
      const featureName = feature.querySelector("label").textContent;
      if (featureId) {
        propertyFeatureIds.push({
          id: featureId,
          name: featureName.replace(REGEX_PATTERNS.TAB_NEWLINE, "").trim().toLowerCase(),
        });
      }
    });
  });

  return propertyFeatureIds;
}

export function getPropertyFeaturesFromForm() {
  const features = [];
  const featureField = document.querySelectorAll(".property-fields.property-feature.row");
  featureField.forEach((field) => {
    const propertyFeaturesInputs = field.querySelectorAll(".custom-control.custom-checkbox");
    propertyFeaturesInputs.forEach((feature) => {
      const input = feature.querySelector("input");
      const label = feature.querySelector("label");
      const value = input.checked;
      if (value && label) {
        const featureName = label.textContent.replace(REGEX_PATTERNS.TAB_NEWLINE, "").trim();
        features.push(featureName);
      }
    });
  });
  return features;
}

export function getIframeContent(iframeId, elementClass) {
  const iframe = document.getElementById(iframeId);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  const element = iframeDoc.querySelector(`.${elementClass} p`);
  return element ? element.textContent : "";
}

export function setIframeContent(iframeId, elementClass, content) {
  const iframe = document.getElementById(iframeId);
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
  const element = iframeDoc?.querySelector(`.${elementClass} p`);
  if (element && content) {
    element.textContent = content;
  } else {
    console.error("Element or content is null for iframeId: ", iframeId, content);
  }
}

export function populateAgentOptions(agentsDB) {
  const agentSelect = document.getElementById('property_agent');
  if (!agentSelect) return;

  agentSelect.innerHTML = '';

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'None';
  agentSelect.appendChild(defaultOption);

  if (agentsDB) {
    Object.entries(agentsDB).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      agentSelect.appendChild(option);
    });
  }
}

export function renderPropertyButtons(currentData, selectProperty) {
  const buttonSection = document.querySelector("#properties_selection");
  buttonSection.innerHTML = "";
  const selectorDiv = document.createElement("div");
  selectorDiv.className = "row-selector";

  const label = document.createElement("h4");
  label.textContent = "Select Property to Import:";
  selectorDiv.appendChild(label);

  const showHideButton = document.querySelector("#hide_properties_selection");
  if (showHideButton) {
    showHideButton.textContent = "Hide Properties Selection";
    showHideButton.style.display = "block";
  }

  currentData.forEach((row, index) => {
    const button = document.createElement("button");
    button.className = "btn btn-secondary property-select-btn";
    button.textContent = `${index + 1}. ${row.property_title} (ID: ${row.id})`;
    button.onclick = () => selectProperty(currentData[index]);
    selectorDiv.appendChild(button);
  });

  buttonSection.appendChild(selectorDiv);
}

export function togglePropertySelection() {
  const showHideButton = document.querySelector("#hide_properties_selection");
  const propertySelection = document.querySelector("#properties_selection");
  if (propertySelection.style.display === "none") {
    showHideButton.textContent = "Hide Properties Selection";
    propertySelection.style.display = "block";
  } else {
    showHideButton.textContent = "Show Properties Selection";
    propertySelection.style.display = "none";
  }
} 