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
  const [authCode, setAuthCode] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setAuthCode(code);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log("Getting access token...");
      const accessToken = await getAccessToken(authCode);
      console.log("Access token received:", accessToken);

      console.log("Fetching tree data...");
      const data = await fetchTreeData(accessToken);
      console.log("Tree data received:", data);

      setTreeData(data);
      generateExcel(data);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExcel = () => {
    if (treeData) {
      generateExcel(treeData);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FamilySearch Tree Viewer</h1>
      <a
        href={AUTH_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline mb-4 inline-block"
      >
        Authorize Application
      </a>
      <form onSubmit={handleSubmit} className="mb-6">
        <input
          type="text"
          value={authCode}
          onChange={(e) => setAuthCode(e.target.value)}
          placeholder="Enter authorization code"
          className="border border-gray-300 rounded px-3 py-2 w-full mb-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Tree Data and Generate Excel"}
        </button>
        {treeData && (
          <button
            onClick={handleGenerateExcel}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2"
          >
            Generate Excel
          </button>
        )}
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {treeData && (
        <div>
          <h2 className="text-2xl font-bold mb-2">Tree Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
            {JSON.stringify(treeData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;
