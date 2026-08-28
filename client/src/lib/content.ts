/* CONCORDVEST / Quiet Structure: portfolio and editorial content are demo records with explicit commercial relationships, never fabricated testimonials. */
export type ProjectCategory =
  | "Renovation"
  | "Finishing"
  | "Kitchens"
  | "Bathrooms"
  | "Interiors"
  | "Exterior"
  | "Before & After";
export type ProjectRecord = {
  id: string;
  slug: string;
  title: string;
  location: string;
  type: string;
  category: ProjectCategory[];
  description: string;
  heroImage: string;
  beforeImages: string[];
  duringImages: string[];
  afterImages: string[];
  services: string[];
  serviceSlugs: string[];
  materials: string[];
  challenges: string[];
  outcome: string;
  relatedProjectSlugs: string[];
  isFeatured?: boolean;
  isPublished?: boolean;
};
export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  heroImage: string;
  readTime: string;
  content: { heading?: string; body: string }[];
  serviceSlugs: string[];
  projectSlugs: string[];
  propertyLink?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
};

// Development/demo images - for production, these should be replaced with Supabase Storage URLs
const img = {
  hero: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=85",
  property:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  kitchen:
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
  project:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
  living:
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85",
  bathroom:
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1600&q=85",
  stairs:
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85",
  office:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",
  exterior:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
  kitchenDetail:
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?auto=format&fit=crop&w=1600&q=85",
};

export const projects: ProjectRecord[] = [
  {
    id: "project-01",
    slug: "the-softened-arrival",
    title: "The Softened Arrival",
    location: "Maitama, Abuja",
    type: "Residential renovation",
    category: ["Renovation", "Interiors", "Before & After"],
    description:
      "A cooler, calmer entrance sequence for a family home with a heavy original layout.",
    heroImage: img.project,
    beforeImages: [img.property],
    duringImages: [img.exterior],
    afterImages: [img.project, img.living],
    services: ["Complete Home Remodeling", "Home Refresh"],
    serviceSlugs: ["complete-home-remodeling", "home-refresh"],
    materials: [
      "Textured plaster",
      "Warm oak",
      "Brushed metal",
      "Limestone-look porcelain",
    ],
    challenges: [
      "Rebalance a dark arrival",
      "Create storage without visual weight",
      "Keep the home operational during works",
    ],
    outcome:
      "The entry, living spaces, and circulation now read as one quieter sequence—more generous, more useful, and easier to maintain.",
    relatedProjectSlugs: ["the-everyday-kitchen", "quiet-lines-warm-light"],
  },
  {
    id: "project-02",
    slug: "the-everyday-kitchen",
    title: "The Everyday Kitchen",
    location: "Jabi, Abuja",
    type: "Kitchen transformation",
    category: ["Kitchens", "Finishing", "Before & After"],
    description:
      "A working kitchen shaped around hosting, storage, and the unhurried parts of a day.",
    heroImage: img.kitchenDetail,
    beforeImages: [img.kitchen],
    duringImages: [img.exterior],
    afterImages: [img.kitchenDetail, img.living],
    services: ["Kitchen Transformation"],
    serviceSlugs: ["kitchen-transformation"],
    materials: [
      "Oak veneer",
      "Quartz composite",
      "Hand-finished tile",
      "Warm LED lighting",
    ],
    challenges: [
      "Improve storage in a compact footprint",
      "Hide service clutter",
      "Make the kitchen feel connected to the living room",
    ],
    outcome:
      "A better working triangle, a more generous prep surface, and a finish palette that can handle daily life.",
    relatedProjectSlugs: ["the-softened-arrival", "material-made-precise"],
  },
  {
    id: "project-03",
    slug: "quiet-lines-warm-light",
    title: "Quiet Lines, Warm Light",
    location: "Asokoro, Abuja",
    type: "Bathroom upgrade",
    category: ["Bathrooms", "Finishing"],
    description:
      "A compact bathroom brought into focus through proportion, light, and durable tactile finishes.",
    heroImage: img.bathroom,
    beforeImages: [img.property],
    duringImages: [img.bathroom],
    afterImages: [img.bathroom, img.living],
    services: ["Luxury Bathroom Upgrade"],
    serviceSlugs: ["luxury-bathroom-upgrade"],
    materials: [
      "Porcelain tile",
      "Ribbed vanity front",
      "Brushed brass",
      "Microcement-look finish",
    ],
    challenges: [
      "Work within existing service positions",
      "Improve storage without shrinking the room",
      "Introduce a calmer material story",
    ],
    outcome:
      "A more restful bathroom with better storage, cleaner detailing, and a finish that feels considered from every angle.",
    relatedProjectSlugs: ["the-softened-arrival", "the-everyday-kitchen"],
  },
  {
    id: "project-04",
    slug: "material-made-precise",
    title: "Material, Made Precise",
    location: "Wuse 2, Abuja",
    type: "Commercial interior",
    category: ["Interiors", "Finishing"],
    description:
      "A workplace refresh that gives a growing team clearer zones for focus, exchange, and welcome.",
    heroImage: img.office,
    beforeImages: [img.exterior],
    duringImages: [img.office],
    afterImages: [img.office, img.living],
    services: ["Office Remodeling"],
    serviceSlugs: ["office-remodeling"],
    materials: [
      "Acoustic slats",
      "Resilient flooring",
      "Powder-coated partitions",
      "Layered lighting",
    ],
    challenges: [
      "Work around a live office",
      "Separate focus and meeting zones",
      "Create a more professional client arrival",
    ],
    outcome:
      "The office now works harder without feeling crowded—clearer circulation, more useful partitions, and a more assured first impression.",
    relatedProjectSlugs: ["the-softened-arrival", "the-everyday-kitchen"],
  },
  {
    id: "project-05",
    slug: "the-open-house",
    title: "The Open House",
    location: "Gwarinpa, Abuja",
    type: "Complete building finishing",
    category: ["Exterior", "Finishing", "Before & After"],
    description:
      "A partially finished structure given a coherent exterior and a more resolved interior direction.",
    heroImage: img.exterior,
    beforeImages: [img.property],
    duringImages: [img.exterior],
    afterImages: [img.exterior, img.living],
    services: ["Complete Building Finishing"],
    serviceSlugs: ["complete-building-finishing"],
    materials: [
      "Stone-look cladding",
      "Slimline aluminium",
      "Terrazzo-inspired tile",
      "Painted timber",
    ],
    challenges: [
      "Coordinate multiple finishing trades",
      "Create a stronger street presence",
      "Bring unfinished services to a clear sequence",
    ],
    outcome:
      "A structure with a clearer point of view—finished from the outside in, with the sequence and details aligned.",
    relatedProjectSlugs: ["material-made-precise", "quiet-lines-warm-light"],
  },
];

