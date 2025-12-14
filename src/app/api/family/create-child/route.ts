import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { childName, childAge, householdId } = await request.json();

    // Validate input
    if (!childName || typeof childName !== 'string' || childName.trim().length === 0) {
      return NextResponse.json({ error: 'Child name is required' }, { status: 400 });
    }

    if (!childAge || typeof childAge !== 'number' || childAge < 1 || childAge > 17) {
      return NextResponse.json({ error: 'Valid age (1-17) is required' }, { status: 400 });
    }

    // Get current user from session using server client
    const supabaseClient = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get parent's profile ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Use service role client for the stored procedure
    const supabaseAdmin = createServiceClient();

    // Call the create_child_profile function
    const { data, error } = await supabaseAdmin.rpc('create_child_profile', {
      parent_profile_id: profile.id,
      child_name: childName.trim(),
      child_age: childAge,
      household_id_param: householdId || null,
    });

    if (error) {
      console.error('Error creating child profile:', error);
      return NextResponse.json(
        { error: 'Failed to create child profile', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data returned from function' }, { status: 500 });
    }

    const result = data[0];

    return NextResponse.json({
      success: true,
      profileId: result.child_profile_id,
      credentialId: result.credential_id,
      username: result.username,
      password: result.password_secret,
      provisioningToken: result.provisioning_token,
    });
  } catch (error) {
    console.error('Error in create-child API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
