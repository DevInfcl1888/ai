export const formatDateTime = (createdAt: Date) => {
    const dateObj = createdAt ? new Date(createdAt) : new Date(); // ✅ fallback if undefined

  if (isNaN(dateObj.getTime())) {
    console.warn("⚠️ Invalid createdAt received in formatDateTime:", createdAt);
    return { formattedDate: "Invalid Date", formattedTime: "--:--:--" };
  }

  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // e.g., 28 Oct 2025
  const formattedTime = dateObj.toISOString().split("T")[1].split(".")[0]; // e.g., 05:30:00
  return { formattedDate, formattedTime };
};
