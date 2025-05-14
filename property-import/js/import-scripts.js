import { insertMissingTaxonomy } from './modules/data-processor.js';
import { selectProperty, setPropertyData, importSelectedProperty } from './modules/property-handler.js';
import { renderPropertyButtons, togglePropertySelection, populateAgentOptions } from './modules/dom-handlers.js';
import { EXAMPLE_DATA_JSON, EXAMPLE_DATA_XML } from './modules/constants.js';
import { readFile } from './modules/file-handler.js';

let rowData = [];
let currentData = [];
let choosedAgent = '';

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

document.addEventListener("DOMContentLoaded", function () {
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
      renderPropertyButtons(currentData, selectProperty);
      populateAgentOptions(agentsDB);
      handleAgentSelection();
    });

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
        renderPropertyButtons(currentData, selectProperty);
      }
    });
});
