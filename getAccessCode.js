const axios = require("axios");
const qs = require("querystring");
const readline = require("readline");

const CLIENT_ID = "b00VC7JDZH9EBLMP85GU";
// const REDIRECT_URI = "http://localhost:3000";
const REDIRECT_URI = "https://kindred-lands.vercel.app";
const AUTH_URL = `https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
const TOKEN_URL = "https://identbeta.familysearch.org/cis-web/oauth2/v3/token";

console.log("Please visit this URL to authorize the application:", AUTH_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Please enter the authorization code from the redirect URL: ",
  (code) => {
    console.log(`Authorization code received: ${code}`);
    getAccessToken(code);
    rl.close();
  }
);

async function getAccessToken(code) {
  const requestData = {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code: code,
  };

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

module.exports = { getAccessToken };
