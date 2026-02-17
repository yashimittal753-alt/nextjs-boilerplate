import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      calories?: number;
      category?: string | null;
      date?: string;
    };

    if (!name || !date || typeof calories !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: name, calories, date" },
        { status: 400 },
      );
    }

    const entry = await prisma.entry.create({
      data: {
        name,
        calories: Math.round(calories),
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

