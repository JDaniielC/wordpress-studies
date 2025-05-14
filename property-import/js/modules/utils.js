import { REGEX_PATTERNS } from './constants.js';

export function formatDescription(text) {
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
  text = text.replace(/Características\s*Principais\s*:/g, "\n\nCaracterísticas Principais:\n");

  // Processa a lista de características
  text = text.replace(/(Características Principais:)\s*(.*?)\.(?=\s*[A-Z]|\s*$)/gs,
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

export function transformYoutubeUrl(url) {
  if (!url) {
    return url;
  }
  // Transforma URLs do formato v/ para watch?v= e remove o parâmetro rel=0
  url = url.replace(REGEX_PATTERNS.YOUTUBE_URL, "youtube.com/watch?v=$1");
  url = url.replace(REGEX_PATTERNS.YOUTUBE_URL_SIMPLE, "youtube.com/watch?v=$1");
  return url;
}

export function convertToFloat(value) {
  if (!value || value.trim() === "") {
    return 0;
  }
  const cleanedValue = value.replace(/\./g, "").replace(",", ".");
  const result = parseFloat(cleanedValue);
  return isNaN(result) ? 0 : result;
}

export function getPropertyFeatures(propertyFeatures) {
  if (!propertyFeatures) {
    return [];
  }
  if (propertyFeatures.includes("<feature>")) {
    const features = Array.from(propertyFeatures.getElementsByTagName("feature"));
    if (features.length)
      return features.map((feature) => feature.textContent.trim());
    return [];
  } else if (propertyFeatures.includes(";")) {
    return propertyFeatures.split(";").map((feature) => feature.trim());
  } else if (Array.isArray(propertyFeatures)) {
    return propertyFeatures.map((feature) => feature.trim());
  }
  return [];
}

export function featureExists(feature, database) {
  return database.findIndex(
    item => item.toLowerCase() === feature.toLowerCase()
  );
}

export function getSlug(value) {
  let slug = value.replace(" ", "-");
  slug = slug.toLowerCase();
  slug = slug.replace(/[^a-z0-9-]/g, "");
  return slug;
}

export function getLatLong() {
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