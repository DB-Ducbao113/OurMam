/**
 * Mã nguồn JavaScript dành cho ứng dụng Scriptable trên iOS
 * Hỗ trợ hiển thị ảnh bữa ăn mới nhất theo phong cách Locket Widget trên màn hình chính iPhone
 */

export const SCRIPTABLE_WIDGET_CODE = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: smile-wink;
const APP_URL = "https://ourmam-recap.vercel.app";
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

  // ── 4. Xây dựng giao diện dựa trên kích thước ──────────────────────────────
  if (family === "large") {
    // Bố cục chia đôi cho size Large
    const mainStack = w.addStack();
    mainStack.layoutHorizontally();

    // Nửa trái: Ảnh
    const leftStack = mainStack.addStack();
    leftStack.size = new Size(targetW / 2, targetH);
    if (img) {
      leftStack.backgroundImage = createCoverImage(img, targetW / 2, targetH);
    } else {
      leftStack.backgroundColor = new Color("#1C1917");
    }

    // Nửa phải: Thông tin
    const rightStack = mainStack.addStack();
    rightStack.size = new Size(targetW / 2, targetH);
    rightStack.backgroundColor = new Color("#0F0F0F");
    rightStack.layoutVertically();
    rightStack.setPadding(24, 20, 24, 20);

    rightStack.addSpacer();

    // Avatar
    if (avatarImg) {
      const aSize = 44;
      const avatarCtx = new DrawContext();
      avatarCtx.size = new Size(aSize * 3, aSize * 3);
      avatarCtx.opaque = false;
      avatarCtx.respectScreenScale = true;
      avatarCtx.setFillColor(Color.clear());
      avatarCtx.fillEllipse(new Rect(0, 0, aSize * 3, aSize * 3));
      avatarCtx.drawImageInRect(avatarImg, new Rect(0, 0, aSize * 3, aSize * 3));
      
      const avatarEl = rightStack.addImage(avatarCtx.getImage());
      avatarEl.imageSize = new Size(aSize, aSize);
      avatarEl.cornerRadius = aSize / 2;
      rightStack.addSpacer(16);
    }

    // Tên món
    const dish = cleanStr(meal.dish_name) || "OurMam";
    const dishLabel = rightStack.addText(dish);
    dishLabel.textColor = Color.white();
    dishLabel.font = Font.boldSystemFont(22);
    dishLabel.minimumScaleFactor = 0.5;

    rightStack.addSpacer(12);

    // Thông tin phụ
    if (meal.calories) {
      const calLabel = rightStack.addText(\`🔥 \${meal.calories} kcal\`);
      calLabel.textColor = new Color("#FF6433");
      calLabel.font = Font.boldSystemFont(16);
      rightStack.addSpacer(6);
    }

    if (meal.location) {
      const locLabel = rightStack.addText(\`📍 \${cleanStr(meal.location)}\`);
      locLabel.textColor = new Color("#A8A29E");
      locLabel.font = Font.mediumSystemFont(15);
      locLabel.minimumScaleFactor = 0.8;
      locLabel.lineLimit = 2;
    }

    rightStack.addSpacer();
  } else {
    // ── Bố cục tràn viền (Full-bleed) cho size Small & Medium ──────────────
    if (img) {
      w.backgroundImage = createCoverImage(img, targetW, targetH);
    } else {
      w.backgroundColor = new Color("#1C1917");
    }

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

    if (avatarImg) {
      const avatarCtx = new DrawContext();
      avatarCtx.size = new Size(avatarSize * 3, avatarSize * 3);
      avatarCtx.opaque = false;
      avatarCtx.respectScreenScale = true;
      avatarCtx.setFillColor(Color.clear());
      avatarCtx.fillEllipse(new Rect(0, 0, avatarSize * 3, avatarSize * 3));
      avatarCtx.drawImageInRect(avatarImg, new Rect(0, 0, avatarSize * 3, avatarSize * 3));
      
      const avatarEl = pill.addImage(avatarCtx.getImage());
      avatarEl.imageSize = new Size(avatarSize, avatarSize);
      avatarEl.cornerRadius = avatarSize / 2;
    }

    const label = pill.addText(message);
    label.textColor = Color.white();
    label.font = Font.boldSystemFont(fontSize);
    label.lineLimit = 1;

    pillRow.addSpacer();
  }

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

function extractMessage(meal) {
  const dish = cleanStr(meal.dish_name || "");
  const loc = cleanStr(meal.location || "");
  const kcal = meal.calories ? \`\${meal.calories} kcal\` : "";
  
  let parts = [];
  if (dish) parts.push(dish);
  if (loc) parts.push(\`📍 \${loc}\`);
  if (kcal) parts.push(\`🔥 \${kcal}\`);
  
  if (parts.length > 0) return parts.join(" • ");
  
  const caption = cleanStr(meal.caption || "");
  return caption || "OurMam 🍲";
}

function normalize(s) {
  return s.toLowerCase().replace(/[\\s\\-_.,!?"'""]+/g, "");
}

function cleanStr(str) {
  if (!str) return "";
  return str.replace(/^["'""«»\\s]+|["'""«»\\s]+$/g, "").trim();
}
`;
