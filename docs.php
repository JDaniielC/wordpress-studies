<?php
/*
Template Name: Import Json Docs
*/

function import_property_to_wordpress($property_data)
{
  error_log('Iniciando importação de propriedade: ');

  $required_fields = ['property_title', 'property_description', 'property_price', 'property_area', 'property_land', 'property_rooms', 'property_bathrooms', 'property_bedrooms', 'property_garage', 'property_garage_size', 'property_address', 'property_country', 'property_city', 'property_district', 'property_neighborhood', 'property_zip'];

  foreach ($required_fields as $field) {
    if (!isset($property_data[$field])) {
      error_log('Campo obrigatório não encontrado: ' . $field);
      return array(
        'success' => false,
        'message' => 'Campo obrigatório não encontrado: ' . $field
      );
    }
  }

  // Create post array
  $post_data = array(
    'post_title'    => wp_strip_all_tags($property_data['property_title']),
    'post_content'  => $property_data['property_description'],
    'post_status'   => 'publish',
    'post_type'     => 'property'
  );

  // Insert the post into the database
  $post_id = wp_insert_post($post_data);

  if (is_wp_error($post_id)) {
    error_log('Erro ao criar post: ' . $post_id->get_error_message());
    return array(
      'success' => false,
      'message' => 'Failed to create property post: ' . $post_id->get_error_message()
    );
  }

  // Price related fields
  $price_data = array(
    'property_price' => $property_data['property_price'],
    'property_price_short' => $property_data['property_price'],
    'property_price_unit' => '1',
    'property_price_on_call' => '0',
    'property_price_prefix' => '',
    'property_price_postfix' => ''
  );

  // Property details
  $details_data = array(
    'property_size' => $property_data['property_area'],
    'property_land' => $property_data['property_land'],
    'property_rooms' => $property_data['property_rooms'],
    'property_bedrooms' => $property_data['property_bedrooms'],
    'property_bathrooms' => $property_data['property_bathrooms'],
    'property_garage' => $property_data['property_garage'],
    'property_garage_size' => $property_data['property_garage_size'],
    'property_year' => isset($property_data['property_year']) ? $property_data['property_year'] : '',
    'property_identity' => $property_data['id']
  );

  // Location data
  $location_data = array(
    'property_address' => $property_data['property_address'],
    'property_country' => $property_data['property_country'],
    'property_state' => $property_data['property_district'],
    'property_city' => $property_data['property_city'],
    'property_neighborhood' => $property_data['property_neighborhood'],
    'property_zip' => $property_data['property_zip']
  );

  // Media data
  $media_data = array(
    'property_images' => $property_data['property_images'],
    'property_attachments' => $property_data['property_files'],
    'property_video_url' => $property_data['property_video_url']
  );

  // Update all meta fields
  foreach (array_merge($price_data, $details_data, $location_data, $media_data) as $key => $value) {
    if (!empty($value)) {
      $res = update_post_meta($post_id, ERE_METABOX_PREFIX . $key, $value);
    }
  }

  // Handle location coordinates if provided
  if (isset($property_data['lat']) && isset($property_data['lng'])) {
    $location = array(
      'location' => $property_data['lat'] . ',' . $property_data['lng'],
      'address' => $property_data['property_address']
    );
    $res = update_post_meta($post_id, ERE_METABOX_PREFIX . 'property_location', $location);
    error_log('Atualizando meta campo: property_location' . $res);
  }

  // Set taxonomies
  $taxonomies = array(
    'property-type' => $property_data['property_type'],
    'property-status' => $property_data['property_status'],
    'property-label' => $property_data['property_label'],
    'property-city' => $property_data['property_city'],
    'property-state' => $property_data['property_district'],
    'property-neighborhood' => $property_data['property_neighborhood']
  );

  foreach ($taxonomies as $taxonomy => $value) {
    if (!empty($value)) {
      $res = wp_set_object_terms($post_id, $value, $taxonomy);
      error_log('Atualizando taxonomia: ' . $res);
    }
  }

  // Handle featured image if images are provided
  if (!empty($property_data['property_images'])) {
    $images = explode(',', $property_data['property_images']);
    if (!empty($images[0])) {
      // Set the first image as featured image
      $featured_image_id = ere_get_attachment_id($images[0]);
      if ($featured_image_id) {
        $res = set_post_thumbnail($post_id, $featured_image_id);
        error_log('Atualizando featured image: ' . $featured_image_id . ' - Resultado: ' . $res);
      }
    }
  }

  return array(
    'success' => true,
    'post_id' => $post_id,
    'message' => 'Property imported successfully'
  );
}

