<?php

/**
 * Funções para importação de propriedades
 */

function import_property_to_wordpress($property_data)
{
  error_log('[IMPORTER] Iniciando importação');

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
    'property_identity' => $property_data['id'],
    'property_agent' => $property_data['agent']
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
    'property-neighborhood' => $property_data['property_neighborhood'],
    'property-feature' => $property_data['property_feature']
  );

  foreach ($taxonomies as $taxonomy => $value) {
    if (!empty($value)) {
      wp_set_object_terms($post_id, $value, $taxonomy);
    }
  }

  if (!empty($property_data['property_images'])) {
    $image_urls_input = $property_data['property_images'];
    $image_urls = array();

    if (is_array($image_urls_input)) {
      $image_urls = $image_urls_input;
    } elseif (is_string($image_urls_input)) {
      $image_urls = explode(',', $image_urls_input);
    } else {
      error_log('property_images não é nem array nem string. Tipo: ' . gettype($image_urls_input));
    }

    $attachment_ids = array();
    $featured_image_set = false;

    // Ensure ABSPATH is defined
    if (!defined('ABSPATH')) {
      define('ABSPATH', dirname(__FILE__) . '/'); // Adjust path as needed if not in root
    }

    foreach ($image_urls as $index => $image_url) {
      $image_url = trim($image_url);
      if (empty($image_url)) {
        error_log('URL da imagem vazia, pulando.');
        continue;
      }

      // Sideload the image
      // Need to require files for media_sideload_image
      if (!function_exists('media_sideload_image')) {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
      }
      
      // Sanitize file name for the image title
      $image_title = sanitize_file_name($property_data['property_title'] . ' - Image ' . ($index + 1));
      $image_id = media_sideload_image($image_url, $post_id, $image_title, 'id');

      if (!is_wp_error($image_id)) {
        $attachment_ids[] = $image_id;
        if (!$featured_image_set) {
          set_post_thumbnail($post_id, $image_id);
          $featured_image_set = true;
        }
      } else {
        error_log('Erro ao fazer sideload da imagem ' . $image_url . ': ' . $image_id->get_error_message());
      }
    }

    // Store all attachment IDs for gallery or other uses
    if (!empty($attachment_ids)) {
      update_post_meta($post_id, ERE_METABOX_PREFIX . 'property_images', implode('|', $attachment_ids));
    } else {
      // If all images failed to import, clear the meta field
      delete_post_meta($post_id, ERE_METABOX_PREFIX . 'property_images');
    }
  } else {
    // Clear the meta field if no images are provided in the input data
    delete_post_meta($post_id, ERE_METABOX_PREFIX . 'property_images');
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
  case property_feature;
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
 * insert missing taxonomy
 * 
 * @param string $property_taxonomy taxonomy name
 * @param array $data array of strings containing the terms names
 * @return int quantity of terms created
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
 * Get all agents from database
 * 
 * @return array
 */
function get_all_agents_from_database()
{
  global $wpdb;
  $ids = $wpdb->get_col("
      SELECT ID
      FROM $wpdb->posts 
      WHERE post_type = 'agent' 
      AND post_status = 'publish'
  ");

  $names = $wpdb->get_col("
      SELECT post_title
      FROM $wpdb->posts 
      WHERE ID IN (" . implode(',', $ids) . ")
  ");

  return array_combine($ids, $names);
}

// AJAX handler for batch property import
add_action('wp_ajax_batch_import_property', 'batch_import_property_ajax_handler');

function batch_import_property_ajax_handler() {
  // Check for nonce security
  check_ajax_referer('batch_import_nonce', 'security');

  if (isset($_POST['property_data'])) {
    $property_data_json = stripslashes($_POST['property_data']);
    error_log('[BATCH IMPORTER] Received property_data JSON: ' . $property_data_json);
    
    $property_data = json_decode($property_data_json, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
      error_log('[BATCH IMPORTER] JSON Decode Error: ' . json_last_error_msg());
      wp_send_json_error(array('message' => 'Invalid JSON data received: ' . json_last_error_msg()));
      return;
    }

    error_log('[BATCH IMPORTER] Decoded property_data: ' . print_r($property_data, true));
    $result = import_property_to_wordpress($property_data);

    if ($result['success']) {
      wp_send_json_success(array('post_id' => $result['post_id'], 'message' => $result['message']));
    } else {
      wp_send_json_error(array('message' => $result['message']));
    }
  } else {
    wp_send_json_error(array('message' => 'No property data received.'));
  }

  wp_die(); // this is required to terminate immediately and return a proper response
}