/**
 * Transliteration Service
 * Provides English to Hindi transliteration functionality
 */

// Basic English to Hindi transliteration mapping
const transliterationMap: Record<string, string> = {
  // Vowels
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  
  // Consonants
  'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
  'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'nya': 'ञ',
  'ta': 'ट', 'tha': 'ठ', 'da': 'ड', 'dha': 'ढ', 'na': 'ण',
  'ta2': 'त', 'tha2': 'थ', 'da2': 'द', 'dha2': 'ध', 'na2': 'न',
  'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
  'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व',
  'sha': 'श', 'shha': 'ष', 'sa': 'स', 'ha': 'ह',
  
  // Common words
  'rice': 'चावल', 'dal': 'दाल', 'oil': 'तेल', 'sugar': 'चीनी',
  'salt': 'नमक', 'flour': 'आटा', 'milk': 'दूध', 'tea': 'चाय',
  'coffee': 'कॉफी', 'bread': 'रोटी', 'water': 'पानी',
  'vegetable': 'सब्जी', 'fruit': 'फल', 'meat': 'मांस',
  'chicken': 'मुर्गी', 'fish': 'मछली', 'egg': 'अंडा',
  'onion': 'प्याज', 'potato': 'आलू', 'tomato': 'टमाटर',
  'garlic': 'लहसुन', 'ginger': 'अदरक', 'chili': 'मिर्च'
};

/**
 * Generate Hindi name from English text
 * @param englishText - English text to transliterate
 * @returns Hindi transliteration
 */
export function generateHindiName(englishText: string): string {
  if (!englishText) return '';
  
  const text = englishText.toLowerCase().trim();
  
  // Check for direct word mappings first
  if (transliterationMap[text]) {
    return transliterationMap[text];
  }
  
  // For compound words, try to split and transliterate
  const words = text.split(/[\s\-_]+/);
  const transliteratedWords = words.map(word => {
    if (transliterationMap[word]) {
      return transliterationMap[word];
    }
    
    // Basic phonetic transliteration for unknown words
    return phoneticTransliterate(word);
  });
  
  return transliteratedWords.join(' ');
}/**
 * 
Basic phonetic transliteration for unknown words
 * @param word - English word to transliterate
 * @returns Phonetic Hindi transliteration
 */
function phoneticTransliterate(word: string): string {
  if (!word) return '';
  
  let result = '';
  let i = 0;
  
  while (i < word.length) {
    let matched = false;
    
    // Try to match longer patterns first
    for (let len = 3; len >= 1; len--) {
      const substr = word.substr(i, len);
      if (transliterationMap[substr]) {
        result += transliterationMap[substr];
        i += len;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // Fallback for unmapped characters
      const char = word[i];
      switch (char) {
        case 'k': result += 'क'; break;
        case 'g': result += 'ग'; break;
        case 'c': result += 'च'; break;
        case 'j': result += 'ज'; break;
        case 't': result += 'त'; break;
        case 'd': result += 'द'; break;
        case 'n': result += 'न'; break;
        case 'p': result += 'प'; break;
        case 'b': result += 'ब'; break;
        case 'm': result += 'म'; break;
        case 'y': result += 'य'; break;
        case 'r': result += 'र'; break;
        case 'l': result += 'ल'; break;
        case 'v': case 'w': result += 'व'; break;
        case 's': result += 'स'; break;
        case 'h': result += 'ह'; break;
        default: result += char; break;
      }
      i++;
    }
  }
  
  return result;
}

/**
 * Validate if text contains Hindi characters
 * @param text - Text to validate
 * @returns True if contains Hindi characters
 */
export function containsHindi(text: string): boolean {
  const hindiRegex = /[\u0900-\u097F]/;
  return hindiRegex.test(text);
}

/**
 * Clean and normalize Hindi text
 * @param text - Hindi text to clean
 * @returns Cleaned Hindi text
 */
export function cleanHindiText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Get transliteration suggestions for a given English word
 * @param englishWord - English word
 * @returns Array of possible Hindi transliterations
 */
export function getTransliterationSuggestions(englishWord: string): string[] {
  const word = englishWord.toLowerCase().trim();
  const suggestions: string[] = [];
  
  // Direct mapping
  if (transliterationMap[word]) {
    suggestions.push(transliterationMap[word]);
  }
  
  // Phonetic transliteration
  const phonetic = phoneticTransliterate(word);
  if (phonetic && !suggestions.includes(phonetic)) {
    suggestions.push(phonetic);
  }
  
  // Common variations
  const variations = [
    word + 'a',
    word + 'i',
    word + 'u'
  ];
  
  variations.forEach(variation => {
    if (transliterationMap[variation]) {
      suggestions.push(transliterationMap[variation]);
    }
  });
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}