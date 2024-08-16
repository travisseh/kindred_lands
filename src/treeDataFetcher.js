import {
  createFamilySearchClient,
  getCurrentPersonId,
  getAncestryTree,
} from "./familySearchClient";
import { processPersonAndAncestors } from "./personDataProcessor";
import { MAX_GENERATIONS } from "./constants";

export async function fetchTreeData(
  accessToken,
  setProcessedCount,
  setTotalCount
) {
  console.log("Fetching tree data with access token:", accessToken);
  const fs = createFamilySearchClient(accessToken);

  try {
    console.log("Getting current person ID...");
    const rootPersonId = await getCurrentPersonId(fs);
    console.log("Current person ID:", rootPersonId);

    console.log("Getting ancestry tree...");
    const tree = await getAncestryTree(fs, rootPersonId, MAX_GENERATIONS);
    console.log("Ancestry tree:", tree);

    const totalPeople = tree.persons.length;
    console.log("Total people in ancestry tree:", totalPeople);
    setTotalCount(totalPeople);

    const excelDataPromises = tree.persons.map((person) =>
      processPersonAndAncestors(fs, person, setProcessedCount)
    );
    const excelDataArrays = await Promise.all(excelDataPromises);
    const excelData = excelDataArrays.flat();

    return { data: excelData, totalPeople };
  } catch (error) {
    console.error("Error in fetchTreeData:", error);
    throw error;
  }
}
