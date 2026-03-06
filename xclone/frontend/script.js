// --- AUTHENTICATION LOGIC ---
const AUTH_SCREEN = document.getElementById('auth-screen');
const AUTH_TITLE = document.getElementById('auth-title');
const AUTH_USERNAME = document.getElementById('auth-username');
const AUTH_EMAIL = document.getElementById('auth-email');
const AUTH_PASSWORD = document.getElementById('auth-password');
const AUTH_ACTION_BTN = document.getElementById('auth-action-btn');
const AUTH_TOGGLE_BTN = document.getElementById('auth-toggle-btn');
const AUTH_TOGGLE_TEXT = document.getElementById('auth-toggle-text');

let isLoginMode = true; // Start in Login mode

// 1. Check if the user if already logged in
// LocalStorage is the browser's persistent memory. It survives refreshes!

if (localStorage.getItem('token')) {
    // If they have a token, hide the login screen immediately
    AUTH_SCREEN.classList.add('hidden');
}

// 2. The TOGGLE Switch (Morph the form) :

AUTH_TOGGLE_BTN.addEventListener("click", () => {
    isLoginMode = !isLoginMode; // Flip the mode

    // Clear inputs when switching
    AUTH_EMAIL.value = "";
    AUTH_PASSWORD.value = "";
    AUTH_USERNAME.value = "";

    if (isLoginMode) {
        // Change to Login Look
        AUTH_TITLE.innerText = "Sign in to X";
        AUTH_ACTION_BTN.innerText = "Log in";
        AUTH_USERNAME.classList.add('hidden'); // Hide username
        AUTH_TOGGLE_TEXT.innerText = "Don't have an account?";
        AUTH_TOGGLE_BTN.innerText = "Sign up";
    } else {
        // Change to Sign Up Look
        AUTH_TITLE.innerText = "Create your account";
        AUTH_ACTION_BTN.innerText = "Sign up";
        AUTH_USERNAME.classList.remove('hidden'); // Show username
        AUTH_TOGGLE_TEXT.innerText = "Already have an account?";
        AUTH_TOGGLE_BTN.innerText = "Log in";
    }

});

// 3. The Big Action Button (Handles both Login AND Register) :
AUTH_ACTION_BTN.addEventListener("click", async () => {
    const email = AUTH_EMAIL.value;
    const password = AUTH_PASSWORD.value;
    const username = AUTH_USERNAME.value;

    if (!email || !password || (!isLoginMode && !username)) {
        alert("Please fill in all fields");
        return;
    }

    try {
        if (isLoginMode) {
            // --- LOGIN FETCH ---

            // Send credentials to the backend
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });


            const data = await response.json();

            if (response.ok) {
                console.log("Login successful!", data);

                // THE MOST IMPORTANT PART: Save the "Wristband" to LocalStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('username', data.username);

                // Hide the login screen to reveal the app
                AUTH_SCREEN.classList.add('hidden');

                // Reload tweets so they are fresh
                loadTweets();
            }

            else {
                // Server rejected the login (wrong password/email)
                alert(data.error);
            }

        }

        else {
            // --- SIGNUP FETCH ---

            // Send credentials to the backend
            const response = await fetch('http://localhost:5001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });


            const data = await response.json();

            if (response.ok) {
                console.log("Account created successfully! You can now log in.", data);
                // Automatically click the toggle to switch them back to the login screen
                AUTH_TOGGLE_BTN.click();
            }
            else {
                alert(data.error);
            }
        }

    } catch (error) {
        console.error("Login failed:", error);
    }
});

const currentUsername = localStorage.getItem('username');

if (currentUsername) {
    const displayNameEl = document.getElementById('sidebar-display-name');
    const handleEl = document.getElementById('sidebar-handle');

    if (displayNameEl) displayNameEl.innerText = currentUsername;
    if (handleEl) handleEl.innerText = `@${currentUsername.toLowerCase()}`;
}

const CURRENT_USER_ID = "user_srijan_123"; // Will replace this with real Auth later

