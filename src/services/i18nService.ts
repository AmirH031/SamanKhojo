import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      nav: {
        home: 'Home',
        shops: 'All Shops',
        bag: 'My Bag',
        admin: 'Admin'
      },

      // Search
      search: {
        title: 'Enhanced Search',
        placeholder: 'Search for items, shops, or locations...',
        shop: 'Shop',
        item: 'Item',
        menu: 'Menu',
        nearMe: 'Near Me',
        voiceSearch: 'Voice Search',
        voiceNotSupported: 'Voice search not supported in this browser',
        recentSearches: 'Recent searches',
        noResults: 'No results found',
        noResultsDesc: 'Try different keywords or check spelling',
        filters: 'Filters',
        shopType: 'Shop Type',
        restaurant: 'Restaurant',
        cafe: 'Cafe',
        hotel: 'Hotel',
        minimumRating: 'Minimum Rating',
        availability: 'Availability',
        openNow: 'Open Now',
        clearFilters: 'Clear Filters',
        resultsFound: 'results found',
        reviews: 'reviews',
        tryDifferentKeywords: 'Try searching with different keywords'
      },

      // Home page
      home: {
        title: 'SamanKhojo',
        subtitle: 'Aapka Bazar, Aapke Haath Mein',
        description: 'SamanKhojo helps you instantly find nearby shops for daily needs like sugar, flour, oil, and more – with just a click.',
        searchPlaceholder: 'Search for items... e.g., "Need 1kg aata" or "Kya tumhare paas cheeni hai?"',
        browseShops: 'Browse All Shops',
        featuredShops: 'Featured Shops',
        howItWorks: 'How It Works',
        howItWorksDesc: 'Simple steps to find what you need',
        step1: 'Search in Your Language',
        step1Desc: 'Type or speak in Hindi, English, or mix. Our AI understands natural language queries.',
        step2: 'Get Smart Results',
        step2Desc: 'AI processes your query and finds nearby shops with the items you need.',
        step3: 'Connect via WhatsApp',
        step3Desc: 'Get shop details, location, and contact information instantly on WhatsApp.'
      },

      // Shop details
      shop: {
        contact: 'Contact',
        call: 'Call',
        map: 'Map',
        owner: 'Owner',
        phone: 'Phone',
        address: 'Address',
        items: 'Items',
        reviews: 'Reviews',
        rating: 'Rating',
        open: 'Open',
        closed: 'Closed',
        verified: 'Verified',
        featured: 'Featured',
        featuredDescription: 'Top-rated shops in your area'
      },

      // Restaurant/Menu
      restaurant: {
        open: 'Open Now',
        closed: 'Closed',
        indianCuisine: 'Indian Cuisine',
        searchMenu: 'Search menu items...',
        menuNotAvailable: 'Menu Not Available',
        contactForMenu: 'Please contact the restaurant for menu details',
        call: 'Call Now',
        whatsapp: 'WhatsApp',
        whatsappMessage: 'Hi {{shopName}}, I would like to see your menu. Can you please share it?',
        addToBag: 'Add to Bag',
        viewBag: 'View Bag',
        items: 'items',
        noItemsFound: 'No menu items found',
        tryDifferentSearch: 'Try searching with different keywords'
      },

      // Shopping
      shopping: {
        selectShop: 'Select Shop',
        searchItems: 'Search Items',
        yourBag: 'Your Bag',
        bagEmpty: 'Your bag is empty',
        bagEmptyDesc: 'Start adding items from shops to your bag',
        bagItems: 'Bag Items',
        myBag: 'My Bag',
        addToBag: 'Add to Bag',
        viewBag: 'View Bag',
        bagList: 'Bag List',
        manageBag: 'Manage Bag',
        removeFromBag: 'Remove from Bag',
        clearBag: 'Clear Bag',
        bagTotal: 'Total Items in Bag'
      },

      // Admin
      admin: {
        dashboard: 'Admin Dashboard',
        shops: 'Shops',
        items: 'Items',
        analytics: 'Analytics',
        homepage: 'Homepage',
        addShop: 'Add Shop',
        editShop: 'Edit Shop',
        shopName: 'Shop Name',
        ownerName: 'Owner Name',
        shopType: 'Shop Type',
        address: 'Address',
        phone: 'Phone',
        mapLink: 'Map Link',
        useMyLocation: 'Use My Location',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit'
      },

      // Shop types
      shopTypes: {
        grocery: 'Grocery Store',
        restaurant: 'Restaurant',
        cafe: 'Cafe',
        hotel: 'Hotel',
        stationery: 'Stationery',
        mobile: 'Mobile Store',
        clinic: 'Clinic',
        cosmetic: 'Cosmetic Shop',
        pharmacy: 'Pharmacy',
        electronics: 'Electronics',
        clothing: 'Clothing',
        hardware: 'Hardware',
        bakery: 'Bakery',
        office: 'Office',
        other: 'Other'
      },

      // Categories
      categories: {
        'Kirana / General Store': 'Kirana / General Store',
        'Fruits & Vegetables (Sabzi Mandi)': 'Fruits & Vegetables (Sabzi Mandi)',
        'Dairy & Bakery': 'Dairy & Bakery',
        'Stationery & Printing': 'Stationery & Printing',
        'Cosmetics & Personal Care': 'Cosmetics & Personal Care',
        'Clothing & Garments': 'Clothing & Garments',
        'Footwear & Bags': 'Footwear & Bags',
        'Electronics & Mobile': 'Electronics & Mobile',
        'Jewellery & Imitation': 'Jewellery & Imitation',
        'Medical & Healthcare': 'Medical & Healthcare',
        'Furniture & Home Needs': 'Furniture & Home Needs',
        'Hardware & Building Material': 'Hardware & Building Material',
        'Sports & Toys': 'Sports & Toys',
        'Sweet Shops (Mithai)': 'Sweet Shops (Mithai)',
        'Meat / Fish / Chicken / Eggs': 'Meat / Fish / Chicken / Eggs',
        'Tailor / Laundry / Boutique': 'Tailor / Laundry / Boutique',
        'Gift & Decoration': 'Gift & Decoration'
      },

      // Shops page
      shops: {
        title: 'Discover Local Shops',
        subtitle: 'Find the best local businesses in your area with our comprehensive directory',
        allCategories: 'All Categories',
        openNow: 'Open Now',
        verified: 'Verified',
        featured: 'Featured',
        nearMe: 'Near Me',
        useLocation: 'Use Location',
        sortByName: 'Sort by Name',
        sortByDistance: 'Sort by Distance',
        sortByRating: 'Sort by Rating',
        sortByNewest: 'Sort by Newest',
        noShopsFound: 'No shops found',
        clearFilters: 'Clear All Filters',
        popularCategories: 'Popular Categories',
        categoryOverview: 'Category Overview'
      },

      // Footer
      footer: {
        quickLinks: 'Quick Links',
        connectWithUs: 'Connect With Us'
      },

      // Office & Public Facilities
      office: {
        government_office: 'Government Office',
        private_office: 'Private Office',
        public_toilet: 'Public Toilet',
        public_garden: 'Public Garden/Park',
        telecom_office: 'Telecom Office',
        bank: 'Bank',
        atm: 'ATM',
        hospital: 'Hospital/Clinic',
        school: 'School/Educational',
        other: 'Other Public Facility',
        department: 'Department',
        services: 'Services',
        workingDays: 'Working Days',
        openTime: 'Opening Time',
        closeTime: 'Closing Time',
        contactPerson: 'Contact Person',
        facilityType: 'Facility Type',
        facilities: 'Available Facilities',
        description: 'Description'
      },

      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        back: 'Back',
        next: 'Next',
        submit: 'Submit',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        clear: 'Clear',
        all: 'All',
        none: 'None',
        yes: 'Yes',
        no: 'No',
        about: 'About',
        feedback: 'Feedback',
        reviews: 'Reviews',
        rating: 'Rating',
        settings: 'Settings'
      }
    }
  },
  hi: {
    translation: {
      // Navigation
      nav: {
        home: 'होम',
        shops: 'सभी दुकानें',
        bag: 'मेरा बैग',
        admin: 'एडमिन'
      },

      // Search
      search: {
        title: 'उन्नत खोज',
        placeholder: 'सामान, दुकान या स्थान खोजें...',
        shop: 'दुकान',
        item: 'सामान',
        menu: 'मेन्यू',
        nearMe: 'मेरे पास',
        voiceSearch: 'आवाज़ से खोजें',
        voiceNotSupported: 'इस ब्राउज़र में आवाज़ से खोज समर्थित नहीं है',
        recentSearches: 'हाल की खोजें',
        noResults: 'कोई परिणाम नहीं मिला',
        noResultsDesc: 'अलग शब्दों का प्रयास करें या स्पेलिंग जांचें',
        filters: 'फिल्टर',
        shopType: 'दुकान का प्रकार',
        restaurant: 'रेस्टोरेंट',
        cafe: 'कैफे',
        hotel: 'होटल',
        minimumRating: 'न्यूनतम रेटिंग',
        availability: 'उपलब्धता',
        openNow: 'अभी खुला',
        clearFilters: 'फिल्टर साफ़ करें',
        resultsFound: 'परिणाम मिले',
        reviews: 'समीक्षाएं',
        tryDifferentKeywords: 'अलग शब्दों से खोजने की कोशिश करें'
      },

      // Home page
      home: {
        title: 'समानखोजो',
        subtitle: 'स्थानीय दुकानें तुरंत खोजें',
        description: 'समानखोजो आपको चीनी, आटा, तेल जैसी दैनिक जरूरतों के लिए आस-पास की दुकानें तुरंत खोजने में मदद करता है।',
        searchPlaceholder: 'सामान खोजें... जैसे "1 किलो आटा चाहिए" या "क्या तुम्हारे पास चीनी है?"',
        browseShops: 'सभी दुकानें देखें',
        featuredShops: 'फीचर्ड दुकानें',
        howItWorks: 'यह कैसे काम करता है',
        howItWorksDesc: 'आपकी जरूरत की चीज़ें खोजने के आसान तरीके',
        step1: 'अपनी भाषा में खोजें',
        step1Desc: 'हिंदी, अंग्रेजी या मिश्रित भाषा में टाइप करें। हमारा AI प्राकृतिक भाषा को समझता है।',
        step2: 'स्मार्ट परिणाम पाएं',
        step2Desc: 'AI आपकी खोज को प्रोसेस करता है और आपकी जरूरत के सामान वाली दुकानें ढूंढता है।',
        step3: 'व्हाट्सऐप से जुड़ें',
        step3Desc: 'दुकान की जानकारी, स्थान और संपर्क विवरण तुरंत व्हाट्सऐप पर पाएं।'
      },

      // Shop details
      shop: {
        contact: 'संपर्क करें',
        call: 'कॉल करें',
        map: 'मैप',
        owner: 'मालिक',
        phone: 'फोन',
        address: 'पता',
        items: 'सामान',
        reviews: 'समीक्षाएं',
        rating: 'रेटिंग',
        open: 'खुला',
        closed: 'बंद',
        verified: 'सत्यापित',
        featured: 'फीचर्ड',
        featuredDescription: 'आपके क्षेत्र की टॉप रेटेड दुकानें'
      },

      // Restaurant/Menu
      restaurant: {
        open: 'अभी खुला',
        closed: 'बंद',
        indianCuisine: 'भारतीय व्यंजन',
        searchMenu: 'मेन्यू आइटम खोजें...',
        menuNotAvailable: 'मेन्यू उपलब्ध नहीं',
        contactForMenu: 'मेन्यू की जानकारी के लिए रेस्टोरेंट से संपर्क करें',
        call: 'अभी कॉल करें',
        whatsapp: 'व्हाट्सऐप',
        whatsappMessage: 'नमस्ते {{shopName}}, मैं आपका मेन्यू देखना चाहूंगा। क्या आप इसे शेयर कर सकते हैं?',
        addToBag: 'बैग में जोड़ें',
        viewBag: 'बैग देखें',
        items: 'आइटम',
        noItemsFound: 'कोई मेन्यू आइटम नहीं मिला',
        tryDifferentSearch: 'अलग शब्दों से खोजने की कोशिश करें'
      },

      // Shopping
      shopping: {
        selectShop: 'दुकान चुनें',
        searchItems: 'सामान खोजें',
        yourBag: 'आपका बैग',
        bagEmpty: 'आपका बैग खाली है',
        bagEmptyDesc: 'दुकानों से सामान अपने बैग में जोड़ना शुरू करें',
        bagItems: 'बैग आइटम',
        myBag: 'मेरा बैग',
        addToBag: 'बैग में जोड़ें',
        viewBag: 'बैग देखें',
        bagList: 'बैग सूची',
        manageBag: 'बैग प्रबंधित करें',
        removeFromBag: 'बैग से हटाएं',
        clearBag: 'बैग साफ करें',
        bagTotal: 'बैग में कुल आइटम'
      },

      // Admin
      admin: {
        dashboard: 'एडमिन डैशबोर्ड',
        shops: 'दुकानें',
        items: 'सामान',
        analytics: 'एनालिटिक्स',
        homepage: 'होमपेज',
        addShop: 'दुकान जोड़ें',
        editShop: 'दुकान संपादित करें',
        shopName: 'दुकान का नाम',
        ownerName: 'मालिक का नाम',
        shopType: 'दुकान का प्रकार',
        address: 'पता',
        phone: 'फोन',
        mapLink: 'मैप लिंक',
        useMyLocation: 'मेरी लोकेशन का उपयोग करें',
        save: 'सेव करें',
        cancel: 'रद्द करें',
        delete: 'डिलीट करें',
        edit: 'संपादित करें'
      },

      // Shop types
      shopTypes: {
        grocery: 'किराना स्टोर',
        restaurant: 'रेस्टोरेंट',
        cafe: 'कैफे',
        hotel: 'होटल',
        stationery: 'स्टेशनरी',
        mobile: 'मोबाइल स्टोर',
        clinic: 'क्लिनिक',
        cosmetic: 'कॉस्मेटिक शॉप',
        pharmacy: 'फार्मेसी',
        electronics: 'इलेक्ट्रॉनिक्स',
        clothing: 'कपड़े',
        hardware: 'हार्डवेयर',
        bakery: 'बेकरी',
        office: 'दफ्तर',
        other: 'अन्य'
      },

      // Categories
      categories: {
        'Kirana / General Store': 'किराना / जनरल स्टोर',
        'Fruits & Vegetables (Sabzi Mandi)': 'फल और सब्जी (सब्जी मंडी)',
        'Dairy & Bakery': 'डेयरी और बेकरी',
        'Stationery & Printing': 'स्टेशनरी और प्रिंटिंग',
        'Cosmetics & Personal Care': 'कॉस्मेटिक्स और व्यक्तिगत देखभाल',
        'Clothing & Garments': 'कपड़े और वस्त्र',
        'Footwear & Bags': 'जूते और बैग',
        'Electronics & Mobile': 'इलेक्ट्रॉनिक्स और मोबाइल',
        'Jewellery & Imitation': 'आभूषण और नकली',
        'Medical & Healthcare': 'चिकित्सा और स्वास्थ्य सेवा',
        'Furniture & Home Needs': 'फर्नीचर और घरेलू जरूरतें',
        'Hardware & Building Material': 'हार्डवेयर और निर्माण सामग्री',
        'Sports & Toys': 'खेल और खिलौने',
        'Sweet Shops (Mithai)': 'मिठाई की दुकान',
        'Meat / Fish / Chicken / Eggs': 'मांस / मछली / चिकन / अंडे',
        'Tailor / Laundry / Boutique': 'दर्जी / धुलाई / बुटीक',
        'Gift & Decoration': 'उपहार और सजावट'
      },

      // Shops page
      shops: {
        title: 'स्थानीय दुकानें खोजें',
        subtitle: 'अपने क्षेत्र में सर्वोत्तम स्थानीय व्यवसायों को हमारी व्यापक निर्देशिका के साथ खोजें',
        allCategories: 'सभी श्रेणियां',
        openNow: 'अभी खुला',
        verified: 'सत्यापित',
        featured: 'फीचर्ड',
        nearMe: 'मेरे पास',
        useLocation: 'स्थान का उपयोग करें',
        sortByName: 'नाम से क्रमबद्ध करें',
        sortByDistance: 'दूरी से क्रमबद्ध करें',
        sortByRating: 'रेटिंग से क्रमबद्ध करें',
        sortByNewest: 'नवीनतम से क्रमबद्ध करें',
        noShopsFound: 'कोई दुकान नहीं मिली',
        clearFilters: 'सभी फिल्टर साफ़ करें',
        popularCategories: 'लोकप्रिय श्रेणियां',
        categoryOverview: 'श्रेणी अवलोकन'
      },

      // Footer
      footer: {
        quickLinks: 'त्वरित लिंक',
        connectWithUs: 'हमसे जुड़ें'
      },

      // Office & Public Facilities
      office: {
        government_office: 'सरकारी दफ्तर',
        private_office: 'प्राइवेट दफ्तर',
        public_toilet: 'सार्वजनिक शौचालय',
        public_garden: 'सार्वजनिक बगीचा/पार्क',
        telecom_office: 'टेलीकॉम दफ्तर',
        bank: 'बैंक',
        atm: 'एटीएम',
        hospital: 'अस्पताल/क्लिनिक',
        school: 'स्कूल/शैक्षणिक',
        other: 'अन्य सार्वजनिक सुविधा',
        department: 'विभाग',
        services: 'सेवाएं',
        workingDays: 'कार्य दिवस',
        openTime: 'खुलने का समय',
        closeTime: 'बंद होने का समय',
        contactPerson: 'संपर्क व्यक्ति',
        facilityType: 'सुविधा का प्रकार',
        facilities: 'उपलब्ध सुविधाएं',
        description: 'विवरण'
      },

      // Common
      common: {
        loading: 'लोड हो रहा है...',
        error: 'त्रुटि',
        success: 'सफलता',
        back: 'वापस',
        next: 'अगला',
        submit: 'जमा करें',
        close: 'बंद करें',
        search: 'खोजें',
        filter: 'फिल्टर',
        sort: 'क्रमबद्ध करें',
        clear: 'साफ करें',
        all: 'सभी',
        none: 'कोई नहीं',
        yes: 'हां',
        no: 'नहीं',
        about: 'के बारे में',
        feedback: 'फीडबैक',
        reviews: 'समीक्षाएं',
        rating: 'रेटिंग',
        settings: 'सेटिंग्स'
      }
    }
  }
};

// Get saved language preference
const getSavedLanguage = (): string => {
  return localStorage.getItem('preferred-language') || 'en';
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: getSavedLanguage(), // Use saved language
    debug: false,

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;