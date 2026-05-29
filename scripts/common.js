export const API_BASE = '';
export const FREE_SHIPPING_THRESHOLD_CENTS = 35000;
export const STANDARD_SHIPPING_FEE_CENTS = 1900;
const AUTH_STORAGE_KEY = 'nimbus_customer_auth_v1';
const ADMIN_STORAGE_KEY = 'admin_token';
const CART_STORAGE_PREFIX = 'nimbus-athletica-cart-v2';
const CART_UPDATED_EVENT = 'cart:updated';
const CART_BADGE_SELECTOR = '.cart-count';
const CART_OVERLAY_ID = 'cart-overlay';
const CART_DRAWER_ID = 'cart-drawer';
const MOBILE_MENU_OVERLAY_ID = 'mobile-menu-overlay';
const MOBILE_MENU_PANEL_ID = 'mobile-menu-panel';
const AUTH_GATE_OVERLAY_ID = 'auth-gate-overlay';
const AUTH_GATE_MODAL_ID = 'auth-gate-modal';
const FR_SWITCH_OVERLAY_ID = 'fr-switch-overlay';
const FR_SWITCH_MODAL_ID = 'fr-switch-modal';
const LOCALE_STORAGE_KEY = 'nimbus_locale_v1';

const I18N = {
  en: {
    locale_code: 'EN',
    header_log_in: 'Log In',
    header_sign_up: 'Sign Up',
    header_logout: 'Logout',
    header_contact_us: 'Contact Us',
    header_cart: 'Cart',
    header_home: 'Home',
    header_hi: 'My Account',
    header_main_categories: 'Main categories',
    header_mobile_categories: 'Mobile categories',
    header_open_menu: 'Open menu',
    header_close_menu: 'Close menu',
    close_modal: 'Close dialog',
    fr_switch_notice_title: 'Passer au français',
    fr_switch_notice_message: 'Le passage en français peut prendre jusqu’à 30 secondes. Merci de patienter.',
    confirm_button: 'Confirmer',
    locale_fixed: 'CA (CAD) |',
    auth_gate_title: 'Log in required',
    auth_gate_message: 'Please log in or sign up before adding items to your cart.',
    auth_gate_close: 'Close login required dialog',
    cart_drawer_close: 'Close cart',
    cart_empty_title: 'Your cart is empty',
    cart_empty_desc: 'Add products to start checkout.',
    cart_shop_all: 'Shop All',
    shop_on_sale: 'Shop On Sale',
    cart_each: 'each',
    cart_remove: 'Remove',
    cart_subtotal: 'Subtotal',
    subtotal: 'Subtotal',
    estimated_tax: 'Estimated Tax',
    shipping_fee: 'Shipping fee',
    free_shipping: 'Free shipping',
    shipping_fee_applied: 'CA$19 shipping applies under CA$350',
    shipping_free_threshold: 'Free shipping on CA$350+',
    square_fee_label: 'Square fee (3%)',
    estimated_total: 'Estimated Total',
    cart_clear: 'Clear Cart',
    cart_checkout: 'Checkout',
    select_for_checkout: 'Select',
    checkout_selected_subtotal: 'Selected subtotal',
    checkout_none_selected: 'Please select at least one active item to checkout.',
    product_discontinued: 'This product has been discontinued',
    checkout_blocked_discontinued: 'Checkout blocked: remove discontinued item(s) first.',
    close_menu: 'Close menu',
    close_cart: 'Close cart',
    uncategorized: 'Uncategorized',
    stock: 'Stock',
    sold_out: 'Sold Out',
    shop_all_kicker: 'SHOP ALL',
    all_products: 'All Products',
    products_available: '{count} product(s) available.',
    sort: 'Sort',
    newest: 'Newest',
    price_low_high: 'Price: Low to High',
    price_high_low: 'Price: High to Low',
    apply: 'Apply',
    search: 'Search',
    cancel: 'Cancel',
    category_kicker: 'CATEGORY',
    category_not_found: 'Category not found',
    back_home: 'Back to home',
    member_access_banner: 'Free shipping on CA$350+ and early drops this week.',
    just_landed: 'JUST LANDED',
    shop_featured: 'Shop Featured',
    shop_new: 'Shop New',
    new_collection: 'New Collection',
    shop_by_category: 'SHOP BY CATEGORY',
    move_every_moment: 'Move Through Every Moment',
    trending_now: 'TRENDING NOW',
    built_to_perform: 'Built to perform. Designed to stand out.',
    training_edit: 'TRAINING EDIT',
    street_essentials: 'STREET ESSENTIALS',
    shop_now: 'Shop Now',
    product_not_found: 'Product not found',
    product: 'Product',
    colors: 'Colors',
    sizes: 'Sizes',
    standard: 'Standard',
    one_size: 'One Size',
    selected_variant: 'Selected: {color} / {size} - Stock {stock}',
    add_to_cart: 'Add to cart',
    sold_out_variant: 'Sold out for selected variant',
    added_to_cart: 'Added {color} / {size} to cart',
    my_orders: 'My Orders',
    purchases_listed: 'All of your purchases are listed below.',
    my_account: 'My Account',
    first_name: 'First Name',
    last_name: 'Last Name',
    phone: 'Phone',
    country: 'Country',
    address_line_1: 'Address Line 1',
    address_line_2: 'Address Line 2',
    address_line_2_optional: 'Address Line 2 (Optional)',
    city: 'City',
    province_state: 'Province / State',
    postal_code: 'Postal Code',
    save_profile: 'Save Profile',
    loading_orders: 'Loading orders...',
    failed_load_orders: 'Failed to load orders',
    profile_saved: 'Profile saved successfully.',
    failed_save_profile: 'Failed to save profile',
    login_manage_profile: 'Log in to manage your address profile',
    go_to_login: 'Go to Log In',
    please_login_view_orders: 'Please log in to view your orders.',
    no_orders_found: 'No orders found.',
    total: 'Total',
    tracking_number_missing: 'Tracking number: not provided',
    tracking_number: 'Tracking number: {number}',
    preparing_shipping: 'Preparing for shipping',
    order_summary: 'Order Summary',
    shipping: 'Shipping',
    calculated_checkout: 'Calculated at checkout',
    proceed_checkout: 'Proceed to Checkout',
    continue_shopping: 'Continue shopping',
    start_shopping: 'Start Shopping',
    browse_add_continue: 'Browse products and add your favorite variants to continue.',
    cart_items: 'Cart Items',
    unit_price: 'Unit price',
    finalizing_payment: 'Finalizing your payment',
    verify_payment_wait: 'Please wait while we verify payment with Square.',
    verify_etransfer_wait: 'Please wait while we verify your Interac e-Transfer.',
    checking_payment_status: 'Checking latest payment status...',
    payment_confirmed_order: 'Payment confirmed. Order {orderNumber} has been created.',
    view_my_orders: 'View My Orders',
    continue_shopping_caps: 'Continue Shopping',
    payment_pending_release: 'Payment pending. Reserved stock will auto-release in {remain}.',
    continue_payment_page: 'Continue to payment page',
    cancel_payment_release: 'Cancel payment and release stock',
    failed_cancel_payment_session: 'Failed to cancel payment session',
    payment_session_done: 'Payment session {label}. Reserved stock has been released.',
    back_to_cart: 'Back to Cart',
    current_session_status: 'Current session status: {status}',
    failed_check_payment_status: 'Failed to check payment status',
    cart_empty: 'Your cart is empty',
    browse_products: 'Browse Products',
    shipping_details: 'Shipping Details',
    stock_reserved_15min: 'Your stock is reserved for 15 minutes after continuing to payment.',
    payment_method: 'Payment Method',
    pay_with_square: 'Pay with Square (card, Apple Pay, Google Pay)',
    pay_with_etransfer: 'Pay with Interac e-Transfer (Autodeposit)',
    preferred_method: 'Preferred method',
    payment_method_hint: 'Choose one method. Your order is created only after payment is confirmed.',
    square_fee_title: 'Square processing fee',
    square_fee_message: 'Square payments include an additional 3% processing fee. Continue?',
    continue_button: 'Continue',
    return_button: 'Return',
    continue_secure_payment: 'Continue to secure payment',
    creating_secure_payment: 'Creating secure payment...',
    payment_link_unavailable: 'Payment link not available. Please try again.',
    etransfer_waiting_match: 'Waiting for e-transfer confirmation. Reserved stock will auto-release in {remain}.',
    etransfer_send_to: 'Please send your e-transfer to: {email}',
    etransfer_send_to_bold: 'Please send your e-transfer to: {email}',
    etransfer_send_prompt: 'Please send your e-transfer to the merchant receiver email.',
    etransfer_exact_payable_amount: 'Send exact amount: {amount}',
    etransfer_exact_amount: 'Important: send the exact checkout amount so we can match your payment automatically.',
    etransfer_monitor_not_ready: 'E-transfer auto-monitor is not configured yet. Please contact support before using this method.',
    etransfer_screenshot_tip: 'Please keep a screenshot of your e-transfer confirmation on your phone.',
    shipping_details_missing_title: 'Shipping profile required',
    shipping_details_missing_desc: 'Please complete your real shipping address in Account before choosing payment.',
    go_to_account_profile: 'Go to Account',
    register_real_address_note:
      'Address will be used for shipping. Please provide a real address, otherwise your package may not arrive.',
    tax_info_title: 'Estimated sales tax reference',
    tax_info_subline_canada: 'For Canada, federal and provincial components are shown separately where applicable.',
    tax_info_subline_non_canada: 'For non-Canada addresses, taxes vary by jurisdiction and are confirmed at checkout.',
    tax_federal: 'Federal tax',
    tax_provincial: 'Provincial / State tax',
    tax_combined: 'Combined tax',
    tax_varies: 'Varies',
    tax_non_canada_note:
      'Please verify the final applicable tax with your local tax authority for your exact shipping address.',
    tax_sources_title: 'Official references',
    checkout_api_404: 'Checkout API not found (404). Please make sure this site is opened from http://localhost:4000 and restart backend with `npm start`.',
    failed_continue_payment: 'Failed to continue to payment',
    login_required: 'Log in required',
    login_before_checkout: 'Please log in before checkout.',
    contact_us: 'CONTACT US',
    reply_24h: 'We will reply within 24 hours.',
    call_us: 'Call us:',
    logged_in_as: 'Logged in as {email}',
    login_to_leave_message: 'Please log in to leave us a message so we can identify your account details.',
    leave_message: 'Leave us a message',
    message_placeholder: 'Tell us how we can help...',
    send_message: 'Send Message',
    sending: 'Sending...',
    message_sent_success: 'Message sent successfully. We will reply within 24 hours.',
    failed_send_message: 'Failed to send message'
    ,
    email: 'Email',
    password: 'Password',
    confirm_password: 'Confirm Password',
    password_mismatch: 'Passwords do not match.',
    forgot_password: 'Forgot password?',
    new_here: 'New here?',
    login_failed: 'Login failed',
    login_to_continue: 'Log in to continue',
    create_account: 'Create your account',
    terms_agree: 'I agree to the Terms & Conditions and privacy policy.',
    already_have_account: 'Already have an account?',
    registration_failed: 'Registration failed',
    reset_password: 'Reset Password',
    verify_email_phone_postal: 'Verify with email + phone + postal code.',
    new_password: 'New Password',
    back_to_login: 'Back to Log In',
    password_reset_success: 'Password reset successful. You can log in now.',
    password_reset_failed: 'Password reset failed',
    customer_account: 'CUSTOMER ACCOUNT',
    account_security: 'ACCOUNT SECURITY',
    registration_verify_email: 'Registration successful. Please verify your email before logging in.',
    email_not_verified: 'Please verify your email before logging in.',
    resend_verification: 'Resend verification email',
    enter_email_for_resend: 'Please enter your email first.',
    resend_verification_sent: 'If this email exists, a verification email was sent.',
    resend_verification_failed: 'Failed to resend verification email.',
    verify_email: 'Email Verification',
    verify_email_missing_title: 'Invalid verification link',
    verify_email_missing_message: 'This link is missing a token.',
    verify_email_missing_error: 'Please request a new verification email from the login page.',
    verify_email_success_title: 'Email verified successfully',
    verify_email_success_message: 'Your account is now active. You can log in.',
    verify_email_success_alert: 'Verification complete.',
    verify_email_sent_title: 'Please verify your email',
    verify_email_sent_message: 'We sent a verification email. Please open your inbox and click the verification link before logging in.',
    verify_email_failed_title: 'Verification failed',
    verify_email_failed_message: 'Your verification link is invalid or expired.',
    verify_email_failed_error: 'Please request a new verification email.',
    account_suspended: 'This account has been suspended or is not valid.'
  },
  fr: {
    locale_code: 'FR',
    header_log_in: 'Se connecter',
    header_sign_up: "S'inscrire",
    header_logout: 'Se déconnecter',
    header_contact_us: 'Contactez-nous',
    header_cart: 'Panier',
    header_home: 'Accueil',
    header_hi: 'Mon compte',
    header_main_categories: 'Catégories principales',
    header_mobile_categories: 'Catégories mobiles',
    header_open_menu: 'Ouvrir le menu',
    header_close_menu: 'Fermer le menu',
    close_modal: 'Fermer la fenêtre',
    fr_switch_notice_title: 'Passer au français',
    fr_switch_notice_message: 'Le passage en français peut prendre jusqu’à 30 secondes. Merci de patienter.',
    confirm_button: 'Confirmer',
    locale_fixed: 'CA (CAD) |',
    auth_gate_title: 'Connexion requise',
    auth_gate_message: "Veuillez vous connecter ou vous inscrire avant d'ajouter des articles au panier.",
    auth_gate_close: 'Fermer la fenêtre de connexion',
    cart_drawer_close: 'Fermer le panier',
    cart_empty_title: 'Votre panier est vide',
    cart_empty_desc: "Ajoutez des produits pour commencer le paiement.",
    cart_shop_all: 'Tout magasiner',
    shop_on_sale: 'Magasiner en solde',
    cart_each: 'chacun',
    cart_remove: 'Retirer',
    cart_subtotal: 'Sous-total',
    subtotal: 'Sous-total',
    estimated_tax: 'Taxe estimée',
    shipping_fee: 'Frais de livraison',
    free_shipping: 'Livraison gratuite',
    shipping_fee_applied: 'Frais de livraison de 19 $CA sous 350 $CA',
    shipping_free_threshold: 'Livraison gratuite à partir de 350 $CA',
    square_fee_label: 'Frais Square (3 %)',
    estimated_total: 'Total estimé',
    cart_clear: 'Vider le panier',
    cart_checkout: 'Paiement',
    select_for_checkout: 'Sélectionner',
    checkout_selected_subtotal: 'Sous-total sélectionné',
    checkout_none_selected: 'Veuillez sélectionner au moins un article actif pour le paiement.',
    product_discontinued: 'Ce produit est retiré de la vente',
    checkout_blocked_discontinued: "Paiement bloqué : retirez d'abord les articles retirés.",
    close_menu: 'Fermer le menu',
    close_cart: 'Fermer le panier',
    uncategorized: 'Non classé',
    stock: 'Stock',
    sold_out: 'Épuisé',
    shop_all_kicker: 'TOUT MAGASINER',
    all_products: 'Tous les produits',
    products_available: '{count} produit(s) disponible(s).',
    sort: 'Trier',
    newest: 'Plus récent',
    price_low_high: 'Prix : croissant',
    price_high_low: 'Prix : décroissant',
    apply: 'Appliquer',
    search: 'Rechercher',
    cancel: 'Annuler',
    category_kicker: 'CATÉGORIE',
    category_not_found: 'Catégorie introuvable',
    back_home: "Retour à l'accueil",
    member_access_banner: 'Livraison gratuite dès 350 $CA et nouveautés anticipées cette semaine.',
    just_landed: "NOUVEAUTÉS",
    shop_featured: "Magasiner l'article vedette",
    shop_new: 'Magasiner les nouveautés',
    new_collection: 'Nouvelle collection',
    shop_by_category: 'MAGASINER PAR CATÉGORIE',
    move_every_moment: 'Bougez à chaque instant',
    trending_now: 'TENDANCES',
    built_to_perform: 'Conçu pour performer. Pensé pour se démarquer.',
    training_edit: "SÉLECTION ENTRAÎNEMENT",
    street_essentials: 'ESSENTIELS URBAINS',
    shop_now: 'Magasiner',
    product_not_found: 'Produit introuvable',
    product: 'Produit',
    colors: 'Couleurs',
    sizes: 'Tailles',
    standard: 'Standard',
    one_size: 'Taille unique',
    selected_variant: 'Sélectionné : {color} / {size} - Stock {stock}',
    add_to_cart: 'Ajouter au panier',
    sold_out_variant: 'Épuisé pour cette variante',
    added_to_cart: '{color} / {size} ajouté au panier',
    my_orders: 'Mes commandes',
    purchases_listed: 'Tous vos achats sont listés ci-dessous.',
    my_account: 'Mon compte',
    first_name: 'Prénom',
    last_name: 'Nom',
    phone: 'Téléphone',
    country: 'Pays',
    address_line_1: 'Adresse ligne 1',
    address_line_2: 'Adresse ligne 2',
    address_line_2_optional: 'Adresse ligne 2 (optionnel)',
    city: 'Ville',
    province_state: 'Province / État',
    postal_code: 'Code postal',
    save_profile: 'Enregistrer le profil',
    loading_orders: 'Chargement des commandes...',
    failed_load_orders: 'Échec du chargement des commandes',
    profile_saved: 'Profil enregistré avec succès.',
    failed_save_profile: "Échec de l'enregistrement du profil",
    login_manage_profile: 'Connectez-vous pour gérer votre adresse',
    go_to_login: 'Aller à la connexion',
    please_login_view_orders: 'Veuillez vous connecter pour voir vos commandes.',
    no_orders_found: 'Aucune commande trouvée.',
    total: 'Total',
    tracking_number_missing: 'Numéro de suivi : non fourni',
    tracking_number: 'Numéro de suivi : {number}',
    preparing_shipping: "Préparation de l'expédition",
    order_summary: 'Résumé de commande',
    shipping: 'Livraison',
    calculated_checkout: 'Calculé au paiement',
    proceed_checkout: 'Passer au paiement',
    continue_shopping: 'Continuer vos achats',
    start_shopping: 'Commencer vos achats',
    browse_add_continue: 'Parcourez les produits et ajoutez vos variantes favorites pour continuer.',
    cart_items: 'Articles du panier',
    unit_price: 'Prix unitaire',
    finalizing_payment: 'Finalisation du paiement',
    verify_payment_wait: 'Veuillez patienter pendant la vérification du paiement Square.',
    verify_etransfer_wait: 'Veuillez patienter pendant la vérification de votre virement Interac.',
    checking_payment_status: 'Vérification du statut de paiement...',
    payment_confirmed_order: 'Paiement confirmé. La commande {orderNumber} a été créée.',
    view_my_orders: 'Voir mes commandes',
    continue_shopping_caps: 'Continuer vos achats',
    payment_pending_release: 'Paiement en attente. Le stock réservé sera libéré dans {remain}.',
    continue_payment_page: 'Continuer vers la page de paiement',
    cancel_payment_release: 'Annuler le paiement et libérer le stock',
    failed_cancel_payment_session: "Échec de l'annulation de la session de paiement",
    payment_session_done: 'Session de paiement {label}. Le stock réservé a été libéré.',
    back_to_cart: 'Retour au panier',
    current_session_status: 'Statut actuel de la session : {status}',
    failed_check_payment_status: 'Échec de vérification du statut de paiement',
    cart_empty: 'Votre panier est vide',
    browse_products: 'Parcourir les produits',
    shipping_details: "Détails d'expédition",
    stock_reserved_15min: 'Votre stock est réservé pendant 15 minutes après la poursuite du paiement.',
    payment_method: 'Méthode de paiement',
    pay_with_square: 'Payer avec Square (carte, Apple Pay, Google Pay)',
    pay_with_etransfer: 'Payer par virement Interac (dépôt automatique)',
    preferred_method: 'Méthode préférée',
    payment_method_hint: 'Choisissez une méthode. La commande est créée seulement après confirmation du paiement.',
    square_fee_title: 'Frais de traitement Square',
    square_fee_message: 'Les paiements Square incluent 3 % de frais supplémentaires. Continuer ?',
    continue_button: 'Continuer',
    return_button: 'Retour',
    continue_secure_payment: 'Continuer vers un paiement sécurisé',
    creating_secure_payment: 'Création du paiement sécurisé...',
    payment_link_unavailable: 'Lien de paiement indisponible. Veuillez réessayer.',
    etransfer_waiting_match:
      "En attente de confirmation du virement électronique. Le stock réservé sera libéré automatiquement dans {remain}.",
    etransfer_send_to: 'Veuillez envoyer votre virement à : {email}',
    etransfer_send_to_bold: 'Veuillez envoyer votre virement à : {email}',
    etransfer_send_prompt: 'Veuillez envoyer votre virement à l’adresse du marchand.',
    etransfer_exact_payable_amount: 'Envoyez le montant exact : {amount}',
    etransfer_exact_amount:
      'Important : envoyez le montant exact de la commande pour que le paiement soit jumelé automatiquement.',
    etransfer_monitor_not_ready:
      "La surveillance automatique des virements n'est pas encore configurée. Veuillez contacter le support avant d'utiliser cette méthode.",
    etransfer_screenshot_tip: 'Veuillez conserver une capture d’écran de confirmation du virement sur votre téléphone.',
    shipping_details_missing_title: "Profil d'expédition requis",
    shipping_details_missing_desc:
      "Veuillez compléter votre véritable adresse d'expédition dans le compte avant de choisir un paiement.",
    go_to_account_profile: 'Aller au compte',
    register_real_address_note:
      "L’adresse sera utilisée pour la livraison. Veuillez fournir une adresse réelle, sinon votre colis pourrait ne pas arriver.",
    tax_info_title: 'Référence de taxe de vente estimée',
    tax_info_subline_canada:
      'Pour le Canada, les composantes fédérales et provinciales sont affichées séparément lorsque applicable.',
    tax_info_subline_non_canada:
      'Pour les adresses hors Canada, les taxes varient selon la juridiction et sont confirmées au paiement.',
    tax_federal: 'Taxe fédérale',
    tax_provincial: 'Taxe provinciale / étatique',
    tax_combined: 'Taxe combinée',
    tax_varies: 'Variable',
    tax_non_canada_note:
      'Veuillez vérifier la taxe finale applicable auprès de votre autorité fiscale locale pour votre adresse précise.',
    tax_sources_title: 'Références officielles',
    checkout_api_404: "API de paiement introuvable (404). Veuillez ouvrir ce site via http://localhost:4000 et redémarrer le backend avec `npm start`.",
    failed_continue_payment: 'Échec de la poursuite du paiement',
    login_required: 'Connexion requise',
    login_before_checkout: 'Veuillez vous connecter avant le paiement.',
    contact_us: 'CONTACTEZ-NOUS',
    reply_24h: 'Nous répondrons sous 24 heures.',
    call_us: 'Appelez-nous :',
    logged_in_as: 'Connecté en tant que {email}',
    login_to_leave_message: 'Veuillez vous connecter pour laisser un message afin que nous puissions identifier votre compte.',
    leave_message: 'Laissez-nous un message',
    message_placeholder: 'Dites-nous comment nous pouvons vous aider...',
    send_message: 'Envoyer le message',
    sending: 'Envoi...',
    message_sent_success: 'Message envoyé avec succès. Nous répondrons sous 24 heures.',
    failed_send_message: "Échec de l'envoi du message"
    ,
    email: 'E-mail',
    password: 'Mot de passe',
    confirm_password: 'Confirmer le mot de passe',
    password_mismatch: 'Les mots de passe ne correspondent pas.',
    forgot_password: 'Mot de passe oublié ?',
    new_here: 'Nouveau ici ?',
    login_failed: 'Échec de la connexion',
    login_to_continue: 'Connectez-vous pour continuer',
    create_account: 'Créez votre compte',
    terms_agree: "J'accepte les Conditions générales et la politique de confidentialité.",
    already_have_account: 'Vous avez déjà un compte ?',
    registration_failed: "Échec de l'inscription",
    reset_password: 'Réinitialiser le mot de passe',
    verify_email_phone_postal: 'Vérifiez avec e-mail + téléphone + code postal.',
    new_password: 'Nouveau mot de passe',
    back_to_login: 'Retour à la connexion',
    password_reset_success: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.',
    password_reset_failed: 'Échec de la réinitialisation du mot de passe',
    customer_account: 'COMPTE CLIENT',
    account_security: 'SÉCURITÉ DU COMPTE',
    registration_verify_email: 'Inscription réussie. Veuillez vérifier votre e-mail avant de vous connecter.',
    email_not_verified: 'Veuillez vérifier votre e-mail avant de vous connecter.',
    resend_verification: "Renvoyer l'e-mail de vérification",
    enter_email_for_resend: "Veuillez d'abord saisir votre e-mail.",
    resend_verification_sent: "Si cet e-mail existe, un e-mail de vérification a été envoyé.",
    resend_verification_failed: "Échec de l'envoi de l'e-mail de vérification.",
    verify_email: "Vérification de l'e-mail",
    verify_email_missing_title: 'Lien de vérification invalide',
    verify_email_missing_message: 'Ce lien ne contient pas de jeton.',
    verify_email_missing_error: "Veuillez demander un nouvel e-mail de vérification depuis la page de connexion.",
    verify_email_success_title: 'E-mail vérifié avec succès',
    verify_email_success_message: 'Votre compte est maintenant actif. Vous pouvez vous connecter.',
    verify_email_success_alert: 'Vérification terminée.',
    verify_email_sent_title: 'Veuillez vérifier votre e-mail',
    verify_email_sent_message: "Nous avons envoyé un e-mail de vérification. Veuillez ouvrir votre boîte de réception et cliquer sur le lien avant de vous connecter.",
    verify_email_failed_title: 'Échec de la vérification',
    verify_email_failed_message: 'Votre lien de vérification est invalide ou expiré.',
    verify_email_failed_error: "Veuillez demander un nouvel e-mail de vérification.",
    account_suspended: 'Ce compte a été suspendu ou est invalide.'
  }
};

