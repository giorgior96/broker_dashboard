import axios from 'axios';

const API_URL = "http://localhost:8000/api";

export const fetchBoats = async (filters = {}) => {
    try {
        const params = {};
        if (filters.refresh) params.refresh = true;

        const response = await axios.get(`${API_URL}/boats`, { params });
        return response.data;
    } catch (error) {
        console.error("Error fetching boats:", error);
        return [];
    }
};

export const fetchDashboardStats = async () => {
    try {
        const response = await axios.get(`${API_URL}/stats`);
        return response.data;
    } catch (error) {
        console.error("Error fetching stats:", error);
        return null;
    }
};

export const fetchSyncStatus = async () => {
    try {
        const response = await axios.get(`${API_URL}/status`);
        return response.data;
    } catch (error) {
        console.error("Error fetching status:", error);
        return null; // Return null on error
    }
};

export const fetchBoatDetails = async (boatId) => {
    try {
        const response = await axios.get(`${API_URL}/boats/${boatId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching boat details:", error);
        return null;
    }
}
