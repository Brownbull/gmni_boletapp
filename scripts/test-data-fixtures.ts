import type { Transaction, StoreCategory } from '../src/types/transaction';

/**
 * Test Data Fixtures for Boletapp
 *
 * Provides realistic transaction data for test users:
 * - test-user-1-uid: 10 transactions (diverse categories)
 * - test-user-2-uid: 8 transactions (different spending patterns)
 *
 * Usage:
 * - Used by reset-test-data.ts script
 * - Used by automated tests
 * - Ensures consistent test data across test runs
 */

// Helper to generate dates in the past 30 days
const generateDate = (daysAgo: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

// Test User 1 Fixtures (10 transactions)
// Pattern: Diverse spending across multiple categories
const testUser1Fixtures: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        date: generateDate(1),
        merchant: 'Whole Foods Market',
        category: 'Supermarket',
        total: 87.43,
        items: [
            { name: 'Organic Milk', qty: 2, price: 6.99 },
            { name: 'Fresh Vegetables', qty: 1, price: 12.50 },
            { name: 'Chicken Breast', qty: 2, price: 15.99 },
            { name: 'Bread', qty: 1, price: 4.50 },
            { name: 'Fruits', qty: 1, price: 18.45 },
            { name: 'Eggs', qty: 1, price: 5.99 },
            { name: 'Cheese', qty: 1, price: 8.99 },
            { name: 'Yogurt', qty: 3, price: 4.02 }
        ]
    },
    {
        date: generateDate(3),
        merchant: 'Uber',
        category: 'Transport',
        total: 24.50,
        items: [
            { name: 'Ride to Downtown', qty: 1, price: 24.50 }
        ]
    },
    {
        date: generateDate(5),
        merchant: 'Pizza Palace',
        category: 'Restaurant',
        total: 42.00,
        items: [
            { name: 'Large Pepperoni Pizza', qty: 1, price: 18.99 },
            { name: 'Caesar Salad', qty: 1, price: 8.99 },
            { name: 'Garlic Bread', qty: 1, price: 6.50 },
            { name: 'Soft Drinks', qty: 2, price: 7.52 }
        ]
    },
    {
        date: generateDate(7),
        merchant: 'Trader Joes',
        category: 'Supermarket',
        total: 63.21,
        items: [
            { name: 'Frozen Meals', qty: 4, price: 19.96 },
            { name: 'Snacks', qty: 3, price: 12.47 },
            { name: 'Coffee Beans', qty: 1, price: 9.99 },
            { name: 'Orange Juice', qty: 2, price: 7.98 },
            { name: 'Ice Cream', qty: 1, price: 5.99 },
            { name: 'Pasta', qty: 2, price: 6.82 }
        ]
    },
    {
        date: generateDate(10),
        merchant: 'Cinema 10',
        category: 'Services',
        alias: 'Movie Theater',
        total: 28.00,
        items: [
            { name: 'Movie Tickets', qty: 2, price: 24.00 },
            { name: 'Popcorn', qty: 1, price: 4.00 }
        ]
    },
    {
        date: generateDate(12),
        merchant: 'City Electric Utility',
        category: 'Services',
        alias: 'Electric Bill',
        total: 120.00,
        items: [
            { name: 'Electric Service - November', qty: 1, price: 120.00 }
        ]
    },
    {
        date: generateDate(14),
        merchant: 'Starbucks',
        category: 'Restaurant',
        total: 8.75,
        items: [
            { name: 'Latte', qty: 1, price: 5.45 },
            { name: 'Croissant', qty: 1, price: 3.30 }
        ]
    },
    {
        date: generateDate(16),
        merchant: 'Shell Gas Station',
        category: 'Transport',
        total: 55.00,
        items: [
            { name: 'Gasoline', qty: 12, price: 55.00 }
        ]
    },
    {
        date: generateDate(18),
        merchant: 'Amazon',
        category: 'Technology',
        total: 134.99,
        items: [
            { name: 'Wireless Mouse', qty: 1, price: 29.99 },
            { name: 'USB-C Cable', qty: 2, price: 19.98 },
            { name: 'Phone Case', qty: 1, price: 24.99 },
            { name: 'Screen Protector', qty: 1, price: 14.99 },
            { name: 'Headphones', qty: 1, price: 45.04 }
        ]
    },
    {
        date: generateDate(20),
        merchant: 'Safeway',
        category: 'Supermarket',
        total: 72.18,
        items: [
            { name: 'Fresh Produce', qty: 1, price: 18.50 },
            { name: 'Meat', qty: 1, price: 22.99 },
            { name: 'Dairy Products', qty: 1, price: 15.49 },
            { name: 'Bakery Items', qty: 1, price: 8.20 },
            { name: 'Beverages', qty: 1, price: 7.00 }
        ]
    }
];