export function getLocale() {
  let raw = 'en';
  try {
    raw = String(localStorage.getItem(LOCALE_STORAGE_KEY) || 'en').toLowerCase();
  } catch {
    raw = 'en';
  }
  return raw === 'fr' ? 'fr' : 'en';
}

export function setLocale(locale) {
  const next = String(locale || '').toLowerCase() === 'fr' ? 'fr' : 'en';
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  } catch {}
  document.documentElement.lang = next;
  return next;
}

export function t(key, params = {}) {
  const locale = getLocale();
  const table = I18N[locale] || I18N.en;
  const fallback = I18N.en[key] || key;
  const source = table[key] || fallback;
  return Object.keys(params).reduce((text, name) => text.replaceAll(`{${name}}`, String(params[name])), source);
}

export function formatPrice(cents = 0) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format((Number(cents) || 0) / 100);
}

export function publicImageUrl(imagePath) {
  if (!imagePath) return '/uploads/placeholder-product.svg';
  if (imagePath.startsWith('http')) return imagePath;
  return imagePath;
}

export async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const isAdminPage =
    typeof location !== 'undefined' && String(location.pathname || '').toLowerCase().startsWith('/admin');
  if (!isAdminPage && !headers.has('x-locale')) {
    headers.set('x-locale', getLocale());
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) {
    const err = new Error(data?.message || `Request failed: ${response.status}`);
    err.code = data?.code || '';
    err.status = response.status;
    throw err;
  }
  return data;
}

