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

export function renderPropertyButtons(currentData) {
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

export function selectProperty(propertyData) {
  const buttons = document.getElementsByClassName("property-select-btn");
  Array.from(buttons).forEach((btn) => btn.classList.remove("selected"));
  event?.target?.classList.add("selected");

  document.getElementById("ere_property_form").style.display = "block";

  togglePropertySelection();

  const propertyAddress = `${propertyData.property_city}, ${propertyData.property_district}, ${propertyData.property_country}`;

  setMapLocation(propertyAddress);
  const propertyFeatureIds = getPropertyFeatureIds();

  const fieldMapping = {
    property_title: propertyData.property_title,
    property_des: propertyData.property_description,
    property_type: propertyData.property_type,
    property_status: propertyData.property_status,
    property_label: propertyData.property_label,
    property_price_short: propertyData.property_price.toString(),
    property_price_unit: "1",
    address1: propertyAddress,
    property_country: propertyData.property_country,
    property_city: propertyData.property_city,
    administrative_area_level_1: propertyData.property_district,
    neighborhood: propertyData.property_neighborhood,
    property_zip: propertyData.property_zip,
    property_gallery: propertyData.property_images || "",
    property_attachments: propertyData.property_files || "",
    property_video_url: propertyData.property_video_url || "",
    property_size: propertyData.property_area || "",
    property_land: propertyData.property_land || "",
    property_identity: propertyData.id || "",
    property_rooms: propertyData.property_rooms || "",
    property_bathrooms: propertyData.property_bathrooms || "",
    property_bedrooms: propertyData.property_bedrooms || "",
    property_garage: propertyData.property_garage || "",
    property_garage_size: propertyData.property_garage_size || "",
  };

  Object.entries(fieldMapping).forEach(([fieldId, value]) => {
    const element = document.getElementById(fieldId);
    if (element) {
      if (fieldId === "property_des") {
        setIframeContent("property_des_ifr", "property_des", value);
      } else if (element.tagName === "SELECT") {
        const option = Array.from(element.options).find(
          (opt) => opt.text.toLowerCase() === value.toLowerCase()
        );
        if (option) {
          option.selected = true;
          element.dispatchEvent(new Event("change"));
        }
      } else if (element.type === "checkbox") {
        element.checked = value === "true";
      } else {
        if (fieldId === "property_attachments") {
          if (!value) {
            element.value = "";
          } else {
            element.value = value;
          }
        } else {
          element.value = value;
        }
      }
    }
  });

  setPropertyFeatures(propertyData.property_feature, propertyFeatureIds);
  renderImageGallery(propertyData.property_images);
}

export function renderImageGallery(imageUrls) {
  const galleryContainer = document.getElementById("image_gallery_container");
  if (!galleryContainer) return;

  galleryContainer.innerHTML = ""; // Clear previous gallery

  if (!imageUrls || imageUrls.length === 0) {
    galleryContainer.style.display = "none";
    return;
  }

  galleryContainer.style.display = "block";
  const title = document.createElement("h4");
  title.textContent = "Select Images to Import:";
  galleryContainer.appendChild(title);

  const galleryDiv = document.createElement("div");
  galleryDiv.className = "image-gallery";

  imageUrls.forEach((url, index) => {
    if (!url) return; // Skip if URL is empty or null

    const itemDiv = document.createElement("div");
    itemDiv.className = "gallery-item";

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Property Image ${index + 1}`;
    img.onerror = () => { // Handle broken images
        itemDiv.style.display = 'none'; // Hide item if image fails to load
    };

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = url;
    checkbox.checked = true; // Default to selected
    checkbox.id = `gallery_image_${index}`;

    itemDiv.onclick = () => {
      checkbox.checked = !checkbox.checked;
    }

    itemDiv.appendChild(img);
    itemDiv.appendChild(checkbox);
    galleryDiv.appendChild(itemDiv);
  });

  galleryContainer.appendChild(galleryDiv);
}

export function getSelectedImages() {
  const selectedImages = [];
  const galleryContainer = document.getElementById("image_gallery_container");
  if (galleryContainer && galleryContainer.style.display !== "none") {
    const checkboxes = galleryContainer.querySelectorAll('.gallery-item input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
      selectedImages.push(checkbox.value);
    });
  }
  return selectedImages;
}