import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchTreeData, generateExcel } from "./getTree";

const CLIENT_ID = "b00VC7JDZH9EBLMP85GU";
const REDIRECT_URI = "http://localhost:3000";
const AUTH_URL = `https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
const TOKEN_URL = "https://identbeta.familysearch.org/cis-web/oauth2/v3/token";

async function getAccessToken(code) {
  const requestData = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code: code,
  });

  try {
    const response = await axios.post(TOKEN_URL, requestData.toString(), {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log("Access token response:", response.data);
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      handleAuthorization(code);
    }
  }, []);

  const handleAuthorization = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken(code);
      const data = await fetchTreeData(accessToken);
      generateExcel(data);
      setSuccess(true);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.message || "An error occurred while processing your request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FamilySearch Tree Viewer</h1>
      {loading ? (
        <div className="text-center mt-8">Processing your request...</div>
      ) : error ? (
        <div className="text-center mt-8 text-red-500">{error}</div>
      ) : success ? (
        <div className="text-center mt-8 text-green-500">
          Data was downloaded successfully!
        </div>
      ) : (
        <a
          href={AUTH_URL}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Authorize with FamilySearch
        </a>
      )}
    </div>
  );
}

export default App;