export function getCustomerSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: '', customer: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || '',
      customer: parsed?.customer || null
    };
  } catch {
    return { token: '', customer: null };
  }
}

export function setCustomerSession(token, customer) {
  if (!token || !customer) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyCartUpdated();
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, customer }));
  notifyCartUpdated();
}

export function clearCustomerSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  notifyCartUpdated();
}

async function ensureCustomerSessionIsActive(session) {
  if (!session?.token || !session?.customer) {
    return { session, valid: false };
  }

  try {
    await request('/api/auth/customer/session-status', {
      headers: {
        Authorization: `Bearer ${session.token}`
      }
    });
    return { session, valid: true };
  } catch (error) {
    if (error?.code === 'ACCOUNT_SUSPENDED' || error?.code === 'ACCOUNT_NOT_FOUND' || error?.status === 401 || error?.status === 403) {
      clearCustomerSession();
      const path = String(location?.pathname || '');
      const isAuthPage = path.startsWith('/account/login') || path.startsWith('/account/register') || path.startsWith('/account/forgot-password');
      if (!isAuthPage) {
        location.href = '/account/login';
      }
      return { session: { token: '', customer: null }, valid: false };
    }
    return { session, valid: true };
  }
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_STORAGE_KEY) || '';
}

export function setAdminToken(token) {
  if (!token) localStorage.removeItem(ADMIN_STORAGE_KEY);
  else localStorage.setItem(ADMIN_STORAGE_KEY, token);
}

