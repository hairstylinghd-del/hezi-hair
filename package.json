export async function sendWhatsApp(phone: string, message: string) {
  const instanceId = process.env.GREEN_API_INSTANCE_ID
  const token = process.env.GREEN_API_TOKEN

  if (!instanceId || !token) {
    console.error('Green API credentials missing')
    return
  }

  // Convert Israeli phone to Green API format: 9725XXXXXXXX@c.us
  const clean = phone.replace(/\D/g, '')
  const intl = clean.startsWith('0') ? '972' + clean.slice(1) : clean
  const chatId = `${intl}@c.us`

  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  })

  const data = await res.json()
  console.log('WhatsApp sent:', data)
  return data
}

export function buildDayMessage(clientName: string, time: string, serviceName: string): string {
  return `שלום ${clientName} 👋\n\nתזכורת: יש לך תור *מחר* בשעה *${time}* 💈\nשירות: *${serviceName}*\n\nלביטול ענה *בטל*`
}

export function buildHourMessage(clientName: string, time: string): string {
  return `היי ${clientName} ⏰\n\nהתור שלך *בעוד שעה* — ${time} היום!\n\nנתראה! 💈`
}
