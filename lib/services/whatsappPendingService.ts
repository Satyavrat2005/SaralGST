import { supabaseAdmin } from './purchaseInvoiceService';

export interface WhatsAppPendingMedia {
  id?: string;
  sender_phone: string;
  media_url: string;
  mime_type: string;
  file_name?: string | null;
  message_id?: string | null;
  created_at?: string;
  expires_at?: string;
}

export async function getPendingMedia(
  senderPhone: string
): Promise<{ data: WhatsAppPendingMedia | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_pending_media')
      .select('*')
      .eq('sender_phone', senderPhone)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function upsertPendingMedia(
  row: WhatsAppPendingMedia
): Promise<{ data: WhatsAppPendingMedia | null; error: string | null }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_pending_media')
      .upsert(
        {
          sender_phone: row.sender_phone,
          media_url: row.media_url,
          mime_type: row.mime_type,
          file_name: row.file_name ?? null,
          message_id: row.message_id ?? null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'sender_phone' }
      )
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function deletePendingMedia(senderPhone: string): Promise<void> {
  try {
    await supabaseAdmin
      .from('whatsapp_pending_media')
      .delete()
      .eq('sender_phone', senderPhone);
  } catch {
    /* best effort */
  }
}