async function deleteTweet(id) {
    if (!confirm("Are you sure you want to delete this tweet?")) return;
    try {
        const response = await fetch(`http://localhost:5001/api/tweets/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadTweets(); // Refresh the feed
        }
        else {
            alert("Server refused to delete.");
        }
    } catch (error) {
        console.error("Error deleting tweet:", error);
    }
}

window.likeTweet = async function (element, tweetId) {
    const countSpan = element.querySelector(".like-count");
    const heartIcon = element.querySelector(".material-symbols-outlined");

    // OPTIMISTIC UI (Make it feel fast)
    // We toggle the visual state immediately before the server responds
    const isLiked = element.classList.contains('text-pink-500');

    if (isLiked) {
        element.classList.remove('text-pink-500');
        countSpan.innerText = parseInt(countSpan.innerText) - 1;
        heartIcon.style.fontVariationSettings = "'FILL' 0";
    }
    else {
        element.classList.add('text-pink-500');
        countSpan.innerText = parseInt(countSpan.innerText) + 1;
        heartIcon.style.fontVariationSettings = "'FILL' 1";
    }

    try {
        // Send the request to server
        const response = await fetch(`http://localhost:5001/api/tweets/${tweetId}/like`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: CURRENT_USER_ID }) // Sending our fake ID
        });
        // If server fails, we should revert the UI changes (optional advanced step)
    } catch (error) {
        console.error("Error toggling like:", error);
    }

}

const TWEET_CONTAINER = document.getElementById('tweet-container');

