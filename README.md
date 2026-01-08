# Jangid Homes Business Management

A comprehensive business management application for **Jangid Interiors & CNC Shop**. Built with Next.js, MongoDB, and NextAuth.js for authentication.

## Features

- **Interior Design Module** - Manage interior design projects, clients, expenses, and tracking
- **CNC Shop Module** - Complete CNC shop management including:
  - Material inventory & stock tracking
  - Order management with job cards
  - Client management & sales reports
  - Expense tracking
  - Profit & Loss reports
  - PDF export for reports

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **pnpm**

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mahesh-jangid21/Jangid-Homes-Business-Management.git
   cd Jangid-Homes-Business-Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and update with your values:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # MongoDB Connection String
   MONGODB_URI=mongodb://localhost:27017/jangid-interiors
   
   # For MongoDB Atlas, use:
   # MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/jangid-interiors?retryWrites=true&w=majority
   
   # NextAuth.js Configuration
   NEXTAUTH_SECRET=your-super-secret-key-here  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Initial Setup

On first run, you'll need to create an admin user. The application will automatically redirect you to the setup page, or you can make a POST request to `/api/setup`:

```json
{
  "email": "admin@example.com",
  "password": "your-secure-password",
  "name": "Admin Name"
}
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF)

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth.js routes
│   │   ├── cnc/          # CNC Shop API endpoints
│   │   ├── interiors/    # Interior Design API endpoints
│   │   └── setup/        # Initial admin setup
│   ├── portal/           # Protected portal pages
│   └── ...
├── components/           # React components
│   ├── cnc/              # CNC module components
│   ├── shared/           # Shared components
│   └── ui/               # UI primitives (shadcn)
├── lib/                  # Utilities and configurations
│   ├── db/               # Database connection
│   ├── models/           # Mongoose schemas
│   └── validations.ts    # Zod schemas
└── ...
```

## License

Private - All rights reserved.
