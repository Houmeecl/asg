import { NextResponse } from 'next/server';
import { cerrarSesion } from '@/lib/segurosAuth';

export async function POST() {
    await cerrarSesion();
    return NextResponse.json({ ok: true });
}
