# "Old School" - Workshop Inventory & Stock Management

A simple, fast, and mobile-friendly workshop inventory management system. **Designed with a focus on ease of use for non-technical users ("gaptek friendliness")** while maintaining powerful capabilities for workshop owners.

## 🚀 Features

- **Extreme Simplicity**: Minimalist UI designed for non-tech users to start working in seconds.
- **Large & Clear Controls**: Big buttons and clear text optimized for mobile use in a workshop environment.
- **Real-time Inventory Tracking**: Track item stock levels (IN/OUT transactions) without complex accounting knowledge.
- **Category Management**: Organize items into simple groups.
- **Fast Reporting**: One-click summary reports to see your stock value and transactions.
- **Cloud Powered**: Built on Cloudflare D1 for high availability—no maintenance required for the user.
- **Secure Access**: Simple PIN-based login—no complex passwords to remember.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/)
- **Runtime & DB**: [Cloudflare Workers](https://workers.cloudflare.com/) + [D1 Database](https://developers.cloudflare.com/d1/)
- **Styling**: Vanilla CSS + Tailwind-like utilities
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [OpenNextjs-Cloudflare](https://opennext.js.org/cloudflare)

---

## 💻 Local Setup

Follow these steps to get the project running on your local machine:

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) CLI installed globally

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/workshop-inventory.git
   cd workshop-inventory
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_APP_USERNAME=admin
   NEXT_PUBLIC_APP_PIN=1234
   ```

4. **Initialize Local Database**:
   Run the migrations against your local Wrangler state:
   ```bash
   npx wrangler d1 execute workshop-inventory-db --file=migrations/0001_init.sql --local
   npx wrangler d1 execute workshop-inventory-db --file=migrations/0003_add_price.sql --local
   ```
   *(Optional) Seed data for testing:*
   ```bash
   npx wrangler d1 execute workshop-inventory-db --file=migrations/0002_seed.sql --local
   ```

5. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment

This application is optimized for **Cloudflare Pages**.

### 1. Create Cloudflare D1 Database
Go to your Cloudflare Dashboard or use CLI:
```bash
npx wrangler d1 create workshop-inventory-db
```
Copy the `database_id` and update it in your `wrangler.toml`.

### 2. Apply Remote Migrations
```bash
npx wrangler d1 execute workshop-inventory-db --file=migrations/0001_init.sql --remote
npx wrangler d1 execute workshop-inventory-db --file=migrations/0003_add_price.sql --remote
```

### 3. Build & Deploy
You can use the built-in script:
```bash
npm run deploy
```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
