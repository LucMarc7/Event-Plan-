// src/components/theme/templates.ts
// Templates prédéfinis — calqués sur les 5 références visuelles.

export type CanvasFormat = "A4" | "A5" | "Letter" | "Square" | "Story";

export const CANVAS_FORMATS: Record<
  CanvasFormat,
  { w: number; h: number; label: string }
> = {
  A4: { w: 595, h: 842, label: "A4 (portrait)" },
  A5: { w: 420, h: 595, label: "A5 (portrait)" },
  Letter: { w: 612, h: 792, label: "Letter (US)" },
  Square: { w: 600, h: 600, label: "Carré 1:1" },
  Story: { w: 405, h: 720, label: "Story 9:16" },
};

export interface TemplateBlock {
  type: "text" | "shape" | "qr" | "image";
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  text?: string;
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: "normal" | "bold" | "800";
    align?: "left" | "center" | "right";
    fontFamily?: "serif" | "script" | "sans" | "default";
  };
  shape?: "rect" | "circle" | "line";
  shapeColor?: string;
  shapeOpacity?: number;
  imageSource?: any;
}

export interface TemplatePage {
  background: { type: "color" | "image"; value: string | any };
  blocks: TemplateBlock[];
}

export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  category: "wedding" | "birthday" | "concert" | "conference" | "neutral";
  format: CanvasFormat;
  accent: string;
  previewImage: any;
  pages: TemplatePage[];
}

