# Sandeep Agro Agencies - Full-Stack E-commerce Platform 🌾🚜

Welcome to the `Sandeep Agro Agencies` source repository. This represents a modular, scalable, event-driven, production-ready microservice platform designed to streamline fertilizer and pesticide distribution.

## Tech Stack 🚀
- **Frontend**: React 18, Vite, TypeScript, Bootstrap 5 (Responsive Dark Theme), React Router DOM.
- **Backend API**: `.NET 8` Microservices Architecture (C#).
- **Persistence**: `MongoDB` native driver (.NET).
- **Messaging Event Bus**: `RabbitMQ` ensuring asynchronous workflow automation between disconnected systems.

## Key Architectural Features 🏗️
1. **Atomic Stock Guard**: Implemented using MongoDB's `$gte` bounds via `FindOneAndUpdateAsync` ensuring extreme thread security (No chance of "Negative Inventory Oversells").
2. **Compensating Rollbacks**: When an order sequentially fails allocation (HTTP 409 Conflict), the OrderService reliably and autonomously loops backward restoring any temporarily sequestered cart items!
3. **Admin Intranet**: Protected by a `.NET` `JwtBearer` token interface mapped to React `<ProtectedRoute>` bindings, allowing discrete live inventory tracking and Restocks at the click of a button!

## Quick Start (Dockerized) 🐳

Assuming you have `Docker` installed, establishing the entire network is handled natively across a unified compose schema:

1. Clone the project locally: `git clone https://github.com/saisandeep1701/agro-agency-shop.git`
2. Run standard docker network generation at the root:
```sh
docker-compose up -d --build
```

**Services Deployed**
- **CommerceHub API**: Mapping to `localhost:5100` (`http://localhost:5100/swagger` for your API endpoints).
- **MongoDB Database**: Running on port `27017`.
- **RabbitMQ Dashboard**: Available natively on `15672` (u: `guest`, p: `guest`).

Once the backend is live, configure your frontend UI:
```sh
cd client
npm install
npm run dev
```

Browse cleanly at `http://localhost:5173`. Access your secure terminal via `/admin`.