export const articles: ArticleRecord[] = [
  {
    id: "article-01",
    slug: "things-to-inspect-before-moving-into-a-new-home",
    title: "Things to Inspect Before Moving Into a New Home",
    category: "Home Improvement Tips",
    date: "14 August 2026",
    excerpt:
      "A practical first walk-through for the details that shape comfort, maintenance, and peace of mind.",
    heroImage: img.property,
    readTime: "6 min read",
    content: [
      {
        heading: "Start with the quiet systems",
        body: "Before unpacking, move through the home slowly. Look for the things that are easy to ignore when a space is staged: water pressure, drainage, sockets, switches, doors, windows, and the way light moves through each room.",
      },
      {
        heading: "Look closely at the finish",
        body: "Small defects often point to larger maintenance questions. Check paint edges, tile joints, silicone lines, cabinet alignment, and areas where moisture gathers. Document what you find with photographs and a simple room-by-room list.",
      },
      {
        heading: "Make the first month easier",
        body: "A home does not need to be perfect on day one. It needs a clear priority list. Separate urgent safety or service issues from the improvements that can make the space feel more like yours over time.",
      },
    ],
    serviceSlugs: ["home-refresh", "complete-home-remodeling"],
    projectSlugs: ["the-softened-arrival"],
    propertyLink: "/properties",
  },
  {
    id: "article-02",
    slug: "which-kitchen-would-you-choose",
    title: "Which Kitchen Would You Choose?",
    category: "Kitchen Inspiration",
    date: "08 August 2026",
    excerpt:
      "Three ways to think about the kitchen: as a working room, a social room, and a material composition.",
    heroImage: img.kitchenDetail,
    readTime: "5 min read",
    content: [
      {
        heading: "The kitchen as a working room",
        body: "Start with the sequence between fridge, sink, and cooking surface. Good kitchens feel easy because the important movements are short, clear, and supported by storage where you need it.",
      },
      {
        heading: "The kitchen as a social room",
        body: "If people gather while food is being prepared, plan for a place to lean, sit, or move through without interrupting the work. A small change in counter depth or lighting can reshape the room.",
      },
      {
        heading: "The kitchen as a material composition",
        body: "Choose one lead material, one supporting texture, and one quiet background. The result feels more enduring than a room where every surface competes for attention.",
      },
    ],
    serviceSlugs: ["kitchen-transformation"],
    projectSlugs: ["the-everyday-kitchen"],
  },
  {
    id: "article-03",
    slug: "5-modern-staircase-ideas",
    title: "5 Modern Staircase Ideas",
    category: "Staircase Ideas",
    date: "02 August 2026",
    excerpt:
      "Five ways to make the stair feel less like a connector and more like a considered architectural moment.",
    heroImage: img.stairs,
    readTime: "4 min read",
    content: [
      {
        heading: "01 — Let the handrail lead",
        body: "A strong handrail can give the stair a single confident line. Consider contrast, touch, and the way it meets the wall before thinking about decorative detail.",
      },
      {
        heading: "02 — Use light as a guide",
        body: "Wall washes, concealed step lights, and a brighter landing can make movement feel intuitive without turning the stair into a display.",
      },
      {
        heading: "03 — Keep the background quiet",
        body: "When the stair has a strong geometry, let the surrounding finishes support it. Calm walls and durable flooring give the structure room to read.",
      },
    ],
    serviceSlugs: ["complete-home-remodeling", "complete-building-finishing"],
    projectSlugs: ["the-softened-arrival"],
  },
  {
    id: "article-04",
    slug: "painting-transformation",
    title: "Painting Transformation",
    category: "Materials & Finishes",
    date: "25 July 2026",
    excerpt:
      "What changes when colour, sheen, preparation, and light are treated as one decision.",
    heroImage: img.living,
    readTime: "5 min read",
    content: [
      {
        heading: "Preparation is part of the finish",
        body: "A beautiful paint colour cannot correct an uneven substrate. Filling, sanding, priming, and cleaning are the quiet stages that allow the final surface to feel deliberate.",
      },
      {
        heading: "Colour follows the light",
        body: "Observe a room through the day before committing. A shade that feels balanced in morning light can become much warmer by evening, especially beside timber or warm artificial light.",
      },
      {
        heading: "Use sheen with intention",
        body: "Different surfaces can carry different levels of reflection. Keep walls calm, then use a slightly higher sheen on doors, trims, or joinery where it supports durability and detail.",
      },
    ],
    serviceSlugs: ["home-refresh"],
    projectSlugs: ["the-softened-arrival", "material-made-precise"],
  },
  {
    id: "article-05",
    slug: "spa-bathroom-inspiration",
    title: "Spa Bathroom Inspiration",
    category: "Bathroom Inspiration",
    date: "18 July 2026",
    excerpt:
      "A calmer bathroom usually begins with fewer, better decisions: proportion, texture, light, and storage.",
    heroImage: img.bathroom,
    readTime: "5 min read",
    content: [
      {
        heading: "Begin with the daily ritual",
        body: "Think about the first and last ten minutes of the day. Where do towels land? What needs to be within reach? Which surfaces need to be easy to clean? These questions shape a better plan than trends alone.",
      },
      {
        heading: "Layer the light",
        body: "A single overhead light rarely creates a restful room. Combine general illumination with mirror light and a softer layer that helps the room feel composed at night.",
      },
      {
        heading: "Choose texture over noise",
        body: "A tactile tile, a quiet stone tone, and a carefully chosen metal finish can create depth without visual clutter.",
      },
    ],
    serviceSlugs: ["luxury-bathroom-upgrade"],
    projectSlugs: ["quiet-lines-warm-light"],
  },
  {
    id: "article-06",
    slug: "construction-mistakes-homeowners-should-avoid",
    title: "Construction Mistakes Homeowners Should Avoid",
    category: "Construction Tips",
    date: "10 July 2026",
    excerpt:
      "A clear brief and a disciplined sequence can prevent the most expensive kind of rework.",
    heroImage: img.exterior,
    readTime: "7 min read",
    content: [
      {
        heading: "Starting without a scope",
        body: "The fastest route is not always the one with the earliest demolition. Define what is changing, what is staying, and what a finished result should feel like before work begins.",
      },
      {
        heading: "Choosing finishes too late",
        body: "Tiles, joinery, lighting, and plumbing decisions affect one another. Resolving them early helps reduce substitutions, delays, and visual compromises.",
      },
      {
        heading: "Underestimating the handover",
        body: "Snagging, cleaning, testing, and documenting the finished work are part of the project—not an afterthought. Leave enough time for the details to be checked properly.",
      },
    ],
    serviceSlugs: ["complete-building-finishing", "complete-home-remodeling"],
    projectSlugs: ["the-open-house"],
  },
];

export const projectCategories: Array<"All Projects" | ProjectCategory> = [
  "All Projects",
  "Renovation",
  "Finishing",
  "Kitchens",
  "Bathrooms",
  "Interiors",
  "Exterior",
  "Before & After",
];
export const inspirationCategories = [
  "All Inspiration",
  "Home Improvement Tips",
  "Kitchen Inspiration",
  "Bathroom Inspiration",
  "Staircase Ideas",
  "Materials & Finishes",
  "Construction Tips",
];
export const getProject = (slug?: string) =>
  projects.find(project => project.slug === slug);
export const getArticle = (slug?: string) =>
  articles.find(article => article.slug === slug);
