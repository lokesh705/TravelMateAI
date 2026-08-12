const https = require('https');

require('dotenv').config();

function requestPexels(url, apiKey) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          Authorization: apiKey,
        },
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : null;

            resolve({
              statusCode: res.statusCode,
              data: parsed,
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: null,
            });
          }
        });
      }
    );

    req.on('error', (error) => {
      console.error('Pexels request error:', error.message);

      resolve({
        statusCode: null,
        data: null,
      });
    });
  });
}

async function getAttractionImage(attractionName, city = '') {
  const name =
    typeof attractionName === 'string'
      ? attractionName.trim()
      : '';

  if (!name) {
    return {
      imageUrl: null,
      photographer: null,
      photographerUrl: null,
    };
  }

  const apiKey = process.env.PEXELS_API_KEY;

  console.log(
    'Pexels API key configured:',
    Boolean(apiKey)
  );

  if (!apiKey) {
    console.log('Pexels API key is missing.');

    return {
      imageUrl: null,
      photographer: null,
      photographerUrl: null,
    };
  }

  const queries = [];

  const cityName =
    typeof city === 'string'
      ? city.trim()
      : '';

  if (cityName) {
    queries.push(`${name} ${cityName}`);
  }

  queries.push(name);
  queries.push(`${name} India`);

  for (const query of queries) {
    try {
      const encodedQuery = encodeURIComponent(query);

      const url =
        `https://api.pexels.com/v1/search` +
        `?query=${encodedQuery}` +
        `&per_page=1`;

      console.log('Pexels search:', query);

      const response = await requestPexels(
        url,
        apiKey
      );

      console.log(
        'Pexels HTTP status:',
        response.statusCode
      );

      if (!response.data) {
        console.log(
          'Pexels response was empty.'
        );
        continue;
      }

      console.log(
        'Pexels total_results:',
        response.data.total_results ?? 'n/a'
      );

      console.log(
        'Pexels photos returned:',
        Array.isArray(response.data.photos)
          ? response.data.photos.length
          : 0
      );

      if (response.statusCode !== 200) {
        console.log(
          'Pexels error response:',
          response.data
        );

        continue;
      }

      if (
        !Array.isArray(response.data.photos) ||
        response.data.photos.length === 0
      ) {
        continue;
      }

      const photo = response.data.photos[0];

      const src = photo?.src || {};

      const imageUrl =
        src.large ||
        src.medium ||
        src.large2x ||
        src.original ||
        null;

      console.log(
        'Pexels image found:',
        Boolean(imageUrl)
      );

      if (!imageUrl) {
        continue;
      }

      return {
        imageUrl,
        photographer:
          photo?.photographer || null,
        photographerUrl:
          photo?.photographer_url || null,
      };
    } catch (error) {
      console.error(
        'Pexels image service error:',
        error.message || error
      );
    }
  }

  return {
    imageUrl: null,
    photographer: null,
    photographerUrl: null,
  };
}

module.exports = {
  getAttractionImage,
};