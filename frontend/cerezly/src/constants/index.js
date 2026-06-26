// constants/index.js (müştəri tərəf)

// Məhsul kateqoriyaları
export const PRODUCT_CATEGORIES = {
  SALTY_NUTS: 'saltyNuts',
  CHOCOLATE_NUTS: 'chocolateNuts',
  DRIED_FRUITS: 'driedFruits',
  GIFT_PACKAGES: 'giftPackages'
};

export const PRODUCT_CATEGORY_LABELS = {
  [PRODUCT_CATEGORIES.SALTY_NUTS]: 'Duzaqlanmış Qoz-Fındıq',
  [PRODUCT_CATEGORIES.CHOCOLATE_NUTS]: 'Şokoladlı Qoz-Fındıq',
  [PRODUCT_CATEGORIES.DRIED_FRUITS]: 'Quru Meyvələr',
  [PRODUCT_CATEGORIES.GIFT_PACKAGES]: 'Hədiyyə Paketləri'
};

// Minimum sifariş miqdarı (qr)
export const MIN_ORDER_GRAMS = 100;

// Səhifələmə
export const DEFAULT_PAGE_SIZE = 16;

// Çəki formatları
export const WEIGHT_FORMATS = {
  GRAMS: 'qr',
  KILOGRAMS: 'kq'
};

// Valyuta
export const CURRENCY = 'AZN';