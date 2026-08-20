import type { Product } from '../types';
import productsData from './products.json';

export const DUMMY_PRODUCTS: Product[] = productsData;

export const CATEGORIES = ['All', ...Array.from(new Set(productsData.map(p => p.category)))];
