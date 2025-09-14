/*
# WhatsApp Birthday Notification Service

This edge function sends automated WhatsApp notifications for upcoming birthdays.
It checks for birthdays occurring in 1-2 days and sends reminder messages.

## Setup Required:
1. Add WhatsApp Business API credentials to environment variables
2. Configure webhook URL in WhatsApp Business settings
3. Set up cron job to run this function daily

## Environment Variables:
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_VERIFY_TOKEN
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { supabase } = await import("npm:@supabase/supabase-js@2");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (!whatsappPhoneNumberId || !whatsappAccessToken) {
      throw new Error("WhatsApp credentials not configured");
    }

    const supabaseClient = supabase(supabaseUrl, supabaseServiceKey);

    // Get current date info
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(today.getDate() + 2);

    // Fetch all active members with birthdays
    const { data: members, error } = await supabaseClient
      .from('members')
      .select('*')
      .eq('is_active', true)
      .not('birth_month', 'is', null)
      .not('birth_day', 'is', null);

    if (error) throw error;

    const upcomingBirthdays = members.filter(member => {
      const birthMonth = member.birth_month;
      const birthDay = member.birth_day;
      
      // Check if birthday is tomorrow or day after tomorrow
      return (
        (tomorrow.getMonth() + 1 === birthMonth && tomorrow.getDate() === birthDay) ||
        (dayAfterTomorrow.getMonth() + 1 === birthMonth && dayAfterTomorrow.getDate() === birthDay)
      );
    });

    // Send WhatsApp notifications
    const notifications = await Promise.allSettled(
      upcomingBirthdays.map(async (member) => {
        const daysUntil = member.birth_month === (tomorrow.getMonth() + 1) && 
                         member.birth_day === tomorrow.getDate() ? 1 : 2;
        
        const message = daysUntil === 1 
          ? `🎉 Don't forget! It's ${member.full_name}'s birthday tomorrow! Let's make sure to wish him well. #JHAMenOfImpact`
          : `🎂 Reminder: ${member.full_name}'s birthday is in 2 days! Mark your calendar to celebrate our brother. #JHAMenOfImpact`;

        // Get all other active members to notify them
        const { data: allMembers } = await supabaseClient
          .from('members')
          .select('phone')
          .eq('is_active', true)
          .neq('id', member.id);

        // Send to WhatsApp group or individual notifications
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${whatsappAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: 'GROUP_CHAT_ID', // Replace with actual WhatsApp group chat ID
              type: 'text',
              text: {
                body: message
              }
            })
          }
        );

        return {
          member: member.full_name,
          success: whatsappResponse.ok,
          daysUntil
        };
      })
    );

    const results = notifications.map(result => 
      result.status === 'fulfilled' ? result.value : { error: result.reason }
    );

    return new Response(
      JSON.stringify({
        success: true,
        upcomingBirthdays: upcomingBirthdays.length,
        notifications: results,
        date: today.toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Birthday notification error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});