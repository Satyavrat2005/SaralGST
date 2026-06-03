import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loadDksMarchReconciliationSources } from '@/lib/reconciliation/dksMarchReconciliation';

async function getAuthenticatedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return user;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const view = url.searchParams.get('view') || 'all';

  const data = loadDksMarchReconciliationSources();
  if (!data) {
    return NextResponse.json(
      {
        error:
          "DKS March files not found. Place DKS - GSTR-2B_MAR'25 - FINAL.xlsx and DKS - GSTR1_MAR'25 - OK.pdf in the project root or public folder.",
      },
      { status: 404 }
    );
  }

  const { recon, gstr1Meta, sources, period } = data;

  if (view === 'matched') {
    return NextResponse.json({
      period,
      sources,
      gstr1Meta,
      data: recon.matchedPairs,
      stats: recon.stats,
    });
  }
  if (view === 'partial') {
    return NextResponse.json({
      period,
      sources,
      gstr1Meta,
      data: recon.partialMatches,
      stats: recon.stats,
    });
  }
  if (view === 'missing-gstr2b') {
    return NextResponse.json({
      period,
      sources,
      gstr1Meta,
      data: recon.missingInGstr2b,
      stats: recon.stats,
    });
  }
  if (view === 'missing-books') {
    return NextResponse.json({
      period,
      sources,
      gstr1Meta,
      data: recon.missingInBooks,
      stats: recon.stats,
    });
  }

  return NextResponse.json({
    period,
    sources,
    gstr1Meta,
    stats: recon.stats,
    matched: recon.matchedPairs,
    partial: recon.partialMatches,
    missing_in_gstr2b: recon.missingInGstr2b,
    missing_in_books: recon.missingInBooks,
  });
}
