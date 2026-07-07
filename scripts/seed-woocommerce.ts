import fs from 'fs';
import path from 'path';

// Environment variables are loaded via Node --env-file


const REST_URL = process.env.WC_REST_URL;
const USERNAME = process.env.WC_REST_KEY; 
const PASSWORD = process.env.WC_REST_SECRET;

const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function wcFetch(endpoint: string, method = 'GET', body?: any) {
    const url = `${REST_URL}/${endpoint}`;
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`WooCommerce API Error: ${res.status} - ${error}`);
    }

    return res.json();
}

async function seed() {
    console.log('🌱 Starting WooCommerce Data Seeding...');

    // 1. Fetch Categories (we already created them in the previous run)
    const existingCats = await wcFetch('products/categories');
    const createdCategories = existingCats.slice(0, 3); // Get the first 3

    if (createdCategories.length < 3) {
        throw new Error('Expected 3 categories to exist. Please reset the database or create them.');
    }

    // 2. Create Products
    const products = [
        {
            name: 'Quantum Headphones',
            regular_price: '299.99', 
            description: 'High-fidelity noise-canceling headphones.',
            categories: [{ id: createdCategories[0].id }],
            images: [{ src: 'https://picsum.photos/seed/headphones/800/800.jpg' }]
        },
        {
            name: 'Mechanical Keyboard',
            regular_price: '149.50',
            description: 'Tactile mechanical keyboard with RGB.',
            categories: [{ id: createdCategories[0].id }],
            images: [{ src: 'https://picsum.photos/seed/keyboard/800/800.jpg' }]
        },
        {
            name: 'Minimalist Watch',
            regular_price: '199.00',
            description: 'Elegant timepiece for everyday wear.',
            categories: [{ id: createdCategories[1].id }],
            images: [{ src: 'https://picsum.photos/seed/watch/800/800.jpg' }]
        },
        {
            name: 'Cotton T-Shirt',
            regular_price: '25.00',
            description: 'Premium soft cotton basic t-shirt.',
            categories: [{ id: createdCategories[1].id }],
            images: [{ src: 'https://picsum.photos/seed/tshirt/800/800.jpg' }]
        },
        {
            name: 'Ceramic Coffee Mug',
            regular_price: '18.50',
            description: 'Handcrafted ceramic mug.',
            categories: [{ id: createdCategories[2].id }],
            images: [{ src: 'https://picsum.photos/seed/mug/800/800.jpg' }]
        },
        {
            name: 'Ergonomic Desk Chair',
            regular_price: '350.00',
            description: 'Comfortable chair for long hours.',
            categories: [{ id: createdCategories[2].id }],
            images: [{ src: 'https://picsum.photos/seed/chair/800/800.jpg' }]
        },
        {
            name: 'Smartphone Pro',
            regular_price: '999.00',
            description: 'Latest flagship smartphone.',
            categories: [{ id: createdCategories[0].id }],
            images: [{ src: 'https://picsum.photos/seed/phone/800/800.jpg' }]
        },
        {
            name: 'Running Shoes',
            regular_price: '120.00',
            description: 'Lightweight and durable.',
            categories: [{ id: createdCategories[1].id }],
            images: [{ src: 'https://picsum.photos/seed/shoes/800/800.jpg' }]
        },
        {
            name: 'Table Lamp',
            regular_price: '45.00',
            description: 'Modern table lamp.',
            categories: [{ id: createdCategories[2].id }],
            images: [{ src: 'https://picsum.photos/seed/lamp/800/800.jpg' }]
        },
        {
            name: 'Bluetooth Speaker',
            regular_price: '89.99',
            description: 'Portable speaker with deep bass.',
            categories: [{ id: createdCategories[0].id }],
            images: [{ src: 'https://picsum.photos/seed/speaker/800/800.jpg' }]
        }
    ];

    for (const p of products) {
        console.log(`Creating product: ${p.name}...`);
        await wcFetch('products', 'POST', p);
    }

    console.log('✅ Seeding Complete!');
}

seed().catch(console.error);
