import { convertXmlToJson, formatJsonData } from './property-handler.js';
import { selectProperty } from './dom-handlers.js';
import { checkJsonData } from './data-processor.js';

export function readFile(data, fileType) {
  if (fileType === "application/xml" || fileType === "text/xml") {
    data = convertXmlToJson(data);
  } else if (fileType === "application/json") {
    data = JSON.parse(data);
    data = formatJsonData(data);
  } else {
    alert("Please upload a JSON or XML file");
    return [];
  }

  if (checkJsonData(data)) {
    if (data.Row.length > 1) {
      const buttonSection = document.querySelector(
        ".property-selection-buttons"
      );
      buttonSection.style.display = "flex";
    } else if (data.Row.length === 1) {
      selectProperty(data.Row[0]);
    }
    return data.Row;
  }
  return [];
} 