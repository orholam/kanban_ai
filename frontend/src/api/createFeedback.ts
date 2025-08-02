import { supabase } from '../lib/supabase';

interface FeedbackData {
  comment: string;
}

export async function createFeedback(feedbackData: FeedbackData) {
  try {
    // First check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to submit feedback');
    }
    
    // Prepare the feedback data for insertion
    const feedbackDataForInsert = {
      user_id: user.id,
      comment: feedbackData.comment,
      created_at: new Date().toISOString()
    };
    
    console.log('Inserting feedback data:', feedbackDataForInsert);
    
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedbackDataForInsert])
      .select();

    if (error) {
      console.error('Error creating feedback:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    console.log('Feedback created successfully:', data);
    return data[0];
  } catch (error) {
    console.error('Error in createFeedback:', error);
    throw error;
  }
}
