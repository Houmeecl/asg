import { NextResponse } from 'next/server';
import { auditarTextoConOllama } from '@/lib/ollamaService';

export async function POST(request, { params }) {
    const { id } = await params;
    const { texto } = await request.json();

    if (!texto) {
        return NextResponse.json({ error: 'Debe proporcionar el texto del contrato o política para auditar.' }, { status: 400 });
    }

    try {
        const analisisForense = await auditarTextoConOllama(texto);
        return NextResponse.json({ status: 'success', expediente_id: id, dictamen_ia: analisisForense });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
