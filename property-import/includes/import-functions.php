<?php
/**
 * Funções para importação de propriedades
 */

function import_property_to_wordpress($property_data) {
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