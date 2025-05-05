<?php

/**
 * Funções para importação de propriedades
 */

function import_property_to_wordpress($property_data)
{
  error_log('Iniciando importação de propriedade: ');

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
      update_post_meta($post_id, ERE_METABOX_PREFIX . $key, $value);
    }
  }

  // Handle location coordinates if provided
  if (isset($property_data['lat']) && isset($property_data['lng'])) {
    $location = array(
      'location' => $property_data['lat'] . ',' . $property_data['lng'],
      'address' => $property_data['property_address']
    );
    update_post_meta($post_id, ERE_METABOX_PREFIX . 'property_location', $location);
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
      wp_set_object_terms($post_id, $value, $taxonomy);
    }
  }

  // Handle featured image if images are provided
  if (!empty($property_data['property_images'])) {
    $images = explode(',', $property_data['property_images']);
    if (!empty($images[0])) {
      // Set the first image as featured image
      $featured_image_id = ere_get_attachment_id($images[0]);
      if ($featured_image_id) {
        set_post_thumbnail($post_id, $featured_image_id);
      }
    }
  }

  return array(
    'success' => true,
    'post_id' => $post_id,
    'message' => 'Property imported successfully'
  );
}

/**
 * Get all property_identity from database
 * 
 * @return array
 */
function get_all_property_identity_from_database()
{
  global $wpdb;
  return $wpdb->get_col("
      SELECT meta_value
      FROM $wpdb->postmeta
      WHERE meta_key = 'real_estate_property_identity'
  ");
}


enum PropertyTaxonomy
{
  case property_city;
  case property_state;
  case property_neighborhood;
  case property_status;
  case property_type;
  case property_label;
}

/**
 * Get all property_attribute from database
 * 
 * @param PropertyTaxonomy $property_taxonomy
 * @return array
 */
function get_all_property_taxonomy_from_database($property_taxonomy)
{
  global $wpdb;
  if (is_object($property_taxonomy) && property_exists($property_taxonomy, 'name')) {
    $property_taxonomy = $property_taxonomy->name;
    $property_taxonomy = str_replace('_', '-', $property_taxonomy);
  }

  return $wpdb->get_col("
      SELECT t.name
      FROM {$wpdb->terms} t
      INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id
      WHERE tt.taxonomy = '$property_taxonomy'
  ");
}

/**
 * Insere termos ausentes em uma taxonomia
 * 
 * @param string $property_taxonomy Nome da taxonomia
 * @param array $data Array de strings contendo os nomes dos termos criados
 * @return int Quantidade de termos criados
 */
function insert_missing_taxonomy($property_taxonomy, $data)
{
  $terms = array();
  $property_taxonomy = str_replace('_', '-', $property_taxonomy);
  foreach ($data as $term_name) {
    $term = term_exists($term_name, $property_taxonomy);

    if (!$term) {
      $slug = str_replace(' ', '-', $term_name);
      $slug = strtolower($slug);
      $slug = preg_replace('/[^a-z0-9-]/', '', $slug);
      $term = wp_insert_term($term_name, $property_taxonomy, array('slug' => $slug));
      $terms[] = $term;
    }
  }

  return count($terms);
}

/**
 * Register an external image in the WordPress database
 * 
 * @param string $image_url The URL of the image
 * @param string $image_title The title of the image
 * @return void
 */
function register_external_image($image_url, $image_title)
{
  if (empty($image_url) || empty($image_title)) {
    return;
  }

  $attachment = array(
    'post_title'     => $image_title,
    'post_content'   => '',
    'post_status'    => 'inherit',
    'post_mime_type' => 'image/jpeg',
    'post_type'      => 'attachment',
    'guid'           => $image_url,
  );

  $attach_id = wp_insert_post($attachment);

  if (is_wp_error($attach_id)) {
    echo 'Erro ao criar attachment: ' . $attach_id->get_error_message();
    return;
  }

  update_post_meta($attach_id, '_wp_attached_file', basename(parse_url($image_url, PHP_URL_PATH)));

  update_post_meta($attach_id, '_wp_attachment_metadata', array(
    'width'  => 1200,
    'height' => 800,
    'file'   => basename(parse_url($image_url, PHP_URL_PATH)),
    'sizes'  => array(),
    'image_meta' => array(),
  ));

  echo "Imagem externa registrada com ID: $attach_id";
}
