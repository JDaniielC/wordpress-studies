// Regex patterns
export const REGEX_PATTERNS = {
  TAB_NEWLINE: /[\t\n]/g,
  YOUTUBE_URL: /youtube\.com\/v\/([^?]+)\?rel=0/,
  YOUTUBE_URL_SIMPLE: /youtube\.com\/v\/([^?]+)/,
};

// Required field types for JSON validation
export const REQUIRED_FIELD_TYPES = {
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

// Taxonomy attributes configuration
export const TAXONOMY_ATTRIBUTES = [
  { key: "property_state", set: new Set(), db: propertyStateDB },
  { key: "property_city", set: new Set(), db: propertyCityDB },
  { key: "property_neighborhood", set: new Set(), db: propertyNeighborhoodDB },
  { key: "property_type", set: new Set(), db: propertyTypeDB },
  { key: "property_status", set: new Set(), db: propertyStatusDB },
  { key: "property_label", set: new Set(), db: propertyLabelDB },
  { key: "property_features", set: new Set(), db: propertyFeatureDB },
];

// Example data for testing
export const EXAMPLE_DATA_JSON = {
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
      property_features: ["Feature 1", "Feature 2", "Feature 3"],
    },
  ],
};

export const EXAMPLE_DATA_XML = `
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
    <property_features>
      <feature>Feature 1</feature>
      <feature>Feature 2</feature>
      <feature>Feature 3</feature>
    </property_features>
  </Row>
</Properties>`;