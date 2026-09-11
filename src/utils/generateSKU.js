export const generateSKU = (productName, categoryName) => {
  // Extract up to first 3 letters of category, uppercase
  const catPrefix = (categoryName || 'GEN').substring(0, 3).toUpperCase();
  
  // Extract up to first 3 letters of product, uppercase
  const prodPrefix = (productName || 'PRD').substring(0, 3).toUpperCase();
  
  // Generate a random 6-digit number
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  
  return `${catPrefix}-${prodPrefix}-${randomNum}`;
};
