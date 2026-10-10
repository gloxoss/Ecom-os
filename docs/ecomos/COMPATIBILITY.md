# EcomOS Compatibility & Support Matrix

- **Document**: `COMPATIBILITY.md`
- **Application**: EcomOS Cross-Platform Matrix
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Runtime Environment Compatibility

| Component | Supported Versions | Minimum Certified | Status |
| :--- | :--- | :--- | :--- |
| **Node.js** | `22.x`, `24.x+` (LTS) | `22.0.0` | **SUPPORTED** |
| **pnpm** | `11.7.0` | `11.0.0` | **SUPPORTED** |
| **PHP** | `8.1.x`, `8.2.x`, `8.3.x` | `8.1.0` | **SUPPORTED** |
| **WordPress** | `6.4.x` through `6.7.x` | `6.4.0` | **SUPPORTED** |
| **WooCommerce** | `8.5.x` through `9.3.x+` | `8.5.0` | **SUPPORTED (HPOS Mandatory)** |
| **MySQL / MariaDB** | MySQL `8.0+`, MariaDB `10.6+` | `8.0` | **SUPPORTED** |

---

## 2. Browser & Client Device Support

| Browser / Surface | Minimum Supported Version | Accessibility Target |
| :--- | :--- | :--- |
| **Desktop Chrome / Edge** | Current and previous 2 releases | WCAG 2.1 AA / AAA |
| **Desktop Safari** | 16.0+ (macOS) | WCAG 2.1 AA / AAA |
| **Desktop Firefox** | Current ESR and latest stable | WCAG 2.1 AA / AAA |
| **Mobile Safari (iOS)** | iOS 16.0+ | WCAG 2.5.5 Touch Target $\ge 44\text{px}$ |
| **Mobile Chrome (Android)** | Android 12+ | WCAG 2.5.5 Touch Target $\ge 44\text{px}$ |

---

## 3. Unsupported or Quarantined Capabilities

- **Customer User Accounts**: Permanently disabled (`customerAccounts = false`). No login or registration forms are supported.
- **Uncertified Digital Gateways**: Stripe, CMI, and Payzone remain disabled pending merchant certification.
- **Legacy WooCommerce Postmeta Orders**: Unsupported. WooCommerce High-Performance Order Storage (HPOS) is mandatory.
