/**
 * Shared Groups Security Rules Tests
 *
 * Story 14c.1: Create Shared Group
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Tests Firestore security rules for shared groups using @firebase/rules-unit-testing.
 * Validates that security rules correctly enforce:
 * - Authentication requirements
 * - Owner validation on create
 * - Member-only read access
 * - Owner-only write/delete access
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    getAuthedFirestore,
    getUnauthFirestore,
    getAuthedFirestoreWithEmail,
    TEST_USERS,
    TEST_EMAILS,
    assertSucceeds,
    assertFails,
} from '../setup/firebase-emulator';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const SHARED_GROUPS_COLLECTION = 'sharedGroups';
const PENDING_INVITATIONS_COLLECTION = 'pendingInvitations';

/**
 * Create a valid shared group data object
 */
function createValidGroupData(ownerId: string) {
    return {
        ownerId,
        appId: 'boletapp',
        name: '🏠 Gastos del Hogar',
        color: '#10b981',
        icon: '🏠',
        shareCode: 'Ab3dEf7hIj9kLm0p',
        shareCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        members: [ownerId],
        memberUpdates: {
            [ownerId]: {
                lastSyncAt: new Date(),
                unreadCount: 0,
            },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
}

describe('Shared Groups Security Rules', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    // =========================================================================
    // CREATE Tests
    // =========================================================================

    describe('CREATE rules', () => {
        it('should allow authenticated user to create a group they own', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(firestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));
            expect(docRef.id).toBeTruthy();
        });

        it('should deny unauthenticated user from creating a group', async () => {
            const firestore = getUnauthFirestore();
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(firestore, SHARED_GROUPS_COLLECTION);

            await assertFails(addDoc(collectionRef, groupData));
        });

        it('should deny creating a group with different owner than authenticated user', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            // Try to create a group where ownerId is USER_2 but auth is USER_1
            const groupData = createValidGroupData(TEST_USERS.USER_2);
            const collectionRef = collection(firestore, SHARED_GROUPS_COLLECTION);

            await assertFails(addDoc(collectionRef, groupData));
        });

        it('should deny creating a group with members array containing other users', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            // Add another user to members on creation (not allowed)
            groupData.members = [TEST_USERS.USER_1, TEST_USERS.USER_2];
            const collectionRef = collection(firestore, SHARED_GROUPS_COLLECTION);

            await assertFails(addDoc(collectionRef, groupData));
        });

        it('should deny creating a group with empty members array', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            groupData.members = [];
            const collectionRef = collection(firestore, SHARED_GROUPS_COLLECTION);

            await assertFails(addDoc(collectionRef, groupData));
        });
    });

    // =========================================================================
    // READ Tests
    // =========================================================================

    describe('READ rules', () => {
        it('should allow group member to read the group', async () => {
            // First create the group as owner
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner (who is a member) can read the group
            const docToRead = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            const snapshot = await assertSucceeds(getDoc(docToRead));
            expect(snapshot.exists()).toBe(true);
        });

        it('should deny non-member from reading the group', async () => {
            // Create the group as USER_1
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 (not a member) tries to read the group
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToRead = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(getDoc(docToRead));
        });

        it('should deny unauthenticated user from reading the group', async () => {
            // Create the group as USER_1
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Unauthenticated user tries to read
            const unauthFirestore = getUnauthFirestore();
            const docToRead = doc(unauthFirestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(getDoc(docToRead));
        });

        it('should deny listing all shared groups collection', async () => {
            // Create a group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);
            await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 tries to list all shared groups (should fail because they're not a member)
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const user2CollectionRef = collection(user2Firestore, SHARED_GROUPS_COLLECTION);

            // This should fail because getDocs would try to read documents where user is not a member
            await assertFails(getDocs(user2CollectionRef));
        });
    });

    // =========================================================================
    // UPDATE Tests
    // =========================================================================

    describe('UPDATE rules', () => {
        it('should allow owner to update the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner updates the group
            const docToUpdate = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            await assertSucceeds(updateDoc(docToUpdate, {
                name: '🏡 Casa Nueva',
                updatedAt: new Date(),
            }));
        });

        it('should deny non-owner member from updating the group', async () => {
            // Create the group first with just the owner
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner adds USER_2 as a member (this update is allowed as owner)
            const docToAddMember = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            await assertSucceeds(updateDoc(docToAddMember, {
                members: [TEST_USERS.USER_1, TEST_USERS.USER_2],
                updatedAt: new Date(),
            }));

            // USER_2 (now a member but not owner) tries to update
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToUpdate = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                name: '🏡 Renamed by Member',
                updatedAt: new Date(),
            }));
        });

        it('should deny non-member from updating the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 (not a member) tries to update
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToUpdate = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                name: '🏡 Hacked Group',
                updatedAt: new Date(),
            }));
        });

        it('should deny unauthenticated user from updating the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Unauthenticated user tries to update
            const unauthFirestore = getUnauthFirestore();
            const docToUpdate = doc(unauthFirestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                name: '🏡 Anonymous Update',
                updatedAt: new Date(),
            }));
        });
    });

    // =========================================================================
    // DELETE Tests
    // =========================================================================

    describe('DELETE rules', () => {
        it('should allow owner to delete the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner deletes the group
            const docToDelete = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            await assertSucceeds(deleteDoc(docToDelete));
        });

        it('should deny non-owner member from deleting the group', async () => {
            // Create the group first with just the owner
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner adds USER_2 as a member
            const docToAddMember = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            await assertSucceeds(updateDoc(docToAddMember, {
                members: [TEST_USERS.USER_1, TEST_USERS.USER_2],
                updatedAt: new Date(),
            }));

            // USER_2 (now a member but not owner) tries to delete
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToDelete = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(deleteDoc(docToDelete));
        });

        it('should deny non-member from deleting the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 (not a member) tries to delete
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToDelete = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(deleteDoc(docToDelete));
        });

        it('should deny unauthenticated user from deleting the group', async () => {
            // Create the group
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Unauthenticated user tries to delete
            const unauthFirestore = getUnauthFirestore();
            const docToDelete = doc(unauthFirestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(deleteDoc(docToDelete));
        });
    });

    // =========================================================================
    // Story 14c.2: User joining group (accepting invitation)
    // =========================================================================

    describe('JOIN GROUP rules (Story 14c.2)', () => {
        it('should allow non-member to add themselves to members array', async () => {
            // Create group as USER_1
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 adds themselves to the group (simulates accepting invitation)
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToJoin = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertSucceeds(updateDoc(docToJoin, {
                members: [TEST_USERS.USER_1, TEST_USERS.USER_2],
                [`memberUpdates.${TEST_USERS.USER_2}`]: {
                    lastSyncAt: new Date(),
                    unreadCount: 0,
                },
                updatedAt: new Date(),
            }));
        });

        it('should deny adding other users (not self) to members array', async () => {
            // Create group as USER_1
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // USER_2 tries to add a third user (malicious attempt)
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToJoin = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToJoin, {
                members: [TEST_USERS.USER_1, 'malicious-user-id'],
                updatedAt: new Date(),
            }));
        });

        it('should deny joining if already a member', async () => {
            // Create group with USER_1 and USER_2 already members
            const ownerFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const groupData = createValidGroupData(TEST_USERS.USER_1);
            const collectionRef = collection(ownerFirestore, SHARED_GROUPS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, groupData));

            // Owner adds USER_2
            const docToAddMember = doc(ownerFirestore, SHARED_GROUPS_COLLECTION, docRef.id);
            await assertSucceeds(updateDoc(docToAddMember, {
                members: [TEST_USERS.USER_1, TEST_USERS.USER_2],
                updatedAt: new Date(),
            }));

            // USER_2 tries to "join" again (should fail since already member)
            const user2Firestore = getAuthedFirestore(TEST_USERS.USER_2);
            const docToRejoin = doc(user2Firestore, SHARED_GROUPS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToRejoin, {
                members: [TEST_USERS.USER_1, TEST_USERS.USER_2],
                name: 'Try to change name too',
                updatedAt: new Date(),
            }));
        });
    });
});

