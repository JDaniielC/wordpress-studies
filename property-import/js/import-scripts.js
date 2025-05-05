let rowData = [];
let currentData = [];
let propertyFeatureIds = [];

function formatDescription(text) {
  if (!text) {
    return "";
  }

  // Remove referências (Ref.: XXXX) e (Ref. XXXX)
  text = text.replace(/Ref\.?\:?\s*\d+\_?\w*/g, "");

  // Corrige espaços entre números e palavras
  text = text.replace(/(\d)([A-Za-z])/g, "$1 $2");

  // Adiciona quebra de linha após pontos finais seguidos de maiúsculas
  text = text.replace(/\.(\s*)([A-Z])/g, ".\n\n$2");

  // Trata listas de características
  text = text.replace(
    /Características\s*Principais\s*:/g,
    "\n\nCaracterísticas Principais:\n"
  );

  // Processa a lista de características
  text = text.replace(
    /(Características Principais:)\s*(.*?)\.(?=\s*[A-Z]|\s*$)/gs,
    (match, prefix, items) => {
      const formattedItems = items
        .split(";")
        .map((item) => item.trim())
        .filter((item) => item)
        .map((item) => `\n• ${item}`);
      return `${prefix}\n${formattedItems.join("\n")}`;
    }
  );

  // Adiciona espaço após vírgulas e outros sinais de pontuação
  text = text.replace(/([,!;:])(?=[^\s])/g, "$1 ");

  // Substitui \" por <b> e </b> para negrito
  text = text.replace(/"([^"]+)"/g, "<b>$1</b>");

  // Remove (-)
  text = text.replace(/\(\-\)/g, "");

  // Remove espaços antes de pontuação
  text = text.replace(/\s+([.,;:])/g, "$1");

  // Trata múltiplos espaços
  text = text.replace(/\s+/g, " ");

  // Trata múltiplas quebras de linha
  text = text.replace(/\n\s*\n\s*\n/g, "\n\n");

  // Trata espaços extras no início e fim de cada linha
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  text = lines.join("\n");

  return text.trim();
}

function transformYoutubeUrl(url) {
  if (!url) {
    return url;
  }
  // Transforma URLs do formato v/ para watch?v= e remove o parâmetro rel=0
  url = url.replace(
    /youtube\.com\/v\/([^?]+)\?rel=0/,
    "youtube.com/watch?v=$1"
  );
  url = url.replace(/youtube\.com\/v\/([^?]+)/, "youtube.com/watch?v=$1");
  return url;
}

function convertToFloat(value) {
  if (!value || value.trim() === "") {
    return 0;
  }
  const cleanedValue = value.replace(/\./g, "").replace(",", ".");
  const result = parseFloat(cleanedValue);
  return isNaN(result) ? 0 : result;
}

function checkXmlFormat(xmlDoc) {
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

  if (presentCount > 3) {
    return true;
  }

  return false;
}

function convertXmlToJson(xmlData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    alert("XML inválido: Erro de parsing");
    return null;
  }

  if (checkXmlFormat(xmlDoc)) {
    const jsonData = JSON.stringify(xmlDoc, null, 2);
    return jsonData;
  }

  const properties = [];

  function getPropertyFeatures(propertyFeatures) {
    return propertyFeatures.split(",").map((feature) => feature.trim());
  }

  const rows = xmlDoc.getElementsByTagName("Row");
  for (const property of rows) {
    const getValue = (tag) => {
      const element = property.getElementsByTagName(tag)[0];
      return element ? element.textContent : "";
    };

    const propertyData = {
      agent: getValue("Angariador") || getValue("agent") || "",
      id: getValue("Referencia") || getValue("id") || "",
      property_city: getValue("Concelho") || getValue("property_city") || "",
      property_label: getValue("Estado") || getValue("property_label") || "",
      property_title:
        getValue("Nome_pt-pt") || getValue("property_title") || "",
      property_status: getValue("Estado") || getValue("property_status") || "",
      property_country: getValue("Pais") || getValue("property_country") || "",
      property_district:
        getValue("Distrito") || getValue("property_district") || "",
      property_type: getValue("Natureza") || getValue("property_type") || "",
      property_neighborhood:
        getValue("Zona") || getValue("property_neighborhood") || "",
      property_price:
        convertToFloat(getValue("Venda") || getValue("property_price")) || 0,
      property_area:
        convertToFloat(getValue("Areautil") || getValue("property_area")) || 0,
      property_land:
        convertToFloat(getValue("AreaTerreno") || getValue("property_land")) ||
        0,
      property_video_url:
        transformYoutubeUrl(
          getValue("Linkdovideo") || getValue("property_video_url")
        ) || "",
      property_description:
        formatDescription(
          getValue("Descricao_pt-pt") || getValue("property_description")
        ) || "",
      property_rooms:
        convertToFloat(getValue("Salas") || getValue("property_rooms")) || 0,
      property_bathrooms:
        convertToFloat(
          getValue("Banheiros") || getValue("property_bathrooms")
        ) || 0,
      property_garage:
        convertToFloat(getValue("Garagem") || getValue("property_garage")) || 0,
      property_bedrooms:
        convertToFloat(getValue("Quartos") || getValue("property_bedrooms")) ||
        0,
      property_garage_size:
        convertToFloat(
          getValue("TamanhoGaragem") || getValue("property_garage_size")
        ) || 0,
      property_address:
        getValue("Endereco") || getValue("property_address") || "",
      property_zip: getValue("Codigopostal") || getValue("property_zip") || "",
      property_images: (
        getValue("Linkdaimagem") ||
        getValue("property_images") ||
        ""
      )
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean),
      property_files:
        getValue("Linkdaplanta") || getValue("property_files") || "",
      property_features:
        getPropertyFeatures(
          getValue("Features") || getValue("property_features") || ""
        ),
    };
    properties.push(propertyData);
  }

  return { Row: properties };
}

