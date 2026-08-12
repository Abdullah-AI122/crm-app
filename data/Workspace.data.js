import { apiRequest } from "@/lib/api";



export default async function getWorkspace(id) {
    try {
        const response = await apiRequest(`/api/workspaces/${id}`, { method: "GET" });
        const data = await response.json();
        if (response.ok) return data.workspace || data;
    } catch (error) { console.log(error); }
};


