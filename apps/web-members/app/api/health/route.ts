import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    const status: Record<string, string> = {
        app: 'healthy',
        database: 'unknown',
    }

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseAnonKey) {
            const supabase = createClient(supabaseUrl, supabaseAnonKey)
            const { data, error } = await supabase.from('firms').select('count', { count: 'exact', head: true })

            if (!error) {
                status.database = 'connected'
            } else {
                status.database = 'error'
                console.error('Health check DB error:', error)
            }
        } else {
            status.database = 'not_configured'
        }
    } catch (error) {
        status.database = 'exception'
        console.error('Health check exception:', error)
    }

    return NextResponse.json(status, { status: 200 })
}
