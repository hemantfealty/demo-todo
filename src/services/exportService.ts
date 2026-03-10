export const exportService = {
  async export(format: "csv" | "json") {
    const res = await fetch(`/api/export?format=${format}`);
    if (!res.ok) throw new Error("Export failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