async function loadTweets() {
    try {
        const response = await fetch('http://localhost:5001/api/tweets');
        const tweets = await response.json();
        console.log("Fetched Tweets:", tweets); // Just to check if the tweets are arriving or not

        // Clear the hard-coded dummy posts
        TWEET_CONTAINER.innerHTML = '';

        tweets.forEach(tweet => {

            // SAFETY CHECK: Ensure likes is always an array
            // If tweet.likes is missing, or is a number, default to []
            let likesArray = Array.isArray(tweet.likes) ? tweet.likes : [];

            // Check if our fake ID is in the list of likes
            const isLiked = likesArray.includes(CURRENT_USER_ID);

            // Set the class based on that check
            const heartColor = isLiked ? 'text-pink-500' : '';
            const heartFill = isLiked ? "'FILL' 1" : "'FILL' 0";

            const imageHTML = tweet.image ?
                `<div class="postimg mt-2
                rounded-2xl overflow-hidden border border-gray-700">
        <img class="w-full" src="http://localhost:5001/${tweet.image}" alt="">
    </div>` : '';

            const currentUsername = localStorage.getItem('username');

            // Only create the delete button HTML if the names match!
            const deleteButtonHTML = tweet.username === currentUsername
                ? `<button onclick="deleteTweet('${tweet._id}')" class="absolute top-2 right-4 text-gray-500 cursor-pointer hover:text-red-500 z-10">
            <span class="material-symbols-outlined text-sm">delete</span>
       </button>`
                : ``;

            // Note: We use tweet._id (with the underscore) because that's how MongoDB stores it
            const tweetHTML = `
        <div class="post border-[1px] border-x-0 border-y-gray-600 p-4 relative">
            
            ${deleteButtonHTML}

            <div class="flex">
                <div class="image mr-4">
                    <img class="w-12 h-12 rounded-full cursor-pointer" src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" alt="">
                </div>
                <div class="content flex-1">
                    <div class="flex items-center space-x-2">
                        <span class="font-bold text-white hover:underline cursor-pointer">${tweet.username}</span>
                        <span class="text-gray-500 text-sm">@${tweet.username} · ${new Date(tweet.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="text-white mt-1 mb-4">
                        ${tweet.text}
                    </div>

                    ${imageHTML}

                    <div class="icons flex justify-between text-gray-600 max-w-md">
                        <div class="flex items-center hover:text-blue-500 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">chat_bubble</span>
                        </div>
                        
                        <div onclick="likeTweet(this, '${tweet._id}')" class="flex items-center hover:text-pink-500 cursor-pointer ${heartColor}">
                            
                            <span class="material-symbols-outlined text-sm" style="font-variation-settings: ${heartFill}">favorite</span>
                            
                            <span class="like-count ml-1 text-xs">${likesArray.length}</span>
                        </div>

                        <div class="flex items-center hover:text-blue-500 cursor-pointer">
                            <span class="material-symbols-outlined text-sm">bar_chart</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
            TWEET_CONTAINER.insertAdjacentHTML('beforeend', tweetHTML);
        });

    } catch (error) {
        console.error("Error loading tweets:", error);
    }
}

loadTweets();


let selectedFile = null;
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');

fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        // Show Preview
        previewImg.src = URL.createObjectURL(file);
        previewContainer.classList.remove('hidden');
    }
});

function removeImage() {
    selectedFile = null;
    fileInput.value = ""; // Reset input
    previewContainer.classList.add('hidden');
}


const POST_BTN = document.getElementById('post-btn');
const TEXT_INPUT = document.getElementById('tweet-input');
const FILE_INPUT = document.getElementById('file-input');
const PREVIEW_CONTAINER = document.getElementById('image-preview');

POST_BTN.addEventListener("click", async () => {
    const text = TEXT_INPUT.value;
    const file = FILE_INPUT.files[0]; // Get the file(if any)
    const token = localStorage.getItem('token');

    // (Optional but good) If they somehow don't have a token, stop them early
    if (!token) {
        alert("You must be logged in to post!");
        return;
    }

    if (!text && !file) {
        alert("Please write something or add an image");
        return;
    }


    // 1. Create formData (The "Package")
    const formData = new FormData();
    formData.append('text', text);
    formData.append('username', "Srijan"); // Or your variable

    if (file) {
        formData.append('image', file); // Attach the file
    }

    try {

        console.log("Sending tweet with token...");

        const response = await fetch('http://localhost:5001/api/tweets', {
            method: 'POST',
            headers: {
                // Note: The word 'Bearer ' followed by a space is the standard internet protocol here.
                'Authorization': `Bearer ${token}`
            },
            // CRITICAL: Still do NOT add 'Content-Type' here! Let the browser handle the FormData boundary, as it itself sets the content type, and attaches a unique code to it, which we can accidentally end up deleting, if we manually set the content type to multipart/form-data

            body: formData
        });
        if (response.ok) {
            console.log("✅ Posted successfully!");

            // Clear inputs
            TEXT_INPUT.value = "";
            FILE_INPUT.value = ""; // Clear file input
            PREVIEW_CONTAINER.classList.add('hidden'); // Hide preview

            // Reload the feed to show the new post
            loadTweets();

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.error("❌ Server rejected request");
            const errorData = await response.json();
            console.log(errorData);
        }

    } catch (error) {
        console.log("Error posting tweet", error);
    }
})


// SEARCH FEATURE:
const SEARCH_INPUT = document.getElementById('search-input');

SEARCH_INPUT.addEventListener('input', function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const allTweets = document.querySelectorAll('.post');

    allTweets.forEach(tweet => {
        const tweetText = tweet.innerText.toLowerCase();

        // If the tweet contains the searchTerm, show it, else hide it
        if (tweetText.includes(searchTerm)) {
            tweet.style.display = 'block';
        }
        else {
            tweet.style.display = 'none';
        }
    });

});


const DESKTOP_LOGOUT = document.getElementById('logout-btn');
const MOBILE_LOGOUT = document.getElementById('mobile-logout-btn');

// Create a reusable logout function
const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.reload();
};

// Attach the function to whichever buttons actually exist on the screen
if (DESKTOP_LOGOUT) DESKTOP_LOGOUT.addEventListener('click', handleLogout);
if (MOBILE_LOGOUT) MOBILE_LOGOUT.addEventListener('click', handleLogout);


