# 🍽️ Cravio — Good Food. Great Times.

A full-stack multi-restaurant food ordering and management platform built with React + Django REST Framework.

---

## Project Structure

```
cravio/
├── cravio-frontend/     # React app
└── cravio-backend/      # Django + DRF API
```

---

## Quick Start

### Backend

```bash
cd cravio-backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

API runs at: `http://localhost:8000`  
Django Admin: `http://localhost:8000/admin`

---

### Frontend

```bash
cd cravio-frontend

# Install dependencies
npm install

# Start dev server
npm start
```

App runs at: `http://localhost:3000`

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 18, React Router 6, Axios, Bootstrap 5 |
| Backend    | Django 4.2, Django REST Framework, SimpleJWT |
| Database   | SQLite (dev) → swap to PostgreSQL for prod |
| Auth       | JWT (access + refresh tokens)           |

---

## User Roles

| Role     | Access                                              |
|----------|-----------------------------------------------------|
| Customer | Browse restaurants, order food, reserve tables, review |
| Owner    | Manage menu, view orders, manage reservations       |
| Admin    | Approve restaurants, manage users, platform stats   |

---

## API Endpoints

| Method | Endpoint                        | Description            |
|--------|---------------------------------|------------------------|
| POST   | /api/users/register/            | Register               |
| POST   | /api/users/login/               | Login (returns JWT)    |
| GET    | /api/users/profile/             | Get/update profile     |
| GET    | /api/restaurants/               | List restaurants       |
| POST   | /api/restaurants/               | Register restaurant    |
| GET    | /api/restaurants/:id/           | Restaurant detail      |
| GET    | /api/foods/                     | List food items        |
| POST   | /api/foods/                     | Add food item (owner)  |
| GET    | /api/cart/                      | View cart              |
| POST   | /api/cart/                      | Add to cart            |
| POST   | /api/orders/                    | Place order            |
| GET    | /api/orders/my/                 | My orders              |
| GET    | /api/orders/restaurant/         | Restaurant orders      |
| PATCH  | /api/orders/:id/                | Update order status    |
| POST   | /api/reservations/              | Make reservation       |
| GET    | /api/reservations/my/           | My reservations        |
| POST   | /api/reviews/                   | Submit review          |
| GET    | /api/reviews/?restaurant=:id    | Restaurant reviews     |
| GET    | /api/admin/stats/               | Platform stats         |

---

## Color Palette

| Variable        | Value     | Usage                  |
|-----------------|-----------|------------------------|
| `--cream`       | `#F5F0E8` | Page backgrounds       |
| `--olive`       | `#4A5C3F` | Primary buttons, links |
| `--terracotta`  | `#C17B4E` | Accents, highlights    |
| `--dark`        | `#2C2C2C` | Body text              |
