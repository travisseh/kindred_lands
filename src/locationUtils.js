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
    if (lastPart.includes("United States")) {
      return "United States";
    }
    return lastPart;
  }
  return "Unknown";
}

export function extractLocations(person) {
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

export function getRelationship(ascendancyNumber) {
  switch (ascendancyNumber) {
    case "1":
      return "Self";
    case "2":
      return "Father";
    case "3":
      return "Mother";
    case "4":
      return "Paternal Grandfather";
    case "5":
      return "Paternal Grandmother";
    case "6":
      return "Maternal Grandfather";
    case "7":
      return "Maternal Grandmother";
    default:
      return "Unknown";
  }
}

export function getPersonUrl(personId) {
  return `https://www.familysearch.org/tree/person/details/${personId}`;
}