function cartStorageKey() {
  const { customer } = getCustomerSession();
  if (customer?.id) return `${CART_STORAGE_PREFIX}:customer:${customer.id}`;
  return `${CART_STORAGE_PREFIX}:guest`;
}

function normalizeCartLine(item) {
  const quantity = Math.max(1, Number(item?.quantity || 1));
  const isActive = item?.isActive !== false;
  return {
    productId: Number(item?.productId || 0),
    name: String(item?.name || '').trim(),
    imageUrl: String(item?.imageUrl || '').trim(),
    priceCents: Math.max(0, Number(item?.priceCents || 0)),
    color: String(item?.color || '').trim(),
    size: String(item?.size || '').trim(),
    sku: String(item?.sku || '').trim(),
    stock: Math.max(0, Number(item?.stock || 0)),
    isActive,
    selected: isActive ? item?.selected !== false : false,
    quantity
  };
}

function mergeCartLines(items = []) {
  const map = new Map();
  items
    .map(normalizeCartLine)
    .filter((item) => Number(item.productId) > 0)
    .forEach((item) => {
      const key = lineKey(item);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        return;
      }
      const mergedIsActive = existing.isActive !== false && item.isActive !== false;
      map.set(key, {
        ...existing,
        name: item.name || existing.name,
        imageUrl: item.imageUrl || existing.imageUrl,
        priceCents: Number(item.priceCents || existing.priceCents || 0),
        sku: item.sku || existing.sku,
        stock: Math.max(Number(existing.stock || 0), Number(item.stock || 0)),
        isActive: mergedIsActive,
        selected: mergedIsActive ? existing.selected !== false || item.selected !== false : false,
        quantity: Math.max(1, Number(existing.quantity || 1) + Number(item.quantity || 1))
      });
    });
  return [...map.values()];
}

function sameCartSnapshot(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      Number(left.productId) !== Number(right.productId) ||
      String(left.color || '') !== String(right.color || '') ||
      String(left.size || '') !== String(right.size || '') ||
      Number(left.quantity || 0) !== Number(right.quantity || 0) ||
      Number(left.priceCents || 0) !== Number(right.priceCents || 0) ||
      String(left.name || '') !== String(right.name || '') ||
      String(left.imageUrl || '') !== String(right.imageUrl || '') ||
      String(left.sku || '') !== String(right.sku || '') ||
      Number(left.stock || 0) !== Number(right.stock || 0) ||
      Boolean(left.isActive !== false) !== Boolean(right.isActive !== false) ||
      Boolean(left.selected !== false) !== Boolean(right.selected !== false)
    ) {
      return false;
    }
  }
  return true;
}

export function getCartItems() {
  try {
    const raw = localStorage.getItem(cartStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    const merged = mergeCartLines(Array.isArray(parsed) ? parsed : []);
    if (!sameCartSnapshot(parsed, merged)) {
      saveCart(merged);
    }
    return merged;
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(cartStorageKey(), JSON.stringify(mergeCartLines(items)));
}

function lineKey(item) {
  return `${item.productId}::${item.color || ''}::${item.size || ''}`.toLowerCase();
}

function notifyCartUpdated() {
  const summary = cartSummary();
  syncCartBadges(summary.totalItems);
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: {
        totalItems: summary.totalItems,
        subtotalCents: summary.subtotalCents
      }
    })
  );
}

function syncCartBadges(totalItems = cartSummary().totalItems) {
  document.querySelectorAll(CART_BADGE_SELECTOR).forEach((node) => {
    node.textContent = String(totalItems);
  });
}

export function addCartItem(item, quantity = 1) {
  const { token, customer } = getCustomerSession();
  if (!token || !customer) {
    const error = new Error('LOGIN_REQUIRED');
    error.code = 'LOGIN_REQUIRED';
    throw error;
  }
  const items = getCartItems();
  const key = lineKey(item);
  const idx = items.findIndex((entry) => lineKey(entry) === key);
  if (idx === -1) {
    items.push({ ...item, selected: item?.isActive === false ? false : true, quantity: Math.max(1, Number(quantity) || 1) });
  } else {
    items[idx].quantity = Math.max(1, Number(items[idx].quantity || 1) + Number(quantity || 1));
    if (items[idx].isActive !== false) {
      items[idx].selected = true;
    }
  }
  saveCart(items);
  notifyCartUpdated();
  return items;
}

export function setCartItemSelected(key, selected) {
  const items = getCartItems().map((item) => {
    if (lineKey(item) !== key) return item;
    if (item.isActive === false) return { ...item, selected: false };
    return { ...item, selected: Boolean(selected) };
  });
  saveCart(items);
  notifyCartUpdated();
  return items;
}

export function getCheckoutItems(items = getCartItems()) {
  return items.filter((item) => item.isActive !== false && item.selected !== false);
}

async function fetchLatestProduct(productId) {
  try {
    const product = await request(`/api/products/${encodeURIComponent(productId)}`);
    return product || null;
  } catch (error) {
    if (Number(error?.status) === 404) {
      return {
        id: Number(productId),
        isActive: false,
        variants: []
      };
    }
    return null;
  }
}

export async function refreshCartPricing() {
  const current = getCartItems();
  if (!current.length) return current;

  const ids = [...new Set(current.map((item) => Number(item.productId)).filter((id) => Number.isFinite(id) && id > 0))];
  const latestRows = await Promise.all(ids.map((id) => fetchLatestProduct(id)));
  const byId = new Map();
  latestRows.forEach((row) => {
    if (row?.id) byId.set(Number(row.id), row);
  });

  const next = current.map((item) => {
    const latest = byId.get(Number(item.productId));
    if (!latest) return item;

    const variants = Array.isArray(latest.variants) ? latest.variants : [];
    const variant = variants.find(
      (v) =>
        String(v?.color || '').trim().toLowerCase() === String(item.color || '').trim().toLowerCase() &&
        String(v?.size || '').trim().toLowerCase() === String(item.size || '').trim().toLowerCase()
    );
    const imageUrls = Array.isArray(latest.imageUrls) ? latest.imageUrls : [];
    const nextImage = imageUrls[0] || latest.imageUrl || item.imageUrl;
    const activeNow = latest.isActive !== false;
    return {
      ...item,
      name: String(latest.name || item.name || ''),
      imageUrl: String(nextImage || ''),
      priceCents: Number(latest.currentPriceCents || latest.priceCents || item.priceCents || 0),
      sku: String(variant?.sku || item.sku || ''),
      stock: Math.max(0, Number(variant?.stock ?? item.stock ?? 0)),
      isActive: activeNow,
      selected: activeNow ? item.selected !== false : false
    };
  });

  const merged = mergeCartLines(next);
  if (!sameCartSnapshot(current, merged)) {
    saveCart(merged);
    notifyCartUpdated();
  }
  return merged;
}

export function startCartAutoSync(intervalMs = 5000) {
  const ms = Math.max(3000, Number(intervalMs) || 5000);
  if (window.__cartAutoSyncTimer) return;

  const run = async () => {
    if (window.__cartAutoSyncBusy) return;
    const items = getCartItems();
    if (!items.length) return;
    window.__cartAutoSyncBusy = true;
    try {
      await refreshCartPricing();
    } catch {
      // best effort background sync
    } finally {
      window.__cartAutoSyncBusy = false;
    }
  };

  window.__cartAutoSyncTimer = window.setInterval(run, ms);
  run().catch(() => {});
}

