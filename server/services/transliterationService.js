const { Sanscript } = require('@indic-transliteration/sanscript');

/**
 * Server-side transliteration for bulk uploads
 */
function transliterateToHindi(englishText) {
  if (!englishText || englishText.trim() === '') return '';
  
  try {
    const cleanText = englishText.trim();
    const hindiText = Sanscript.t(cleanText, 'itrans', 'devanagari');
    return hindiText;
  } catch (error) {
    console.error('Server transliteration error:', error);
    return '';
  }
}

/**
 * Auto-transliterate with smart detection
 */
function autoTransliterate(text) {
  if (!text || text.trim() === '') return '';
  
  // Check if text is already in Devanagari script
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(text)) {
    return text; // Already in Hindi
  }
  
  // Check if text contains only English characters
  const englishPattern = /^[a-zA-Z\s\-_.,()]+$/;
  if (!englishPattern.test(text)) {
    return ''; // Contains special characters, skip
  }
  
  return transliterateToHindi(text);
}

/**
 * Batch transliterate for CSV uploads
 */
function batchTransliterate(items) {
  return items.map(item => {
    const result = { ...item };
    
    // Transliterate name if hindi_name is empty
    if (item.name && (!item.hindi_name || item.hindi_name.trim() === '')) {
      result.hindi_name = autoTransliterate(item.name);
    }
    
    // Transliterate category if category_hindi is empty
    if (item.category && (!item.category_hindi || item.category_hindi.trim() === '')) {
      result.category_hindi = autoTransliterate(item.category);
    }
    
    return result;
  });
}

module.exports = {
  transliterateToHindi,
  autoTransliterate,
  batchTransliterate
};