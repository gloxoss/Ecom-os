<?php
/**
 * EcomOS RFQ Transactional Notifications & Deduplicating Mail Dispatcher
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

// Mail sink for test environments
global $ecomos_rfq_test_mail_sink;
$ecomos_rfq_test_mail_sink = array();

/**
 * Reset test mail sink.
 */
function ecomos_rfq_reset_mail_sink() {
    global $ecomos_rfq_test_mail_sink;
    $ecomos_rfq_test_mail_sink = array();
}

/**
 * Retrieve messages captured in the mail sink.
 *
 * @return array Captured emails.
 */
function ecomos_rfq_get_mail_sink() {
    global $ecomos_rfq_test_mail_sink;
    return is_array($ecomos_rfq_test_mail_sink) ? $ecomos_rfq_test_mail_sink : array();
}

/**
 * Check if a notification for an event has already been sent to prevent duplicates.
 *
 * @param string $idempotency_key Unique event identifier.
 * @return bool True if already sent, false otherwise.
 */
function ecomos_rfq_is_notification_dispatched($idempotency_key) {
    if (function_exists('get_option')) {
        $sent = get_option('ecomos_rfq_notif_' . $idempotency_key, false);
        return !empty($sent);
    }
    return false;
}

/**
 * Mark a notification as sent to guarantee at-most-once delivery.
 *
 * @param string $idempotency_key Unique event identifier.
 */
function ecomos_rfq_mark_notification_dispatched($idempotency_key) {
    if (function_exists('update_option')) {
        update_option('ecomos_rfq_notif_' . $idempotency_key, time(), false);
    }
}

/**
 * Dispatch an email with idempotency and HTML sanitization.
 *
 * @param string $idempotency_key Deduplication key.
 * @param string $to Recipient email.
 * @param string $subject Email subject.
 * @param string $message Safe message content.
 * @param array $headers Optional headers.
 * @return bool True if dispatched, false if duplicate or failed.
 */
function ecomos_rfq_send_email($idempotency_key, $to, $subject, $message, $headers = array()) {
    global $ecomos_rfq_test_mail_sink;

    if (ecomos_rfq_is_notification_dispatched($idempotency_key)) {
        return false; // Duplicate suppressed
    }

    $sanitized_to = sanitize_email($to);
    $sanitized_subject = sanitize_text_field($subject);

    if (empty($sanitized_to)) {
        return false;
    }

    $mail_record = array(
        'key'        => $idempotency_key,
        'to'         => $sanitized_to,
        'subject'    => $sanitized_subject,
        'message'    => $message,
        'headers'    => $headers,
        'dispatched' => time(),
    );

    // Record in memory sink
    if (!is_array($ecomos_rfq_test_mail_sink)) {
        $ecomos_rfq_test_mail_sink = array();
    }
    $ecomos_rfq_test_mail_sink[] = $mail_record;

    // Dispatch through wp_mail if function exists
    $result = true;
    if (function_exists('wp_mail')) {
        $result = wp_mail($sanitized_to, $sanitized_subject, $message, $headers);
    }

    if ($result) {
        ecomos_rfq_mark_notification_dispatched($idempotency_key);
    }

    return $result;
}

/**
 * Send notification when staff creates/revises an offer.
 *
 * @param array $quote Quote record.
 * @param array $revision Offer revision.
 * @return bool Dispatched status.
 */
function ecomos_rfq_notify_offer_created($quote, $revision) {
    $quote_id = $quote['id'];
    $rev_id = $revision['revision_id'] ?? 'rev_1';
    $idempotency_key = 'offer_created_' . $quote_id . '_' . $rev_id;

    $subject = sprintf('Votre devis %s est prêt - EcomOS', $quote['quote_number']);
    $total = number_format((float) ($revision['total_incl_tax'] ?? 0.0), 2, '.', ' ');
    $currency = $revision['currency'] ?? 'MAD';
    $expires = substr($revision['expires_at'] ?? '', 0, 10);

    $body = sprintf(
        "Bonjour %s,\n\nUne nouvelle offre chiffrée (révision %s) a été préparée pour votre demande de devis %s.\n\nMontant Total TTC : %s %s\nDate de validité : %s\n\nVous pouvez consulter, accepter ou demander une révision directement depuis votre espace devis.\n\nCordialement,\nL'équipe commerciale",
        esc_html($quote['customer_name']),
        esc_html($revision['revision_number'] ?? '1'),
        esc_html($quote['quote_number']),
        esc_html($total),
        esc_html($currency),
        esc_html($expires)
    );

    return ecomos_rfq_send_email($idempotency_key, $quote['customer_email'], $subject, $body);
}

/**
 * Send notification when customer accepts an offer.
 *
 * @param array $quote Quote record.
 * @return bool Dispatched status.
 */
function ecomos_rfq_notify_offer_accepted($quote) {
    $quote_id = $quote['id'];
    $idempotency_key = 'offer_accepted_' . $quote_id;

    $admin_email = function_exists('get_option') ? get_option('admin_email', 'sales@paraloca.ma') : 'sales@paraloca.ma';
    $subject = sprintf('Devis %s ACCEPTÉ par le client', $quote['quote_number']);

    $body = sprintf(
        "Le client %s (%s) a formellement accepté le devis %s.\n\nLe dossier est prêt pour la conversion en commande WooCommerce et l'affectation logistique.",
        esc_html($quote['customer_name']),
        esc_html($quote['customer_email']),
        esc_html($quote['quote_number'])
    );

    return ecomos_rfq_send_email($idempotency_key, $admin_email, $subject, $body);
}

/**
 * Send notification when quote is rejected or declined.
 *
 * @param array $quote Quote record.
 * @param string $reason Reason given.
 * @return bool Dispatched status.
 */
function ecomos_rfq_notify_offer_rejected($quote, $reason = '') {
    $quote_id = $quote['id'];
    $idempotency_key = 'offer_rejected_' . $quote_id;

    $admin_email = function_exists('get_option') ? get_option('admin_email', 'sales@paraloca.ma') : 'sales@paraloca.ma';
    $subject = sprintf('Devis %s décliné', $quote['quote_number']);

    $body = sprintf(
        "Le devis %s a été décliné.\nMotif : %s",
        esc_html($quote['quote_number']),
        esc_html($reason ?: 'Aucun motif renseigné')
    );

    return ecomos_rfq_send_email($idempotency_key, $admin_email, $subject, $body);
}
