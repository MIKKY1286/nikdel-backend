export const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate a random 6 character string (alphanumeric)
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `ORD-${year}${month}${day}-${randomStr}`;
};
