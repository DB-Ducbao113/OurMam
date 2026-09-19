// ==============================================================================
// OURMAM - SCRIPTABLE WIDGET FOR IOS HOME SCREEN
// ==============================================================================
// Installation Runbook:
// 1. Install the free "Scriptable" app from Apple App Store on your iPhone.
// 2. Open Scriptable -> Tap (+) to create a new script -> Paste this entire file.
// 3. Name the script "OurMam Widget".
// 4. On iOS Home Screen -> Long press -> Tap (+) -> Select Scriptable -> Choose Medium Widget -> Set script to "OurMam Widget".
// ==============================================================================

const SUPABASE_URL = "https://gjdutovmlpxrvwqycvay.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHV0b3ZtbHB4cnZ3cXljdmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ1ODYyMywiZXhwIjoyMTA1MDM0NjIzfQ.A2B19Y2P6NmE-HCeJa1IVPaF4qgDMnNsk7ZDy2AwmOk";

const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();

async function createWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color("#FAF8F5");
  w.setPadding(12, 12, 12, 12);

  let meal = null;

  try {
    const req = new Request(`${SUPABASE_URL}/rest/v1/meals?select=*&order=created_at.desc&limit=1`);
    req.headers = {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    };
    const res = await req.loadJSON();
    if (res && res.length > 0) {
      meal = res[0];
    }
  } catch (e) {
    console.log("Supabase fetch warning: " + e);
  }

  // Fallback demo meal
  if (!meal) {
    meal = {
      user_name: "OurMam 🌸",
      dish_name: "Bữa cơm ấm cúng",
      caption: "Món ngon mỗi ngày cùng người thương 🍲",
      photo_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80",
      location: "Sài Gòn"
    };
  }

  let img = null;
  try {
    const imgReq = new Request(meal.photo_url);
    img = await imgReq.loadImage();
  } catch (e) {
    console.log("Image load warning: " + e);
  }

  // Horizontal Layout
  const stack = w.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.spacing = 10;

  // Squircle Photo
  if (img) {
    const imgElement = stack.addImage(img);
    imgElement.imageSize = new Size(110, 110);
    imgElement.cornerRadius = 16;
    imgElement.applyFillingContentMode();
  }

  // Info Column
  const infoStack = stack.addStack();
  infoStack.layoutVertically();
  infoStack.spacing = 3;

  // Author & Streak
  const headerStack = infoStack.addStack();
  headerStack.layoutHorizontally();
  headerStack.spacing = 4;

  const authorText = headerStack.addText(meal.user_name || "Người thương");
  authorText.textColor = new Color("#ac340a");
  authorText.font = Font.boldSystemFont(13);

  const flameText = headerStack.addText("🔥 42");
  flameText.textColor = new Color("#ff6f43");
  flameText.font = Font.boldSystemFont(11);

  // Dish Name
  const dishText = infoStack.addText(meal.dish_name || "Món ngon hôm nay");
  dishText.textColor = new Color("#211a16");
  dishText.font = Font.semiboldSystemFont(12);

  // Caption
  const captionText = infoStack.addText(meal.caption || "");
  captionText.textColor = new Color("#59413b");
  captionText.font = Font.systemFont(11);
  captionText.lineLimit = 2;

  // Location
  const metaText = infoStack.addText(`📍 ${meal.location || 'Sài Gòn'} • Vừa xong`);
  metaText.textColor = new Color("#8d7169");
  metaText.font = Font.systemFont(9);

  return w;
}
