# Fable – Backend API

Express.js REST API for the Fable ebook sharing platform.

## 🌐 Live API URL

[https://fable-server-8aqu.onrender.com](https://fable-server-8aqu.onrender.com)

## 🔗 Frontend Repository

[https://github.com/IMRAN-385/fable-client](https://github.com/IMRAN-385/fable-client)

## ✨ Key Features

- JWT Authentication with bcrypt password hashing
- Role-based middleware (user / writer / admin)
- Google OAuth sync endpoint
- Full CRUD for ebooks with ownership checks
- Stripe Checkout session + payment confirmation
- Purchase history, sales history, all transactions
- Bookmark add/remove
- Admin analytics (monthly sales, genre breakdown)
- Top writers aggregation pipeline
- Search, filter, sort, pagination on ebooks

## 🛠️ NPM Packages Used

| Package | Purpose |
|---|---|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `bcryptjs` | Password hashing |
| `stripe` | Payment processing |
| `cors` | Cross-origin requests |
| `dotenv` | Environment variables |
| `nodemon` | Dev auto-restart |

## 🔑 Environment Variables

Create a `.env` file in the root:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
CLIENT_URL=http://localhost:3000
PORT=5000
```

## 🚀 Getting Started

```bash
npm install
npm run dev        # development
npm start          # production
npm run create-admin  # create admin@fable.com account
```

## 📁 API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login user |
| GET | /api/auth/profile | JWT | Get profile |
| POST | /api/auth/google | Public | Google OAuth sync |
| GET | /api/ebooks | Public | List ebooks (search/filter/sort/paginate) |
| GET | /api/ebooks/:id | Public | Single ebook details |
| POST | /api/ebooks | Writer/Admin | Create ebook |
| PUT | /api/ebooks/:id | Owner/Admin | Update ebook |
| DELETE | /api/ebooks/:id | Owner/Admin | Delete ebook |
| POST | /api/purchase/create-checkout-session | JWT | Create Stripe session |
| POST | /api/purchase/confirm | JWT | Confirm payment |
| GET | /api/purchase/my-purchases | JWT | User purchase history |
| GET | /api/purchase/my-sales | Writer | Writer sales history |
| GET | /api/purchase/all | Admin | All transactions |
| POST | /api/bookmark/:ebookId | JWT | Add bookmark |
| DELETE | /api/bookmark/:ebookId | JWT | Remove bookmark |
| GET | /api/users/top-writers | Public | Top 3 writers by sales |
| GET | /api/users/analytics | Admin | Platform analytics |
| GET | /api/users | Admin | All users |
| PATCH | /api/users/:id/role | Admin | Change user role |
| DELETE | /api/users/:id | Admin | Delete user |

## 👤 Admin Account
