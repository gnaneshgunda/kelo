import type { Product } from '../types';

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Birthday Card',
    description: 'A cozy, handwoven scarf made from 100% natural sheep wool. Perfect for chilly evenings.',
    price: 35.00,
    category: 'Cards',
    imageUrl: 'https://images.unsplash.com/photo-1598124237583-3c970591f807?w=500&q=80',
  },
  {
    id: 'p2',
    name: 'Photo Frames',
    description: 'Artisan-crafted ceramic bowl with a beautiful blue glaze finish. Microwave and dishwasher safe.',
    price: 45.00,
    category: 'Frames',
    imageUrl: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80',
  },
  {
    id: 'p3',
    name: 'Bead Bracelets',
    description: 'Set of three hand-carved olive wood spoons. Finished with food-safe beeswax.',
    price: 25.00,
    category: 'Bracelets',
    imageUrl: 'https://images.unsplash.com/photo-1590487042502-d9f2e343b44b?w=500&q=80',
  },
  {
    id: 'p4',
    name: 'Scrap Book',
    description: 'Intricate macrame tapestry made with recycled cotton cord. Adds a boho touch to any room.',
    price: 60.00,
    category: 'Books',
    imageUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500&q=80',
  },
  {
    id: 'p5',
    name: 'Mini Cards',
    description: 'Unique beaded necklace featuring ethically sourced glass beads and a brass clasp.',
    price: 30.00,
    category: 'Cards',
    imageUrl: 'https://images.unsplash.com/photo-1599643477874-1296181f2150?w=500&q=80',
  },
  {
    id: 'p6',
    name: 'Shinchan Card',
    description: 'Lavender and sage scented soy candle in a reusable amber glass jar. 40-hour burn time.',
    price: 18.00,
    category: 'Cards',
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&q=80',
  }
];

export const CATEGORIES = ['All', 'Hampers','Photo frames','Bracelets','Scrap books','Cards','Shinchan card','Radio'];
