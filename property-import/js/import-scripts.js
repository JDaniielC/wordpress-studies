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
}); 