export function updateCartQuantity(key, quantity) {
  const items = getCartItems().map((item) => {
    if (lineKey(item) !== key) return item;
    return { ...item, quantity: Math.max(1, Number(quantity) || 1) };
  });
  saveCart(items);
  notifyCartUpdated();
  return items;
}

export function removeCartItem(key) {
  const items = getCartItems().filter((item) => lineKey(item) !== key);
  saveCart(items);
  notifyCartUpdated();
  return items;
}

export function clearCart() {
  saveCart([]);
  notifyCartUpdated();
}

export function cartSummary(items = getCartItems()) {
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const subtotalCents = items.reduce(
    (sum, item) => sum + Number(item.priceCents || 0) * Number(item.quantity || 0),
    0
  );
  return { totalItems, subtotalCents };
}

function buildNavGroup(category) {
  const children = category.children || [];
  const dropdown =
    children.length > 0
      ? `<div class="nav-dropdown">${children
          .map((child) => `<a href="/category/${child.slug}" class="nav-child">${child.name}</a>`)
          .join('')}</div>`
      : '';
  return `<div class="nav-group"><a href="/category/${category.slug}" class="nav-parent">${category.name}</a>${dropdown}</div>`;
}

function buildMobileMenuGroups(categories = []) {
  const groupsHtml = categories
    .map((category) => {
      const children = Array.isArray(category.children) ? category.children : [];
      if (children.length > 0) {
        return `
          <div class="mobile-nav-group">
            <button type="button" class="mobile-nav-parent-btn" data-mobile-open-children="${category.slug}">
              <span>${category.name}</span>
              <span class="mobile-nav-arrow">›</span>
            </button>
          </div>
        `;
      }
      return `
        <div class="mobile-nav-group">
          <a href="/category/${category.slug}" class="mobile-nav-parent">${category.name}</a>
        </div>
      `;
    })
    .join('');

  return `
    <div class="mobile-nav-group">
      <a href="/shop" class="mobile-nav-parent">${t('cart_shop_all')}</a>
    </div>
    <div class="mobile-nav-group">
      <a href="/shop?onSale=1&sort=price_desc" class="mobile-nav-parent">${t('shop_on_sale')}</a>
    </div>
    ${groupsHtml}
  `;
}

function hamburgerIconHtml() {
  return `<span class="mobile-menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>`;
}

function ensureSiteFooter() {
  if (document.querySelector('#site-footer')) return;

  const footer = document.createElement('footer');
  footer.id = 'site-footer';
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="site-footer-shell">
      <div class="site-footer-brand">
        <h3>Luxury Cloth Inc.</h3>
        <p>United Kingdom apparel company focused on modern performance and premium everyday essentials.</p>
      </div>
      <div class="site-footer-meta">
        <p class="site-footer-label">Contact</p>
        <a class="site-footer-phone" href="tel:+447404822411">+44 7404822411</a>
        <p class="site-footer-small">Customer support responds within 24 hours.</p>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
}

function localeSwitchHtml(extraClass = '') {
  const locale = getLocale();
  return `
    <div class="locale-switch ${extraClass}" aria-label="Language selector">
      <span class="locale-switch-prefix">🌐 ${t('locale_fixed')}</span>
      <button type="button" class="locale-switch-btn ${locale === 'en' ? 'active' : ''}" data-locale-switch="en">EN</button>
      <span class="locale-switch-divider">|</span>
      <button type="button" class="locale-switch-btn ${locale === 'fr' ? 'active' : ''}" data-locale-switch="fr">FR</button>
    </div>
  `;
}

function bindLocaleSwitchers() {
  document.querySelectorAll('[data-locale-switch]').forEach((node) => {
    if (node.dataset.bound === '1') return;
    node.dataset.bound = '1';
    node.addEventListener('click', async () => {
      const next = node.dataset.localeSwitch || 'en';
      if (next === getLocale()) return;
      if (next === 'fr') {
        await openFrSwitchNoticeModal();
      }
      setLocale(next);
      location.reload();
    });
  });
}

function closeFrSwitchNoticeModal() {
  const overlay = document.querySelector(`#${FR_SWITCH_OVERLAY_ID}`);
  const modal = document.querySelector(`#${FR_SWITCH_MODAL_ID}`);
  if (!overlay || !modal) return;
  overlay.hidden = true;
  modal.hidden = true;
  document.body.classList.remove('fr-switch-open');
}

function ensureFrSwitchNoticeModal() {
  let overlay = document.querySelector(`#${FR_SWITCH_OVERLAY_ID}`);
  let modal = document.querySelector(`#${FR_SWITCH_MODAL_ID}`);

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = FR_SWITCH_OVERLAY_ID;
    overlay.className = 'fr-switch-overlay';
    overlay.hidden = true;
    document.body.appendChild(overlay);
  }

  if (!modal) {
    modal = document.createElement('aside');
    modal.id = FR_SWITCH_MODAL_ID;
    modal.className = 'fr-switch-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="fr-switch-card" role="dialog" aria-modal="true" aria-labelledby="fr-switch-title">
        <h3 id="fr-switch-title">${t('fr_switch_notice_title')}</h3>
        <p id="fr-switch-message">${t('fr_switch_notice_message')}</p>
        <div class="fr-switch-actions">
          <button type="button" class="cta-button" data-fr-switch-action="confirm">${t('confirm_button')}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const titleNode = modal.querySelector('#fr-switch-title');
  const messageNode = modal.querySelector('#fr-switch-message');
  const confirmBtn = modal.querySelector('[data-fr-switch-action="confirm"]');
  if (titleNode) titleNode.textContent = t('fr_switch_notice_title');
  if (messageNode) messageNode.textContent = t('fr_switch_notice_message');
  if (confirmBtn) confirmBtn.textContent = t('confirm_button');

  return { overlay, modal, confirmBtn };
}

function openFrSwitchNoticeModal() {
  const { overlay, modal, confirmBtn } = ensureFrSwitchNoticeModal();
  overlay.hidden = false;
  modal.hidden = false;
  document.body.classList.add('fr-switch-open');

  return new Promise((resolve) => {
    if (!(confirmBtn instanceof HTMLElement)) {
      closeFrSwitchNoticeModal();
      resolve();
      return;
    }

    const handleConfirm = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      closeFrSwitchNoticeModal();
      resolve();
    };

    confirmBtn.addEventListener('click', handleConfirm, { once: true });
    confirmBtn.focus();
  });
}

function closeAuthGateModal() {
  const overlay = document.querySelector(`#${AUTH_GATE_OVERLAY_ID}`);
  const modal = document.querySelector(`#${AUTH_GATE_MODAL_ID}`);
  if (!overlay || !modal) return;
  overlay.hidden = true;
  modal.hidden = true;
  document.body.classList.remove('auth-gate-open');
}

function ensureAuthGateModal() {
  let overlay = document.querySelector(`#${AUTH_GATE_OVERLAY_ID}`);
  let modal = document.querySelector(`#${AUTH_GATE_MODAL_ID}`);

  if (!overlay) {
    overlay = document.createElement('button');
    overlay.id = AUTH_GATE_OVERLAY_ID;
    overlay.className = 'auth-gate-overlay';
    overlay.hidden = true;
    overlay.type = 'button';
    overlay.setAttribute('aria-label', t('auth_gate_close'));
    document.body.appendChild(overlay);
  }

  if (!modal) {
    modal = document.createElement('aside');
    modal.id = AUTH_GATE_MODAL_ID;
    modal.className = 'auth-gate-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="auth-gate-card">
        <h3 id="auth-gate-title">${t('auth_gate_title')}</h3>
        <p id="auth-gate-message">${t('auth_gate_message')}</p>
        <div class="auth-gate-actions">
          <a href="/account/login" class="cta-button auth-gate-btn">${t('header_log_in')}</a>
          <a href="/account/register" class="header-pill auth-gate-btn auth-gate-alt-btn">${t('header_sign_up')}</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  if (!overlay.dataset.bound) {
    overlay.dataset.bound = '1';
    overlay.addEventListener('click', closeAuthGateModal);
  }

  if (!modal.dataset.bound) {
    modal.dataset.bound = '1';
    modal.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('a')) closeAuthGateModal();
    });
  }

  if (!window.__authGateEscBound) {
    window.__authGateEscBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAuthGateModal();
    });
  }

  return { overlay, modal };
}

export function openAuthGateModal(title = t('auth_gate_title'), message = t('auth_gate_message')) {
  const { overlay, modal } = ensureAuthGateModal();
  const titleNode = modal.querySelector('#auth-gate-title');
  const messageNode = modal.querySelector('#auth-gate-message');
  if (titleNode) titleNode.textContent = title;
  if (messageNode) messageNode.textContent = message;
  overlay.hidden = false;
  modal.hidden = false;
  document.body.classList.add('auth-gate-open');
}

