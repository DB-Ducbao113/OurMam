/**
 * Mã nguồn JavaScript dành cho ứng dụng Scriptable trên iOS
 * Hỗ trợ hiển thị ảnh bữa ăn mới nhất theo phong cách Locket Widget trên màn hình chính iPhone
 */

export const SCRIPTABLE_WIDGET_CODE = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: smile-wink;
const APP_URL = "https://our-mam.vercel.app";
const SUPABASE_URL = "https://gjdutovmlpxrvwqycvay.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHV0b3ZtbHB4cnZ3cXljdmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTQ1ODYyMywiZXhwIjoyMTA1MDM0NjIzfQ.A2B19Y2P6NmE-HCeJa1IVPaF4qgDMnNsk7ZDy2AwmOk";

// Chế độ preview khi bấm Play trong Scriptable app
const PREVIEW_TYPE = "small";

// Khi tap widget → Scriptable chạy script với runsFromHomeScreen = true
// → tự động mở Safari ngay lập tức
if (config.runsFromHomeScreen) {
  Safari.open(APP_URL);
  Script.complete();
} else if (!config.runsInWidget) {
  // Bấm Play trong app Scriptable → preview widget
  const family = config.widgetFamily || PREVIEW_TYPE;
  const widget = await createWidget(family);
  if (family === "small") await widget.presentSmall();
  else if (family === "large") await widget.presentLarge();
  else await widget.presentMedium();
  Script.complete();
} else {
  // Chạy trong widget → render giao diện
  const widget = await createWidget(config.widgetFamily || "small");
  Script.setWidget(widget);
  Script.complete();
}

async function createWidget(family) {
  const w = new ListWidget();
  // URL dự phòng cho "Open URL" mode
  w.url = APP_URL;
  w.setPadding(0, 0, 0, 0);

  // ── 1. Lấy dữ liệu từ Supabase ──────────────────────────────────────────
  let meal = null;
  try {
    const req = new Request(
      \`\${SUPABASE_URL}/rest/v1/meals?select=*&order=created_at.desc&limit=1\`
    );
    req.headers = {
      apikey: SUPABASE_KEY,
      Authorization: \`Bearer \${SUPABASE_KEY}\`,
    };
    const res = await req.loadJSON();
    if (res && res.length > 0) meal = res[0];
  } catch (e) {
    console.log("Supabase error: " + e);
  }

  if (!meal) {
    meal = {
      dish_name: "Bữa cơm ấm cúng",
      caption: "",
      photo_url:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80",
      user_avatar: null,
    };
  }

  // ── 2. Kích thước thực của từng size widget (logical points × 3 for Retina) ──
  let targetW, targetH, fontSize, avatarSize, bottomPad;
  if (family === "large") {
    targetW = 338; targetH = 354; fontSize = 15; avatarSize = 28; bottomPad = 18;
  } else if (family === "medium") {
    targetW = 338; targetH = 158; fontSize = 13; avatarSize = 22; bottomPad = 14;
  } else {
    targetW = 158; targetH = 158; fontSize = 12; avatarSize = 20; bottomPad = 10;
  }

  // ── 3. Tải ảnh chính & avatar song song ─────────────────────────────────
  let [img, avatarImg] = await Promise.all([
    loadImage(meal.photo_url),
    loadImage(meal.user_avatar),
  ]);

  // ── 4. Ảnh full-bleed (aspect fill, không bị lặp ô gạch) ────────────────
  if (img) {
    w.backgroundImage = createCoverImage(img, targetW, targetH);
  } else {
    w.backgroundColor = new Color("#1C1917");
  }

  // ── 5. Caption pill + Avatar ở đáy ───────────────────────────────────────
  const message = extractMessage(meal);

  const overlay = w.addStack();
  overlay.layoutVertically();
  overlay.setPadding(0, 10, bottomPad, 10);
  overlay.addSpacer();

  const pillRow = overlay.addStack();
  pillRow.layoutHorizontally();
  pillRow.centerAlignContent();
  pillRow.addSpacer();

  const pill = pillRow.addStack();
  pill.backgroundColor = new Color("#000000", 0.62);
  pill.cornerRadius = 18;
  pill.setPadding(6, 10, 6, 14);
  pill.centerAlignContent();
  pill.spacing = 6;

  // Avatar tròn trong pill (nếu có)
  if (avatarImg) {
    const avatarCtx = new DrawContext();
    avatarCtx.size = new Size(avatarSize * 3, avatarSize * 3);
    avatarCtx.opaque = false;
    avatarCtx.respectScreenScale = true;
    // Vẽ hình tròn clip mask
    avatarCtx.setFillColor(Color.clear());
    avatarCtx.fillEllipse(new Rect(0, 0, avatarSize * 3, avatarSize * 3));
    avatarCtx.drawImageInRect(avatarImg, new Rect(0, 0, avatarSize * 3, avatarSize * 3));
    const avatarRound = avatarCtx.getImage();

    const avatarEl = pill.addImage(avatarRound);
    avatarEl.imageSize = new Size(avatarSize, avatarSize);
    avatarEl.cornerRadius = avatarSize / 2;
  }

  const label = pill.addText(message);
  label.textColor = Color.white();
  label.font = Font.boldSystemFont(fontSize);
  label.lineLimit = 1;

  pillRow.addSpacer();

  return w;
}

// ── Tải ảnh an toàn (trả về null nếu lỗi) ────────────────────────────────────
async function loadImage(url) {
  if (!url) return null;
  try {
    const req = new Request(url);
    return await req.loadImage();
  } catch (e) {
    return null;
  }
}

// ── Scale ảnh aspect-fill, không bao giờ bị lặp ô gạch ──────────────────────
function createCoverImage(img, targetWidth, targetHeight) {
  const scale = 3;
  const w = targetWidth * scale;
  const h = targetHeight * scale;

  const ctx = new DrawContext();
  ctx.size = new Size(w, h);
  ctx.opaque = true;
  ctx.respectScreenScale = false;

  const imgW = img.size.width;
  const imgH = img.size.height;
  const sf = Math.max(w / imgW, h / imgH);
  const dw = imgW * sf;
  const dh = imgH * sf;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  ctx.drawImageInRect(img, new Rect(dx, dy, dw, dh));
  return ctx.getImage();
}

// ── Trích xuất message, không lặp từ ─────────────────────────────────────────
function extractMessage(meal) {
  const dish = cleanStr(meal.dish_name || "");
  const caption = cleanStr(meal.caption || "");
  const nd = normalize(dish);
  const nc = normalize(caption);

  if (caption && dish) {
    if (nd === nc || nc.includes(nd)) return caption;
    if (nd.includes(nc)) return dish;
    return \`\${dish} • \${caption}\`;
  }
  return caption || dish || "OurMam 🍲";
}

function normalize(s) {
  return s.toLowerCase().replace(/[\\s\\-_.,!?"'""]+/g, "");
}

function cleanStr(str) {
  if (!str) return "";
  return str.replace(/^["'""«»\\s]+|["'""«»\\s]+$/g, "").trim();
}
`;
