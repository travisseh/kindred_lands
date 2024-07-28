const FamilySearch = require("fs-js-lite");
const XLSX = require("xlsx");
const path = require("path");
const os = require("os");

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
  const usStates = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  function getCountry(placeParts) {
    if (placeParts.length > 1) {
      const lastPart = placeParts[placeParts.length - 1];
      const secondLastPart = placeParts[placeParts.length - 2];

      if (lastPart === "United States" || lastPart === "USA") {
        return "United States";
      }
      if (usStates.includes(lastPart) || usStates.includes(secondLastPart)) {
        return "United States";
      }
      // Check for cases like "Utah, United States"
      if (lastPart.includes("United States")) {
        return "United States";
      }
      return lastPart;
    }
    return "Unknown";
  }

  const locations = [];
  if (person.facts) {
    person.facts.forEach((fact) => {
      if (fact.place && fact.place.original) {
        const placeParts = fact.place.original.split(", ");
        const country = getCountry(placeParts);
        locations.push({
          type: fact.type.replace("http://gedcomx.org/", ""),
          place: fact.place.original,
          country: country,
          date: fact.date ? fact.date.original : "Unknown",
        });
      }
    });
  }
  return locations;
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

async function main() {
  const accessToken = "b0-Ru8Uwe5eHmD.D2q5oOyiFIn";

  const fs = new FamilySearch({
    accessToken: accessToken,
    environment: "beta",
  });

  try {
    const personId = await getCurrentPersonId(fs);
    const tree = await getAncestryTree(fs, personId);

    console.log("Fetching ancestry data...");

    const excelData = [];

    for (const person of tree.persons) {
      const details = await getPersonDetails(fs, person.id);
      const locations = extractLocations(details.persons[0]);

      const personData = {
        Name: person.display.name,
        Relationship: getRelationship(person.display.ascendancyNumber),
        Gender: person.display.gender,
        Lifespan: person.display.lifespan,
        ID: person.id,
        "Memory Count": "N/A (Beta limitation)",
        "FamilySearch URL": getPersonUrl(person.id),
      };

      if (locations.length === 0) {
        personData["Location Type"] = "No locations found";
        personData["Location"] = "";
        personData["Country"] = "";
        personData["Date"] = "";
        excelData.push(personData);
      } else {
        locations.forEach((loc, index) => {
          if (index === 0) {
            personData["Location Type"] = loc.type;
            personData["Location"] = loc.place;
            personData["Country"] = loc.country;
            personData["Date"] = loc.date;
            excelData.push(personData);
          } else {
            excelData.push({
              "Location Type": loc.type,
              Location: loc.place,
              Country: loc.country,
              Date: loc.date,
            });
          }
        });
      }

      // Optional: log progress
      console.log(`Processed: ${person.display.name}`);
    }

    // Create a new workbook and add the data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Ancestry Tree");

    // Get the path to the Downloads folder
    const downloadsFolder = path.join(os.homedir(), "Downloads");
    const filePath = path.join(downloadsFolder, "ancestry_tree.xlsx");

    // Write the workbook to a file in the Downloads folder
    XLSX.writeFile(wb, filePath);

    console.log(`Total persons in tree: ${tree.persons.length}`);
    console.log(`Excel file saved to: ${filePath}`);
  } catch (error) {
    console.error("Detailed error:", error.message);
  }
}

main();