function closeCartDrawer({ restoreMobileMenu = false } = {}) {
  const overlay = document.querySelector(`#${CART_OVERLAY_ID}`);
  const drawer = document.querySelector(`#${CART_DRAWER_ID}`);
  const trigger = document.querySelector('#cart-trigger-btn');
  if (!overlay || !drawer) return;
  const shouldRestoreMobileMenu =
    restoreMobileMenu || (drawer.dataset.mobileReturnToMenu === '1' && window.matchMedia('(max-width: 980px)').matches);
  overlay.hidden = true;
  drawer.hidden = true;
  drawer.dataset.mobileReturnToMenu = '0';
  document.body.classList.remove('cart-drawer-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  if (shouldRestoreMobileMenu) {
    openMobileMenu();
    return;
  }
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  setMobileToggleState(Boolean(panel?.classList.contains('is-open')));
}

function renderCartDrawer() {
  const drawer = document.querySelector(`#${CART_DRAWER_ID}`);
  if (!drawer) return;
  const items = getCartItems();
  const checkoutItems = getCheckoutItems(items);
  const summary = cartSummary(checkoutItems);
  const hasDiscontinued = items.some((item) => item.isActive === false);
  const hasNoSelected = checkoutItems.length === 0;

  drawer.innerHTML = `
    <div class="cart-drawer-head">
      <h3>${t('header_cart')}</h3>
      <button type="button" class="cart-drawer-close" data-cart-action="close" aria-label="${t('cart_drawer_close')}">×</button>
    </div>
    ${
      items.length === 0
        ? `<div class="cart-empty">
             <h4>${t('cart_empty_title')}</h4>
             <p>${t('cart_empty_desc')}</p>
             <a href="/shop" class="cart-view-btn" data-cart-action="close">${t('cart_shop_all')}</a>
           </div>`
        : `<div class="cart-list">
             ${items
               .map(
                 (item) => `
               <article class="cart-item">
                 <label class="cart-select-check">
                   <input type="checkbox" data-cart-action="toggle-select" data-key="${lineKey(item)}" ${
                     item.selected !== false && item.isActive !== false ? 'checked' : ''
                   } ${item.isActive === false ? 'disabled' : ''} />
                   <span>${t('select_for_checkout')}</span>
                 </label>
                 <img src="${publicImageUrl(item.imageUrl)}" alt="${item.name}" class="cart-item-image" />
                 <div class="cart-item-content">
                   <h4>${item.name}</h4>
                   <p>${item.color} / ${item.size}</p>
                   <p class="cart-muted">${formatPrice(item.priceCents)} ${t('cart_each')}</p>
                   ${item.isActive === false ? `<p class="admin-error">${t('product_discontinued')}</p>` : ''}
                   <div class="cart-item-actions">
                     <div class="qty-control">
                       <button type="button" data-cart-action="minus" data-key="${lineKey(item)}">-</button>
                       <span>${item.quantity}</span>
                       <button type="button" data-cart-action="plus" data-key="${lineKey(item)}">+</button>
                     </div>
                     <button type="button" class="danger-ghost" data-cart-action="remove" data-key="${lineKey(
                       item
                     )}">${t('cart_remove')}</button>
                   </div>
                 </div>
               </article>
             `
               )
               .join('')}
           </div>
           <div class="cart-footer">
             <p>${t('checkout_selected_subtotal')}: <strong>${formatPrice(summary.subtotalCents)}</strong></p>
             ${hasDiscontinued ? `<p class="admin-error">${t('checkout_blocked_discontinued')}</p>` : ''}
             ${hasNoSelected ? `<p class="admin-error">${t('checkout_none_selected')}</p>` : ''}
             <div class="cart-footer-actions">
               <button type="button" class="danger-ghost" data-cart-action="clear">${t('cart_clear')}</button>
               <a href="/checkout" class="cart-view-btn ${hasDiscontinued || hasNoSelected ? 'is-disabled' : ''}" data-checkout-guard="${
                 hasDiscontinued || hasNoSelected ? '1' : '0'
               }" data-cart-action="${hasDiscontinued || hasNoSelected ? '' : 'close'}" aria-disabled="${
                 hasDiscontinued || hasNoSelected ? 'true' : 'false'
               }">${t('cart_checkout')}</a>
             </div>
           </div>`
    }
  `;
}

function renderMobileCartView() {
  const container = document.querySelector('#mobile-cart-content');
  if (!container) return;

  const items = getCartItems();
  const checkoutItems = getCheckoutItems(items);
  const summary = cartSummary(checkoutItems);
  const hasDiscontinued = items.some((item) => item.isActive === false);
  const hasNoSelected = checkoutItems.length === 0;

  container.innerHTML =
    items.length === 0
      ? `<div class="cart-empty">
           <h4>${t('cart_empty_title')}</h4>
           <p>${t('cart_empty_desc')}</p>
           <a href="/shop" class="cart-view-btn" data-mobile-menu-action="close">${t('cart_shop_all')}</a>
         </div>`
      : `<div class="cart-list mobile-nav-cart-list">
           ${items
             .map(
               (item) => `
             <article class="cart-item">
               <label class="cart-select-check">
                 <input type="checkbox" data-mobile-cart-action="toggle-select" data-key="${lineKey(item)}" ${
                   item.selected !== false && item.isActive !== false ? 'checked' : ''
                 } ${item.isActive === false ? 'disabled' : ''} />
                 <span>${t('select_for_checkout')}</span>
               </label>
               <img src="${publicImageUrl(item.imageUrl)}" alt="${item.name}" class="cart-item-image" />
               <div class="cart-item-content">
                 <h4>${item.name}</h4>
                 <p>${item.color} / ${item.size}</p>
                 <p class="cart-muted">${formatPrice(item.priceCents)} ${t('cart_each')}</p>
                 ${item.isActive === false ? `<p class="admin-error">${t('product_discontinued')}</p>` : ''}
                 <div class="cart-item-actions">
                   <div class="qty-control">
                     <button type="button" data-mobile-cart-action="minus" data-key="${lineKey(item)}">-</button>
                     <span>${item.quantity}</span>
                     <button type="button" data-mobile-cart-action="plus" data-key="${lineKey(item)}">+</button>
                   </div>
                   <button type="button" class="danger-ghost" data-mobile-cart-action="remove" data-key="${lineKey(
                     item
                   )}">${t('cart_remove')}</button>
                 </div>
               </div>
             </article>
           `
             )
             .join('')}
         </div>
         <div class="cart-footer">
           <p>${t('checkout_selected_subtotal')}: <strong>${formatPrice(summary.subtotalCents)}</strong></p>
           ${hasDiscontinued ? `<p class="admin-error">${t('checkout_blocked_discontinued')}</p>` : ''}
           ${hasNoSelected ? `<p class="admin-error">${t('checkout_none_selected')}</p>` : ''}
           <div class="cart-footer-actions">
             <button type="button" class="danger-ghost" data-mobile-cart-action="clear">${t('cart_clear')}</button>
             <a href="/checkout" class="cart-view-btn ${hasDiscontinued || hasNoSelected ? 'is-disabled' : ''}" data-checkout-guard="${
               hasDiscontinued || hasNoSelected ? '1' : '0'
             }" data-mobile-menu-action="${hasDiscontinued || hasNoSelected ? '' : 'close'}" aria-disabled="${
               hasDiscontinued || hasNoSelected ? 'true' : 'false'
             }">${t('cart_checkout')}</a>
           </div>
         </div>`;
}

function openCartDrawer({ mobileReturnToMenu = false } = {}) {
  const overlay = document.querySelector(`#${CART_OVERLAY_ID}`);
  const drawer = document.querySelector(`#${CART_DRAWER_ID}`);
  const trigger = document.querySelector('#cart-trigger-btn');
  if (!overlay || !drawer) return;
  renderCartDrawer();
  refreshCartPricing()
    .then(() => {
      const currentDrawer = document.querySelector(`#${CART_DRAWER_ID}`);
      if (currentDrawer && !currentDrawer.hidden) renderCartDrawer();
    })
    .catch(() => {});
  drawer.dataset.mobileReturnToMenu = mobileReturnToMenu ? '1' : '0';
  overlay.hidden = false;
  drawer.hidden = false;
  document.body.classList.add('cart-drawer-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  if (mobileReturnToMenu) {
    setMobileToggleState(true);
  }
}

function toggleCartDrawer() {
  const drawer = document.querySelector(`#${CART_DRAWER_ID}`);
  if (!drawer) return;
  if (drawer.hidden) {
    openCartDrawer();
  } else {
    closeCartDrawer();
  }
}

