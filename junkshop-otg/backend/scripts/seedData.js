/** Catalog seed data (mirrors frontend/src/data junkshops + prices). */

const junkshopSeed = [
  {
    slug: 'mang-tonio',
    name: "Mang Tonio's Junkshop",
    lat: 14.5995,
    lng: 121.0055,
    distance: '0.3 km',
    address: '123 P. Sanchez St., Teresa, Sta. Mesa',
    phone: '0912-345-6789',
    hours: '8:00 AM - 6:00 PM',
    status: 'open',
    rating: 4.8,
    materials: ['Plastic', 'Metal', 'Paper', 'Glass'],
    topPrice: 'Metal: ₱50/kg',
  },
  {
    slug: 'green-recyclers',
    name: 'Green Recyclers Teresa',
    lat: 14.6005,
    lng: 121.0035,
    distance: '0.5 km',
    address: '456 N. Domingo St., Teresa, Sta. Mesa',
    phone: '0923-456-7890',
    hours: '7:00 AM - 7:00 PM',
    status: 'open',
    rating: 4.6,
    materials: ['Plastic', 'Paper', 'E-waste'],
    topPrice: 'E-waste: ₱100/kg',
  },
  {
    slug: 'barangay-recycle-hub',
    name: 'Barangay Recycle Hub',
    lat: 14.5985,
    lng: 121.0065,
    distance: '0.8 km',
    address: '789 Mayon St., Teresa, Sta. Mesa',
    phone: '0934-567-8901',
    hours: '9:00 AM - 5:00 PM',
    status: 'closed',
    rating: 4.5,
    materials: ['Plastic', 'Metal', 'Paper', 'Glass', 'E-waste'],
    topPrice: 'All materials accepted',
  },
  {
    slug: 'ecostar',
    name: 'EcoStar Junkshop',
    lat: 14.6015,
    lng: 121.0025,
    distance: '1.2 km',
    address: '321 Arayat St., Teresa, Sta. Mesa',
    phone: '0945-678-9012',
    hours: '8:30 AM - 6:30 PM',
    status: 'open',
    rating: 4.7,
    materials: ['Metal', 'Paper', 'Cardboard'],
    topPrice: 'Metal: ₱48/kg',
  },
  {
    slug: 'teresa-green-exchange',
    name: 'Teresa Green Exchange',
    lat: 14.5975,
    lng: 121.0075,
    distance: '1.5 km',
    address: '555 V. Mapa St., Teresa, Sta. Mesa',
    phone: '0956-789-0123',
    hours: '8:00 AM - 5:00 PM',
    status: 'open',
    rating: 4.9,
    materials: ['Plastic', 'Metal', 'Paper', 'Glass', 'E-waste', 'Cardboard'],
    topPrice: 'Best prices in Teresa',
  },
];

const materialSeed = [
  { slug: 'pet-clear', category: 'plastic', name: 'PET Bottles (Clear)', examples: 'Water bottles, soft drink bottles', perKgPrice: '₱15-20', notes: 'Clean and flattened preferred' },
  { slug: 'pet-colored', category: 'plastic', name: 'PET Bottles (Colored)', examples: 'Juice bottles, colored containers', perKgPrice: '₱12-18', notes: 'Remove labels if possible' },
  { slug: 'hard-plastic', category: 'plastic', name: 'Hard Plastic', examples: 'Containers, buckets, chairs', perKgPrice: '₱10-15', notes: 'Clean and dry' },
  { slug: 'plastic-bags', category: 'plastic', name: 'Plastic Bags (Soft)', examples: 'Shopping bags, sachets', perKgPrice: '₱5-8', notes: 'Bundle together' },
  { slug: 'cardboard', category: 'paper', name: 'Cardboard', examples: 'Boxes, packaging materials', perKgPrice: '₱8-12', notes: 'Flatten and bundle' },
  { slug: 'white-paper', category: 'paper', name: 'White Paper', examples: 'Office paper, notebook paper', perKgPrice: '₱12-15', notes: 'No plastic coating' },
  { slug: 'newspaper', category: 'paper', name: 'Newspaper', examples: 'Old newspapers, magazines', perKgPrice: '₱6-10', notes: 'Bundle and tie' },
  { slug: 'mixed-paper', category: 'paper', name: 'Mixed Paper', examples: 'Various paper types', perKgPrice: '₱5-8', notes: 'Remove plastic or metal parts' },
  { slug: 'scrap-metal', category: 'metal', name: 'Scrap Metal (Iron)', examples: 'Iron bars, metal scraps', perKgPrice: '₱35-50', notes: 'Higher price for clean metal' },
  { slug: 'aluminum-cans', category: 'metal', name: 'Aluminum Cans', examples: 'Soda cans, beer cans', perKgPrice: '₱45-60', notes: 'Flatten to save space' },
  { slug: 'copper-wire', category: 'metal', name: 'Copper Wire', examples: 'Electrical wires, cables', perKgPrice: '₱280-350', notes: 'Remove plastic coating for better price' },
  { slug: 'brass', category: 'metal', name: 'Brass', examples: 'Faucets, fittings', perKgPrice: '₱180-220', notes: 'Clean items preferred' },
  { slug: 'glass-clear', category: 'glass', name: 'Glass Bottles (Clear)', examples: 'Beer bottles, wine bottles', perKgPrice: '₱8-12', notes: 'Unbroken, clean bottles' },
  { slug: 'glass-colored', category: 'glass', name: 'Glass Bottles (Colored)', examples: 'Brown, green bottles', perKgPrice: '₱6-10', notes: 'Remove caps and labels' },
  { slug: 'computer-parts', category: 'ewaste', name: 'Computer Parts', examples: 'Motherboards, hard drives', perKgPrice: '₱50-150', notes: 'Working or non-working' },
  { slug: 'mobile-phones', category: 'ewaste', name: 'Mobile Phones', examples: 'Old phones, smartphones', perKgPrice: '₱300-800', notes: 'Price varies by model' },
  { slug: 'cables-wires', category: 'ewaste', name: 'Cables & Wires', examples: 'Chargers, USB cables', perKgPrice: '₱20-40', notes: 'Mixed electronic cables' },
  { slug: 'batteries', category: 'ewaste', name: 'Batteries', examples: 'Phone batteries, power banks', perKgPrice: '₱15-30', notes: 'Handle with care' },
];

function parsePriceMid(perKgPrice) {
  const nums = String(perKgPrice).match(/\d+/g);
  if (!nums?.length) return 0;
  if (nums.length === 1) return Number(nums[0]);
  return Math.round((Number(nums[0]) + Number(nums[1])) / 2);
}

module.exports = {
  junkshopSeed,
  materialSeed,
  parsePriceMid,
  CATALOG_PROVIDER_EMAIL: 'catalog@junkshop.internal',
};