// Test User 2 Fixtures (8 transactions)
// Pattern: Different spending habits, more dining/entertainment focus
const testUser2Fixtures: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        date: generateDate(2),
        merchant: 'The Steakhouse',
        category: 'Restaurant',
        total: 95.00,
        items: [
            { name: 'Ribeye Steak', qty: 1, price: 45.00 },
            { name: 'Grilled Salmon', qty: 1, price: 32.00 },
            { name: 'Wine', qty: 1, price: 18.00 }
        ]
    },
    {
        date: generateDate(4),
        merchant: 'Local Market',
        category: 'Supermarket',
        total: 48.30,
        items: [
            { name: 'Fresh Vegetables', qty: 1, price: 15.50 },
            { name: 'Fruits', qty: 1, price: 12.80 },
            { name: 'Organic Products', qty: 1, price: 20.00 }
        ]
    },
    {
        date: generateDate(8),
        merchant: 'City Parking',
        category: 'Transport',
        total: 15.00,
        items: [
            { name: 'Parking Fee', qty: 1, price: 15.00 }
        ]
    },
    {
        date: generateDate(11),
        merchant: 'Concert Hall',
        category: 'Services',
        alias: 'Live Concert',
        total: 85.00,
        items: [
            { name: 'Concert Ticket', qty: 1, price: 75.00 },
            { name: 'Merchandise', qty: 1, price: 10.00 }
        ]
    },
    {
        date: generateDate(13),
        merchant: 'Fashion Boutique',
        category: 'Other',
        total: 120.50,
        items: [
            { name: 'Shirt', qty: 2, price: 60.00 },
            { name: 'Jeans', qty: 1, price: 60.50 }
        ]
    },
    {
        date: generateDate(15),
        merchant: 'Internet Provider',
        category: 'Services',
        total: 79.99,
        items: [
            { name: 'Internet Service - November', qty: 1, price: 79.99 }
        ]
    },
    {
        date: generateDate(17),
        merchant: 'Brunch Cafe',
        category: 'Restaurant',
        total: 52.00,
        items: [
            { name: 'Avocado Toast', qty: 1, price: 14.00 },
            { name: 'Pancakes', qty: 1, price: 12.00 },
            { name: 'Fresh Juice', qty: 2, price: 12.00 },
            { name: 'Coffee', qty: 2, price: 10.00 },
            { name: 'Tip', qty: 1, price: 4.00 }
        ]
    },
    {
        date: generateDate(19),
        merchant: 'Farmers Market',
        category: 'Supermarket',
        total: 35.75,
        items: [
            { name: 'Organic Vegetables', qty: 1, price: 18.50 },
            { name: 'Local Honey', qty: 1, price: 12.25 },
            { name: 'Fresh Herbs', qty: 1, price: 5.00 }
        ]
    }
];

// Export fixtures organized by user UID
export const fixtures: Record<string, Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]> = {
    'test-user-1-uid': testUser1Fixtures,
    'test-user-2-uid': testUser2Fixtures
};

// Export individual collections for convenience
export { testUser1Fixtures, testUser2Fixtures };

// Helper: Get all test user UIDs
export const getTestUserUIDs = (): string[] => {
    return Object.keys(fixtures);
};

// Helper: Get fixture count for a user
export const getFixtureCount = (userId: string): number => {
    return fixtures[userId]?.length || 0;
};

// Helper: Get total fixture count across all users
export const getTotalFixtureCount = (): number => {
    return Object.values(fixtures).reduce((sum, userFixtures) => sum + userFixtures.length, 0);
};
