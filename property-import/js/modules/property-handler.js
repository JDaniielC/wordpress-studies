import {
  getPropertyFeatures,
  convertToFloat,
  transformYoutubeUrl,
  formatDescription,
} from "./utils.js";
import {
  getPropertyFeaturesFromForm,
  getIframeContent,
  getSelectedImages
} from "./dom-handlers.js";
import { getLatLong } from "./utils.js";

export function convertXmlToJson(xmlData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");

  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    alert("XML inválido: Erro de parsing");
    return null;
  }

  const properties = [];

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
      property_feature: getPropertyFeatures(
        getValue("Features") || getValue("property_feature") || ""
      ),
    };
    properties.push(propertyData);
  }

  return { Row: properties };
}

export function formatJsonData(jsonData) {
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
      property_images: Array.isArray(property.property_images) ? property.property_images : (String(property.property_images).split(',').map(s => s.trim()).filter(Boolean)),
      property_files: String(property.property_files) || "",
      property_video_url:
        transformYoutubeUrl(String(property.property_video_url)) || "",
      property_feature: getPropertyFeatures(property.property_feature),
      agent: String(property.agent) || "",
    })),
  };
  return formattedData;
}

export function setPropertyData(choosedAgent = "") {
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
    if (!element) {
      return "";
    }
    const option = element.options[element.selectedIndex]?.text || "";
    return getSlug(option);
  };

  const { lat, lng } = getLatLong();

  const property_data = {
    id: getElementValue("property_identity"),
    property_title: getElementValue("property_title"),
    property_description: getIframeContent("property_des_ifr", "property_des"),
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
    property_images: getSelectedImages(),
    property_files: getElementValue("property_attachments"),
    property_video_url: getElementValue("property_video_url"),
    property_feature: getPropertyFeaturesFromForm(),
    agent: choosedAgent,
    lat: lat,
    lng: lng,
  };

  return property_data;
}

export function importSelectedProperty(propertyData) {
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
