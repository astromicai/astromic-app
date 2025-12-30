import { corsHeaders, handleOptions } from './cors.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') return handleOptions();
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });

    try {
        const { type, isPWA, screen, referrer, name } = await req.json();

        // Environment variable for the Google Script
        const LOGGING_URL = process.env.WAITLIST_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzcO29ERwEyDRUZf95TBzIfSA4X5XdPSFvrjloE5q34sNKIFSgjRL1tmR6UC0hDrlr5/exec";

        // Forward to Google Script
        let scriptParams;

        if (isPWA) {
            scriptParams = new URLSearchParams({
                type: 'pwa_launch',
                name: name || 'Guest',
                screen: screen,
                os: 'Mobile/Tablet',
                ip: req.headers.get('x-forwarded-for') || 'unknown'
            });
        } else {
            scriptParams = new URLSearchParams({
                email: 'Pageview',
                message: 'Web Visit',
                screen: screen,
                referrer: referrer,
                platform: 'Web',
                ip: req.headers.get('x-forwarded-for') || 'unknown'
            });
        }

        // Fire and forget (await to ensure it sends in Edge)
        await fetch(LOGGING_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: scriptParams,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Logging Failed' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
}
