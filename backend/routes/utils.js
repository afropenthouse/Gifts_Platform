const express = require('express');
const axios = require('axios');

module.exports = () => {
  const router = express.Router();

  // Get Country Codes
  router.get('/country-codes', async (req, res) => {
    try {
      // Fetch only the fields we need to keep the payload small
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,flags,idd', {
        timeout: 10000 // 10 second timeout
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response from country API');
      }

      const countryCodes = response.data
        .map(country => {
          // Ensure the country has a calling code
          if (!country.idd || !country.idd.root) {
            return null;
          }
          
          // The API provides a root and suffixes. We'll combine them.
          // e.g., root: '+1', suffixes: ['242', '246', ...] -> We'll just use the root for simplicity.
          const code = country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : '');

          return {
            code: code,
            country: country.name.common,
            flag: country.flags.svg, // Using SVG for better quality
          };
        })
        .filter(Boolean) // Filter out any null entries
        .filter(item => /^[\d\+]+$/.test(item.code)); // Ensure the code is a valid phone code format

      // Sort the list alphabetically by country name for better UX
      countryCodes.sort((a, b) => a.country.localeCompare(b.country));

      res.json(countryCodes);
    } catch (err) {
      console.error('Error fetching country codes:', err.message);
      // Fallback to a minimal list if API fails
      res.json([
        { code: '+234', country: 'Nigeria', flag: '' },
        { code: '+1', country: 'USA/Canada', flag: '' },
        { code: '+44', country: 'United Kingdom', flag: '' }
      ]);
    }
  });

  return router;
};
