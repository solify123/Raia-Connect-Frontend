/**
 * Map product names to local asset images for consistent loading.
 */
export const productImages: Record<string, number> = {
  Aspirin: require('../../assets/Aspirin.jpg'),
  'Vitamin C': require('../../assets/Vitamin C.jpg'),
  Sunscreen: require('../../assets/Sunscreen.jpg'),
  'Hand Sanitizer': require('../../assets/HandSanitizer.jpg'),
  'Face Mask': require('../../assets/Face Mask.jpg'),
};

export function getProductImageSource(name: string): number | undefined {
  return productImages[name];
}
