import * as cron from 'node-cron';
import { getCollection } from '../config/database'; // Adjust import path as needed

// Function to sync global prompts to all users
async function syncGlobalPromptsToUsers() {
  try {
    console.log('🔄 Starting global prompt sync job...');
    
    // Get collections
    const globalPromptCollection = await getCollection('globalprompt');
    const usersCollection = await getCollection('users');
    
    // Find all global prompts with new: true
    const newGlobalPrompts = await globalPromptCollection.find({ new: true }).toArray();
    
    if (newGlobalPrompts.length === 0) {
      console.log('✅ No new global prompts found to sync');
      return;
    }
    
    console.log(`📋 Found ${newGlobalPrompts.length} new global prompt(s) to sync`);
    
    for (const globalPrompt of newGlobalPrompts) {
      console.log(`🔄 Syncing global prompt: ${globalPrompt.title}`);
      
      // Update all users with the new prompt
      const updateResult = await usersCollection.updateMany(
        {}, // Empty filter means all documents
        {
          $set: {
            prompt: globalPrompt.prompt,
            promptUpdatedAt: new Date(),
            promptTitle: globalPrompt.title
          }
        }
      );
      
      console.log(`✅ Updated ${updateResult.modifiedCount} user(s) with prompt: ${globalPrompt.title}`);
      
      // Mark the global prompt as processed (set new: false)
      await globalPromptCollection.updateOne(
        { _id: globalPrompt._id },
        {
          $set: {
            new: false,
            processedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Marked global prompt "${globalPrompt.title}" as processed`);
    }
    
    console.log('🎉 Global prompt sync job completed successfully');
    
  } catch (error) {
    console.error('❌ Error in global prompt sync job:', error);
  }
}

// Function to start the cron job
export function startPromptSyncCronJob() {
  // Run every 5 minutes
  // Format: second minute hour day month day-of-week
  const cronSchedule = '* * * * *'; // Every 5 minutes
  
  console.log('🚀 Starting global prompt sync cron job...');
  console.log(`⏰ Schedule: ${cronSchedule} (every 5 minutes)`);
  
  const task = cron.schedule(cronSchedule, async () => {
    await syncGlobalPromptsToUsers();
  }, {
    timezone: "UTC" // Set your preferred timezone
  });
  
  // Start the cron job (it starts automatically by default)
  
  console.log('✅ Global prompt sync cron job started successfully');
  
  return task;
}

// Function to stop the cron job
export function stopPromptSyncCronJob(task: cron.ScheduledTask) {
  if (task) {
    task.stop();
    console.log('🛑 Global prompt sync cron job stopped');
  }
}

// Manual trigger function for testing
export async function triggerPromptSyncManually() {
  console.log('🔧 Manually triggering global prompt sync...');
  await syncGlobalPromptsToUsers();
}

// Alternative cron schedules (uncomment the one you prefer):
// '0 */1 * * *'    // Every hour at minute 0
// '0 0 * * *'      // Every day at midnight
// '0 0 */6 * *'    // Every 6 hours
// '*/30 * * * *'   // Every 30 minutes
// '0 */15 * * *'   // Every 15 minutes