if (isset($_POST['property_data'])) {
  $property_data = json_decode(stripslashes($_POST['property_data']), true);
  $result = import_property_to_wordpress($property_data);

  if ($result['success']) {
    echo "<script>alert('Property imported successfully! Post ID: " . $result['post_id'] . "');</script>";
  } else {
    echo "<script>alert('Failed to import: " . $result['message'] . "');</script>";
  }
}

get_header();

global $hide_property_fields;
$hide_property_fields = array(
  'property_price_prefix',
  'property_price_postfix',
  'property_price_on_call',
  'additional_details'
);
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script>
    let rowData = [];

    function convertXmlToJson(xmlData) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      const jsonData = JSON.stringify(xmlDoc, null, 2);
      return jsonData;
    }

    function readFile(data, fileType) {
      if (fileType === 'application/xml') {
        data = convertXmlToJson(data);
      } else if (fileType === 'application/json') {
        data = JSON.parse(data);
        const isValid = checkJsonData(data);
        if (isValid) {
          if (data.Row.length > 1) {
            const buttonSection = document.querySelector('.property-selection-buttons')
            buttonSection.style.display = 'flex';
          } else if (data.Row.length === 1) {
            selectProperty(data.Row[0]);
          }
          rowData = data.Row;
        }
      } else {
        alert('Please upload a JSON or XML file.');
      }

      return data;
    }

    function selectProperty(propertyData) {
      const buttons = document.getElementsByClassName('property-select-btn');
      Array.from(buttons).forEach(btn => btn.classList.remove('selected'));
      event?.target?.classList.add('selected');

      document.getElementById('ere_property_form').style.display = 'block';

      const fieldMapping = {
        'property_title': propertyData.property_title,
        'property_des': propertyData.property_description,
        'property_type': propertyData.property_type,
        'property_status': propertyData.property_status,
        'property_label': propertyData.property_label,
        'property_price_short': propertyData.property_price.toString(),
        'property_price_unit': '1',
        'address1': propertyData.property_address,
        'property_country': propertyData.property_country,
        'property_city': propertyData.property_city,
        'administrative_area_level_1': propertyData.property_district,
        'neighborhood': propertyData.property_neighborhood,
        'property_zip': propertyData.property_zip,
        'property_gallery': propertyData.property_images || '',
        'property_attachments': propertyData.property_files || '',
        'property_video_url': propertyData.property_video_url || '',
        'property_size': propertyData.property_area || '',
        'property_land': propertyData.property_land || '',
        'property_identity': propertyData.id || '',
        'property_rooms': propertyData.property_rooms || '',
        'property_bathrooms': propertyData.property_bathrooms || '',
        'property_bedrooms': propertyData.property_bedrooms || '',
        'property_garage': propertyData.property_garage || '',
        'property_garage_size': propertyData.property_garage_size || '',
      };

      Object.entries(fieldMapping).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
          if (element.tagName === 'SELECT') {
            const option = Array.from(element.options).find(opt =>
              opt.text.toLowerCase() === value.toLowerCase()
            );
            if (option) {
              option.selected = true;
              element.dispatchEvent(new Event('change'));
            }
          } else if (element.type === 'checkbox') {
            element.checked = value === 'true';
          } else {
            if (fieldId === 'property_attachments') {
              if (!value) {
                element.value = '';
              } else {
                element.value = value;
              }
            } else {
              element.value = value;
            }
          }
        }
      });
    }

    function checkJsonData(jsonData) {
      if (!jsonData.Row || !Array.isArray(jsonData.Row)) {
        alert('Invalid JSON format: Missing or invalid "Row" array');
        return false;
      }

      const requiredTypes = {
        id: 'string',
        property_title: 'string',
        property_type: 'string',
        property_status: 'string',
        property_label: 'string',
        property_area: 'number',
        property_land: 'number',
        property_price: 'number',
        property_address: 'string',
        property_country: 'string',
        property_district: 'string',
        property_city: 'string',
        property_neighborhood: 'string',
        property_zip: 'string',
        agent: 'string',
        property_description: 'string',
        property_images: 'string',
        property_video_url: 'string',
        property_files: 'string',
        property_rooms: 'number',
        property_bathrooms: 'number',
        property_bedrooms: 'number',
        property_garage: 'number',
        property_garage_size: 'number'
      };

      for (let i = 0; i < jsonData.Row.length; i++) {
        const property = jsonData.Row[i];

        for (const [field, type] of Object.entries(requiredTypes)) {
          if (!(field in property)) {
            continue;
          }

          const actualType = typeof property[field];

          if (type === 'number' && actualType !== 'number') {
            alert(`Field "${field}" must be a number in property at index ${i}`);
            return false;
          }
          if (type === 'string' && actualType !== 'string') {
            alert(`Field "${field}" must be a string in property at index ${i}`);
            return false;
          }

          if (field === 'property_video_url') {
            if (!property[field].includes('youtube.com/v/')) {
              alert(`Invalid YouTube URL format in property at index ${i}`);
              return false;
            }
          }

          if (type === 'number' && property[field] <= 0) {
            alert(`Field "${field}" must be a positive number in property at index ${i}`);
            return false;
          }

          if (field === 'property_files' || field === 'property_images') {
            if (property[field] !== '' &&
              !property[field].includes(',') &&
              !property[field].match(/^https?:\/\/.+\..+$/)) {
              alert(`Field "${field}" should be empty or contain valid URL(s) in property at index ${i}`);
              return false;
            }
          }
        }
      }
      return true;
    }

    function setPropertyData(property = undefined) {
      let property_data = property;
      if (!property) {
        const getElementValue = (elementId, defaultValue = '') => {
          const element = document.getElementById(elementId);
          return element ? (element.value || defaultValue) : defaultValue;
        };

        const parseNumber = (value, defaultValue = 0) => {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? defaultValue : parsed;
        };

        property_data = {
          'id': getElementValue('property_identity', ''),
          'property_title': getElementValue('property_title', ''),
          'property_description': getElementValue('property_des', ''),
          'property_type': getElementValue('property_type', ''),
          'property_status': getElementValue('property_status', ''),
          'property_label': getElementValue('property_label', ''),
          'property_price': parseNumber(getElementValue('property_price_short'), 0),
          'property_area': parseNumber(getElementValue('property_size'), 0),
          'property_land': parseNumber(getElementValue('property_land'), 0),
          'property_rooms': parseNumber(getElementValue('property_rooms'), 0),
          'property_bathrooms': parseNumber(getElementValue('property_bathrooms'), 0),
          'property_bedrooms': parseNumber(getElementValue('property_bedrooms'), 0),
          'property_garage': parseNumber(getElementValue('property_garage'), 0),
          'property_garage_size': parseNumber(getElementValue('property_garage_size'), 0),
          'property_address': getElementValue('address1', ''),
          'property_country': getElementValue('property_country', ''),
          'property_city': getElementValue('property_city', ''),
          'property_district': getElementValue('administrative_area_level_1', ''),
          'property_neighborhood': getElementValue('neighborhood', ''),
          'property_zip': getElementValue('property_zip', ''),
          'property_images': getElementValue('property_gallery', ''),
          'property_files': getElementValue('property_attachments', ''),
          'property_video_url': getElementValue('property_video_url', '')
        };
      }

      return property_data;
    }

    function importSelectedProperty(propertyData) {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = window.location.href;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'property_data';
      input.value = JSON.stringify(propertyData);

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }

    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('ere_select_json_file').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json, .xml';

        input.onchange = function(e) {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();

            reader.onload = function(e) {
              const fileType = file.type;
              let data = e.target.result;
              readFile(data, fileType);
            };

            reader.readAsText(file);
          }
        };

        input.click();
      });

      const dropZone = document.getElementById('ere_gallery_plupload_container');

      dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        const fileType = file.type;
        let data = e.target.result;

        readFile(data);
      });

      document.getElementById('download-example-json').addEventListener('click', function() {
        const example = {
          "Row": [{
            "id": "EXAMPLE_001",
            "property_type": "Apartamento",
            "property_status": "Disponível",
            "property_label": "Em construção",
            "property_area": 100,
            "property_land": 120,
            "property_price": 100000,
            "property_address": "Rua do Exemplo, 123",
            "property_country": "Portugal",
            "property_district": "Exemplo",
            "property_city": "Cidade Exemplo",
            "property_neighborhood": "Bairro Exemplo",
            "property_zip": "12345-678",
            "property_title": "Apartamento T2 Exemplo",
            "agent": "AGENTE EXEMPLO",
            "property_description": "Este é um exemplo de descrição do imóvel. Aqui você pode incluir todas as características e detalhes do imóvel. Este texto serve apenas como demonstração do formato necessário...",
            "property_images": "https://exemplo.com/imagem1.jpg,https://exemplo.com/imagem2.jpg",
            "property_video_url": "https://www.youtube.com/v/exemplo123",
            "property_files": "https://exemplo.com/documento1.pdf,https://exemplo.com/documento2.pdf",
            "property_rooms": 2,
            "property_bathrooms": 2,
            "property_bedrooms": 2,
            "property_garage": 1,
            "property_garage_size": 20
          }]
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(example, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "example.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      });

      document.getElementById('ere_submit_property').addEventListener('click', function() {
        const property_data = setPropertyData();
        importSelectedProperty(property_data);
      });

      document.getElementById('import-all-properties').addEventListener('click', function() {
        for (let i = 0; i < rowData.length; i++) {
          const property = rowData[i];
          importSelectedProperty(property);
        }
      });

      document.getElementById('import-selected-property').addEventListener('click', function() {
        const hideSection = document.querySelector('#hide_properties_selection')
        hideSection.textContent = 'Hide Properties Selection';
        hideSection.style.display = 'block';

        const buttonSection = document.querySelector('#properties_selection')
        buttonSection.innerHTML = '';
        const selectorDiv = document.createElement('div');
        selectorDiv.className = 'row-selector';

        const label = document.createElement('h4');
        label.textContent = 'Select Property to Import:';
        selectorDiv.appendChild(label);

        rowData.forEach((row, index) => {
          const button = document.createElement('button');
          button.className = 'btn btn-secondary property-select-btn';
          button.textContent = `${index + 1}. ${row.property_title} (ID: ${row.id})`;
          button.onclick = () => selectProperty(rowData[index]);
          selectorDiv.appendChild(button);
        });
        buttonSection.appendChild(selectorDiv);
      });

      document.getElementById('download-example-xml').addEventListener('click', function() {
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

        const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xmlContent);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "example.xml");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      });

      document.getElementById('hide_properties_selection').addEventListener('click', function() {
        const buttonSection = document.querySelector('#properties_selection')
        if (buttonSection.style.display === 'none') {
          buttonSection.style.display = 'flex';
          this.textContent = 'Hide Properties Selection';
        } else {
          buttonSection.style.display = 'none';
          this.textContent = 'Show Properties Selection';
        }
      });
    })
  </script>

  <style>
    #ere_gallery_plupload_container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 1rem;
      align-items: center;
    }

    #ere_gallery_plupload_container .container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    #ere_gallery_plupload_container .media-drag-drop-icon {
      font-size: 2rem;
    }

    #ere_gallery_plupload_container h4 {
      margin: 0;
    }

    .media-drag-drop.dragover {
      border-color: #007bff;
      background-color: rgba(0, 123, 255, 0.1);
    }

    #json-instructions {
      margin: 20px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    #json-instructions pre {
      background-color: #f1f1f1;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
    }

    #json-instructions ul {
      margin-left: 20px;
      margin-bottom: 20px;
    }

    #json-instructions li {
      margin-bottom: 5px;
      color: #666;
    }

    #download-example {
      margin-top: 10px;
    }

    .row-selector {
      margin: 20px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }

    .property-select-btn {
      margin: 5px;
      padding: 10px 15px;
      transition: all 0.3s ease;
    }

    .property-select-btn.selected {
      background-color: #007bff;
      color: white;
    }

    .property-preview {
      margin: 15px 0;
      padding: 15px;
      background-color: #fff;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .property-preview p {
      margin-bottom: 8px;
    }

    #property_details {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }

    #property_details h4 {
      margin-bottom: 15px;
    }

    .btn-primary {
      margin-top: 15px;
    }

    #ere_property_form {
      display: none;
    }

    .property-selection-buttons {
      display: none;
      justify-content: space-between;
      align-items: center;
    }

    .example-buttons {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    #hide_properties_selection {
      margin-top: 10px;
      padding: 10px 15px;
      transition: all 0.3s ease;
      display: none;
    }
  </style>