export const THEME_TEMPLATES: ThemeTemplate[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. DESMOND & TRACY — Vert tropical + script "Save the Date"
  // ═══════════════════════════════════════════════════════════════
  {
    id: "desmond-tracy",
    name: "Desmond & Tracy",
    description: "Vert tropical, script élégant",
    category: "wedding",
    format: "A4",
    accent: "#2D5016",
    previewImage: require("../../../assets/images/bg-desmond.jpg"),
    pages: [
      {
        background: {
          type: "image",
          value: require("../../../assets/images/bg-desmond.jpg"),
        },
        blocks: [
          {
            type: "text",
            xPercent: 10,
            yPercent: 70,
            widthPercent: 80,
            heightPercent: 12,
            text: "DESMOND\n& TRACY",
            style: {
              fontSize: 56,
              color: "#FFFFFF",
              fontWeight: "800",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 83,
            widthPercent: 80,
            heightPercent: 5,
            text: "20.09.2025",
            style: {
              fontSize: 24,
              color: "#FFFFFF",
              fontWeight: "normal",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 88,
            widthPercent: 80,
            heightPercent: 4,
            text: "@ Jubilee International Church\nLocation: Pigfarm Station",
            style: {
              fontSize: 11,
              color: "#FFFFFF",
              fontWeight: "normal",
              align: "center",
              fontFamily: "sans",
            },
          },
          {
            type: "qr",
            xPercent: 40,
            yPercent: 93,
            widthPercent: 20,
            heightPercent: 5,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. NOIR & OR — Fond noir, motifs dorés, script raffiné
  // ═══════════════════════════════════════════════════════════════
  {
    id: "noir-or",
    name: "Noir & Or",
    description: "Sombre, luxueux, doré",
    category: "wedding",
    format: "A4",
    accent: "#D4AF37",
    previewImage: require("../../../assets/images/bg-black-gold.png"),
    pages: [
      {
        background: {
          type: "image",
          value: require("../../../assets/images/bg-black-gold.png"),
        },
        blocks: [
          {
            type: "text",
            xPercent: 10,
            yPercent: 26,
            widthPercent: 80,
            heightPercent: 4,
            text: "The Family of",
            style: {
              fontSize: 16,
              color: "#D4AF37",
              align: "center",
              fontFamily: "script",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 31,
            widthPercent: 80,
            heightPercent: 6,
            text: "David Lewis",
            style: {
              fontSize: 26,
              color: "#D4AF37",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 39,
            widthPercent: 80,
            heightPercent: 4,
            text: "Invites",
            style: {
              fontSize: 18,
              color: "#D4AF37",
              align: "center",
              fontFamily: "script",
            },
          },
          {
            type: "shape",
            xPercent: 20,
            yPercent: 45,
            widthPercent: 60,
            heightPercent: 0.3,
            shape: "line",
            shapeColor: "#D4AF37",
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 47,
            widthPercent: 80,
            heightPercent: 10,
            text: "Wedding Faith",
            style: {
              fontSize: 40,
              color: "#D4AF37",
              align: "center",
              fontFamily: "script",
            },
          },
          {
            type: "shape",
            xPercent: 20,
            yPercent: 57,
            widthPercent: 60,
            heightPercent: 0.3,
            shape: "line",
            shapeColor: "#D4AF37",
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 60,
            widthPercent: 80,
            heightPercent: 4,
            text: "of his children",
            style: {
              fontSize: 14,
              color: "#D4AF37",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 15,
            yPercent: 66,
            widthPercent: 35,
            heightPercent: 8,
            text: "Isabel\nLEWIS",
            style: {
              fontSize: 22,
              color: "#D4AF37",
              fontWeight: "bold",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 50,
            yPercent: 66,
            widthPercent: 35,
            heightPercent: 8,
            text: "Roger\nCLARK",
            style: {
              fontSize: 22,
              color: "#D4AF37",
              fontWeight: "bold",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 78,
            widthPercent: 80,
            heightPercent: 4,
            text: "28th December, 2024\n10 AM",
            style: {
              fontSize: 16,
              color: "#D4AF37",
              fontWeight: "bold",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 86,
            widthPercent: 80,
            heightPercent: 5,
            text: "David Lewis's Compound\nSuburbia Area Bida, Niger state",
            style: {
              fontSize: 11,
              color: "#D4AF37",
              align: "center",
              fontFamily: "serif",
            },
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. ROUGE & OR — Texturé, vertical, type "Clara Steven"
  // ═══════════════════════════════════════════════════════════════
  {
    id: "rouge-or",
    name: "Rouge & Or",
    description: "Rouge velours, or gravé",
    category: "wedding",
    format: "A4",
    accent: "#8B0000",
    previewImage: require("../../../assets/images/bg-black-gold.png"),
    pages: [
      {
        background: {
          type: "image",
          value: require("../../../assets/images/bg-black-gold.png"),
        },
        blocks: [
          {
            type: "text",
            xPercent: 8,
            yPercent: 25,
            widthPercent: 84,
            heightPercent: 40,
            text: "Clara\nAND\nSteven",
            style: {
              fontSize: 64,
              color: "#D4AF37",
              fontWeight: "800",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 25,
            widthPercent: 50,
            heightPercent: 4,
            text: "PLEASE JOIN US FOR\nTHE WEDDING OF",
            style: {
              fontSize: 9,
              color: "#D4AF37",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 35,
            widthPercent: 50,
            heightPercent: 4,
            text: "INVITE YOU TO THEIR\nWEDDING CELEBRATION",
            style: {
              fontSize: 9,
              color: "#D4AF37",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 45,
            widthPercent: 50,
            heightPercent: 4,
            text: "FRIDAY",
            style: {
              fontSize: 11,
              color: "#D4AF37",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 50,
            widthPercent: 50,
            heightPercent: 6,
            text: "25.08\n2026",
            style: {
              fontSize: 28,
              color: "#D4AF37",
              fontWeight: "bold",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 62,
            widthPercent: 50,
            heightPercent: 8,
            text: "AT FOUR O'CLOCK\nIN THE AFTERNOON\n2098 MAIN STREET,\nMINNEAPOLIS, MN 55773",
            style: {
              fontSize: 9,
              color: "#D4AF37",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 73,
            widthPercent: 50,
            heightPercent: 4,
            text: "AT 4:00 PM",
            style: {
              fontSize: 12,
              color: "#D4AF37",
              fontWeight: "bold",
              align: "left",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 45,
            yPercent: 78,
            widthPercent: 50,
            heightPercent: 4,
            text: "RECEPTION TO FOLLOW",
            style: {
              fontSize: 8,
              color: "#D4AF37",
              align: "left",
              fontFamily: "serif",
            },
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. BLEU 40 ANS — Bleu nuit, typographie mixte
  // ═══════════════════════════════════════════════════════════════
  {
    id: "bleu-40-ans",
    name: "Bleu 40 Ans",
    description: "Bleu nuit, or, 40 ans",
    category: "birthday",
    format: "A4",
    accent: "#0A1F44",
    previewImage: require("../../../assets/images/bg-blue-40.jpg"),
    pages: [
      {
        background: {
          type: "image",
          value: require("../../../assets/images/bg-blue-40.jpg"),
        },
        blocks: [
          {
            type: "shape",
            xPercent: 8,
            yPercent: 5,
            widthPercent: 84,
            heightPercent: 90,
            shape: "rect",
            shapeColor: "transparent",
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 10,
            widthPercent: 80,
            heightPercent: 4,
            text: "an Invitation to Celebrate",
            style: {
              fontSize: 14,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 20,
            widthPercent: 80,
            heightPercent: 20,
            text: "40 YEARS",
            style: {
              fontSize: 80,
              color: "#FFFFFF",
              fontWeight: "800",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 38,
            widthPercent: 80,
            heightPercent: 4,
            text: "of Excellence",
            style: {
              fontSize: 22,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 48,
            widthPercent: 80,
            heightPercent: 4,
            text: "With great pleasure, you are cordially\ninvited to join us in celebrating",
            style: {
              fontSize: 10,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "sans",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 60,
            widthPercent: 80,
            heightPercent: 12,
            text: "Pastor Kayode\nAyodele",
            style: {
              fontSize: 34,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "script",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 78,
            widthPercent: 80,
            heightPercent: 4,
            text: "Sat. 2nd May '26 || 12pm",
            style: {
              fontSize: 16,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 83,
            widthPercent: 80,
            heightPercent: 6,
            text: "First Class Assembly Global\nFirst Floor, Sunrise Plaza, beside\nDankaro Estate, Odozi Street, Berger, Lagos",
            style: {
              fontSize: 9,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "sans",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 91,
            widthPercent: 80,
            heightPercent: 4,
            text: "colour of the day: white and gold",
            style: {
              fontSize: 10,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "qr",
            xPercent: 42,
            yPercent: 96,
            widthPercent: 16,
            heightPercent: 3,
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. FLORAL VERT — Inspiré du 1er (Save the Date)
  // ═══════════════════════════════════════════════════════════════
  {
    id: "floral-vert",
    name: "Floral Vert",
    description: "Feuillage tropical, romantique",
    category: "wedding",
    format: "A4",
    accent: "#2D5016",
    previewImage: require("../../../assets/images/bg-green-floral.jpg"),
    pages: [
      {
        background: {
          type: "image",
          value: require("../../../assets/images/bg-green-floral.jpg"),
        },
        blocks: [
          {
            type: "text",
            xPercent: 10,
            yPercent: 15,
            widthPercent: 80,
            heightPercent: 40,
            text: "Save\nthe\nDate",
            style: {
              fontSize: 72,
              color: "#2D5016",
              fontWeight: "800",
              align: "center",
              fontFamily: "script",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 62,
            widthPercent: 80,
            heightPercent: 10,
            text: "DESMOND\n& TRACY",
            style: {
              fontSize: 46,
              color: "#FFFFFF",
              fontWeight: "800",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 76,
            widthPercent: 80,
            heightPercent: 4,
            text: "20.09.2025",
            style: {
              fontSize: 22,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "serif",
            },
          },
          {
            type: "text",
            xPercent: 10,
            yPercent: 82,
            widthPercent: 80,
            heightPercent: 4,
            text: "@ Jubilee International Church\nLocation: Pigfarm Station",
            style: {
              fontSize: 11,
              color: "#FFFFFF",
              align: "center",
              fontFamily: "sans",
            },
          },
        ],
      },
    ],
  },
];

export function getTemplatesByCategory(category?: string): ThemeTemplate[] {
  if (!category) return THEME_TEMPLATES;
  return THEME_TEMPLATES.filter(
    (t) => t.category === category || t.category === "neutral",
  );
}

export function buildThemeFromTemplate(
  template: ThemeTemplate,
  eventId: string,
  canvasW: number,
  canvasH: number,
): any {
  const id = `theme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const baseW = CANVAS_FORMATS[template.format].w;
  const baseH = CANVAS_FORMATS[template.format].h;

  const pages = template.pages.map((p, pi) => ({
    id: `page-${Date.now()}-${pi}`,
    background:
      p.background.type === "image"
        ? { type: "image", value: p.background.value }
        : { type: "color", value: p.background.value },
    bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
  }));

  const blocks: any[] = [];
  template.pages.forEach((p, pi) => {
    p.blocks.forEach((b, bi) => {
      const x = (b.xPercent / 100) * canvasW;
      const y = (b.yPercent / 100) * canvasH;
      const width = (b.widthPercent / 100) * canvasW;
      const height = (b.heightPercent / 100) * canvasH;

      if (b.type === "text") {
        blocks.push({
          id: `blk-${Date.now()}-${pi}-${bi}`,
          type: "text",
          pageIndex: pi,
          text: b.text || "",
          x,
          y,
          width,
          height,
          rotation: 0,
          zIndex: blocks.length + 1,
          style: {
            fontSize: b.style?.fontSize || 18,
            color: b.style?.color || "#000000",
            fontWeight: b.style?.fontWeight || "normal",
            align: b.style?.align || "center",
            fontFamily: b.style?.fontFamily || "default",
          },
        });
      } else if (b.type === "shape") {
        blocks.push({
          id: `blk-${Date.now()}-${pi}-${bi}`,
          type: "shape",
          shape: b.shape || "rect",
          color: b.shapeColor || "#000000",
          opacity: b.shapeOpacity ?? 1,
          pageIndex: pi,
          x,
          y,
          width,
          height,
          rotation: 0,
          zIndex: blocks.length + 1,
        });
      } else if (b.type === "qr") {
        blocks.push({
          id: `blk-${Date.now()}-${pi}-${bi}`,
          type: "qr",
          value: "{{code_invitation}}",
          pageIndex: pi,
          x,
          y,
          width,
          height,
          rotation: 0,
          zIndex: blocks.length + 1,
        });
      } else if (b.type === "image" && b.imageSource) {
        blocks.push({
          id: `blk-${Date.now()}-${pi}-${bi}`,
          type: "image",
          src: b.imageSource,
          pageIndex: pi,
          x,
          y,
          width,
          height,
          rotation: 0,
          zIndex: blocks.length + 1,
        });
      }
    });
  });

  return {
    id,
    name: template.name,
    eventId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    canvas: { width: canvasW, height: canvasH, format: template.format },
    pages,
    blocks,
    accent: template.accent,
  };
}
