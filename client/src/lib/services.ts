/* CONCORDVEST / Quiet Structure: service data stays editorial, transparent, and quote-led—no invented fixed pricing. */
export type ServicePackage = {
  id: string;
  number: string;
  slug: string;
  name: string;
  shortDescription: string;
  overview: string;
  problemsSolved: string[];
  includes: string[];
  process: string[];
  timeline: string;
  image: string;
  relatedProjectImage: string;
  tags: string[];
  isPublished?: boolean;
  sortOrder?: number;
};

const image = {
  home: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
  kitchen:
    "https://images.unsplash.com/photo-1556912167-f556f1f39fdf?auto=format&fit=crop&w=1600&q=85",
  bathroom:
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1600&q=85",
  interior:
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85",
  office:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85",
  bedroom:
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85",
  exterior:
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85",
};

export const servicePackages: ServicePackage[] = [
  {
    id: "svc-01",
    number: "01",
    slug: "home-refresh",
    name: "Home Refresh",
    shortDescription:
      "A precise reset for the spaces that need a lighter, cleaner point of view.",
    overview:
      "Home Refresh is designed for lived-in spaces that need their rhythm restored without becoming a full-scale construction site.",
    problemsSolved: [
      "Tired finishes and marked walls",
      "Small maintenance issues collecting over time",
      "Spaces that feel dim, dated, or disconnected",
    ],
    includes: [
      "Painting",
      "Minor POP repairs",
      "Light replacement",
      "Wall finishing",
      "Door polishing",
      "Basic plumbing fixes",
    ],
    process: [
      "Walk-through and scope alignment",
      "Surface preparation and repair",
      "Finishing, polishing, and final review",
    ],
    timeline: "Timeline placeholder · typically scoped after inspection",
    image: image.home,
    relatedProjectImage: image.interior,
    tags: ["refresh", "finishing", "maintenance"],
  },
  {
    id: "svc-02",
    number: "02",
    slug: "kitchen-transformation",
    name: "Kitchen Transformation",
    shortDescription:
      "A more considered kitchen through better flow, durable finishes, and everyday function.",
    overview:
      "Kitchen Transformation brings the working heart of the home into focus, balancing storage, surfaces, light, and the way meals actually happen.",
    problemsSolved: [
      "Poor storage and difficult work zones",
      "Worn surfaces and dated fixtures",
      "Lighting and plumbing that interrupt the workflow",
    ],
    includes: [
      "Tiles",
      "Cabinets",
      "Countertops",
      "Plumbing",
      "Lighting",
      "Sink installation",
    ],
    process: [
      "Measure, brief, and material direction",
      "First-fix services and cabinetry preparation",
      "Installation, finishing, and handover",
    ],
    timeline:
      "Timeline placeholder · confirmed with scope and material lead times",
    image: image.kitchen,
    relatedProjectImage: image.home,
    tags: ["kitchen", "cabinetry", "interiors"],
  },
  {
    id: "svc-03",
    number: "03",
    slug: "luxury-bathroom-upgrade",
    name: "Luxury Bathroom Upgrade",
    shortDescription:
      "A calmer daily ritual through refined surfaces, better water flow, and tactile detail.",
    overview:
      "Luxury Bathroom Upgrade turns a functional room into a more composed experience with careful proportion, clean detailing, and dependable services.",
    problemsSolved: [
      "Leaking or unreliable bathroom services",
      "Surfaces that are difficult to maintain",
      "A bathroom that feels visually busy or under-resolved",
    ],
    includes: [
      "Wall tiles",
      "Floor tiles",
      "Shower",
      "Vanity",
      "Toilet",
      "Water heater",
      "Plumbing",
    ],
    process: [
      "Site measure and design direction",
      "Strip-out, service preparation, and waterproofing",
      "Fit-out, detailing, and final testing",
    ],
    timeline: "Timeline placeholder · confirmed after site inspection",
    image: image.bathroom,
    relatedProjectImage: image.bedroom,
    tags: ["bathroom", "tiles", "luxury"],
  },
  {
    id: "svc-04",
    number: "04",
    slug: "complete-building-finishing",
    name: "Complete Building Finishing",
    shortDescription:
      "A coordinated finishing programme for unfinished structures ready to become homes.",
    overview:
      "Complete Building Finishing coordinates the major finishing trades into one considered programme, reducing the friction between services and surfaces.",
    problemsSolved: [
      "An unfinished structure without a clear sequence",
      "Multiple trades working without coordination",
      "Finishes that need a single quality point of view",
    ],
    includes: [
      "Plumbing",
      "Electrical",
      "POP",
      "Painting",
      "Tiles",
      "Doors",
      "Windows",
      "Kitchen",
      "Wardrobes",
    ],
    process: [
      "Technical assessment and finishing brief",
      "Services, surfaces, and joinery sequence",
      "Quality checks, snagging, and handover",
    ],
    timeline: "Timeline placeholder · programme issued after assessment",
    image: image.exterior,
    relatedProjectImage: image.kitchen,
    tags: ["building", "finishing", "coordination"],
  },
  {
    id: "svc-05",
    number: "05",
    slug: "office-remodeling",
    name: "Office Remodeling",
    shortDescription:
      "Professional commercial renovation shaped around how your team works, meets, and grows.",
    overview:
      "Office Remodeling treats the workplace as a working system: clear circulation, durable finishes, focused lighting, and a professional atmosphere.",
    problemsSolved: [
      "Layouts that slow collaboration or privacy",
      "A workplace that no longer reflects the business",
      "Poor lighting, flooring, partitions, or meeting flow",
    ],
    includes: [
      "Office aesthetics",
      "Functional layouts",
      "Finishes",
      "Lighting",
      "Flooring",
      "Partitions",
      "Professional appearance",
    ],
    process: [
      "Workplace brief and existing-space review",
      "Layout and finish direction",
      "Phased delivery with operational considerations",
    ],
    timeline: "Timeline placeholder · phased programme after brief",
    image: image.office,
    relatedProjectImage: image.interior,
    tags: ["office", "commercial", "workplace"],
  },
  {
    id: "svc-06",
    number: "06",
    slug: "rental-property-makeover",
    name: "Rental Property Makeover",
    shortDescription:
      "A practical uplift that improves appearance, functionality, and rental appeal.",
    overview:
      "Rental Property Makeover focuses on the changes that help a property feel ready: clean presentation, reliable function, and durable decisions.",
    problemsSolved: [
      "A rental that is hard to present confidently",
      "Small defects affecting tenant appeal",
      "Rooms that need better use without overbuilding",
    ],
    includes: [
      "Appearance improvements",
      "Functionality improvements",
      "Tenant preparation",
      "Rental appeal direction",
    ],
    process: [
      "Condition review and priority list",
      "Targeted repairs and visual uplift",
      "Final styling check and ready-to-let handover",
    ],
    timeline: "Timeline placeholder · dependent on property condition",
    image: image.bedroom,
    relatedProjectImage: image.home,
    tags: ["rental", "makeover", "investment"],
  },
  {
    id: "svc-07",
    number: "07",
    slug: "complete-home-remodeling",
    name: "Complete Home Remodeling",
    shortDescription:
      "A premium, whole-home transformation for new layouts, extensions, and elevated finishing.",
    overview:
      "Complete Home Remodeling is for a home that needs more than a surface update: a new spatial logic, a stronger material story, and careful delivery from structure to finish.",
    problemsSolved: [
      "A home constrained by its existing layout",
      "A need for extensions or structural change",
      "Disconnected rooms, finishes, and services",
    ],
    includes: [
      "Structural changes",
      "New layouts",
      "Extensions",
      "Luxury finishing",
    ],
    process: [
      "Discovery, feasibility, and project brief",
      "Design coordination and construction planning",
      "Build, finish, snag, and handover",
    ],
    timeline: "Timeline placeholder · programme confirmed after feasibility",
    image: image.interior,
    relatedProjectImage: image.exterior,
    tags: ["remodel", "extension", "luxury"],
  },
];

