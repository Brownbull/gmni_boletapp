/**
 * One-time script to fix duplicate sharedGroupIds in transactions
 *
 * Run with: npx tsx scripts/fix-duplicate-sharedGroupIds.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Firebase config (from src/config/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBP5rMN__fQNVMXPJGPy39mM7qWGOrT8GU",
  authDomain: "boletapp-d609f.firebaseapp.com",
  projectId: "boletapp-d609f",
  storageBucket: "boletapp-d609f.firebasestorage.app",
  messagingSenderId: "1080422627796",
  appId: "1:1080422627796:web:8bd94b46dc5d9da3acce3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const USER_ID = 'gHZgifyzywbDBFux5QKhN005SuI2';
const APP_ID = 'boletapp';

async function fixDuplicateSharedGroupIds() {
  console.log('🔍 Searching for transactions with sharedGroupIds...\n');

  const transactionsRef = collection(db, `artifacts/${APP_ID}/users/${USER_ID}/transactions`);
  const snapshot = await getDocs(transactionsRef);

  let fixedCount = 0;
  let checkedCount = 0;

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    const sharedGroupIds = data.sharedGroupIds as string[] | undefined;

    if (sharedGroupIds && sharedGroupIds.length > 0) {
      checkedCount++;
      const uniqueIds = [...new Set(sharedGroupIds)];

      console.log(`📄 Transaction: ${docSnapshot.id}`);
      console.log(`   Merchant: ${data.merchant || 'Unknown'}`);
      console.log(`   Original sharedGroupIds: [${sharedGroupIds.join(', ')}]`);
      console.log(`   Length: ${sharedGroupIds.length}`);

      if (uniqueIds.length !== sharedGroupIds.length) {
        console.log(`   ⚠️  DUPLICATES FOUND! Unique count: ${uniqueIds.length}`);
        console.log(`   ✏️  Fixing...`);

        const docRef = doc(db, `artifacts/${APP_ID}/users/${USER_ID}/transactions`, docSnapshot.id);
        await updateDoc(docRef, { sharedGroupIds: uniqueIds });

        console.log(`   ✅ Fixed! New sharedGroupIds: [${uniqueIds.join(', ')}]`);
        fixedCount++;
      } else {
        console.log(`   ✅ No duplicates`);
      }
      console.log('');
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Summary:`);
  console.log(`   Total transactions checked: ${checkedCount}`);
  console.log(`   Transactions fixed: ${fixedCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

fixDuplicateSharedGroupIds()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
