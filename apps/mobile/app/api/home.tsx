import API_CLIENT from ".";
import { logApiCatch } from "@/utils/apiError";

const fetchCompanyStats = async () => {
  try {
    const response = await API_CLIENT.makeGetRequest("/home/stats");
    return response.data;
  } catch (error) {
    logApiCatch("Error fetching company stats", error);
    throw error;
  }
};

const HOME = {
  fetchCompanyStats,
};

export default HOME;
