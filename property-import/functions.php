<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

define( 'HOMEID_VERSION', '1.1.5' );
define( 'HOMEID_FILE_HANDLER', basename( get_template_directory() ) . '-' );

/**
 * Inlcude theme functions
 */
require_once get_template_directory() . '/templates/property-import/includes/import-functions.php';
include_once get_parent_theme_file_path( 'inc/require-plugin.php' );
include_once get_parent_theme_file_path( 'inc/breadcrumbs.php' );
include_once get_parent_theme_file_path( 'inc/core-functions.php' );
include_once get_parent_theme_file_path( 'inc/template-functions.php' );
include_once get_parent_theme_file_path( 'inc/template-tags.php' );
include_once get_parent_theme_file_path( 'inc/customizer.php' );
include_once get_parent_theme_file_path( 'inc/setup-data.php' );
include_once get_parent_theme_file_path( 'inc/core.php' );
include_once get_parent_theme_file_path('inc/elementor.php');
include_once get_parent_theme_file_path( 'inc/custom-css.php' );

