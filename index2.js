const axios = require("axios");
const qs = require("querystring");

const TOKEN_URL = "https://identbeta.familysearch.org/cis-web/oauth2/v3/token";
const requestData = {
  grant_type: "authorization_code",
  client_id: "b00VC7JDZH9EBLMP85GU",
  redirect_uri: "http://localhost:3000",
  code: "AUTHORIZATION_CODE",
};

async function getAccessToken() {
  try {
    const response = await axios.post(TOKEN_URL, qs.stringify(requestData), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("Access Token:", response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

getAccessToken();
