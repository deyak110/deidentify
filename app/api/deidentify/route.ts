import { NextResponse } from "next/server";
import { deidentifyText } from "@/lib/deidentify";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Please paste some text to de-identify." }, { status: 400 });
    }
    return NextResponse.json(deidentifyText(text));
  } catch {
    return NextResponse.json({ error: "Unable to process the request." }, { status: 500 });
  }
}