// backend/cronJobs.js
import cron from 'node-cron';
import Campaign from './models/Campaign.js';

// Hər gün gecə yarısı (00:00) işləyəcək
cron.schedule('0 0 * * *', async () => {
  console.log('🔄 Kampaniya tarix yoxlaması başladı...');
  
  try {
    const now = new Date();
    
    // Bitmiş kampaniyaları 'completed' et
    const expiredResult = await Campaign.updateMany(
      {
        endDate: { $lt: now },
        status: { $ne: 'completed' }
      },
      { status: 'completed' }
    );
    
    // Hələ başlamamış kampaniyaları 'inactive' et
    const inactiveResult = await Campaign.updateMany(
      {
        startDate: { $gt: now },
        status: 'active'
      },
      { status: 'inactive' }
    );
    
    console.log(`✅ ${expiredResult.modifiedCount} kampaniya bitirildi`);
    console.log(`✅ ${inactiveResult.modifiedCount} kampaniya deaktiv edildi`);
  } catch (error) {
    console.error('❌ Cron xətası:', error);
  }
});