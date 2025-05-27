<?php
/*
Template Name: Import Json Docs
*/

require_once dirname(__FILE__) . '/../includes/import-functions.php';

if (isset($_POST['property_data'])) {
  $property_data = json_decode(stripslashes($_POST['property_data']), true);
  $result = import_property_to_wordpress($property_data);

  if ($result['success']) {
    echo "<script>alert('Property imported successfully! Post ID: " . $result['post_id'] . "');</script>";
  } else {
    echo "<script>alert('Failed to import: " . $result['message'] . "');</script>";
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['preprocess']) && is_array($_POST['preprocess'])) {
  foreach ($_POST['preprocess'] as $property_attribute => $values) {
    $result = insert_missing_taxonomy($property_attribute, $values);

    echo "<script>alert('{$property_attribute}: {$result} added on database');</script>";
  }
}

$property_ids_db = get_all_property_identity_from_database();
$property_city_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_city);
$property_state_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_state);
$property_neighborhood_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_neighborhood);
$property_type_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_type);
$property_status_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_status);
$property_label_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_label);
$property_feature_db = get_all_property_taxonomy_from_database(PropertyTaxonomy::property_feature);
$agents_db = get_all_agents_from_database();

get_header();

global $hide_property_fields;
$hide_property_fields = array(
  'property_price_prefix',
  'property_price_postfix',
  'property_price_on_call',
  'property_price_unit',
  'additional_details'
);
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Import Properties</title>
  
  <link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/templates/property-import/css/import-styles.css">
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
      "property_feature": array/string
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
    &lt;property_feature&gt;
      &lt;feature&gt;Feature 1&lt;/feature&gt;
      &lt;feature&gt;Feature 2&lt;/feature&gt;
      &lt;feature&gt;Feature 3&lt;/feature&gt;
    &lt;/property_feature&gt;
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
      <button id="import-selected-property" class="button btn-submit-property">
        Import Selected Property
      </button>
      <label for="show_only_new_properties" style="display:inline-flex;align-items:center;gap:5px;">
        <input type="checkbox" id="show_only_new_properties" checked />
        Show only new properties
      </label>
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
    // G5ERE()->get_template("property/submit-property/media.php");
    ?> 

    <div id="image_gallery_container">
      <!-- Image gallery will be rendered here by JavaScript -->
    </div>

    <div id="property_agent_selection">
      <label for="property_agent">Select Agent:</label>
      <select id="property_agent">
      </select>
    </div>

    <input
      id="ere_submit_property"
      type="submit"
      name="submit_property"
      class="button btn-submit-property"
      value="<?php esc_attr_e('Import Property', 'g5-ere'); ?>" />
  </div>

  <script type="module" src="<?php echo get_template_directory_uri(); ?>/templates/property-import/js/import-scripts.js"></script>

  <script>
    var propertyIdsDB = <?php echo json_encode(array_map('strval', $property_ids_db)); ?>;
    var propertyStateDB = <?php echo json_encode(array_map('strval', $property_state_db)); ?>;
    var propertyCityDB = <?php echo json_encode(array_map('strval', $property_city_db)); ?>;
    var propertyNeighborhoodDB = <?php echo json_encode(array_map('strval', $property_neighborhood_db)); ?>;
    var propertyTypeDB = <?php echo json_encode(array_map('strval', $property_type_db)); ?>;
    var propertyStatusDB = <?php echo json_encode(array_map('strval', $property_status_db)); ?>;
    var propertyLabelDB = <?php echo json_encode(array_map('strval', $property_label_db)); ?>;
    var propertyFeatureDB = <?php echo json_encode(array_map('strval', $property_feature_db)); ?>;
    var choosedAgent = '';
    var agentsDB = <?php echo json_encode(array_map('strval', $agents_db)); ?>;
  </script> 
</body>
</html>
<?php get_footer(); ?> 