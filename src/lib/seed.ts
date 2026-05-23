export async function seedInitialData() {
  try {
    const response = await fetch('/api/seed', {
      method: 'POST'
    });
    if (response.ok) {
      console.log("Seeding complete via API!");
    }
  } catch (error) {
    console.error("Seeding failed:", error);
  }
}
