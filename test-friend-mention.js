/**
 * Test script untuk mention hanya teman:
 * 1. Create 3 users: alice, bob, charlie
 * 2. Alice add Bob as friend (accepted)
 * 3. Alice try tag Bob -> Should work (notification created)
 * 4. Alice try tag Charlie (not friend) -> Should FAIL (no notification)
 */

const API_BASE = 'http://localhost:3000';
const DELAY = 300;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
    const headers = {'Content-Type': 'application/json'};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = {method, headers};
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return response.json();
}

async function registerUser(username, nisn) {
    const data = await fetchAPI('/api/register', 'POST', {username, nisn, password: 'test123'});
    if (data.success || data.message?.includes('exist')) {
        console.log(`✓ User ${username} ready`);
        return true;
    }
    throw new Error(data.message);
}

async function loginUser(username) {
    const data = await fetchAPI('/api/login', 'POST', {username, password: 'test123'});
    if (data.success) {
        console.log(`✓ ${username} logged in`);
        return data.token;
    }
    throw new Error(data.message);
}

async function addFriend(token, friendUsername) {
    const data = await fetchAPI('/api/friendship/add-friend', 'POST', {username: friendUsername}, token);
    console.log(`✓ Friend request sent to ${friendUsername}`);
    return data;
}

async function acceptFriend(token, requesterUsername) {
    // Get pending requests first
    const requests = await fetchAPI('/api/friendship/pending-requests', 'GET', null, token);
    const request = requests.requests?.find(r => r.requester.username === requesterUsername);
    if (request) {
        const data = await fetchAPI(`/api/friendship/accept-request/${request._id}`, 'POST', {}, token);
        console.log(`✓ Accepted friend request from ${requesterUsername}`);
        return data;
    }
}

async function createPostWithMention(token, username, content) {
    const data = await fetchAPI('/api/post/create', 'POST', {content}, token);
    if (data.success) {
        console.log(`✓ ${username} created post: "${content}"`);
        return data.post;
    } else {
        console.log(`✗ Failed to create post: ${data.message}`);
        return null;
    }
}

async function getNotifications(token, username) {
    const data = await fetchAPI('/api/notifications', 'GET', null, token);
    const unread = data.notifications?.filter(n => !n.isRead) || [];
    console.log(`📬 ${username}: ${data.notifications?.length || 0} total, ${unread.length} unread`);
    return data.notifications || [];
}

async function runTest() {
    try {
        console.log('🚀 FRIEND-ONLY MENTION TEST\n');
        
        // Register 3 users
        console.log('--- Register Users ---');
        await registerUser('alice', '1111111111');
        await sleep(DELAY);
        await registerUser('bob', '2222222222');
        await sleep(DELAY);
        await registerUser('charlie', '3333333333');
        await sleep(DELAY);
        
        // Login
        console.log('\n--- Login ---');
        const aliceToken = await loginUser('alice');
        await sleep(DELAY);
        const bobToken = await loginUser('bob');
        await sleep(DELAY);
        const charlieToken = await loginUser('charlie');
        await sleep(DELAY);
        
        // Initial notifications
        console.log('\n--- Initial State ---');
        await getNotifications(bobToken, 'bob');
        await getNotifications(charlieToken, 'charlie');
        await sleep(DELAY);
        
        // Alice add Bob as friend
        console.log('\n--- Alice adds Bob as friend ---');
        await addFriend(aliceToken, 'bob');
        await sleep(500);
        
        // Bob accepts Alice's friend request
        console.log('--- Bob accepts friendship ---');
        await acceptFriend(bobToken, 'alice');
        await sleep(500);
        
        // Test 1: Alice mention Bob (should work - they're friends)
        console.log('\n--- TEST 1: Alice mentions Bob (FRIEND) ---');
        await createPostWithMention(aliceToken, 'alice', '@bob You are my friend!');
        await sleep(500);
        
        const bobNotif1 = await getNotifications(bobToken, 'bob');
        if (bobNotif1.filter(n => !n.isRead && n.fromUsername === 'alice').length > 0) {
            console.log('✅ SUCCESS: Bob received notification from Alice');
        } else {
            console.log('❌ FAIL: Bob did NOT receive notification');
        }
        await sleep(DELAY);
        
        // Test 2: Alice mention Charlie (should NOT work - not friends)
        console.log('\n--- TEST 2: Alice mentions Charlie (NOT FRIEND) ---');
        await createPostWithMention(aliceToken, 'alice', '@charlie You are NOT my friend!');
        await sleep(500);
        
        const charlieNotifBefore = await getNotifications(charlieToken, 'charlie');
        const charlieNotifFromAlice = charlieNotifBefore.filter(n => n.fromUsername === 'alice').length;
        
        if (charlieNotifFromAlice === 0) {
            console.log('✅ SUCCESS: Charlie did NOT receive notification (correct - not friends)');
        } else {
            console.log('❌ FAIL: Charlie received notification (should not - not friends)');
        }
        
        console.log('\n✅ TEST COMPLETED');
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

runTest().then(() => process.exit(0)).catch(() => process.exit(1));