function formatJsonData(jsonData) {
  const formattedData = {
    Row: jsonData.Row.map((property) => ({
      id: String(property.id) || "",
      property_title: String(property.property_title) || "",
      property_type: String(property.property_type) || "",
      property_status: String(property.property_status) || "",
      property_label: String(property.property_label) || "",
      property_country: String(property.property_country) || "",
      property_district: String(property.property_district) || "",
      property_city: String(property.property_city) || "",
      property_neighborhood: String(property.property_neighborhood) || "",
      property_zip: String(property.property_zip) || "",
      property_price: parseFloat(property.property_price) || 0,
      property_area: parseFloat(property.property_area) || 0,
      property_land: parseFloat(property.property_land) || 0,
      property_rooms: parseFloat(property.property_rooms) || 0,
      property_bathrooms: parseFloat(property.property_bathrooms) || 0,
      property_garage: parseFloat(property.property_garage) || 0,
      property_address: String(property.property_address) || "",
      property_bedrooms: parseFloat(property.property_bedrooms) || 0,
      property_garage_size: parseFloat(property.property_garage_size) || 0,
      property_description:
        formatDescription(String(property.property_description)) || "",
      property_images: String(property.property_images) || "",
      property_files: String(property.property_files) || "",
      property_video_url:
        transformYoutubeUrl(String(property.property_video_url)) || "",
      property_features: property.property_features?.split(",") || [],
      agent: String(property.agent) || "",
    })),
  };
  return formattedData;
}

function readFile(data, fileType) {
  if (fileType === "application/xml" || fileType === "text/xml") {
    data = convertXmlToJson(data);
  } else if (fileType === "application/json") {
    data = JSON.parse(data);
    data = formatJsonData(data);
  } else {
    alert("Please upload a JSON or XML file");
    return;
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
    rowData = data.Row;
  }
}

function getPropertyFeatureIds() {
  const propertyFeaturesInputs = document.querySelectorAll(".g5ere__sf-feature");
  propertyFeaturesInputs.forEach((feature) => {
    const featureId = feature.querySelector("input").id;
    const featureName = feature.querySelector("label").textContent;
    if (featureId) {
      propertyFeatureIds.push({
        id: featureId,
        name: featureName,
      });
    }
  });

  return propertyFeatureIds;
}