function ensureCartDrawer() {
  let overlay = document.querySelector(`#${CART_OVERLAY_ID}`);
  let drawer = document.querySelector(`#${CART_DRAWER_ID}`);

  if (!overlay) {
    overlay = document.createElement('button');
    overlay.id = CART_OVERLAY_ID;
    overlay.className = 'cart-overlay';
    overlay.type = 'button';
    overlay.hidden = true;
    overlay.setAttribute('aria-label', t('close_cart'));
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = document.createElement('aside');
    drawer.id = CART_DRAWER_ID;
    drawer.className = 'cart-drawer';
    drawer.hidden = true;
    document.body.appendChild(drawer);
  }

  if (!overlay.dataset.bound) {
    overlay.dataset.bound = '1';
    overlay.addEventListener('click', closeCartDrawer);
  }

  if (!drawer.dataset.bound) {
    drawer.dataset.bound = '1';
    drawer.addEventListener('click', (event) => {
      const blockedCheckout = event.target.closest('[data-checkout-guard="1"]');
      if (blockedCheckout) {
        event.preventDefault();
        return;
      }
      const control = event.target.closest('[data-cart-action]');
      if (!control) return;
      const action = control.dataset.cartAction;
      const key = control.dataset.key || '';

      if (action === 'close') {
        closeCartDrawer();
        return;
      }
      if (action === 'clear') {
        clearCart();
        renderCartDrawer();
        return;
      }
      if (action === 'remove') {
        removeCartItem(key);
        renderCartDrawer();
        return;
      }
      if (action === 'toggle-select') {
        const checkbox = control instanceof HTMLInputElement ? control : null;
        setCartItemSelected(key, Boolean(checkbox?.checked));
        renderCartDrawer();
        return;
      }
      if (action === 'minus') {
        const item = getCartItems().find((entry) => lineKey(entry) === key);
        if (!item) return;
        updateCartQuantity(key, Math.max(1, Number(item.quantity || 1) - 1));
        renderCartDrawer();
        return;
      }
      if (action === 'plus') {
        const item = getCartItems().find((entry) => lineKey(entry) === key);
        if (!item) return;
        updateCartQuantity(key, Number(item.quantity || 1) + 1);
        renderCartDrawer();
      }
    });
  }

  if (!window.__cartDrawerEscBound) {
    window.__cartDrawerEscBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCartDrawer();
    });
  }

  if (!window.__cartDrawerSyncBound) {
    window.__cartDrawerSyncBound = true;
    window.addEventListener(CART_UPDATED_EVENT, () => {
      const currentDrawer = document.querySelector(`#${CART_DRAWER_ID}`);
      if (currentDrawer && !currentDrawer.hidden) {
        renderCartDrawer();
      }
    });
  }
}

function resetMobileSubmenu() {
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  const main = document.querySelector('#mobile-nav-main');
  const sub = document.querySelector('#mobile-nav-sub');
  const cart = document.querySelector('#mobile-nav-cart');
  const subLinks = document.querySelector('#mobile-submenu-links');
  const subTitle = document.querySelector('#mobile-submenu-title');
  if (!panel) return;
  panel.classList.remove('submenu-open');
  panel.classList.remove('cart-open');
  if (main) main.setAttribute('aria-hidden', 'false');
  if (sub) sub.setAttribute('aria-hidden', 'true');
  if (cart) cart.setAttribute('aria-hidden', 'true');
  if (subLinks) subLinks.innerHTML = '';
  if (subTitle) subTitle.textContent = '';
}

