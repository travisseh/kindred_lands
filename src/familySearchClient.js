import FamilySearch from "fs-js-lite";

export function createFamilySearchClient(accessToken) {
  console.log("Creating FamilySearch client with access token:", accessToken);
  return new FamilySearch({
    clientId: "b00VC7JDZH9EBLMP85GU",
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

// ... (include other FamilySearch API related functions like getAncestryTree, getPersonDetails, getMemoryCount, fetchParents)