function togglePropertySelection() {
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

function setMapLocation(propertyAddress) {
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

function setPropertyFeatures(propertyFeatures) {
  const transformedFeatures = propertyFeatures.map((feature) => {
    return propertyFeatureIds.find((f) => f.name === feature)?.id;
  });
  transformedFeatures.forEach((feature) => {
    const featureElement = document.getElementById(feature);
    if (featureElement) {
      featureElement.checked = true;
    }
  });
}

function getLatLong() {
  const latInput = document.getElementById('lat');
  const lngInput = document.getElementById('lng');
  
  if (latInput && lngInput) {
    return {
      lat: parseFloat(latInput.value),
      lng: parseFloat(lngInput.value)
    };
  }
  return null;
}

function selectProperty(propertyData) {
  const buttons = document.getElementsByClassName("property-select-btn");
  Array.from(buttons).forEach((btn) => btn.classList.remove("selected"));
  event?.target?.classList.add("selected");

  document.getElementById("ere_property_form").style.display = "block";

  togglePropertySelection();

  const propertyAddress = `${propertyData.property_city}, ${propertyData.property_district}, ${propertyData.property_country}`;

  setMapLocation(propertyAddress);
  propertyFeatureIds = getPropertyFeatureIds();

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

  const features = propertyData.property_features || "";
  const featuresArray = features.split(",");
  featuresArray.forEach((feature) => {
    const featureElement = document.getElementById(feature);
    if (featureElement) {
      featureElement.checked = true;
    }
  });
}

function checkJsonData(jsonData) {
  if (!jsonData.Row || !Array.isArray(jsonData.Row)) {
    alert('Invalid JSON format: Missing or invalid "Row" array');
    return false;
  }

  const requiredTypes = {
    id: "string",
    property_title: "string",
    property_type: "string",
    property_status: "string",
    property_label: "string",
    property_area: "number",
    property_price: "number",
    property_address: "string",
    property_country: "string",
    property_district: "string",
    property_city: "string",
    property_neighborhood: "string",
    property_zip: "string",
    agent: "string",
    property_description: "string",
    property_rooms: "number",
    property_bathrooms: "number",
    property_bedrooms: "number",
    property_garage: "number",
    property_garage_size: "number",
  };

  for (let i = 0; i < jsonData.Row.length; i++) {
    const property = jsonData.Row[i];

    for (const [field, type] of Object.entries(requiredTypes)) {
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

function getIframeContent(iframeId, elementClass) {
  const iframe = document.getElementById(iframeId);
  const iframeDoc =
    iframe.contentDocument || iframe.contentWindow.document;
  const element = iframeDoc.querySelector(`.${elementClass} p`);
  return element ? element.textContent : "";
}

function setIframeContent(iframeId, elementClass, content) {
  const iframe = document.getElementById(iframeId);
  const iframeDoc =
    iframe?.contentDocument || iframe?.contentWindow?.document;
  const element = iframeDoc?.querySelector(`.${elementClass} p`);
  element.textContent = content;
}

function setPropertyData(property = undefined) {
  let property_data = property;
  if (!property) {
    const getElementValue = (elementId) => {
      const element = document.getElementById(elementId);
      return element ? element.value : "";
    };

    const getElementNumberValue = (elementId) => {
      let element = document.getElementById(elementId);
      element = element ? parseFloat(element.value || 0) : 0;
      return isNaN(element) ? 0 : element;
    };

    const getSlug = (value) => {
      let slug = value.replace(" ", "-");
      slug = slug.toLowerCase();
      slug = slug.replace(/[^a-z0-9-]/g, "");
      return slug;
    };

    const getOptionLabel = (elementId) => {
      const element = document.getElementById(elementId);
      const option = element ? element.options[element.selectedIndex].text : "";
      return getSlug(option);
    };

    const getDescriptionValue = () => {
      return getIframeContent("property_des_ifr", "property_des");
    };

    const { lat, lng } = getLatLong();

    property_data = {
      id: getElementValue("property_identity"),
      property_title: getElementValue("property_title"),
      property_description: getDescriptionValue(),
      property_type: getOptionLabel("property_type"),
      property_status: getOptionLabel("property_status"),
      property_label: getOptionLabel("property_label"),
      property_price: getElementNumberValue("property_price_short"),
      property_area: getElementNumberValue("property_size"),
      property_land: getElementNumberValue("property_land"),
      property_rooms: getElementNumberValue("property_rooms"),
      property_bathrooms: getElementNumberValue("property_bathrooms"),
      property_bedrooms: getElementNumberValue("property_bedrooms"),
      property_garage: getElementNumberValue("property_garage"),
      property_garage_size: getElementNumberValue("property_garage_size"),
      property_address: getElementValue("address1"),
      property_country: getOptionLabel("property_country"),
      property_city: getOptionLabel("city"),
      property_district: getOptionLabel("administrative_area_level_1"),
      property_neighborhood: getOptionLabel("neighborhood"),
      property_zip: getElementValue("property_zip"),
      property_images: getElementValue("property_gallery"),
      property_files: getElementValue("property_attachments"),
      property_video_url: getElementValue("property_video_url"),
      property_features: getElementValue("property_features"),
      lat: lat,
      lng: lng,
    };
  }

  return property_data;
}

function importSelectedProperty(propertyData) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = window.location.href;

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "property_data";
  input.value = JSON.stringify(propertyData);

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
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

function insertMissingTaxonomy(data) {
  const attributes = [
    { key: "property_state", set: new Set(), db: propertyStateDB },
    { key: "property_city", set: new Set(), db: propertyCityDB },
    {
      key: "property_neighborhood",
      set: new Set(),
      db: propertyNeighborhoodDB,
    },
    { key: "property_type", set: new Set(), db: propertyTypeDB },
    { key: "property_status", set: new Set(), db: propertyStatusDB },
    { key: "property_label", set: new Set(), db: propertyLabelDB },
    { key: "property_feature", set: new Set(), db: propertyFeatureDB },
  ];

  data.forEach((property) => {
    attributes.forEach((attr) => {
      if (property[attr.key]) attr.set.add(property[attr.key]);
    });
  });

  const preprocessAttributes = {};
  attributes.forEach((attr) => {
    if (attr.set.size > 0) {
      const missing = Array.from(attr.set).filter(
        (value) => !attr.db.includes(value) && value !== "" && value !== null
      );
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

function setCurrentData(filter = false) {
  if (filter) {
    currentData = rowData.filter(
      (property) => !propertyIdsDB.includes(String(property.id))
    );
  } else {
    currentData = rowData;
  }
}

function renderPropertyButtons() {
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
            readFile(data, fileType);
            setCurrentData(true);
            insertMissingTaxonomy(rowData);
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

    readFile(data, fileType);
  });

  document
    .getElementById("download-example-json")
    .addEventListener("click", function () {
      const example = {
        Row: [
          {
            id: "EXAMPLE_001",
            property_type: "Apartamento",
            property_status: "Disponível",
            property_label: "Em construção",
            property_area: 100,
            property_land: 120,
            property_price: 100000,
            property_address: "Rua do Exemplo, 123",
            property_country: "Portugal",
            property_district: "Exemplo",
            property_city: "Cidade Exemplo",
            property_neighborhood: "Bairro Exemplo",
            property_zip: "12345-678",
            property_title: "Apartamento T2 Exemplo",
            agent: "AGENTE EXEMPLO",
            property_description:
              "Este é um exemplo de descrição do imóvel. Aqui você pode incluir todas as características e detalhes do imóvel. Este texto serve apenas como demonstração do formato necessário...",
            property_images:
              "https://exemplo.com/imagem1.jpg,https://exemplo.com/imagem2.jpg",
            property_video_url: "https://www.youtube.com/v/exemplo123",
            property_files:
              "https://exemplo.com/documento1.pdf,https://exemplo.com/documento2.pdf",
            property_rooms: 2,
            property_bathrooms: 2,
            property_bedrooms: 2,
            property_garage: 1,
            property_garage_size: 20,
          },
        ],
      };

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(example, null, 2));
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
      const property_data = setPropertyData();
      importSelectedProperty(property_data);
    });

  document
    .getElementById("import-selected-property")
    .addEventListener("click", function () {
      renderPropertyButtons();
    });

  document
    .getElementById("download-example-xml")
    .addEventListener("click", function () {
      const xmlContent = `
<Properties>
  <Row>
    <id>EXAMPLE_001</id>
    <property_type>Apartamento</property_type>
    <property_status>Disponível</property_status>
    <property_label>Em construção</property_label>
    <property_area>100</property_area>
    <property_land>120</property_land>
    <property_price>100000</property_price>
    <property_address>Rua do Exemplo, 123</property_address>
    <property_country>Portugal</property_country>
    <property_district>Exemplo</property_district>
    <property_city>Cidade Exemplo</property_city>
    <property_neighborhood>Bairro Exemplo</property_neighborhood>
    <property_zip>12345-678</property_zip>
    <property_title>Apartamento T2 Exemplo</property_title>
    <agent>AGENTE EXEMPLO</agent>
    <property_description>Este é um exemplo de descrição do imóvel. Aqui você pode incluir todas as características e detalhes do imóvel. Este texto serve apenas como demonstração do formato necessário...</property_description>
    <property_images>https://exemplo.com/imagem1.jpg,https://exemplo.com/imagem2.jpg</property_images>
    <property_video_url>https://www.youtube.com/v/exemplo123</property_video_url>
    <property_files>https://exemplo.com/documento1.pdf,https://exemplo.com/documento2.pdf</property_files>
    <property_rooms>2</property_rooms>
    <property_bathrooms>2</property_bathrooms>
    <property_bedrooms>2</property_bedrooms>
    <property_garage>1</property_garage>
    <property_garage_size>20</property_garage_size>
  </Row>
</Properties>`;

      const dataStr =
        "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
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
        renderPropertyButtons();
      }
    });
});
