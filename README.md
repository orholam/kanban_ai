# **Kanban AI**

Kanban AI is your personal side project coach. Tell KAI what your side project SaaS idea is, along with the skills you want to add to your resume (e.g., React, Express, etc.), and KAI will generate a full 10-week plan to help you create it! Track your progress by updating the tasks KAI makes for you.

---

## **Setup**

### **Shared Setup (Frontend and Backend Together)**
1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2. Install dependencies for both the frontend and backend:
    ```
    npm install
    ```
3. Start both the frontend and backend servers:
    ```
    npm start
    ```
- The *frontend* will run on `localhost:5173` (default Vite dev server port)and the *backend* will run on `localhost:3000` (default Express server port).

## **Individual Setup***
### **Frontend**
1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```
    npm install
    ```
3. Start the frontend server:
    ```
    npm start
    ```
The *frontend* will run on `localhost:5173`
### **Backend**
1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
3. Start the backend server:
    ```
    node server.js
    ```
The *backend* will run on `localhost:3000`

---

## **Database** (not automatically configured)
The application uses PostgreSQL as its database. The database has not yet been set up to be shared, so when you run the application, you will not see any cards loaded into the Kanban board. You will need to set up the database manually and configure the backend with the appropriate connection details.