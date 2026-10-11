import { NextResponse } from 'next/server';
import { exigirOps } from '@/lib/auth';
import { probeSupabase } from '@/lib/supabase/client';

export async function GET() {
  const usuario = await exigirOps();
  if (!usuario) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const supabase = await probeSupabase();
  return NextResponse.json({ usuario, supabase });
}
