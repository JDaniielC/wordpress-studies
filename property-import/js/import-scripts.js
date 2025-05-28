import { insertMissingTaxonomy } from './modules/data-processor.js';
import { setPropertyData, importSelectedProperty } from './modules/property-handler.js';
import { renderPropertyButtons, togglePropertySelection, populateAgentOptions } from './modules/dom-handlers.js';
import { EXAMPLE_DATA_JSON, EXAMPLE_DATA_XML } from './modules/constants.js';
import { readFile } from './modules/file-handler.js';

let rowData = [];
let currentData = [];
let choosedAgent = '';

// Elements for batch import progress
let importProgressDiv = null;
let progressBar = null;
let progressText = null;
let progressLog = null;
let importAllButton = null;

function setCurrentData(filter = false) {
  if (filter) {
    currentData = rowData.filter(
      (property) => !propertyIdsDB.includes(String(property.id))
    );
  } else {
    currentData = rowData;
  }
}

function handleAgentSelection() {
  const agentSelect = document.getElementById('property_agent');
  if (agentSelect) {
    agentSelect.addEventListener('change', function() {
      choosedAgent = this.value;
    });
  }
}

async function importAllProperties() {
  if (!currentData || currentData.length === 0) {
    alert("No properties to import. Please load a file and select properties.");
    return;
  }

  importProgressDiv.style.display = 'block';
  progressText.textContent = 'Starting import...';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  progressLog.innerHTML = ''; // Clear previous logs

  let successfulImports = 0;
  let failedImports = 0;
  const totalProperties = currentData.length;

  for (let i = 0; i < totalProperties; i++) {
    const property = currentData[i];
    const propertyIdentifier = property.property_title || property.id || `Property ${i + 1}`;

    progressText.textContent = `Importing ${i + 1} of ${totalProperties}: ${propertyIdentifier}`;
    
    const logItem = document.createElement('li');
    logItem.textContent = `Importing: ${propertyIdentifier}... `;
    progressLog.appendChild(logItem);
    progressLog.scrollTop = progressLog.scrollHeight; // Scroll to bottom

    try {
      const formData = new FormData();
      formData.append('action', 'batch_import_property');
      formData.append('security', batch_import_nonce); // nonce from import-template.php
      formData.append('property_data', JSON.stringify(property));

      const response = await fetch(ajaxurl, { // ajaxurl from import-template.php
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text(); // Get raw text first
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse JSON response:", responseText, e);
        result = { 
          success: false, 
          data: { 
            message: "Invalid JSON response from server. Raw: " + (responseText || "").substring(0, 200) + "..." 
          } 
        };
      }

      if (response.ok && result && result.success) {
        successfulImports++;
        const postId = result.data && result.data.post_id ? result.data.post_id : 'N/A';
        logItem.textContent += `SUCCESS (ID: ${postId})`;
        logItem.style.color = 'green';
      } else {
        failedImports++;
        let errorMessage = "Unknown error";
        if (result && result.data && result.data.message) {
          errorMessage = result.data.message;
        } else if (result && result.message && typeof result.message === 'string') { // Handle if message is top-level
            errorMessage = result.message;
        } else if (!response.ok) {
          errorMessage = `Server returned ${response.status}: ${response.statusText}. Response: ${(responseText || "").substring(0, 200) + "..."}`;
        } else if (responseText === "0") {
            errorMessage = "AJAX action not found or not properly registered on the server. (Response was '0')";
        } else if (responseText === "-1") {
            errorMessage = "Nonce verification failed. Security check error. (Response was '-1')";
        } else if (result && typeof result === 'object' && result.data === undefined) {
           errorMessage = "Parsed JSON response is missing 'data' property or it's undefined. Response: " + JSON.stringify(result).substring(0,200) + "...";
        } else if (result && typeof result !== 'object') {
           errorMessage = "Parsed response was not a JSON object. Response: " + (responseText || "").substring(0,200) + "...";
        }

        logItem.textContent += `FAILED: ${errorMessage}`;
        logItem.style.color = 'red';
        console.error(`Failed to import ${propertyIdentifier}: Current Status: ${response.status} ${response.statusText}`, 
                      `Error Message: ${errorMessage}`, 
                      "Raw Response Text:", responseText, 
                      "Parsed Result Object:", result);
      }
    } catch (error) { // Catch network errors or other issues with fetch itself
      failedImports++;
      logItem.textContent += `FAILED: ${error.message || 'Network error or JS exception'}`;
      logItem.style.color = 'red';
      console.error(`Error importing property ${propertyIdentifier} (fetch/js error):`, error);
    }

    const percentage = Math.round(((i + 1) / totalProperties) * 100);
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
  }

  progressText.textContent = `Import finished: ${successfulImports} successful, ${failedImports} failed.`;
  if (failedImports > 0) {
    progressText.textContent += " Check console for error details if any.";
  }
   // Optionally hide the import all button or disable it
  // importAllButton.disabled = true; 
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize progress elements
  importProgressDiv = document.getElementById('import-progress');
  progressBar = document.getElementById('progress-bar');
  progressText = document.getElementById('progress-text');
  progressLog = document.getElementById('progress-log');
  importAllButton = document.getElementById('import-all-properties');

  document
    .getElementById("ere_select_json_file")
    .addEventListener("click", function () {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json, .xml";

      input.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();

          reader.onload = function (e) {
            const fileType = file.type;
            let data = e.target.result;
            rowData = readFile(data, fileType);
            setCurrentData(true);
            if (rowData.length > 0) {
              insertMissingTaxonomy(rowData);
            }
          };

          reader.readAsText(file);
        }
      };

      input.click();
    });

  const dropZone = document.getElementById("ere_gallery_plupload_container");

  dropZone.addEventListener("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    const fileType = file.type;
    let data = e.target.result;

    rowData = readFile(data, fileType);
    if (rowData.length > 0) {
      setCurrentData(true);
      insertMissingTaxonomy(rowData);
    }
  });

  document
    .getElementById("download-example-json")
    .addEventListener("click", function () {
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(EXAMPLE_DATA_JSON, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "example.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });

  document
    .getElementById("ere_submit_property")
    .addEventListener("click", function () {
      const property_data = setPropertyData(choosedAgent);
      importSelectedProperty(property_data);
    });

  document
    .getElementById("import-selected-property")
    .addEventListener("click", function () {
      renderPropertyButtons(currentData);
      populateAgentOptions(agentsDB);
      handleAgentSelection();
    });

  if (importAllButton) {
    importAllButton.addEventListener("click", importAllProperties);
  }

  document
    .getElementById("download-example-xml")
    .addEventListener("click", function () {
      const dataStr =
        "data:text/xml;charset=utf-8," + encodeURIComponent(EXAMPLE_DATA_XML);
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "example.xml");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });

  document
    .getElementById("hide_properties_selection")
    .addEventListener("click", function () {
      togglePropertySelection();
    });

  document
    .getElementById("show_only_new_properties")
    .addEventListener("click", function () {
      const onlyNewPropertiesButton = document.getElementById(
        "show_only_new_properties"
      );

      if (onlyNewPropertiesButton.checked) {
        setCurrentData(true);
      } else {
        setCurrentData();
      }

      const buttonsWasRendered = document.querySelector(
        "#properties_selection .row-selector"
      );
      if (buttonsWasRendered) {
        renderPropertyButtons(currentData);
      }
    });
});
