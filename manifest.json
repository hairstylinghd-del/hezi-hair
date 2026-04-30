import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, buildDayMessage, buildHourMessage } from '@/lib/whatsapp'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const sent = { day: 0, hour: 0 }

  // Appointments in ~24 hours
  const in23h = new Date(now.getTime() + 23.5 * 3600000).toISOString()
  const in25h = new Date(now.getTime() + 24.5 * 3600000).toISOString()

  const { data: dayAppts } = await supabase
    .from('appointments')
    .select('*, clients(*), services(*)')
    .eq('reminder_sent', 'none')
    .gte('scheduled_at', in23h)
    .lte('scheduled_at', in25h)

  for (const appt of dayAppts || []) {
    const time = new Date(appt.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const msg = buildDayMessage(appt.clients.first_name, time, appt.services.name)
    await sendWhatsApp(appt.clients.phone, msg)
    await supabase.from('appointments').update({ reminder_sent: 'day' }).eq('id', appt.id)
    sent.day++
  }

  // Appointments in ~1 hour
  const in45m = new Date(now.getTime() + 0.75 * 3600000).toISOString()
  const in75m = new Date(now.getTime() + 1.25 * 3600000).toISOString()

  const { data: hourAppts } = await supabase
    .from('appointments')
    .select('*, clients(*), services(*)')
    .in('reminder_sent', ['none', 'day'])
    .gte('scheduled_at', in45m)
    .lte('scheduled_at', in75m)

  for (const appt of hourAppts || []) {
    const time = new Date(appt.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const msg = buildHourMessage(appt.clients.first_name, time)
    await sendWhatsApp(appt.clients.phone, msg)
    await supabase.from('appointments').update({ reminder_sent: 'both' }).eq('id', appt.id)
    sent.hour++
  }

  return NextResponse.json({ success: true, sent })
}