</head>

<body>

  <div id="json-instructions">
    <h3>File Format Instructions</h3>

    <h4>JSON Format</h4>
    <p>The JSON file should follow this structure:</p>
    <pre>
{
  "Row": [
    {
      "id": "string",                    // Property ID (e.g., "EXAMPLE_001")
      "property_type": "string",         // Type of property (e.g., "Apartamento", "Moradia")
      "property_status": "string",       // Status (e.g., "Pronto")
      "property_label": "string",        // Label (e.g., "Em Obras", "Pronto")
      "property_area": number,      // Useful area in m² (e.g., 100)
      "property_land": number,     // Gross area in m² (e.g., 120)
      "property_price": number,          // Price in euros (e.g., 100000)
      "property_address": "string",      // Full address (e.g., "Rua do Exemplo, 123")
      "property_country": "string",      // Country (e.g., "Portugal")
      "property_district": "string",     // District (e.g., "Exemplo")
      "property_city": "string",         // City (e.g., "Cidade Exemplo")
      "property_neighborhood": "string",  // Neighborhood (e.g., "Bairro Exemplo")
      "property_zip": "string",          // Zip code (e.g., "12345678")
      "property_title": "string",        // Property title (e.g., "Apartamento T2 Exemplo")
      "agent": "string",                 // Agent name (e.g., "AGENTE EXEMPLO")
      "property_description": "string",   // Full property description
      "property_images": "string",       // Comma-separated URLs (e.g., "https://exemplo.com/imagem1.jpg")
      "property_video_url": "string",    // YouTube video URL (e.g., "https://www.youtube.com/v/exemplo123")
      "property_files": "string",         // Comma-separated URLs (e.g., "https://exemplo.com/documento1.pdf")
      "property_rooms": number,
      "property_bathrooms": number,
      "property_bedrooms": number,
      "property_garage": number,
      "property_garage_size": number
    }
  ]
}
    </pre>

    <h4>XML Format</h4>
    <p>The XML file should follow this structure:</p>
    <pre>
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;Properties&gt;
  &lt;Row&gt;
    &lt;id&gt;EXAMPLE_001&lt;/id&gt;                           &lt;!-- Property ID --&gt;
    &lt;property_type&gt;Apartamento&lt;/property_type&gt;       &lt;!-- Type of property (e.g., "Apartamento", "Moradia") --&gt;
    &lt;property_status&gt;Disponível&lt;/property_status&gt;    &lt;!-- Status (e.g., "Pronto") --&gt;
    &lt;property_label&gt;Em construção&lt;/property_label&gt;   &lt;!-- Label (e.g., "Em Obras", "Pronto") --&gt;
    &lt;property_area&gt;100&lt;/property_area&gt;              &lt;!-- Useful area in m² --&gt;
    &lt;property_land&gt;120&lt;/property_land&gt;              &lt;!-- Gross area in m² --&gt;
    &lt;property_price&gt;100000&lt;/property_price&gt;         &lt;!-- Price in euros --&gt;
    &lt;property_address&gt;Rua do Exemplo, 123&lt;/property_address&gt;  &lt;!-- Full address --&gt;
    &lt;property_country&gt;Portugal&lt;/property_country&gt;    &lt;!-- Country --&gt;
    &lt;property_district&gt;Exemplo&lt;/property_district&gt;   &lt;!-- District --&gt;
    &lt;property_city&gt;Cidade Exemplo&lt;/property_city&gt;    &lt;!-- City --&gt;
    &lt;property_neighborhood&gt;Bairro Exemplo&lt;/property_neighborhood&gt;  &lt;!-- Neighborhood --&gt;
    &lt;property_zip&gt;12345-678&lt;/property_zip&gt;          &lt;!-- Zip code --&gt;
    &lt;property_title&gt;Apartamento T2 Exemplo&lt;/property_title&gt;  &lt;!-- Property title --&gt;
    &lt;agent&gt;AGENTE EXEMPLO&lt;/agent&gt;                   &lt;!-- Agent name --&gt;
    &lt;property_description&gt;Este é um exemplo de descrição do imóvel...&lt;/property_description&gt;  &lt;!-- Full description --&gt;
    &lt;property_images&gt;https://exemplo.com/imagem1.jpg,https://exemplo.com/imagem2.jpg&lt;/property_images&gt;  &lt;!-- Comma-separated URLs --&gt;
    &lt;property_video_url&gt;https://www.youtube.com/v/exemplo123&lt;/property_video_url&gt;  &lt;!-- YouTube video URL --&gt;
    &lt;property_files&gt;https://exemplo.com/documento1.pdf,https://exemplo.com/documento2.pdf&lt;/property_files&gt;  &lt;!-- Comma-separated URLs --&gt;
    &lt;property_rooms&gt;2&lt;/property_rooms&gt;              &lt;!-- Number of rooms --&gt;
    &lt;property_bathrooms&gt;2&lt;/property_bathrooms&gt;      &lt;!-- Number of bathrooms --&gt;
    &lt;property_bedrooms&gt;2&lt;/property_bedrooms&gt;        &lt;!-- Number of bedrooms --&gt;
    &lt;property_garage&gt;1&lt;/property_garage&gt;            &lt;!-- Number of garage spaces --&gt;
    &lt;property_garage_size&gt;20&lt;/property_garage_size&gt;  &lt;!-- Garage size in m² --&gt;
  &lt;/Row&gt;
