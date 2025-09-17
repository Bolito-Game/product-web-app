const API_URL = import.meta.env.VITE_GRAPHQL_API_URL;
const API_KEY = import.meta.env.VITE_GRAPHQL_API_KEY;

// Helper function to make GraphQL requests
async function fetchGraphQL(query, variables = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonResponse = await response.json();
    if (jsonResponse.errors) {
      console.error('GraphQL Errors:', jsonResponse.errors);
      throw new Error('Error fetching data from GraphQL API.');
    }

    return jsonResponse.data;
  } catch (error) {
    console.error('Network or GraphQL Error:', error);
    throw error;
  }
}

// --- API Functions ---

// Get user's locale (language and country)
export function getUserLocale() {
    const locale = navigator.language || 'en-US'; // Default to en-US
    const [lang, country] = locale.split('-');
    return { lang: lang.toLowerCase(), country: (country || 'us').toLowerCase() };
}

// Query for all products with their relevant localization
export async function getAllProducts(nextToken = null) {
  const { lang, country } = getUserLocale();
  const query = `
    query GetAllProductsByLocalization($lang: String!, $country: String!, $limit: Int, $nextToken: String) {
      getAllProductsByLocalization(lang: $lang, country: $country, limit: 20, nextToken: $nextToken) {
        items {
          sku
          imageUrl
          localizations {
            productName
            description
            price
            currency
          }
        }
        nextToken
      }
    }
  `;
  const data = await fetchGraphQL(query, { lang, country, nextToken });
  return data.getAllProductsByLocalization;
}

// Query for all categories in a specific language
export async function getAllCategories() {
  const { lang } = getUserLocale();
  const query = `
    query GetAllCategoriesByLanguage($lang: String!) {
      getAllCategoriesByLanguage(lang: $lang) {
        items {
          category
          text
        }
        nextToken
      }
    }
  `;
  const data = await fetchGraphQL(query, { lang });
  return data.getAllCategoriesByLanguage.items;
}

// Query for products within a specific category
export async function getProductsByCategory(category) {
  const { lang, country } = getUserLocale();
  const query = `
    query GetProductsByCategory($category: String!, $lang: String!, $country: String!) {
      getProductsByCategory(category: $category, lang: $lang, country: $country) {
        sku
        imageUrl
        localizations {
          productName
          description
          price
          currency
        }
      }
    }
  `;
  const data = await fetchGraphQL(query, { category, lang, country });
  return data.getProductsByCategory;
}