declare module 'sanscript' {
    interface SanscriptStatic {
        /**
         * Transliterate text from one script to another
         * @param text - The text to transliterate
         * @param from - Source script (e.g., 'itrans', 'hk', 'slp1', 'velthuis')
         * @param to - Target script (e.g., 'devanagari', 'bengali', 'gujarati', 'gurmukhi', 'kannada', 'malayalam', 'oriya', 'tamil', 'telugu')
         * @returns Transliterated text
         */
        t(text: string, from: string, to: string): string;

        /**
         * Check if a scheme is supported
         * @param scheme - The scheme name to check
         * @returns True if the scheme is supported
         */
        isRomanScheme(scheme: string): boolean;

        /**
         * Get all available schemes
         * @returns Array of scheme names
         */
        getSchemes(): string[];
    }

    const Sanscript: SanscriptStatic;
    export default Sanscript;
}