import { REQUIRED_FIELD_TYPES, TAXONOMY_ATTRIBUTES } from './constants.js';
import { featureExists } from './utils.js';

export function checkXmlFormat(xmlDoc) {
  // Verify if XML has correct format
  const rows = xmlDoc.getElementsByTagName("Row");
  if (!rows || rows.length === 0) {
    alert('XML inválido: Nenhum elemento "Row" encontrado');
    return false;
  }

  const tags = [
    "id",
    "property_type",
    "property_status",
    "property_label",
    "property_area",
    "property_land",
    "property_price",
    "property_address",
    "property_country",
    "property_district",
    "property_city",
    "property_neighborhood",
    "property_zip",
    "property_title",
    "agent",
    "property_description",
  ];

  let presentCount = 0;
  for (const tag of tags) {
    if (xmlDoc.getElementsByTagName(tag)[0]) {
      presentCount++;
    }
  }

  return presentCount > 3;
}

export function checkJsonData(jsonData) {
  if (!jsonData.Row || !Array.isArray(jsonData.Row)) {
    alert('Invalid JSON format: Missing or invalid "Row" array');
    return false;
  }

  for (let i = 0; i < jsonData.Row.length; i++) {
    const property = jsonData.Row[i];

    for (const [field, type] of Object.entries(REQUIRED_FIELD_TYPES)) {
      if (!(field in property)) {
        continue;
      }

      const actualType = typeof property[field];

      if (type === "number" && actualType !== "number") {
        alert(`Field "${field}" must be a number in property at index ${i}`);
        return false;
      }
      if (type === "string" && actualType !== "string") {
        alert(`Field "${field}" must be a string in property at index ${i}`);
        return false;
      }

      if (type === "number" && property[field] < 0) {
        alert(
          `Field "${field}" must be a positive number in property at index ${i}`
        );
        return false;
      }

      if (field === "property_files" || field === "property_images") {
        if (
          property[field] !== "" &&
          !property[field].includes(",") &&
          !property[field].match(/^https?:\/\/.+\..+$/)
        ) {
          alert(
            `Field "${field}" should be empty or contain valid URL(s) in property at index ${i}`
          );
          return false;
        }
      }
    }
  }
  return true;
}

export function insertMissingTaxonomy(data) {
  const filteredData = data.filter(property => {
    if (property.property_features) {
      return Array.isArray(property.property_features) && property.property_features.length > 0;
    }
    return TAXONOMY_ATTRIBUTES.every(attr => {
      const value = property[attr.key];
      return value !== null && value !== undefined && value !== '';
    });
  });

  filteredData.forEach((property) => {
    TAXONOMY_ATTRIBUTES.forEach((attr) => {
      const value = property[attr.key];
      const verifiedValue = (
        value && value !== "" && value !== null && value !== undefined
      );
      if (attr.key == "property_features") {
        if (Array.isArray(value)) {
          value.forEach(feature => {
            attr.set.add(feature);
          });
        }
      } else if (verifiedValue) {
        attr.set.add(value);
      }
    });
  });

  const preprocessAttributes = {};
  TAXONOMY_ATTRIBUTES.forEach((attr) => {
    if (attr.set.size > 0) {
      const missing = Array.from(attr.set).filter((value) => {
        const verifiedValue = (
          value && value !== "" && value !== null && value !== 'null'
        );
        const featureId = featureExists(value, attr.db);
        return verifiedValue && !featureId;
      });
      if (missing.length > 0) {
        preprocessAttributes[attr.key] = missing;
      }
    }
  });

  if (Object.keys(preprocessAttributes).length > 0) {
    let msg =
      "Para uma migração completa de dados, alguns dados devem ser pré cadastrados no banco:\n\n";
    Object.entries(preprocessAttributes).forEach(([key, values]) => {
      msg += `- ${key}: ${values.join(", ")}\n`;
    });
    msg += "\nDeseja cadastrar esses dados agora?";

    if (confirm(msg)) {
      submitPreprocessData(preprocessAttributes);
    } else {
      alert("Pré-processamento cancelado pelo usuário.");
    }
  }
}

function submitPreprocessData(attributes) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = window.location.href;

  Object.entries(attributes).forEach(([key, values]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = `preprocess[${key}][]`;
    values.forEach((value) => {
      const valueInput = document.createElement("input");
      valueInput.type = "hidden";
      valueInput.name = `preprocess[${key}][]`;
      valueInput.value = value;
      form.appendChild(valueInput);
    });
  });

  document.body.appendChild(form);
  form.submit();
} 