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
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

function Spinner() {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code && !processed) {
      handleAuthorization(code);
      // Clear the code from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [processed]);

  const handleAuthorization = async (code) => {
    if (processed) return;
    setLoading(true);
    setError(null);
    try {
      setProcessed(true);
      const accessToken = await getAccessToken(code);
      const data = await fetchTreeData(accessToken);
      generateExcel(data);
      setSuccess(true);
    } catch (err) {
      console.error("Error:", err);
      if (
        err.response &&
        err.response.data &&
        err.response.data.error === "invalid_grant"
      ) {
        setError("Authorization code expired. Please try authorizing again.");
      } else {
        setError(
          err.message || "An error occurred while processing your request"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setProcessed(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FamilySearch Tree Viewer</h1>
      {loading ? (
        <div className="text-center mt-8">
          <Spinner />
          <p className="mt-4">Processing your request...</p>
        </div>
      ) : error ? (
        <div className="text-center mt-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
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
