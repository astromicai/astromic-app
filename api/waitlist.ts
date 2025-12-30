
import { corsHeaders, handleOptions } from './cors';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    if (req.method === 'OPTIONS') return handleOptions();
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
    }

    try {
        const formData = await req.formData();

        // The Google Script URL (Server-side only)
        const GOOGLE_SCRIPT_URL = process.env.WAITLIST_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzcO29ERwEyDRUZf95TBzIfSA4X5XdPSFvrjloE5q34sNKIFSgjRL1tmR6UC0hDrlr5/exec";

        // Forward the request to Google
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            // Google Scripts redirect, so we follow
            redirect: 'follow'
        });

        if (response.ok) {
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
        } else {
            return new Response(JSON.stringify({ error: "Upstream Error" }), { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
        }

    } catch (error: any) {
        console.error("Waitlist API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } });
    }
}