export const customService: ServicePackage = {
  id: "custom",
  number: "∞",
  slug: "custom-renovation",
  name: "Custom Renovation",
  shortDescription:
    "A considered route when your project does not fit one package.",
  overview:
    "Tell us what you are trying to change, and we will help shape the right next step.",
  problemsSolved: [],
  includes: [],
  process: [],
  timeline: "Timeline placeholder",
  image: image.exterior,
  relatedProjectImage: image.home,
  tags: ["custom", "bespoke"],
};

export function getService(slug?: string) {
  return (
    servicePackages.find(item => item.slug === slug) ||
    (slug === customService.slug ? customService : undefined)
  );
}

export function calculateNextServiceNumber(existingNumbers: string[]): string {
  const nums = existingNumbers
    .map(val => parseInt(val, 10))
    .filter(val => !isNaN(val) && isFinite(val));

  if (nums.length === 0) {
    return "01";
  }

  const max = Math.max(...nums);
  const next = max + 1;
  return next < 10 ? `0${next}` : String(next);
}

export function calculateNextSortOrder(existingOrders: number[]): number {
  if (existingOrders.length === 0) {
    return 1;
  }
  const max = Math.max(...existingOrders);
  return max + 1;
}

export function renumberServices(
  servicesList: ServicePackage[]
): ServicePackage[] {
  const sorted = [...servicesList].sort((a, b) => {
    const orderA = a.sortOrder ?? 0;
    const orderB = b.sortOrder ?? 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.number.localeCompare(b.number);
  });

  return sorted.map((srv, index) => {
    const nextIndex = index + 1;
    const newNumber = nextIndex < 10 ? `0${nextIndex}` : String(nextIndex);
    return {
      ...srv,
      number: newNumber,
      sortOrder: nextIndex,
    };
  });
}
