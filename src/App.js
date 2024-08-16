import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchTreeData, generateExcel } from "./getTree";

const CLIENT_ID = "b00VC7JDZH9EBLMP85GU";
const REDIRECT_URI = "http://localhost:3000";
// const REDIRECT_URI = "https://kindred-lands.vercel.app";
const BASE_AUTH_URL =
  "https://identbeta.familysearch.org/cis-web/oauth2/v3/authorization";
const TOKEN_URL = "https://identbeta.familysearch.org/cis-web/oauth2/v3/token";
const LOGOUT_URL = "https://apibeta.familysearch.org/platform/logout";

function getAuthUrl() {
  const uniqueId =
    Date.now().toString(36) + Math.random().toString(36).substr(2);
  return `${BASE_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${uniqueId}`;
}

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
  const [accessToken, setAccessToken] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code && !accessToken) {
      handleAuthorization(code);
      // Clear the code from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [accessToken]);

  useEffect(() => {
    const logoutLogs = localStorage.getItem("logoutLogs");
    if (logoutLogs) {
      console.log("Logout logs:", JSON.parse(logoutLogs));
      localStorage.removeItem("logoutLogs");
    }
  }, []);

  const handleAuthorization = async (code) => {
    if (accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setAccessToken(true);
      const accessToken = await getAccessToken(code);
      setAccessToken(accessToken);
      await fetchAndGenerateExcel(accessToken);
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

  const fetchAndGenerateExcel = async (token) => {
    try {
      setProcessedCount(0); // Reset processed count
      setTotalCount(0); // Reset total count
      const { data } = await fetchTreeData(
        token,
        setProcessedCount,
        setTotalCount
      );
      generateExcel(data);
      setSuccess(true);
      setCompletedSets((prev) => prev + 1);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    }
  };

  const handleFetchAnother = () => {
    setSuccess(false);
    setError(null);
    fetchAndGenerateExcel(accessToken);
  };

  const handleLogoutAndAuthorize = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log("Starting logout and authorization process...");

    try {
      // Attempt to logout first
      console.log("Attempting to logout...");
      console.log(
        "Current access token:",
        accessToken ? "Token exists" : "No token available"
      );

      const logoutResponse = await axios.post(LOGOUT_URL, null, {
        headers: {
          Authorization: `Bearer ${accessToken || "dummy-token"}`,
        },
      });

      console.log("Logout response status:", logoutResponse.status);
      console.log("Logged out successfully");

      // Clear FamilySearch cookies
      console.log("Clearing FamilySearch cookies...");
      const familySearchDomains = [
        ".familysearch.org",
        "www.familysearch.org",
        "identbeta.familysearch.org",
        "apibeta.familysearch.org",
      ];
      document.cookie.split(";").forEach(function (c) {
        const cookie = c.trim();
        const cookieName = cookie.split("=")[0];
        familySearchDomains.forEach((domain) => {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        });
      });
      console.log("FamilySearch cookies cleared");

      // Reset states
      console.log("Resetting application state...");
      setAccessToken(null);
      setSuccess(false);
      setCompletedSets(0);

      // Generate new auth URL with unique identifier
      console.log("Generating new authorization URL...");
      const uniqueId =
        Date.now().toString(36) + Math.random().toString(36).substr(2);
      const authUrl = `${BASE_AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${uniqueId}`;
      console.log("New Auth URL:", authUrl);

      // Redirect to the new authorization URL in the same window
      window.location.href = authUrl;
    } catch (error) {
      console.error("Error during logout:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      } else if (error.request) {
        console.error("Error request:", error.request);
      } else {
        console.error("Error message:", error.message);
      }

      setError("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">FamilySearch Tree Viewer</h1>
      {loading ? (
        <div className="text-center mt-8">
          <Spinner />
          <p className="mt-4">Processing your request...</p>
          <p className="mt-2">
            Total people processed: {processedCount} /{" "}
            {totalCount || "Calculating..."}
          </p>
        </div>
      ) : error ? (
        <div className="text-center mt-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      ) : success ? (
        <div className="text-center mt-8">
          <p className="text-green-500 mb-4">
            Data was downloaded successfully!
          </p>
          <p className="mb-4">Completed sets: {completedSets}</p>
          <button
            onClick={handleFetchAnother}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Fetch Another Set
          </button>
          <button
            onClick={handleLogoutAndAuthorize}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Use New Credentials
          </button>
        </div>
      ) : (
        <a
          href="#"
          onClick={handleLogoutAndAuthorize}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Authorize with FamilySearch
        </a>
      )}
    </div>
  );
}

export default App;
