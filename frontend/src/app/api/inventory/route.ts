import { NextResponse } from "next/server";

// Mock inventory data - in production this would come from your backend database
const inventoryData = [
  {
    id: "1",
    name: "Red Apples",
    sku: "APP-001",
    category: "fruits",
    quantity: 45,
    weight: "1 lb",
    price: 0.99,
    reorderLevel: 50,
    lastRestocked: "2026-04-07",
  },
  {
    id: "2",
    name: "Organic Carrots",
    sku: "CAR-002",
    category: "vegetables",
    quantity: 15,
    weight: "2 lbs",
    price: 1.49,
    reorderLevel: 30,
    lastRestocked: "2026-04-06",
  },
  {
    id: "3",
    name: "Fresh Broccoli",
    sku: "BRO-003",
    category: "produce",
    quantity: 22,
    weight: "1.5 lbs",
    price: 2.99,
    reorderLevel: 25,
    lastRestocked: "2026-04-07",
  },
  {
    id: "4",
    name: "Free Range Chicken",
    sku: "CHI-004",
    category: "meat",
    quantity: 8,
    weight: "2 lbs",
    price: 12.99,
    reorderLevel: 10,
    lastRestocked: "2026-04-05",
  },
  {
    id: "5",
    name: "Bananas",
    sku: "BAN-005",
    category: "fruits",
    quantity: 60,
    weight: "2 lbs",
    price: 0.59,
    reorderLevel: 40,
    lastRestocked: "2026-04-08",
  },
  {
    id: "6",
    name: "Organic Spinach",
    sku: "SPI-006",
    category: "vegetables",
    quantity: 12,
    weight: "0.5 lbs",
    price: 2.49,
    reorderLevel: 20,
    lastRestocked: "2026-04-06",
  },
  {
    id: "7",
    name: "Tomatoes",
    sku: "TOM-007",
    category: "produce",
    quantity: 35,
    weight: "1.5 lbs",
    price: 1.79,
    reorderLevel: 30,
    lastRestocked: "2026-04-07",
  },
  {
    id: "8",
    name: "Ground Beef",
    sku: "BEE-008",
    category: "meat",
    quantity: 5,
    weight: "1 lb",
    price: 8.99,
    reorderLevel: 10,
    lastRestocked: "2026-04-04",
  },
];

export async function GET() {
  try {
    // Add a small delay to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));

    return NextResponse.json(inventoryData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
