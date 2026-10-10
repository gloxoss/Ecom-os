<?php
/**
 * EcomOS RFQ Quotation Document (HTML/PDF) Generator & Access Protection
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Verify access permission to view or download a quotation document.
 *
 * @param array $quote Quote record from repository.
 * @param string $provided_token Access secret provided by guest.
 * @param WP_User|null $user Current authenticated user.
 * @return true|WP_Error True if authorized, WP_Error otherwise.
 */
function ecomos_rfq_verify_document_access($quote, $provided_token = '', $user = null) {
    if (empty($quote)) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    // 1. Staff permission check
    if ($user instanceof WP_User && ($user->has_cap('ecomos_operator') || $user->has_cap('manage_woocommerce'))) {
        return true;
    }
    if (function_exists('current_user_can') && (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce'))) {
        return true;
    }

    // 2. Guest HMAC access verification
    if (empty($provided_token) || !ecomos_rfq_verify_guest_access($quote, $provided_token)) {
        return new WP_Error('forbidden', 'Access denied: valid guest access token required to view quote document', array('status' => 403));
    }

    return true;
}

/**
 * Generate safe, sanitized HTML quotation document ready for display or PDF conversion.
 * Strictly sanitizes all input fields to prevent injection.
 *
 * @param array $quote Quote data.
 * @param array|null $revision Specific revision to render (defaults to current revision).
 * @return string Safe HTML document string.
 */
function ecomos_rfq_generate_document_html($quote, $revision = null) {
    if ($revision === null) {
        $revisions = isset($quote['revisions']) ? $quote['revisions'] : array();
        foreach ($revisions as $rev) {
            if (!empty($rev['is_current'])) {
                $revision = $rev;
                break;
            }
        }
        if (!$revision && !empty($revisions)) {
            $revision = end($revisions);
        }
    }

    $quote_num = htmlspecialchars($quote['quote_number'] ?? 'DEV-N/A', ENT_QUOTES, 'UTF-8');
    $created_at = htmlspecialchars(substr($quote['created_at'] ?? '', 0, 10), ENT_QUOTES, 'UTF-8');
    $expires_at = htmlspecialchars(substr($quote['expires_at'] ?? 'Non spécifiée', 0, 10), ENT_QUOTES, 'UTF-8');
    $customer_name = htmlspecialchars($quote['customer_name'] ?? 'Client', ENT_QUOTES, 'UTF-8');
    $customer_email = htmlspecialchars($quote['customer_email'] ?? '', ENT_QUOTES, 'UTF-8');
    $company_name = htmlspecialchars($quote['company_name'] ?? '', ENT_QUOTES, 'UTF-8');
    $tax_id = htmlspecialchars($quote['tax_id'] ?? '', ENT_QUOTES, 'UTF-8');
    $state = htmlspecialchars(strtoupper($quote['state'] ?? 'SUBMITTED'), ENT_QUOTES, 'UTF-8');
    $currency = htmlspecialchars($revision['currency'] ?? 'MAD', ENT_QUOTES, 'UTF-8');

    $lines = isset($revision['lines']) ? $revision['lines'] : array();
    $subtotal = number_format((float) ($revision['subtotal_excl_tax'] ?? 0.0), 2, '.', ' ');
    $tax = number_format((float) ($revision['total_tax'] ?? 0.0), 2, '.', ' ');
    $total = number_format((float) ($revision['total_incl_tax'] ?? 0.0), 2, '.', ' ');
    $terms = htmlspecialchars($revision['terms'] ?? 'Paiement à la livraison ou virement bancaire sous réserve de confirmation.', ENT_QUOTES, 'UTF-8');

    $lines_html = '';
    foreach ($lines as $line) {
        $title = htmlspecialchars($line['title'] ?? 'Article', ENT_QUOTES, 'UTF-8');
        $sku = htmlspecialchars($line['sku'] ?? '-', ENT_QUOTES, 'UTF-8');
        $qty = (int) ($line['quantity'] ?? 1);
        $unit_price = number_format((float) ($line['unitPriceExclTax'] ?? 0.0), 2, '.', ' ');
        $line_tax_pct = ((float) ($line['taxRate'] ?? 0.20)) * 100;
        $line_total = number_format((float) ($line['totalInclTax'] ?? 0.0), 2, '.', ' ');

        $lines_html .= '<tr>'
            . '<td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>' . $title . '</strong><br><small style="color: #6b7280;">SKU: ' . $sku . '</small></td>'
            . '<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">' . $qty . '</td>'
            . '<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">' . $unit_price . ' ' . $currency . '</td>'
            . '<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">' . $line_tax_pct . '%</td>'
            . '<td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">' . $line_total . ' ' . $currency . '</td>'
            . '</tr>';
    }

    return '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Devis ' . $quote_num . '</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: bold; margin: 0; }
        .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; background: #f3f4f6; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f9fafb; padding: 10px; text-align: left; font-size: 13px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
        .totals { margin-left: auto; width: 300px; margin-bottom: 30px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .total-final { font-size: 18px; font-weight: bold; border-top: 2px solid #111827; padding-top: 10px; }
        .notice { font-size: 12px; color: #6b7280; border-left: 3px solid #9ca3af; padding-left: 10px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="title">DEVIS / PROFORMA</h1>
            <p style="margin: 5px 0 0; color: #4b5563;">Référence : ' . $quote_num . '</p>
        </div>
        <div style="text-align: right;">
            <span class="badge">STATUT : ' . $state . '</span>
            <p style="margin: 5px 0 0; font-size: 13px; color: #6b7280;">Date d\'émission : ' . $created_at . '<br>Échéance de validité : ' . $expires_at . '</p>
        </div>
    </div>

    <div class="info-grid">
        <div>
            <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #6b7280;">Émetteur</h3>
            <strong>EcomOS Platform</strong><br>
            Services Commerciaux & Devis<br>
            contact@paraloca.ma
        </div>
        <div>
            <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #6b7280;">Destinataire</h3>
            <strong>' . $customer_name . '</strong>' . ($company_name ? '<br>' . $company_name : '') . '<br>
            ' . $customer_email . ($tax_id ? '<br>Identifiant fiscal / ICE : ' . $tax_id : '') . '
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Désignation</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: right;">P.U. HT</th>
                <th style="text-align: center;">TVA</th>
                <th style="text-align: right;">Total TTC</th>
            </tr>
        </thead>
        <tbody>
            ' . $lines_html . '
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row">
            <span>Sous-total HT :</span>
            <span>' . $subtotal . ' ' . $currency . '</span>
        </div>
        <div class="totals-row">
            <span>Total TVA :</span>
            <span>' . $tax . ' ' . $currency . '</span>
        </div>
        <div class="totals-row total-final">
            <span>Total TTC :</span>
            <span>' . $total . ' ' . $currency . '</span>
        </div>
    </div>

    <div class="notice">
        <strong>Conditions :</strong> ' . $terms . '<br>
        <em>Ce devis constitue une offre de prix ferme jusqu\'à sa date d\'expiration. Conformément à la politique d\'intégrité des stocks, l\'émission du devis ne réserve aucun inventaire physique avant validation formelle et conversion en commande.</em>
    </div>
</body>
</html>';
}
