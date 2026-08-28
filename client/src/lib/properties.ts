/* CONCORDVEST / Quiet Structure: local prototype inventory mirrors the future listing schema so real catalogue data can replace it without changing the UI vocabulary. */
export type PropertyCategory = "All Properties" | "Land for Sale" | "Apartments for Sale" | "Concordvest Property" | "Partner Property" | "Developer Listings";
export type PropertyType = "Land" | "Apartment" | "House";
export type ListingType = "Concordvest Property" | "Partner Property" | "Developer Listing";
export type Availability = "Available" | "Reserved" | "Sold";

export type PropertyRecord = {
  id: string;
  title: string;
  slug: string;
  category: PropertyCategory;
  listingType: ListingType;
  propertyType: PropertyType;
  location: string;
  area: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  landSize: number;
  buildingSize: number;
  description: string;
  features: string[];
  amenities: string[];
  documentation: string[];
  availability: Availability;
  images: string[];
  video: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
};

// Development/demo images - for production, these should be replaced with Supabase Storage URLs
const img = {
  hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  interior: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  home: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85",
  kitchen: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
  terrace: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85",
  building: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85",
  land: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85",
};

export const demoProperties: PropertyRecord[] = [
  { id: "cv-001", title: "Modern 3 Bedroom Apartment", slug: "modern-3-bedroom-apartment-jabi", category: "Concordvest Property", listingType: "Concordvest Property", propertyType: "Apartment", location: "Jabi", area: "Abuja", price: 185000000, bedrooms: 3, bathrooms: 4, landSize: 420, buildingSize: 245, description: "A considered apartment with generous proportions, calm finishes, and a connected Jabi address.", features: ["Balcony", "Fitted Kitchen", "Parking"], amenities: ["Security", "Generator", "Water", "Serviced Property"], documentation: ["C of O", "Deed"], availability: "Available", images: [img.hero, img.interior], video: "", coordinates: { lat: 9.0765, lng: 7.4306 }, tags: ["curated", "city living"] },
  { id: "cv-002", title: "Premium Residential Land", slug: "premium-residential-land-katampe", category: "Land for Sale", listingType: "Developer Listing", propertyType: "Land", location: "Katampe", area: "Abuja", price: 120000000, bedrooms: 0, bathrooms: 0, landSize: 600, buildingSize: 0, description: "A well-positioned parcel for a private residence in one of Abuja’s most considered growth corridors.", features: ["Security", "Garden"], amenities: ["Water", "Parking"], documentation: ["C of O", "R of O"], availability: "Available", images: [img.land], video: "", coordinates: { lat: 9.123, lng: 7.414 }, tags: ["land", "residential"] },
  { id: "cv-003", title: "Luxury 4 Bedroom Apartment", slug: "luxury-4-bedroom-apartment-wuse-2", category: "Partner Property", listingType: "Partner Property", propertyType: "Apartment", location: "Wuse 2", area: "Abuja", price: 220000000, bedrooms: 4, bathrooms: 5, landSize: 510, buildingSize: 330, description: "A bright, private apartment with an elevated material palette and close access to Wuse 2’s daily rhythm.", features: ["Swimming Pool", "Balcony", "Fitted Kitchen", "Smart Home"], amenities: ["Security", "Generator", "Water", "Parking"], documentation: ["Deed", "Other"], availability: "Reserved", images: [img.interior, img.kitchen], video: "", coordinates: { lat: 9.076, lng: 7.469 }, tags: ["luxury", "apartment"] },
  { id: "cv-004", title: "Courtyard House at Guzape", slug: "courtyard-house-guzape", category: "Apartments for Sale", listingType: "Concordvest Property", propertyType: "House", location: "Guzape", area: "Abuja", price: 265000000, bedrooms: 4, bathrooms: 5, landSize: 680, buildingSize: 390, description: "A composed courtyard home designed around light, privacy, and generous outdoor living.", features: ["Garden", "Swimming Pool", "Fitted Kitchen", "Parking"], amenities: ["Security", "Generator", "Water", "Smart Home"], documentation: ["C of O", "Deed"], availability: "Available", images: [img.home, img.terrace], video: "", coordinates: { lat: 9.022, lng: 7.495 }, tags: ["family home", "courtyard"] },
  { id: "cv-005", title: "Serviced 2 Bedroom Residence", slug: "serviced-2-bedroom-residence-maitama", category: "Partner Property", listingType: "Partner Property", propertyType: "Apartment", location: "Maitama", area: "Abuja", price: 148000000, bedrooms: 2, bathrooms: 3, landSize: 300, buildingSize: 180, description: "A polished, serviced residence in a quiet Maitama setting, designed for easy city living.", features: ["Serviced Property", "Balcony", "Fitted Kitchen"], amenities: ["Security", "Generator", "Water", "Parking"], documentation: ["R of O", "Deed"], availability: "Available", images: [img.terrace, img.interior], video: "", coordinates: { lat: 9.092, lng: 7.487 }, tags: ["serviced", "residence"] },
  { id: "cv-006", title: "Build-Ready Plot at Life Camp", slug: "build-ready-plot-life-camp", category: "Developer Listings", listingType: "Developer Listing", propertyType: "Land", location: "Life Camp", area: "Abuja", price: 85000000, bedrooms: 0, bathrooms: 0, landSize: 500, buildingSize: 0, description: "A build-ready residential plot with a clear brief: space, access, and room to shape your own address.", features: ["Security", "Garden"], amenities: ["Water", "Parking"], documentation: ["R of O", "Other"], availability: "Sold", images: [img.land, img.home], video: "", coordinates: { lat: 9.114, lng: 7.39 }, tags: ["plot", "development"] },
  { id: "cv-007", title: "Garden Apartment at Asokoro", slug: "garden-apartment-asokoro", category: "Apartments for Sale", listingType: "Developer Listing", propertyType: "Apartment", location: "Asokoro", area: "Abuja", price: 310000000, bedrooms: 4, bathrooms: 5, landSize: 560, buildingSize: 360, description: "An understated garden apartment with a private outdoor edge and quiet Asokoro address.", features: ["Garden", "Smart Home", "Fitted Kitchen", "Balcony"], amenities: ["Security", "Generator", "Water", "Parking"], documentation: ["C of O"], availability: "Available", images: [img.home, img.kitchen], video: "", coordinates: { lat: 9.034, lng: 7.506 }, tags: ["garden", "private"] },
  { id: "cv-008", title: "Family Residence at Gwarinpa", slug: "family-residence-gwarinpa", category: "All Properties", listingType: "Partner Property", propertyType: "House", location: "Gwarinpa", area: "Abuja", price: 172000000, bedrooms: 4, bathrooms: 4, landSize: 540, buildingSize: 290, description: "A practical family residence with generous rooms, reliable amenities, and room to grow.", features: ["Garden", "Parking", "Fitted Kitchen"], amenities: ["Security", "Generator", "Water"], documentation: ["Deed", "Other"], availability: "Available", images: [img.building, img.interior], video: "", coordinates: { lat: 9.101, lng: 7.405 }, tags: ["family", "home"] },
  { id: "cv-009", title: "Courtyard Residence at Jabi", slug: "courtyard-residence-jabi", category: "All Properties", listingType: "Concordvest Property", propertyType: "House", location: "Jabi", area: "Abuja", price: 205000000, bedrooms: 3, bathrooms: 4, landSize: 470, buildingSize: 265, description: "A warm courtyard residence with a practical plan, generous light, and a Jabi address.", features: ["Garden", "Parking", "Balcony"], amenities: ["Security", "Generator", "Water"], documentation: ["C of O", "Deed"], availability: "Available", images: [img.home, img.terrace], video: "", coordinates: { lat: 9.077, lng: 7.431 }, tags: ["courtyard", "jabi"] },
];

export const locations = ["Abuja", "Maitama", "Asokoro", "Wuse", "Jabi", "Gwarinpa", "Katampe", "Guzape", "Life Camp", "Apo", "Lokogoma", "Utako"];
export const featureOptions = ["Parking", "Security", "Generator", "Water", "Balcony", "Fitted Kitchen", "Garden", "Swimming Pool", "Smart Home", "Serviced Property"];
export const documentationOptions = ["C of O", "R of O", "Deed", "Other"];
export const categoryOptions: PropertyCategory[] = ["All Properties", "Land for Sale", "Apartments for Sale", "Concordvest Property", "Partner Property", "Developer Listings"];

export function formatNaira(value: number) { return `₦${new Intl.NumberFormat("en-NG").format(value)}`; }