function setMobileToggleState(isOpen) {
  document.querySelectorAll('.mobile-menu-toggle').forEach((node) => {
    node.classList.toggle('is-open', Boolean(isOpen));
    node.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function openMobileSubmenu(category) {
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  const main = document.querySelector('#mobile-nav-main');
  const sub = document.querySelector('#mobile-nav-sub');
  const cart = document.querySelector('#mobile-nav-cart');
  const subLinks = document.querySelector('#mobile-submenu-links');
  const subTitle = document.querySelector('#mobile-submenu-title');
  if (!panel || !main || !sub || !subLinks || !subTitle) return;

  const children = Array.isArray(category?.children) ? category.children : [];
  subTitle.textContent = category?.name || '';
  subLinks.innerHTML = children
    .map((child) => `<a href="/category/${child.slug}" class="mobile-nav-child-card">${child.name}</a>`)
    .join('');

  main.setAttribute('aria-hidden', 'true');
  sub.setAttribute('aria-hidden', 'false');
  if (cart) cart.setAttribute('aria-hidden', 'true');
  panel.classList.remove('cart-open');
  panel.classList.add('submenu-open');
}

function openMobileCartView() {
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  const main = document.querySelector('#mobile-nav-main');
  const sub = document.querySelector('#mobile-nav-sub');
  const cart = document.querySelector('#mobile-nav-cart');
  if (!panel || !main || !sub || !cart) return;

  // Always resync badge/cart state when opening cart view (silent, no reload).
  syncCartBadges(cartSummary().totalItems);
  renderMobileCartView();
  refreshCartPricing()
    .then(() => {
      const currentPanel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
      if (currentPanel?.classList.contains('cart-open')) {
        syncCartBadges(cartSummary().totalItems);
        renderMobileCartView();
      }
    })
    .catch(() => {});
  main.setAttribute('aria-hidden', 'true');
  sub.setAttribute('aria-hidden', 'true');
  cart.setAttribute('aria-hidden', 'false');
  panel.classList.remove('submenu-open');
  panel.classList.add('cart-open');
}

function closeMobileMenu() {
  const overlay = document.querySelector(`#${MOBILE_MENU_OVERLAY_ID}`);
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  if (!overlay || !panel) return;
  resetMobileSubmenu();
  overlay.classList.remove('is-open');
  panel.classList.remove('is-open');
  document.body.classList.remove('mobile-nav-open');
  setMobileToggleState(false);
}

function openMobileMenu() {
  const overlay = document.querySelector(`#${MOBILE_MENU_OVERLAY_ID}`);
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  if (!overlay || !panel) return;
  // Guard against stale in-memory state after mobile page restore.
  syncCartBadges(cartSummary().totalItems);
  resetMobileSubmenu();
  overlay.classList.add('is-open');
  panel.classList.add('is-open');
  document.body.classList.add('mobile-nav-open');
  setMobileToggleState(true);
}

function toggleMobileMenu() {
  const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
  if (!panel) return;
  const isOpen = panel.classList.contains('is-open');
  if (isOpen) closeMobileMenu();
  else openMobileMenu();
}

export async function renderHeader() {
  const host = document.querySelector('#site-header');
  if (!host) return;
  document.documentElement.lang = getLocale();

  const [categories, rawSession, summary] = await Promise.all([
    request('/api/categories?tree=1').catch(() => []),
    Promise.resolve(getCustomerSession()),
    Promise.resolve(cartSummary())
  ]);
  const { session } = await ensureCustomerSessionIsActive(rawSession);
  const mobileCategoryBySlug = new Map(categories.map((item) => [item.slug, item]));

  const authLinksDesktop = session.customer
    ? `<a href="/account" class="header-pill">${t('header_hi', { name: session.customer.firstName })}</a>
       <button type="button" class="header-pill button-pill" id="logout-btn">${t('header_logout')}</button>`
    : `<a href="/account/login" class="header-pill">${t('header_log_in')}</a>
       <a href="/account/register" class="header-pill">${t('header_sign_up')}</a>`;

  const authLinksMobile = session.customer
    ? `<a href="/account" class="header-pill">${t('header_hi', { name: session.customer.firstName })}</a>
       <button type="button" class="header-pill button-pill" id="mobile-logout-btn">${t('header_logout')}</button>`
    : `<a href="/account/login" class="header-pill">${t('header_log_in')}</a>
       <a href="/account/register" class="header-pill">${t('header_sign_up')}</a>`;

  host.innerHTML = `
    <header class="site-header">
      <div class="header-shell">
        <div class="mobile-header-row">
          <a href="/" class="brand-link">LUXURY STATION</a>
          <button type="button" class="mobile-menu-toggle" id="mobile-menu-toggle" aria-expanded="false" aria-label="${t('header_open_menu')}">${hamburgerIconHtml()}</button>
        </div>

        <a href="/" class="brand-link desktop-brand">LUXURY STATION</a>
        <nav class="mega-nav desktop-nav" aria-label="${t('header_main_categories')}">
          <div class="nav-group"><a href="/shop" class="nav-parent">${t('cart_shop_all')}</a></div>
          <div class="nav-group"><a href="/shop?onSale=1&sort=price_desc" class="nav-parent">${t('shop_on_sale')}</a></div>
          ${categories.map(buildNavGroup).join('')}
        </nav>
        <div class="header-actions desktop-actions">
          ${localeSwitchHtml()}
          <a href="/orders" class="header-pill">${t('my_orders')}</a>
          <a href="/contact" class="header-pill">${t('header_contact_us')}</a>
          <div class="customer-menu">${authLinksDesktop}</div>
          <button type="button" class="cart-trigger" id="cart-trigger-btn" aria-expanded="false">${t('header_cart')} <span class="cart-count">${summary.totalItems}</span></button>
        </div>
      </div>
    </header>
    <button id="${MOBILE_MENU_OVERLAY_ID}" class="mobile-nav-overlay" type="button" aria-label="${t('close_menu')}"></button>
    <aside id="${MOBILE_MENU_PANEL_ID}" class="mobile-nav-panel">
      <div class="mobile-nav-head">
        <a href="/" class="mobile-nav-home" data-mobile-menu-action="close">${t('header_home')}</a>
        <button type="button" class="mobile-menu-toggle" data-mobile-menu-action="close" aria-label="${t('header_close_menu')}">${hamburgerIconHtml()}</button>
      </div>
      <div class="mobile-nav-stage">
      <div id="mobile-nav-main" class="mobile-nav-view" aria-hidden="false">
        ${localeSwitchHtml('locale-switch-mobile')}
        <nav class="mobile-nav-links" aria-label="${t('header_mobile_categories')}">
          ${buildMobileMenuGroups(categories)}
        </nav>
        <div class="mobile-nav-actions">
          <a href="/orders" class="header-pill" data-mobile-menu-action="close">${t('my_orders')}</a>
          <a href="/contact" class="header-pill" data-mobile-menu-action="close">${t('header_contact_us')}</a>
          <div class="mobile-customer-links">${authLinksMobile}</div>
          <button type="button" class="cart-trigger mobile-cart-trigger" data-mobile-menu-action="open-cart">
            ${t('header_cart')} <span class="cart-count">${summary.totalItems}</span>
          </button>
        </div>
      </div>
      <div id="mobile-nav-sub" class="mobile-nav-sub mobile-nav-view" aria-hidden="true">
        <div class="mobile-nav-sub-head">
          <button type="button" class="mobile-nav-back-btn" data-mobile-menu-action="back-submenu">← Back</button>
          <strong id="mobile-submenu-title"></strong>
        </div>
        <div id="mobile-submenu-links" class="mobile-nav-sub-links"></div>
      </div>
      <div id="mobile-nav-cart" class="mobile-nav-sub mobile-nav-view" aria-hidden="true">
        <div class="mobile-nav-sub-head">
          <button type="button" class="mobile-nav-back-btn" data-mobile-menu-action="back-cart">← Back</button>
          <strong>${t('header_cart')}</strong>
        </div>
        <div id="mobile-cart-content" class="mobile-nav-cart-content"></div>
      </div>
      </div>
    </aside>
  `;

  function syncHeaderCartCount(event) {
    if (event?.detail?.totalItems !== undefined) {
      syncCartBadges(event.detail.totalItems);
      return;
    }
    syncCartBadges(cartSummary().totalItems);
  }

  syncHeaderCartCount();

  if (!host.dataset.cartListenerBound) {
    host.dataset.cartListenerBound = '1';
    window.addEventListener(CART_UPDATED_EVENT, syncHeaderCartCount);
  }

  if (!host.dataset.mobileCartListenerBound) {
    host.dataset.mobileCartListenerBound = '1';
    window.addEventListener(CART_UPDATED_EVENT, () => {
      const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
      if (panel?.classList.contains('cart-open')) {
        renderMobileCartView();
      }
    });
  }

  if (!host.dataset.cartResyncBound) {
    host.dataset.cartResyncBound = '1';
    const silentResyncCartUi = () => {
      syncCartBadges(cartSummary().totalItems);
      const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
      if (panel?.classList.contains('cart-open')) {
        renderMobileCartView();
      }
    };
    window.addEventListener('pageshow', silentResyncCartUi);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) silentResyncCartUi();
    });
    window.addEventListener('focus', silentResyncCartUi);
  }

  const logoutButton = document.querySelector('#logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearCustomerSession();
      location.href = '/';
    });
  }
  const mobileLogoutButton = document.querySelector('#mobile-logout-btn');
  if (mobileLogoutButton) {
    mobileLogoutButton.addEventListener('click', () => {
      clearCustomerSession();
      location.href = '/';
    });
  }

  ensureCartDrawer();
  document.querySelector('#cart-trigger-btn')?.addEventListener('click', toggleCartDrawer);
  document.querySelectorAll('[data-mobile-menu-action="open-cart"]').forEach((node) => {
    node.addEventListener('click', () => {
      openMobileCartView();
    });
  });

  document.querySelector('#mobile-menu-toggle')?.addEventListener('click', () => {
    const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
    if (panel?.classList.contains('cart-open')) {
      resetMobileSubmenu();
      return;
    }
    toggleMobileMenu();
  });
  document.querySelector(`#${MOBILE_MENU_OVERLAY_ID}`)?.addEventListener('click', closeMobileMenu);
  document.querySelectorAll('[data-mobile-menu-action="close"]').forEach((node) => {
    node.addEventListener('click', () => {
      const panel = document.querySelector(`#${MOBILE_MENU_PANEL_ID}`);
      if (panel?.classList.contains('cart-open')) {
        resetMobileSubmenu();
        return;
      }
      closeMobileMenu();
    });
  });
  document.querySelectorAll('.mobile-nav-panel a').forEach((node) => {
    node.addEventListener('click', closeMobileMenu);
  });
  document.querySelectorAll('[data-mobile-open-children]').forEach((node) => {
    node.addEventListener('click', () => {
      const slug = node.getAttribute('data-mobile-open-children') || '';
      const category = mobileCategoryBySlug.get(slug);
      if (!category) return;
      openMobileSubmenu(category);
    });
  });
  document.querySelectorAll('[data-mobile-menu-action="back-submenu"]').forEach((node) => {
    node.addEventListener('click', () => {
      resetMobileSubmenu();
    });
  });
  document.querySelectorAll('[data-mobile-menu-action="back-cart"]').forEach((node) => {
    node.addEventListener('click', () => {
      resetMobileSubmenu();
    });
  });
  document.querySelector('#mobile-cart-content')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const blockedCheckout = target.closest('[data-checkout-guard="1"]');
    if (blockedCheckout) {
      event.preventDefault();
      return;
    }
    const control = target.closest('[data-mobile-cart-action]');
    if (!control) return;
    const action = control.getAttribute('data-mobile-cart-action') || '';
    const key = control.getAttribute('data-key') || '';
    if (action === 'clear') {
      clearCart();
      renderMobileCartView();
      return;
    }
    if (action === 'remove') {
      removeCartItem(key);
      renderMobileCartView();
      return;
    }
    if (action === 'toggle-select') {
      const checkbox = control instanceof HTMLInputElement ? control : null;
      setCartItemSelected(key, Boolean(checkbox?.checked));
      renderMobileCartView();
      return;
    }
    if (action === 'minus') {
      const item = getCartItems().find((entry) => lineKey(entry) === key);
      if (!item) return;
      updateCartQuantity(key, Math.max(1, Number(item.quantity || 1) - 1));
      renderMobileCartView();
      return;
    }
    if (action === 'plus') {
      const item = getCartItems().find((entry) => lineKey(entry) === key);
      if (!item) return;
      updateCartQuantity(key, Number(item.quantity || 1) + 1);
      renderMobileCartView();
    }
  });

  if (!window.__mobileMenuEscBound) {
    window.__mobileMenuEscBound = true;
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    });
  }

  bindLocaleSwitchers();
  ensureSiteFooter();
  startCartAutoSync(5000);
}

export function requireCustomerLogin(redirectTo = '/account/login') {
  const { token, customer } = getCustomerSession();
  if (!token || !customer) {
    location.href = redirectTo;
    return null;
  }
  return { token, customer };
}

export function makeLineKey(item) {
  return lineKey(item);
}

export function initCustomSelects(scope = document) {
  const root = scope && typeof scope.querySelectorAll === 'function' ? scope : document;
  const selects = root.querySelectorAll('[data-custom-select]');
  if (!selects.length) return;

  function closeAllCustomSelects(except) {
    document.querySelectorAll('[data-custom-select].is-open').forEach((node) => {
      if (except && node === except) return;
      node.classList.remove('is-open');
      const trigger = node.querySelector('[data-select-trigger]');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  selects.forEach((selectNode) => {
    if (selectNode.dataset.bound === '1') return;
    selectNode.dataset.bound = '1';

    const trigger = selectNode.querySelector('[data-select-trigger]');
    const menu = selectNode.querySelector('[data-select-menu]');
    const input = selectNode.querySelector('[data-select-input]');
    if (!trigger || !menu || !input) return;

    const options = Array.from(selectNode.querySelectorAll('[data-select-option]'));
    const setSelection = (value, shouldFocusTrigger = false) => {
      input.value = value;
      options.forEach((option) => {
        const isSelected = String(option.dataset.value || '') === String(value || '');
        option.classList.toggle('active', isSelected);
        option.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        if (isSelected) {
          trigger.textContent = option.textContent || '';
          trigger.dataset.value = String(value || '');
        }
      });
      if (shouldFocusTrigger) trigger.focus();
    };

    const initialValue = trigger.dataset.value || input.value || options[0]?.dataset.value || '';
    setSelection(initialValue);

    trigger.addEventListener('click', () => {
      const willOpen = !selectNode.classList.contains('is-open');
      closeAllCustomSelects(selectNode);
      selectNode.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        setSelection(option.dataset.value || '', true);
        selectNode.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      });
    });
  });

  if (!window.__customSelectGlobalBound) {
    window.__customSelectGlobalBound = true;

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const currentSelect = target.closest('[data-custom-select]');
      document.querySelectorAll('[data-custom-select].is-open').forEach((node) => {
        if (currentSelect && node === currentSelect) return;
        node.classList.remove('is-open');
        const trigger = node.querySelector('[data-select-trigger]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('[data-custom-select].is-open').forEach((node) => {
        node.classList.remove('is-open');
        const trigger = node.querySelector('[data-select-trigger]');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}