// ============================================================================
// Story 14c.2: Pending Invitations Security Rules Tests
// ============================================================================

/**
 * Create a valid pending invitation data object
 */
function createValidInvitationData(invitedByUserId: string, invitedEmail: string) {
    return {
        groupId: 'test-group-123',
        groupName: '🏠 Gastos del Hogar',
        groupColor: '#10b981',
        groupIcon: '🏠',
        invitedEmail: invitedEmail.toLowerCase(),
        invitedByUserId,
        invitedByName: 'Test User',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
    };
}

describe('Pending Invitations Security Rules (Story 14c.2)', () => {
    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    // =========================================================================
    // CREATE Tests
    // =========================================================================

    describe('CREATE rules', () => {
        it('should allow authenticated user to create invitation they sent', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(firestore, PENDING_INVITATIONS_COLLECTION);

            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));
            expect(docRef.id).toBeTruthy();
        });

        it('should deny unauthenticated user from creating invitation', async () => {
            const firestore = getUnauthFirestore();
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(firestore, PENDING_INVITATIONS_COLLECTION);

            await assertFails(addDoc(collectionRef, invitationData));
        });

        it('should deny creating invitation with different invitedByUserId', async () => {
            const firestore = getAuthedFirestore(TEST_USERS.USER_1);
            // Try to create invitation claiming it was sent by USER_2
            const invitationData = createValidInvitationData(TEST_USERS.USER_2, 'someone@test.com');
            const collectionRef = collection(firestore, PENDING_INVITATIONS_COLLECTION);

            await assertFails(addDoc(collectionRef, invitationData));
        });
    });

    // =========================================================================
    // READ Tests
    // =========================================================================

    describe('READ rules', () => {
        it('should allow invited user to read their invitation', async () => {
            // Create invitation as USER_1
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_2 (invited by email) can read the invitation
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToRead = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            const snapshot = await assertSucceeds(getDoc(docToRead));
            expect(snapshot.exists()).toBe(true);
        });

        it('should deny non-invited user from reading invitation', async () => {
            // Create invitation for USER_2
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_1 (creator, but not invited) tries to read
            const user1Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_1, TEST_EMAILS.USER_1);
            const docToRead = doc(user1Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(getDoc(docToRead));
        });

        it('should deny unauthenticated user from reading invitation', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // Unauthenticated user tries to read
            const unauthFirestore = getUnauthFirestore();
            const docToRead = doc(unauthFirestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(getDoc(docToRead));
        });
    });

    // =========================================================================
    // UPDATE Tests
    // =========================================================================

    describe('UPDATE rules', () => {
        it('should allow invited user to accept invitation (status only)', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_2 accepts the invitation
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToUpdate = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertSucceeds(updateDoc(docToUpdate, {
                status: 'accepted',
            }));
        });

        it('should allow invited user to decline invitation (status only)', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_2 declines the invitation
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToUpdate = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertSucceeds(updateDoc(docToUpdate, {
                status: 'declined',
            }));
        });

        it('should deny updating fields other than status', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_2 tries to change groupName (not allowed)
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToUpdate = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                status: 'accepted',
                groupName: 'Hacked Group Name',
            }));
        });

        it('should deny setting invalid status value', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_2 tries to set invalid status
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToUpdate = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                status: 'invalid_status',
            }));
        });

        it('should deny non-invited user from updating invitation', async () => {
            // Create invitation for USER_2
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // USER_1 (not the invited user) tries to accept
            const user1Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_1, TEST_EMAILS.USER_1);
            const docToUpdate = doc(user1Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(updateDoc(docToUpdate, {
                status: 'accepted',
            }));
        });
    });

    // =========================================================================
    // DELETE Tests
    // =========================================================================

    describe('DELETE rules', () => {
        it('should deny anyone from deleting invitations', async () => {
            // Create invitation
            const creatorFirestore = getAuthedFirestore(TEST_USERS.USER_1);
            const invitationData = createValidInvitationData(TEST_USERS.USER_1, TEST_EMAILS.USER_2);
            const collectionRef = collection(creatorFirestore, PENDING_INVITATIONS_COLLECTION);
            const docRef = await assertSucceeds(addDoc(collectionRef, invitationData));

            // Even the invited user cannot delete
            const user2Firestore = getAuthedFirestoreWithEmail(TEST_USERS.USER_2, TEST_EMAILS.USER_2);
            const docToDelete = doc(user2Firestore, PENDING_INVITATIONS_COLLECTION, docRef.id);

            await assertFails(deleteDoc(docToDelete));
        });
    });
});
