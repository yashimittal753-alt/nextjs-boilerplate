import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function estimateCalories(name: string, category?: string | null): number {
  const lower = name.toLowerCase();

  const keywordMap: { keyword: string; calories: number }[] = [
    { keyword: "banana", calories: 105 },
    { keyword: "apple", calories: 95 },
    { keyword: "orange", calories: 80 },
    { keyword: "egg", calories: 78 },
    { keyword: "rice", calories: 200 },
    { keyword: "bread", calories: 80 },
    { keyword: "sandwich", calories: 350 },
    { keyword: "salad", calories: 180 },
    { keyword: "chicken", calories: 250 },
    { keyword: "pizza", calories: 285 },
    { keyword: "pasta", calories: 350 },
    { keyword: "coffee", calories: 5 },
    { keyword: "latte", calories: 180 },
    { keyword: "burger", calories: 500 },
    { keyword: "fries", calories: 365 },
    { keyword: "yogurt", calories: 150 },
    { keyword: "smoothie", calories: 220 },
    { keyword: "oats", calories: 150 },
    { keyword: "oatmeal", calories: 150 },
    { keyword: "protein", calories: 200 },
  ];

  for (const { keyword, calories } of keywordMap) {
    if (lower.includes(keyword)) {
      return calories;
    }
  }

  if (category) {
    const cat = category.toLowerCase();
    if (cat === "breakfast") return 350;
    if (cat === "lunch") return 600;
    if (cat === "dinner") return 650;
    if (cat === "snack") return 200;
  }

  return 300;
}

// GET /api/entries?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Missing required query param 'date' (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    const entries = await prisma.entry.findMany({
      where: { date },
      orderBy: { createdAt: "asc" },
    });

    const totalCalories = entries.reduce(
      (sum, entry) => sum + entry.calories,
      0,
    );

    return NextResponse.json({ entries, totalCalories });
  } catch (error) {
    console.error("Error fetching entries", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 },
    );
  }
}

// POST /api/entries
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, calories, category, date } = body as {
      name?: string;
      calories?: number | null;
      category?: string | null;
      date?: string;
    };

    if (!name || !date) {
      return NextResponse.json(
        { error: "Missing required fields: name, date" },
        { status: 400 },
      );
    }

    let caloriesToUse: number;

    if (typeof calories === "number" && calories > 0) {
      caloriesToUse = Math.round(calories);
    } else {
      caloriesToUse = estimateCalories(name, category ?? null);
    }

    const entry = await prisma.entry.create({
      data: {
        name,
        calories: caloriesToUse,
        category: category || null,
        date,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating entry", error);
    return NextResponse.json(
      { error: "Failed to create entry" },
      { status: 500 },
    );
  }
}

// DELETE /api/entries?id=...
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query param 'id'" },
      { status: 400 },
    );
  }

  try {
    await prisma.entry.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting entry", error);
    return NextResponse.json(
      { error: "Failed to delete entry" },
      { status: 500 },
    );
  }
}

