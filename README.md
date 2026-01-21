## FeedbackPro Server

FeedbackPro Server is an Express-based Node.js backend for managing feedback campaigns, surveys, customers, and responses. It exposes a set of routes and uses MongoDB (via Mongoose models) for persistence.

---

## Prerequisites

- **Node.js**: v18 or later recommended  
- **npm**: Comes with Node.js  
- **MongoDB**: Local or hosted instance (e.g. MongoDB Atlas)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd FeedbackProServer
```

### 2. Install dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`.

### 3. Environment configuration

This project uses environment variables for configuration. A typical setup is:

```bash
cp .env.example .env.local
```

If `.env.example` does not exist, create `.env.local` manually with the variables your app expects. Common variables for an Express + MongoDB app might include:

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/feedbackpro
SESSION_SECRET=change_me
```

> Note: The project uses `dotenv` (as seen in the startup logs) to load environment variables from `.env.local`.

### 4. Run the development server

```bash
npm start
```

This runs `node ./bin/www`, which loads the Express app from `app.js` and starts the server. Set `PORT` in `.env.local` if you want something other than the default (`5000`).

Once running, open your browser at:

```text
http://localhost:5000
```

If you changed the `PORT` variable, use that port instead.

---

## Project Structure

High-level overview of the main directories and files:

- **`app.js`**: Main Express application setup (middleware, routes, error handlers).
- **`bin/www`**: Entry point script that creates the HTTP server and starts listening on the configured port.
- **`routes/`**: Route handlers for different resources:
  - `auth.js` – Authentication routes
  - `campaigns.js` – Campaign management
  - `customers.js` – Customer management
  - `edit.js` – Editing-related routes
  - `index.js` – Home and basic routes
  - `responses.js` – Feedback/response handling
  - `surveys.js` – Survey management
  - `users.js` – User management
- **`models/`**: Mongoose models:
  - `Campaign.js`
  - `Customer.js`
  - `Response.js`
  - `Survey.js`
  - `User.js`
  - `Transaction.js`
- **`views/`**: Jade (Pug) templates used for server-side rendered pages:
  - `layout.jade`, `index.jade`, `error.jade`
- **`public/`**: Static assets (CSS, JS, images).

---

## Available npm Scripts

Check `package.json` for the exact list. Common scripts:

- **`npm start`**: Start the production server (`node ./bin/www`).

If you add additional scripts (like `dev`, `lint`, or `test`), document them here.

---

## Wallet & Transactions

Every user has a wallet balance and a transaction history.

- **Get wallet summary**: `GET /users/:id/wallet`  
  - Optional: `?limit=20` to cap the number of recent transactions returned (max 100).

- **List transactions (paginated)**: `GET /users/:id/transactions`  
  - Query params: `page` (default 1), `limit` (default 50, max 200).

- **Create a transaction**: `POST /users/:id/wallet/transactions`  
  - Body:  
    ```json
    {
      "type": "credit",   // or "debit"
      "amount": 25.5,
      "description": "Manual top-up"
    }
    ```
  - Credits increase balance; debits decrease balance (debits fail if funds are insufficient).

- **Add funds (credit)**: `POST /users/:id/wallet/add`  
  - Body:
    ```json
    { "amount": 25.5, "description": "Top-up" }
    ```

- **Deduct funds (debit)**: `POST /users/:id/wallet/deduct`  
  - Body:
    ```json
    { "amount": 10, "description": "Payout" }
    ```

---

## Campaigns

Campaigns can use either an internal survey (linked by `surveyId`) or an external survey link with a 4-digit code.

- **Create campaign**: `POST /campaigns`
  - Required: `userId`, `name`
  - Optional: `description`, `message_template`, `contacts`, `reward`, `surveyId`, `externalSurveyLink`, `code`
  - Body example with internal survey:
    ```json
    {
      "userId": "user_id_here",
      "name": "Q1 Feedback Campaign",
      "description": "Collecting feedback for Q1",
      "surveyId": "survey_id_here"
    }
    ```
  - Body example with external survey:
    ```json
    {
      "userId": "user_id_here",
      "name": "External Survey Campaign",
      "description": "Using external survey platform",
      "externalSurveyLink": "https://example.com/survey/123",
      "code": "1234"
    }
    ```
  - Note: Cannot specify both `surveyId` and `externalSurveyLink`. Choose one.
  - The `code` field must be exactly 4 digits when `externalSurveyLink` is provided.

- **Update campaign**: `PATCH /campaigns/:campaignId`
  - Can update any campaign fields including `externalSurveyLink` and `code`.
  - Same validation rules apply as creation.

- **Get campaign**: `GET /campaigns/:campaignId`
  - Returns campaign details with populated survey (if internal survey is used).

- **List campaigns**: `GET /campaigns?userId=USER_ID`
  - Returns all campaigns for a specific user.

---

## Development Notes

- **Code style**: Follow the existing style in the project (Express generator style with callbacks/middleware).
- **Models & routes**: When adding new features, define a model in `models/` and corresponding routes in `routes/`.
- **Views**: Use Jade (Pug) templates in `views/` if you need server-rendered pages.

---

## Troubleshooting

- **Server doesn’t start / runtime errors**
  - Ensure dependencies are installed: `npm install`.
  - Confirm your environment variables in `.env.local` are correct.
  - Check the console output where you ran `npm start` for stack traces and error messages.

- **MongoDB connection issues**
  - Verify that MongoDB is running and reachable at `MONGODB_URI`.
  - Try connecting with the MongoDB shell or Compass to confirm connectivity.

---

## License

Add your preferred license here (e.g. MIT). If this is a private/internal project, you can simply note that it is proprietary and for internal use only.