&lt;/Properties&gt;
    </pre>

    <h4>Important Notes:</h4>
    <ul>
      <li>All fields are required</li>
      <li>Multiple images should be separated by commas</li>
      <li>Multiple documents should be separated by commas</li>
      <li>Areas should be in square meters (m²)</li>
      <li>Files must be in valid JSON or XML format</li>
      <li>There are some fields that are not provided in the file, they will be ignored</li>
      <li>XML files must use UTF-8 encoding</li>
      <li>XML tags are case-sensitive</li>
    </ul>

    <h4>Fields that need to be registered in the database before importing:</h4>
    <ul>
      <li>Property Type</li>
      <li>Property Status</li>
      <li>Property Label</li>
      <li>Property state</li>
      <li>Property country</li>
      <li>Property city</li>
      <li>Property neighborhood</li>
    </ul>
    <h4>Example Files:</h4>
    <div class="example-buttons">
      <button id="download-example-json" class="btn btn-primary">Download Example JSON</button>
      <button id="download-example-xml" class="btn btn-primary">Download Example XML</button>
    </div>
  </div>

  <div id="ere_gallery_plupload_container" class="media-drag-drop">
    <div class="container">
      <div class="media-drag-drop-icon"><i class="fa fa-file-import"></i></div>
      <h4>
        <?php esc_html_e('Segure e solte o arquivo JSON ou XML aqui ou', 'g5-ere'); ?>
      </h4>
    </div>
    <button type="button" id="ere_select_json_file" class="btn btn-secondary">
      <?php esc_html_e('Selecione o arquivo JSON ou XML', 'g5-ere'); ?>
    </button>
  </div>

  <div class="property-selection">
    <div class="property-selection-buttons">
      <button id="import-all-properties" class="button btn-submit-property">
        Import All Properties
      </button>
      <button id="import-selected-property" class="button btn-submit-property">
        Import Selected Property
      </button>
    </div>

    <button id="hide_properties_selection">Hide Properties Selection</button>
    <div id="properties_selection">
    </div>
  </div>

  <div id="ere_property_form">
    <?php
    G5ERE()->get_template("property/submit-property/title-des.php");
    G5ERE()->get_template("property/submit-property/type.php");
    G5ERE()->get_template("property/submit-property/price.php");
    G5ERE()->get_template("property/submit-property/location.php");
    G5ERE()->get_template("property/submit-property/details.php");
    G5ERE()->get_template("property/submit-property/features.php");
    G5ERE()->get_template("property/submit-property/media.php");
    ?>

    <input
      id="ere_submit_property"
      type="submit"
      name="submit_property"
      class="button btn-submit-property"
      value="<?php esc_attr_e('Import Property', 'g5-ere'); ?>" />
  </div>

</body>

</html>
<?php get_footer(); ?>