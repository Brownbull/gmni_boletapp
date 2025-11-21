To make this app fully functional with a persistent database and Google Authentication, you need to move away from the "preview environment" configuration and connect it to your own Firebase project.

Here is the step-by-step guide and the updated code.

### Phase 1: Set up Firebase (The Backend)

1.  **Create a Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Register App:** Click the Web icon (`</>`) to register a web app. Copy the `firebaseConfig` object provided (API keys, etc.).
3.  **Enable Database:**
      * Go to **Build \> Firestore Database**.
      * Click **Create Database**.
      * Choose a location and start in **Test Mode** (for development) or **Production Mode** (you will need to add the security rules below).
4.  **Enable Authentication:**
      * Go to **Build \> Authentication**.
      * Click **Get Started**.
      * Select **Google** from the Sign-in method list and enable it.
      * (Optional) Select **Anonymous** and enable it if you want guest access.

**Firestore Security Rules (If using Production Mode):**
Go to the **Rules** tab in Firestore and paste this to allow users to only access their own data:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Phase 2: The Updated Code

I have updated the `App.jsx` file below. You **must** replace the `YOUR_FIREBASE_CONFIG` placeholders at the top with the keys you got in Step 2.

**Changes made:**

  * **Google Auth:** Replaced the automatic anonymous login with a proper "Sign in with Google" screen.
  * **Sign Out:** Added a Sign Out button in the Settings menu.
  * **Persistent Config:** Replaced the environment variable injection with a standard configuration block for you to fill.

http://googleusercontent.com/immersive_entry_chip/0