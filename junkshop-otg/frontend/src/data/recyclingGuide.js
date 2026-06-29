import tipSeparateImg from '../assets/recycling/tip-separate.jpg';
import tipCleanImg from '../assets/recycling/tip-clean.jpg';
import tipCapsImg from '../assets/recycling/tip-caps.jpg';
import tipSortImg from '../assets/recycling/tip-sort.jpg';

export const recyclingSteps = [
  {
    number: 1,
    title: 'Separate Materials',
    icon: '📦',
    previewImage: tipSeparateImg,
    description: 'Sort recyclables by type: plastic, paper, metal, glass, e-waste, and tires.',
    tips: ['Keep different materials in separate bags', 'Label containers for easy identification'],
    preview: true,
  },
  {
    number: 2,
    title: 'Clean Bottles',
    icon: '🧼',
    previewImage: tipCleanImg,
    description: 'Rinse containers first to remove dirt, liquid, and leftover residue.',
    tips: ['Use minimal water when cleaning', 'Let items dry completely before storing'],
    preview: true,
  },
  {
    number: 3,
    title: 'Remove Caps',
    icon: '🔓',
    previewImage: tipCapsImg,
    description: 'Take off lids, caps, labels, and other non-recyclable parts.',
    tips: ['Caps are often different plastic types', 'Labels can contaminate the recycling process'],
    preview: true,
  },
  {
    number: 4,
    title: 'Sort by Type',
    icon: '♻️',
    previewImage: tipSortImg,
    description: 'Group similar materials together so junkshops can price them faster.',
    tips: ['Keep tires dry and free from mud', 'Keep metals separated by type'],
    preview: true,
  },
  {
    number: 5,
    title: 'Bring to Junkshop',
    icon: '🚚',
    description: 'Deliver your sorted recyclables to nearby junkshops during business hours.',
    tips: ['Call ahead to confirm accepted materials', 'Keep recyclables dry while transporting'],
  },
];

export const recyclingDos = [
  'Clean and dry all recyclables before storage',
  'Keep tires dry and separated from mixed household waste',
  'Remove food residue from containers',
  'Sort materials by type',
  'Store in a dry, ventilated area',
  'Bundle newspapers and tie them',
  'Check what materials your local junkshop accepts',
  'Flatten plastic bottles to reduce volume',
];

export const recyclingDonts = [
  "Don't mix wet and dry waste",
  "Don't include food-contaminated items",
  "Don't throw batteries in regular trash",
  "Don't burn plastic or rubber materials",
  "Don't mix different types of plastic",
  "Don't include items with hazardous materials",
  "Don't leave recyclables exposed to rain",
  "Don't forget to remove metal staples from paper",
];

export const materialGuides = [
  {
    material: 'Plastic',
    accepted: ['PET bottles', 'Hard plastic containers', 'Plastic bags', 'Plastic chairs'],
    notAccepted: ['Food-contaminated plastic', 'Styrofoam', 'Plastic with food residue'],
    prep: 'Clean, dry, and flatten when possible',
  },
  {
    material: 'Paper',
    accepted: ['Newspapers', 'Office paper', 'Magazines', 'Paper bags'],
    notAccepted: ['Wet paper', 'Wax-coated paper', 'Carbon paper', 'Tissue paper'],
    prep: 'Keep dry, bundle and tie',
  },
  {
    material: 'Metal',
    accepted: ['Aluminum cans', 'Steel cans', 'Copper wire', 'Brass items', 'Iron scraps'],
    notAccepted: ['Paint cans with residue', 'Pressurized containers', 'Batteries'],
    prep: 'Remove labels, flatten cans, separate by metal type',
  },
  {
    material: 'Glass',
    accepted: ['Clear bottles', 'Colored bottles', 'Glass jars'],
    notAccepted: ['Broken glass', 'Window glass', 'Mirrors', 'Light bulbs'],
    prep: 'Clean, remove caps and labels, keep unbroken',
  },
  {
    material: 'Tires',
    accepted: ['Car tires', 'Motorcycle tires', 'Bicycle tires'],
    notAccepted: ['Tires filled with mud', 'Burned tires', 'Tires mixed with hazardous waste'],
    prep: 'Keep dry, remove loose debris, and confirm oversized tires with the junkshop first',
  },
];

export const previewRecyclingSteps = recyclingSteps.filter((step) => step.preview).slice(0, 4);
