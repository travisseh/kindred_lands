const FamilySearch = require("fs-js-lite");

async function getCurrentPersonId(fs) {
  return new Promise((resolve, reject) => {
    fs.get("/platform/tree/current-person", (error, response) => {
      if (error) {
        console.error("Error fetching current person:", error);
        reject(error);
      } else if (response.statusCode >= 400) {
        reject(
          new Error(
            `HTTP error! status: ${response.statusCode}, body: ${response.body}`
          )
        );
      } else {
        if (response.headers && response.headers.location) {
          const locationParts = response.headers.location.split("/");
          const personId = locationParts[locationParts.length - 1];
          console.log("Current person ID:", personId);
          resolve(personId);
        } else {
          reject(new Error("Unable to find person ID in the response headers"));
        }
      }
    });
  });
}

async function getAncestryTree(fs, personId, generations = 2) {
  const url = `/platform/tree/ancestry?person=${personId}&generations=${generations}`;

  return new Promise((resolve, reject) => {
    fs.get(url, (error, response) => {
      if (error) {
        console.error("Error fetching ancestry tree:", error);
        reject(error);
      } else if (response.statusCode >= 400) {
        reject(
          new Error(
            `HTTP error! status: ${response.statusCode}, body: ${response.body}`
          )
        );
      } else {
        resolve(response.data);
      }
    });
  });
}

async function getPersonDetails(fs, personId) {
  return new Promise((resolve, reject) => {
    fs.get(`/platform/tree/persons/${personId}`, (error, response) => {
      if (error) {
        console.error("Error fetching person details:", error);
        reject(error);
      } else if (response.statusCode >= 400) {
        reject(
          new Error(
            `HTTP error! status: ${response.statusCode}, body: ${response.body}`
          )
        );
      } else {
        resolve(response.data);
      }
    });
  });
}

function extractLocations(person) {
  const locations = new Set();
  if (person.facts) {
    person.facts.forEach((fact) => {
      if (fact.place && fact.place.original) {
        locations.add(fact.place.original);
      }
    });
  }
  return Array.from(locations);
}

function getRelationship(ascendancyNumber) {
  if (ascendancyNumber === "1") return "Self";
  if (ascendancyNumber === "2") return "Father";
  if (ascendancyNumber === "3") return "Mother";

  const generation = Math.floor(Math.log2(parseInt(ascendancyNumber)));
  const isMaternal = parseInt(ascendancyNumber) % 2 === 1;
  const side = isMaternal ? "Maternal" : "Paternal";

  if (generation === 2) return `${side} Grandparent`;
  if (generation === 3) return `${side} Great-Grandparent`;
  if (generation > 3) return `${side} ${generation - 2}x Great-Grandparent`;

  return "Unknown";
}

function getPersonUrl(personId) {
  return `https://www.familysearch.org/tree/person/details/${personId}`;
}

function displayPersonInfo(person, locations) {
  const display = person.display;
  const relationship = getRelationship(display.ascendancyNumber);
  const personUrl = getPersonUrl(person.id);
  console.log(`
    Name: ${display.name}
    Relationship: ${relationship}
    Gender: ${display.gender}
    Lifespan: ${display.lifespan}
    Ascendancy Number: ${display.ascendancyNumber}
    ID: ${person.id}
    Locations: ${locations.join(", ") || "No locations found"}
    Memory Count: N/A (Beta limitation)
    FamilySearch URL: ${personUrl}
  `);
}

async function main() {
  const accessToken = "b0-Ru8Uwe5eHmD.D2q5oOyiFIn";

  const fs = new FamilySearch({
    accessToken: accessToken,
    environment: "beta",
  });

  try {
    const personId = await getCurrentPersonId(fs);
    const tree = await getAncestryTree(fs, personId);

    console.log("Ancestry Tree:");
    for (const person of tree.persons) {
      const details = await getPersonDetails(fs, person.id);
      const locations = extractLocations(details.persons[0]);
      displayPersonInfo(person, locations);
    }

    console.log(`Total persons in tree: ${tree.persons.length}`);
  } catch (error) {
    console.error("Detailed error:", error.message);
  }
}

main();
