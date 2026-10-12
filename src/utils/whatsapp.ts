import { Product } from '../types';

/**
 * Strips all non-digit characters from the phone number
 * so it complies with WhatsApp's wa.me specification
 */
export function cleanWhatsAppNumber(phoneNumber: string): string {
  if (!phoneNumber) return '917349095032';
  // Remove +, spaces, hyphens, parentheses, etc.
  let cleaned = phoneNumber.replace(/[^0-9]/g, '');
  // If standard 10-digit Indian phone number is provided, automatically prepend country code 91
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    cleaned = '91' + cleaned;
  }
  return cleaned || '917349095032';
}

/**
 * Constructs the official WhatsApp click-to-chat URL
 */
export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanNumber = cleanWhatsAppNumber(phoneNumber);
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Builds the exact required order message format
 */
export function buildWhatsAppOrderMessage(
  product: Product,
  options: {
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    productUrl?: string;
    currencySymbol?: string;
    greeting?: string;
  }
): string {
  const {
    quantity,
    selectedSize,
    selectedColor,
    productUrl = typeof window !== 'undefined' ? window.location.href : '',
    currencySymbol = '₹',
    greeting = 'Hello! I am interested in ordering the following product.',
  } = options;

  let variationText = 'None / Standard';
  if (selectedSize && selectedColor) {
    variationText = `Size: ${selectedSize}, Color: ${selectedColor}`;
  } else if (selectedSize) {
    variationText = `Size: ${selectedSize}`;
  } else if (selectedColor) {
    variationText = `Color: ${selectedColor}`;
  }

  const formattedPrice = `${currencySymbol}${product.price.toLocaleString('en-IN')}`;

  return `${greeting}

Product: ${product.name}
Price: ${formattedPrice}
Quantity: ${quantity}
Variation: ${variationText}
Product Link: ${productUrl}

Please provide the ordering and delivery details.`;
}

/**
 * Builds general product inquiry message
 */
export function buildWhatsAppInquiryMessage(
  product: Product,
  currencySymbol = '₹',
  productUrl = typeof window !== 'undefined' ? window.location.href : ''
): string {
  const formattedPrice = `${currencySymbol}${product.price.toLocaleString('en-IN')}`;
  return `Hello! I have an inquiry regarding: ${product.name} (${formattedPrice}).

Product Link: ${productUrl}

Could you please share more details or availability?`;
}

/**
 * General store chat message
 */
export function buildGeneralChatMessage(storeName: string): string {
  return `Hello ${storeName}! I am browsing your online store and have an inquiry about your products.`;
}
