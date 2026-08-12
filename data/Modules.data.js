import { apiRequest } from "@/lib/api";

export async function getModules(workspaceId, setModules) {
    try {
        const response = await apiRequest(`/api/modules/${workspaceId}`, { method: "GET" });
        const data = await response.json();
        if (response.ok) setModules(data.modules || []);
    } catch (error) {
        console.error("getModules error:", error);
    }
}

export async function createModule({
    workspaceId,
    moduleName,
    moduleDescription,
    setCreatingModule,
    setModuleName,
    setModuleDescription,
    setShowModuleModal,
    getModulesData,
}) {
    if (!moduleName.trim()) return;
    try {
        setCreatingModule(true);
        const response = await apiRequest(`/api/modules/${workspaceId}`, {
            method: "POST",
            body: JSON.stringify({ name: moduleName, description: moduleDescription, visibility: "workspace" }),
        });
        if (response.ok) {
            setModuleName("");
            setModuleDescription("");
            setShowModuleModal(false);
            if (getModulesData) getModulesData();
        }
    } catch (error) {
        console.error("createModule error:", error);
    } finally {
        setCreatingModule(false);
    }
}

export async function deleteModule({
    moduleId,
    setDeletingModuleId,
    setModules,
    setDeleteModuleModal,
}) {
    try {
        setDeletingModuleId(moduleId);
        const response = await apiRequest(`/api/modules/${moduleId}`, { method: "DELETE" });
        if (response.ok) {
            setModules((prev) => prev.filter((m) => m._id !== moduleId));
        } else {
            const data = await response.json();
            console.error(data.message);
        }
    } catch (error) {
        console.error("deleteModule error:", error);
    } finally {
        setDeletingModuleId(null);
        setDeleteModuleModal(null);
    }
}
