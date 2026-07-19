async function getFreeModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  const data = await res.json();
  const freeModels = data.data.filter(m => m.pricing.prompt === "0" && m.pricing.completion === "0");
  console.log("Found", freeModels.length, "free models!");
  for (const m of freeModels.slice(0, 10)) {
    console.log(m.id);
  }
}
getFreeModels();
