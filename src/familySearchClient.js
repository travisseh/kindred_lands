import FamilySearch from "fs-js-lite";

export function createFamilySearchClient(accessToken) {
  console.log("Creating FamilySearch client with access token:", accessToken);
  return new FamilySearch({
    clientId: process.env.REACT_APP_CLIENT_ID,
    accessToken: accessToken,
    environment: "beta",
    saveAccessToken: false,
  });
}

export async function getCurrentPersonId(fs) {
  return new Promise((resolve, reject) => {
    fs.get("/platform/tree/current-person", (error, response) => {
      if (error) {
        console.error("Error getting current person:", error);
        reject(error);
      } else {
        console.log("Current person response:", response);
        const locationParts = response.headers.location.split("/");
        resolve(locationParts[locationParts.length - 1]);
      }
    });
  });
}

export async function getAncestryTree(fs, personId, generations) {
  return new Promise((resolve, reject) => {
    fs.get(
      `/platform/tree/ancestry?person=${personId}&generations=${generations}`,
      (error, response) => {
        if (error) {
          console.error("Error getting ancestry tree:", error);
          reject(error);
        } else {
          console.log("Ancestry tree response:", response);
          resolve(response.data);
        }
      }
    );
  });
}

export async function getPersonDetails(fs, personId) {
  return new Promise((resolve, reject) => {
    fs.get(`/platform/tree/persons/${personId}`, (error, response) => {
      if (error) {
        console.error("Error getting person details:", error);
        reject(error);
      } else {
        console.log("Person details response:", response);
        resolve(response.data);
      }
    });
  });
}

export async function getMemoryCount(fs, personId) {
  return new Promise((resolve, reject) => {
    fs.get(`/platform/tree/persons/${personId}/memories`, (error, response) => {
      if (error) {
        console.error("Error fetching memory count:", error);
        resolve({ count: "N/A", links: [] });
      } else {
        console.log("Memory count response:", response);
        const memoryCount =
          response.data && response.data.sourceDescriptions
            ? response.data.sourceDescriptions.length
            : 0;
        const memoryLinks =
          response.data && response.data.sourceDescriptions
            ? response.data.sourceDescriptions.map(
                (memory) =>
                  `https://www.familysearch.org/photos/artifacts/${memory.id}`
              )
            : [];
        resolve({ count: memoryCount, links: memoryLinks });
      }
    });
  });
}
