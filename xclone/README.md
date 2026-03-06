# Full-Stack X (Twitter) Clone 🐦



A complete, end-to-end social media application built from scratch to deeply understand core web architecture, RESTful APIs, and Client-Side Rendering before abstracting with frameworks like React.

**Author:** Srijan Gupta  
**Status:** MVP Complete (Learning Project)

## 🎯 Project Focus
The primary goal of this project was to understand the "under the hood" mechanics of full-stack development. Rather than relying on modern frameworks to handle state and routing, this project utilizes raw Vanilla JavaScript for manual DOM manipulation and a custom Express backend to strictly enforce security and data flow.

## ⚙️ Core Features & Engineering Highlights

* **Robust Authentication System:** Implemented secure user registration and login using `bcrypt.js` for password hashing and JSON Web Tokens (JWT) for stateless session management.
* **Custom Security Middleware:** Built an Express middleware "bouncer" to intercept HTTP requests, verify cryptographic JWT signatures, and protect core API routes from unauthorized access.
* **Strict Access Control:** Engineered backend logic to ensure users can only delete their own posts, returning `403 Forbidden` errors if the UI is bypassed via tools like Postman.
* **Client-Side Rendering (CSR):** Designed a frontend architecture that fetches raw JSON arrays from the database and dynamically constructs HTML components on the fly using JavaScript.
* **Multipart File Handling:** Utilized `multer` and `FormData` to cleanly separate text payloads from binary image files during HTTP POST requests.
* **NoSQL Database Modeling:** Designed strict Mongoose schemas to enforce data consistency in a naturally schema-less MongoDB environment, utilizing arrays to efficiently track unique post likes.

## 🛠️ Tech Stack

* **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Security & Utilities:** JWT (jsonwebtoken), Bcrypt.js, Multer, CORS, Dotenv

## 🚀 Running Locally

To run this project on your local machine for testing, open your terminal and run the following commands:

```bash
# 1. Clone the repository
git clone [https://github.com/SrijanGupta2006/x-clone.git](https://github.com/SrijanGupta2006/x-clone.git)

# 2. Navigate into the project folder
cd x-clone

# 3. Install all required dependencies
npm install

# 4. Create your environment variables file
touch .env

# ---> Open the new .env file in your code editor and add the following:
# PORT=5001
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_super_secret_key

# 5. Start the local server
npm start