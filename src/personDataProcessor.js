import { getPersonDetails, getMemoryCount } from "./familySearchClient";
import {
  extractLocations,
  getRelationship,
  getPersonUrl,
} from "./locationUtils";

export async function processPersonAndAncestors(fs, person, setProcessedCount) {
  try {
    const details = await getPersonDetails(fs, person.id);
    const locations = extractLocations(details.persons[0]);
    const { count, links } = await getMemoryCount(fs, person.id);

    const personData = {
      Name: person.display.name,
      Relationship: getRelationship(person.display.ascendancyNumber),
      Gender: person.display.gender,
      Lifespan: person.display.lifespan,
      ID: person.id,
      "Memory Count": count,
      "Memory Links": links.join(", "),
      "FamilySearch URL": getPersonUrl(person.id),
    };

    const personExcelData = [];

    if (locations.length === 0) {
      personData["Location Type"] = "No locations found";
      personData["Location"] = "";
      personData["Country"] = "";
      personData["Date"] = "";
      personExcelData.push(personData);
    } else {
      locations.forEach((loc, index) => {
        if (index === 0) {
          personData["Location Type"] = loc.type;
          personData["Location"] = loc.place;
          personData["Country"] = loc.country;
          personData["Date"] = loc.date;
          personExcelData.push(personData);
        } else {
          personExcelData.push({
            "Location Type": loc.type,
            Location: loc.place,
            Country: loc.country,
            Date: loc.date,
          });
        }
      });
    }

    setProcessedCount((prev) => prev + 1);
    return personExcelData;
  } catch (error) {
    console.error(`Error processing person ${person.id}:`, error.message);
    setProcessedCount((prev) => prev + 1);
    return [];
  }
}
